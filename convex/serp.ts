// SerpApi client, ported from app/serp.py's `call`. Cache-first: every
// engine wrapper in engines.ts goes through here so a re-run of a category
// that's already been pulled costs zero live searches.
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { Role } from "./usageRules";
import { cacheKey, type SerpParams } from "./cacheKey";

const ENDPOINT = "https://serpapi.com/search.json";

export class SerpError extends Error {}
/** Thrown instead of a live fetch when the run's owner is over their daily
 * live-search cap (BUILD-PLAN Rule 3). Cache hits are always free. */
export class QuotaExceeded extends Error {}

function offline(): boolean {
  return process.env.OFFLINE === "1";
}

// TTL per engine (ms). Fixture-sourced rows never expire (expiresAt is left
// undefined for those) -- this table only governs live-fetched rows.
const DAY = 24 * 60 * 60 * 1000;
const TTL_MS: Record<string, number> = {
  apple_reviews: DAY,
  google_maps_reviews: DAY,
  yelp_reviews: DAY,
  tripadvisor_reviews: DAY,
  opentable_reviews: DAY,
  google_ai_overview: DAY,
  // Plain `google` search used to pull an inline ai_overview block (see
  // BUILD-PLAN's aiOverview note) -- same freshness need as the dedicated
  // ai_overview engine.
  google: DAY,
  apple_app_store: 7 * DAY,
  google_maps: 7 * DAY,
  yelp: 7 * DAY,
  tripadvisor: 7 * DAY,
  google_trends: 7 * DAY,
  google_autocomplete: 30 * DAY,
};

function ttlFor(engine: string): number | undefined {
  return TTL_MS[engine];
}

function summarizeParams(params: SerpParams): string {
  const { engine: _engine, ...rest } = params;
  return Object.entries(rest)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
}

/**
 * One SerpApi call, cache-first. `runId` is only used to attribute the
 * `calls` row this produces -- it plays no part in the cache key, so two
 * different runs asking for the same engine+params share a cache hit.
 */
export async function call(
  ctx: ActionCtx,
  runId: Id<"runs">,
  params: SerpParams,
): Promise<any> {
  const engine = String(params.engine ?? "unknown");
  const key = await cacheKey(params);
  const start = Date.now();

  const cached = await ctx.runQuery(internal.cache.getCached, { key });
  if (cached) {
    await ctx.runMutation(internal.serp.recordCall, {
      runId,
      engine,
      paramsSummary: summarizeParams(params),
      live: false,
      ms: Date.now() - start,
    });
    return cached.response;
  }

  const owner: { userId: Id<"users">; role: Role } | null = await ctx.runQuery(
    internal.serp.runOwner,
    { runId },
  );
  if (!owner) throw new SerpError("run has no owner");
  const canGo: boolean = await ctx.runQuery(internal.usage.canSpendLive, owner);
  if (!canGo) throw new QuotaExceeded(`${engine}: over daily live-search cap for role ${owner.role}`);

  if (offline()) {
    const subject = params.term ?? params.product_id ?? params.q ?? "";
    throw new SerpError(`OFFLINE=1 and no fixture for ${engine} ${subject}`);
  }

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    throw new SerpError(
      "SERPAPI_KEY is not set. Get a free key at serpapi.com/manage-api-key",
    );
  }

  const url = new URL(ENDPOINT);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  url.searchParams.set("api_key", apiKey);

  const resp = await fetch(url.toString());
  const data = await resp.json();
  if (data?.error) throw new SerpError(String(data.error));
  const ms = Date.now() - start;

  await ctx.runMutation(internal.cache.putCache, {
    key,
    engine,
    params,
    response: data,
    source: "live",
    expiresAt: ttlFor(engine) ? Date.now() + ttlFor(engine)! : undefined,
  });
  await ctx.runMutation(internal.serp.recordCall, {
    runId,
    engine,
    paramsSummary: summarizeParams(params),
    live: true,
    ms,
  });
  await ctx.runMutation(internal.usage.recordLive, { userId: owner.userId });
  return data;
}

/** Who pays for a run's live searches. */
export const runOwner = internalQuery({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }) => {
    const run = await ctx.db.get(runId);
    if (!run) return null;
    const user = await ctx.db.get(run.userId);
    if (!user) return null;
    return { userId: run.userId, role: user.role };
  },
});

// -- calls bookkeeping --------------------------------------------------

export const recordCall = internalMutation({
  args: {
    runId: v.id("runs"),
    engine: v.string(),
    paramsSummary: v.string(),
    live: v.boolean(),
    ms: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("calls", { ...args, at: now, createdAt: now });
  },
});

// Live/cached counters for a run -- the TS equivalent of serp.py's
// module-level `_live`/`_cached` globals, but derived from the `calls`
// table instead of process-global state (actions may run concurrently).
export const counters = internalQuery({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }) => {
    const rows = await ctx.db
      .query("calls")
      .withIndex("by_run", (q) => q.eq("runId", runId))
      .collect();
    const liveSearches = rows.filter((r) => r.live).length;
    return { liveSearches, servedFromCache: rows.length - liveSearches };
  },
});
