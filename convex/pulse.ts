// Pulse: runPulse (nightly review pull + gap ranking + prescription),
// morningCard (PulseHome data + a one-line LLM headline) and
// measureExperiments (the Monday read). All DB access happens through the
// internal query/mutations below -- runPulse and morningCard (both public
// actions) never touch ctx.db directly, per BUILD-PLAN.md Rules #2.
//
// convex/playbook.ts (A's file) landed real and complete partway through
// this session -- `prescribeLocal` below now wraps its `fillPlaybook`
// instead of the placeholder templates it started as. See MERGE-NOTES.md.
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { Role } from "./auth";
import { call as serpCall, QuotaExceeded } from "./serp";
import { cacheKey, type SerpParams } from "./cacheKey";
import { dedupeReviews } from "./dedupe";
import { classifyLocal, rankGapsLocal, type ClassifiedLocalReview, type LocalGap } from "./analyze.local";
import {
  aiOverview,
  googleMaps,
  googleMapsReviews,
  tripadvisorReviews,
  tripadvisorSearch,
  yelpReviews,
  yelpSearch,
  type AiOverviewResult,
  type CallFn,
  type MapsPlace,
} from "./engines.local";
import { cardHeadline } from "./llm";
import { fillPlaybook } from "./playbook";
import { todayKey } from "./usageRules";

// ---------------------------------------------------------------------------
// auth (actions can't use ctx.db -- getRole below is the internal query that
// stands in for auth.ts's requireUser/requireRole, which need ctx.db)
// ---------------------------------------------------------------------------

export const getRole = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => (await ctx.db.get(userId))?.role ?? null,
});

async function requireActionUser(ctx: ActionCtx): Promise<{ userId: Id<"users">; role: Role }> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const role: Role | null = await ctx.runQuery(internal.pulse.getRole, { userId });
  if (!role) throw new Error("Not authenticated");
  return { userId, role };
}

// ---------------------------------------------------------------------------
// quota-guarded SerpApi calls (BUILD-PLAN.md Rules #1 and #3)
// ---------------------------------------------------------------------------

/** Adapts A's `serp.call(ctx, runId, params)` (cache-first, records `calls`
 * rows, respects OFFLINE, enforces the per-role live-search cap) into the
 * plain `(engine, params) => data` shape engines.local.ts expects. */
function makeCallFn(ctx: ActionCtx, runId: Id<"runs">): CallFn {
  return (engine, params) => serpCall(ctx, runId, { engine, ...params } as SerpParams);
}

/** A source (Yelp/TripAdvisor id lookup, an AI Overview query, quota) can
 * legitimately come back empty -- log and move on rather than fail the run,
 * mirroring BUILD-PLAN.md's "skip the source, don't fake it" rule for
 * OpenTable. */
async function tryOrSkip<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    if (!(err instanceof QuotaExceeded)) {
      console.error(`[pulse] ${label} failed:`, err);
    } else {
      console.warn(`[pulse] ${label} skipped: ${err.message}`);
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// peer encoding -- businesses.peers is v.array(v.string()) with no separate
// name field. We encode "<title>::<dataId>" per peer so a re-run of an
// existing business (peers already known) never needs another googleMaps
// call to recover their display names. ponytail: if the schema ever grows a
// dedicated {name, placeId} shape for peers, switch to that instead.
function encodePeer(title: string, dataId: string): string {
  return `${title}::${dataId}`;
}
function decodePeer(s: string): { title: string; dataId: string } {
  const idx = s.lastIndexOf("::");
  return idx === -1 ? { title: s, dataId: s } : { title: s.slice(0, idx), dataId: s.slice(idx + 2) };
}

// Austin's ll from ENGINE-NOTES.md -- ponytail: v1 only demos Austin, so this
// is the default rather than a real geocoder. Pass `ll` explicitly for any
// other city.
const DEFAULT_LL = "@30.3178,-97.7318,12z";

async function discoverPlaces(
  callFn: CallFn,
  name: string,
  category: string,
  ll: string | undefined,
  peerCount: number,
): Promise<{ you: MapsPlace; peers: MapsPlace[] }> {
  const results = await googleMaps(callFn, { q: category, ll: ll ?? DEFAULT_LL });
  const top = results.slice(0, 10);
  if (top.length === 0) throw new Error(`googleMaps returned no results for "${category}"`);
  const idx = top.findIndex((p) => p.title.toLowerCase().includes(name.toLowerCase()));
  const youIdx = idx >= 0 ? idx : 0;
  const you = top[youIdx];
  const peers = top.filter((_, i) => i !== youIdx).slice(0, peerCount);
  return { you, peers };
}

async function pullPlaceReviews(
  callFn: CallFn,
  place: { title: string; dataId: string },
  findLoc: string,
  cityToken: string,
) {
  const out: Awaited<ReturnType<typeof googleMapsReviews>> = [];
  for (const sortBy of ["newestFirst", "ratingLow"] as const) {
    const rows = await tryOrSkip(`google_maps_reviews ${place.title} ${sortBy}`, () =>
      googleMapsReviews(callFn, { dataId: place.dataId, place: place.title, sortBy }),
    );
    if (rows) out.push(...rows);
  }
  const yelpId = await tryOrSkip(`yelp search ${place.title}`, () =>
    yelpSearch(callFn, { findDesc: place.title, findLoc }),
  );
  if (yelpId) {
    const rows = await tryOrSkip(`yelp_reviews ${place.title}`, () =>
      yelpReviews(callFn, { placeId: yelpId, place: place.title }),
    );
    if (rows) out.push(...rows);
  }
  const taId = await tryOrSkip(`tripadvisor search ${place.title}`, () =>
    tripadvisorSearch(callFn, { q: `${place.title} ${cityToken}` }),
  );
  if (taId) {
    const rows = await tryOrSkip(`tripadvisor_reviews ${place.title}`, () =>
      tripadvisorReviews(callFn, { placeId: taId, place: place.title }),
    );
    if (rows) out.push(...rows);
  }
  return out;
}

async function pullAiAnswers(callFn: CallFn, name: string, topPeer: string, category: string, city: string) {
  const queries = [`is ${name} worth it`, `${name} vs ${topPeer}`, `best ${category} in ${city}`];
  const out: { query: string; result: AiOverviewResult }[] = [];
  for (const query of queries) {
    const result = await tryOrSkip(`ai overview "${query}"`, () => aiOverview(callFn, { q: query }));
    if (result) out.push({ query, result });
  }
  return out;
}

function toAiAnswerRow(businessName: string, ai: AiOverviewResult) {
  const combined = ai.textBlocks.join(" ").toLowerCase();
  const cited = ai.present && combined.includes(businessName.toLowerCase());
  const counts = new Map<string, number>();
  for (const name of ai.cited) counts.set(name, (counts.get(name) ?? 0) + 1);
  return {
    cited,
    sources: [...counts.entries()].map(([name, count]) => ({ name, count })),
    excerpt: ai.textBlocks[0] ?? "",
  };
}

function computePlatformsByTheme(rows: (ClassifiedLocalReview & { source: string })[]): Record<string, string[]> {
  const byTheme = new Map<string, Set<string>>();
  for (const r of rows) {
    if (r.intent === "praise") continue;
    for (const theme of r.themes) {
      const set = byTheme.get(theme) ?? new Set<string>();
      set.add(r.source);
      byTheme.set(theme, set);
    }
  }
  return Object.fromEntries([...byTheme.entries()].map(([theme, set]) => [theme, [...set].sort()]));
}

type Prescription = { theme: string; title: string; why: string; effort: string };

/** Wraps A's convex/playbook.ts (real and complete as of this writing --
 * this was a TODO-stub fallback earlier in the session; see MERGE-NOTES.md).
 * `fillPlaybook` returns `{title, why, effort, cadence}`; `cadence` is
 * dropped here since the `actions` table (and applyPrescriptions' validator
 * below) has no such column yet. */
function prescribeLocal(gap: LocalGap): Omit<Prescription, "theme">[] {
  const actions = fillPlaybook(gap);
  if (actions.length > 0) return actions.map(({ title, why, effort }) => ({ title, why, effort }));
  // No playbook entry for this theme (e.g. it's not one of the twelve local
  // themes) -- fall back to a generic one-liner rather than dropping the gap.
  const quote = gap.quotes[0]?.text;
  const why = quote ? `${gap.mentions} reviews mention this — e.g. "${quote}"` : `${gap.mentions} reviews mention this`;
  return [{ title: `Look into ${gap.label.toLowerCase()}`, why, effort: "med" }];
}

// ---------------------------------------------------------------------------
// internal DB access
// ---------------------------------------------------------------------------

export const getBusiness = internalQuery({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => ctx.db.get(businessId),
});

export const createBusiness = internalMutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    placeId: v.string(),
    category: v.string(),
    location: v.string(),
    peers: v.array(v.string()),
    timezone: v.string(),
  },
  handler: async (ctx, args) => ctx.db.insert("businesses", { ...args, createdAt: Date.now() }),
});

export const setDiscoveredPeers = internalMutation({
  args: { businessId: v.id("businesses"), placeId: v.string(), peers: v.array(v.string()) },
  handler: async (ctx, { businessId, placeId, peers }) => {
    await ctx.db.patch(businessId, { placeId, peers });
  },
});

/** Idempotent by (businessId, day) -- BUILD-PLAN.md Rules #6. `runs` has no
 * businessId column, so pulse runs key `term` = the businessId string,
 * reusing the existing by_kind_term index instead of a schema change. */
export const createRun = internalMutation({
  args: { businessId: v.id("businesses"), userId: v.id("users"), location: v.optional(v.string()) },
  handler: async (ctx, { businessId, userId, location }) => {
    const day = todayKey();
    const startOfDay = new Date(`${day}T00:00:00.000Z`).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
    const todaysRuns = await ctx.db
      .query("runs")
      .withIndex("by_kind_term", (q) => q.eq("kind", "pulse").eq("term", businessId))
      .collect();
    // ponytail: linear scan over one business's runs for one day -- always a
    // handful of rows. Reuses today's run even if it errored rather than
    // retrying; add a retry path if that turns out to matter for the demo.
    const existing = todaysRuns.find((r) => r.startedAt >= startOfDay && r.startedAt < endOfDay);
    if (existing) return { runId: existing._id, reused: true as const };
    const now = Date.now();
    const runId = await ctx.db.insert("runs", {
      kind: "pulse",
      term: businessId,
      location,
      userId,
      status: "running",
      startedAt: now,
      createdAt: now,
    });
    return { runId, reused: false as const };
  },
});

export const getRunSummary = internalQuery({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }) => {
    const run = await ctx.db.get(runId);
    const gaps = await ctx.db
      .query("gaps")
      .withIndex("by_run", (q) => q.eq("runId", runId))
      .collect();
    return {
      runId,
      businessId: run?.term as Id<"businesses"> | undefined,
      reviewCount: run?.reviewCount ?? 0,
      categoryGaps: gaps.sort((a, b) => b.score - a.score).slice(0, 10),
      liveCalls: run?.liveCalls ?? 0,
      cachedCalls: run?.cachedCalls ?? 0,
      reused: true as const,
    };
  },
});

export const finishRun = internalMutation({
  args: {
    runId: v.id("runs"),
    status: v.union(v.literal("done"), v.literal("error")),
    reviewCount: v.optional(v.number()),
    liveCalls: v.optional(v.number()),
    cachedCalls: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { runId, ...rest }) => {
    await ctx.db.patch(runId, { ...rest, finishedAt: Date.now() });
  },
});

const reviewRowValidator = v.object({
  source: v.string(),
  placeId: v.string(),
  hash: v.string(),
  text: v.optional(v.string()),
  rating: v.optional(v.number()),
  date: v.optional(v.string()),
});

export const saveReviews = internalMutation({
  args: { runId: v.id("runs"), reviews: v.array(reviewRowValidator) },
  handler: async (ctx, { runId, reviews }) => {
    let inserted = 0;
    for (const r of reviews) {
      const exists = await ctx.db
        .query("reviews")
        .withIndex("by_place_hash", (q) => q.eq("runId", runId).eq("placeId", r.placeId).eq("hash", r.hash))
        .first();
      if (exists) continue;
      await ctx.db.insert("reviews", { runId, ...r, createdAt: Date.now() });
      inserted++;
    }
    return inserted;
  },
});

const gapRowValidator = v.object({
  theme: v.string(),
  label: v.string(),
  mentions: v.number(),
  requests: v.number(),
  pain: v.number(),
  breadth: v.number(),
  score: v.number(),
  apps: v.array(v.string()),
  quotes: v.array(v.object({ text: v.string(), rating: v.optional(v.number()), place: v.string() })),
  platforms: v.optional(v.array(v.string())),
});

export const saveGaps = internalMutation({
  args: { runId: v.id("runs"), gaps: v.array(gapRowValidator) },
  handler: async (ctx, { runId, gaps }) => {
    for (const g of gaps) await ctx.db.insert("gaps", { runId, ...g, createdAt: Date.now() });
  },
});

export const saveAiAnswers = internalMutation({
  args: {
    businessId: v.id("businesses"),
    day: v.string(),
    answers: v.array(
      v.object({
        query: v.string(),
        cited: v.boolean(),
        sources: v.array(v.object({ name: v.string(), count: v.number() })),
        excerpt: v.string(),
      }),
    ),
  },
  handler: async (ctx, { businessId, day, answers }) => {
    for (const a of answers) await ctx.db.insert("ai_answers", { businessId, day, ...a, createdAt: Date.now() });
  },
});

export const applyPrescriptions = internalMutation({
  args: {
    businessId: v.id("businesses"),
    prescriptions: v.array(v.object({ theme: v.string(), title: v.string(), why: v.string(), effort: v.string() })),
  },
  handler: async (ctx, { businessId, prescriptions }) => {
    const todaysActions = await ctx.db
      .query("actions")
      .withIndex("by_business_state", (q) => q.eq("businessId", businessId).eq("state", "today"))
      .collect();
    for (const a of todaysActions) await ctx.db.patch(a._id, { state: "carried" });
    const now = Date.now();
    for (const p of prescriptions) {
      await ctx.db.insert("actions", {
        businessId,
        theme: p.theme,
        title: p.title,
        why: p.why,
        effort: p.effort,
        state: "today",
        prescribedAt: now,
        createdAt: now,
      });
    }
  },
});

// ---------------------------------------------------------------------------
// runPulse
// ---------------------------------------------------------------------------

export const runPulse = action({
  args: {
    businessId: v.optional(v.id("businesses")),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    ll: v.optional(v.string()),
    peerCount: v.optional(v.number()),
    timezone: v.optional(v.string()),
  },
  // Explicit return type breaks a circular-inference error: this handler
  // calls internal.pulse.* (defined in this very file), and without an
  // annotation TS can't determine `internal`'s type without first knowing
  // this handler's return type, and vice versa.
  handler: async (ctx, args): Promise<any> => {
    const { userId, role } = await requireActionUser(ctx);

    let business = args.businessId ? await ctx.runQuery(internal.pulse.getBusiness, { businessId: args.businessId }) : null;
    if (args.businessId && !business) throw new Error("business not found");

    if (!business) {
      if (role === "viewer") throw new Error("viewer role cannot start a new Pulse business");
      if (!args.name || !args.category || !args.location) {
        throw new Error("runPulse needs businessId, or name + category + location");
      }
      // Created with a placeholder placeId/peers -- discovery below (which
      // needs a runId, which needs a businessId) fills them in.
      const businessId = await ctx.runMutation(internal.pulse.createBusiness, {
        userId,
        name: args.name,
        placeId: "",
        category: args.category,
        location: args.location,
        peers: [],
        timezone: args.timezone ?? "America/Chicago",
      });
      business = await ctx.runQuery(internal.pulse.getBusiness, { businessId });
    }
    if (!business) throw new Error("failed to resolve business");

    return executePulse(ctx, business, userId, role, { ll: args.ll, peerCount: args.peerCount });
  },
});

/** Shared by the public `runPulse` action and `runPulseScheduled` (the cron
 * entry point, which has no signed-in user to authenticate). */
async function executePulse(
  ctx: ActionCtx,
  business: Doc<"businesses">,
  userId: Id<"users">,
  role: Role,
  opts: { ll?: string; peerCount?: number },
): Promise<any> {
  const { runId, reused } = await ctx.runMutation(internal.pulse.createRun, {
    businessId: business._id,
    userId,
    location: business.location,
  });
  if (reused) return ctx.runQuery(internal.pulse.getRunSummary, { runId });

  const callFn = makeCallFn(ctx, runId);

  try {
    let you: { title: string; dataId: string };
    let peers: { title: string; dataId: string }[];
    if (business.placeId) {
      you = { title: business.name, dataId: business.placeId };
      peers = business.peers.map(decodePeer);
    } else {
      const discovered = await discoverPlaces(callFn, business.name, business.category, opts.ll, opts.peerCount ?? 6);
      you = { title: discovered.you.title, dataId: discovered.you.dataId };
      peers = discovered.peers.map((p) => ({ title: p.title, dataId: p.dataId }));
      await ctx.runMutation(internal.pulse.setDiscoveredPeers, {
        businessId: business._id,
        placeId: you.dataId,
        peers: peers.map((p) => encodePeer(p.title, p.dataId)),
      });
    }

    const cityToken = business.location.split(",")[0]?.trim() || business.location;
    const allPlaces = [you, ...peers];
    const reviewLists = await Promise.all(allPlaces.map((p) => pullPlaceReviews(callFn, p, business.location, cityToken)));
    const rawReviews = reviewLists.flat();

    // Dedupe on (placeId, hash) -- the sorts (and sources) overlap.
    // Reuses dedupe.ts's dedupeReviews via the generic `app_id` field.
    const deduped = dedupeReviews(rawReviews.map((r) => ({ ...r, app_id: r.placeId })));

    await ctx.runMutation(internal.pulse.saveReviews, {
      runId,
      reviews: deduped.map((r) => ({
        source: r.source,
        placeId: r.placeId,
        hash: r.hash,
        text: r.text,
        rating: r.rating ?? undefined,
        date: r.date,
      })),
    });

    const classified: (ClassifiedLocalReview & { source: string })[] = deduped.map((r) => ({
      ...classifyLocal({ app_id: r.placeId, rating: r.rating, text: r.text }),
      source: r.source,
    }));

    const appsById: Record<string, { title: string }> = {};
    for (const p of allPlaces) appsById[p.dataId] = { title: p.title };

    const categoryGaps = rankGapsLocal(classified, appsById);
    const yourGaps = rankGapsLocal(
      classified.filter((r) => r.app_id === you.dataId),
      appsById,
    );
    const topCategoryThemes = new Set(categoryGaps.slice(0, 5).map((g) => g.theme));
    const alreadyHittingYou = yourGaps.filter((g) => topCategoryThemes.has(g.theme)).map((g) => g.theme);
    const platformsByTheme = computePlatformsByTheme(classified);

    await ctx.runMutation(internal.pulse.saveGaps, {
      runId,
      gaps: categoryGaps.map((g) => ({
        theme: g.theme,
        label: g.label,
        mentions: g.mentions,
        requests: g.requests,
        pain: g.pain,
        breadth: g.breadth,
        score: g.score,
        apps: g.apps,
        quotes: g.quotes.map((q) => ({ text: q.text, rating: q.rating ?? undefined, place: q.app })),
        platforms: platformsByTheme[g.theme] ?? [],
      })),
    });

    const day = todayKey();
    const aiRaw = await pullAiAnswers(callFn, you.title, peers[0]?.title ?? business.category, business.category, cityToken);
    await ctx.runMutation(internal.pulse.saveAiAnswers, {
      businessId: business._id,
      day,
      answers: aiRaw.map((a) => ({ query: a.query, ...toAiAnswerRow(you.title, a.result) })),
    });

    const sourceGaps = yourGaps.length > 0 ? yourGaps : categoryGaps.slice(0, 3);
    const prescriptions: Prescription[] = sourceGaps
      .slice(0, 3)
      .flatMap((g) => prescribeLocal(g).slice(0, 1).map((a) => ({ theme: g.theme, ...a })));
    await ctx.runMutation(internal.pulse.applyPrescriptions, { businessId: business._id, prescriptions });

    const counters: { liveSearches: number; servedFromCache: number } = await ctx.runQuery(internal.serp.counters, {
      runId,
    });
    await ctx.runMutation(internal.pulse.finishRun, {
      runId,
      status: "done",
      reviewCount: deduped.length,
      liveCalls: counters.liveSearches,
      cachedCalls: counters.servedFromCache,
    });

    return {
      runId,
      businessId: business._id,
      reviewCount: deduped.length,
      categoryGaps: categoryGaps.slice(0, 10),
      yourGaps,
      alreadyHittingYou,
      liveCalls: counters.liveSearches,
      cachedCalls: counters.servedFromCache,
      reused: false as const,
    };
  } catch (err) {
    await ctx.runMutation(internal.pulse.finishRun, { runId, status: "error", error: String(err) });
    throw err;
  }
}

/** Cron entry point (see crons.ts) -- no signed-in user, so it authenticates
 * as the business owner and runs uncapped ("admin"): a scheduled pulse
 * shouldn't silently no-op because the owning account happens to be a
 * capped judge/demo login. Only works for an already-discovered business
 * (businessId), never creates a new one. */
export const runPulseScheduled = internalAction({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }): Promise<any> => {
    const business = await ctx.runQuery(internal.pulse.getBusiness, { businessId });
    if (!business) return null;
    return executePulse(ctx, business, business.userId, "admin", {});
  },
});

export const listBusinessIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("businesses").collect();
    return rows.map((b) => b._id);
  },
});

// ---------------------------------------------------------------------------
// morningCard (PulseHome)
// ---------------------------------------------------------------------------

export const getMorningData = internalQuery({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    const business = await ctx.db.get(businessId);
    const [today, carried, doneRows] = await Promise.all([
      ctx.db
        .query("actions")
        .withIndex("by_business_state", (q) => q.eq("businessId", businessId).eq("state", "today"))
        .collect(),
      ctx.db
        .query("actions")
        .withIndex("by_business_state", (q) => q.eq("businessId", businessId).eq("state", "carried"))
        .collect(),
      ctx.db
        .query("actions")
        .withIndex("by_business_state", (q) => q.eq("businessId", businessId).eq("state", "done"))
        .collect(),
    ]);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const doneThisWeek = doneRows.filter((a) => (a.doneAt ?? 0) >= sevenDaysAgo);

    const runs = await ctx.db
      .query("runs")
      .withIndex("by_kind_term", (q) => q.eq("kind", "pulse").eq("term", businessId))
      .collect();
    const doneRuns = runs.filter((r) => r.status === "done").sort((a, b) => b.startedAt - a.startedAt);
    const latestRun = doneRuns[0] ?? null;
    const prevRun = doneRuns[1] ?? null;

    const gaps = latestRun
      ? await ctx.db
          .query("gaps")
          .withIndex("by_run", (q) => q.eq("runId", latestRun._id))
          .collect()
      : [];
    const sortedGaps = [...gaps].sort((a, b) => b.score - a.score);
    const topGap = sortedGaps[0] ?? null;

    const prevGaps = prevRun
      ? await ctx.db
          .query("gaps")
          .withIndex("by_run", (q) => q.eq("runId", prevRun._id))
          .collect()
      : [];
    const prevTopGap = topGap ? prevGaps.find((g) => g.theme === topGap.theme) : undefined;
    const trend: "up" | "down" | "flat" =
      !topGap || !prevTopGap || topGap.mentions === prevTopGap.mentions
        ? "flat"
        : topGap.mentions > prevTopGap.mentions
          ? "up"
          : "down";

    const day = latestRun ? new Date(latestRun.startedAt).toISOString().slice(0, 10) : todayKey();
    const aiAnswers = await ctx.db
      .query("ai_answers")
      .withIndex("by_business_day", (q) => q.eq("businessId", businessId).eq("day", day))
      .collect();
    const aiCited = aiAnswers.some((a) => a.cited);

    return {
      business,
      today,
      carried,
      doneThisWeekCount: doneThisWeek.length,
      gaps: sortedGaps.slice(0, 8),
      topGap,
      trend,
      aiAnswers,
      aiCited,
    };
  },
});

export const morningCard = action({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }): Promise<any> => {
    await requireActionUser(ctx); // any authenticated role can view
    const data = await ctx.runQuery(internal.pulse.getMorningData, { businessId });
    const headline = await cardHeadline(ctx, {
      businessName: data.business?.name,
      topGapLabel: data.topGap?.label,
      topGapMentions: data.topGap?.mentions,
      trend: data.trend,
      aiCited: data.aiCited,
    });
    return { ...data, headline: headline.text, headlineFallback: headline.fallback };
  },
});

// ---------------------------------------------------------------------------
// measureExperiments (the Monday read)
// ---------------------------------------------------------------------------

export const listMeasuringExperiments = internalQuery({
  args: {},
  handler: async (ctx) => {
    // ponytail: full table scan -- fine at hackathon scale (a handful of
    // businesses, one experiment per theme). Add a `by_verdict` index if
    // this ever needs to run over real traffic.
    const all = await ctx.db.query("experiments").collect();
    return all.filter((e) => e.verdict === "measuring");
  },
});

export const getLatestDoneRun = internalQuery({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    const runs = await ctx.db
      .query("runs")
      .withIndex("by_kind_term", (q) => q.eq("kind", "pulse").eq("term", businessId))
      .collect();
    return runs.filter((r) => r.status === "done").sort((a, b) => b.startedAt - a.startedAt)[0] ?? null;
  },
});

export const getGapByTheme = internalQuery({
  args: { runId: v.id("runs"), theme: v.string() },
  handler: async (ctx, { runId, theme }) => {
    const gaps = await ctx.db
      .query("gaps")
      .withIndex("by_run", (q) => q.eq("runId", runId))
      .collect();
    return gaps.find((g) => g.theme === theme) ?? null;
  },
});

export const appendExperimentRead = internalMutation({
  args: {
    experimentId: v.id("experiments"),
    read: v.object({ at: v.number(), mentions: v.number(), pain: v.number() }),
    verdict: v.union(v.literal("measuring"), v.literal("moved"), v.literal("flat"), v.literal("too_few")),
  },
  handler: async (ctx, { experimentId, read, verdict }) => {
    const exp = await ctx.db.get(experimentId);
    if (!exp) return;
    await ctx.db.patch(experimentId, { reads: [...exp.reads, read], verdict });
  },
});

/** moved if mentions -30% or pain -0.5 vs baseline; flat if this read is
 * within +-15% of the previous read (or baseline, if this is the first
 * read); too_few if fewer than 5 mentions this read; else keep measuring. */
export function experimentVerdict(
  baselineMentions: number,
  baselinePain: number,
  mentions: number,
  pain: number,
  priorRead?: { mentions: number; pain: number },
): "moved" | "flat" | "too_few" | "measuring" {
  if (mentions < 5) return "too_few";
  const mentionsDropPct = baselineMentions > 0 ? (baselineMentions - mentions) / baselineMentions : 0;
  const painDrop = baselinePain - pain;
  if (mentionsDropPct >= 0.3 || painDrop >= 0.5) return "moved";
  const compareTo = priorRead ?? { mentions: baselineMentions, pain: baselinePain };
  const withinBand =
    compareTo.mentions > 0 ? Math.abs(mentions - compareTo.mentions) / compareTo.mentions <= 0.15 : mentions === 0;
  return withinBand ? "flat" : "measuring";
}

export const measureExperiments = internalAction({
  args: {},
  handler: async (ctx) => {
    const experiments = await ctx.runQuery(internal.pulse.listMeasuringExperiments, {});
    for (const exp of experiments) {
      const run = await ctx.runQuery(internal.pulse.getLatestDoneRun, { businessId: exp.businessId });
      if (!run) continue;
      const gap = await ctx.runQuery(internal.pulse.getGapByTheme, { runId: run._id, theme: exp.theme });
      const mentions = gap?.mentions ?? 0;
      const pain = gap?.pain ?? 0;
      const priorRead = exp.reads[exp.reads.length - 1];
      const verdict = experimentVerdict(exp.baselineMentions, exp.baselinePain, mentions, pain, priorRead);
      await ctx.runMutation(internal.pulse.appendExperimentRead, {
        experimentId: exp._id,
        read: { at: Date.now(), mentions, pain },
        verdict,
      });
    }
  },
});
