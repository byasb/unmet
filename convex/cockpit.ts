// The cockpit's public read/write API -- every frontend hook in
// src/data/api.ts maps 1:1 to a function here. Reads are open to any
// authenticated role; writes require admin or judge (BUILD-PLAN.md Rules
// #3). This file only ever touches its own reads/writes -- see the file
// ownership note at the top of the task: everything else under convex/ is
// someone else's, read-and-import only.
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireRole, requireUser } from "./auth";
import { LIVE_CAPS, todayKey } from "./usageRules";

// businesses.peers is encoded "<title>::<dataId>" (see pulse.ts's
// encodePeer) -- decodePeer isn't exported there, so it's duplicated here
// per the ownership split (write it here if it's missing on their side).
function decodePeer(s: string): { title: string; dataId: string } {
  const idx = s.lastIndexOf("::");
  return idx === -1 ? { title: s, dataId: s } : { title: s.slice(0, idx), dataId: s.slice(idx + 2) };
}

async function latestDonePulseRun(ctx: QueryCtx, businessId: Id<"businesses">): Promise<Doc<"runs"> | null> {
  const rows = await ctx.db
    .query("runs")
    .withIndex("by_kind_term", (q) => q.eq("kind", "pulse").eq("term", businessId))
    .collect();
  return rows.filter((r) => r.status === "done").sort((a, b) => b.startedAt - a.startedAt)[0] ?? null;
}

// ---------------------------------------------------------------------------
// reads
// ---------------------------------------------------------------------------

export const run = query({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }) => {
    await requireUser(ctx);
    return await ctx.db.get(runId);
  },
});

// The streaming Reading screen's subscription.
export const calls = query({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }) => {
    await requireUser(ctx);
    const rows = await ctx.db
      .query("calls")
      .withIndex("by_run", (q) => q.eq("runId", runId))
      .collect();
    return rows.sort((a, b) => a.at - b.at);
  },
});

export const gaps = query({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }) => {
    await requireUser(ctx);
    const rows = await ctx.db
      .query("gaps")
      .withIndex("by_run", (q) => q.eq("runId", runId))
      .collect();
    return rows.sort((a, b) => b.score - a.score);
  },
});

// ponytail: demo scope -- every authenticated user sees every business.
// Per-user scoping (filter by businesses.userId) can land once there's more
// than one owner using this.
export const businesses = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const rows = await ctx.db.query("businesses").collect();
    return rows.map((b) => ({ ...b, peers: b.peers.map(decodePeer) }));
  },
});

export const latestPulseRun = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await requireUser(ctx);
    return await latestDonePulseRun(ctx, businessId);
  },
});

export const pulseGaps = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await requireUser(ctx);
    const business = await ctx.db.get(businessId);
    if (!business) return [];
    const latest = await latestDonePulseRun(ctx, businessId);
    if (!latest) return [];
    const rows = await ctx.db
      .query("gaps")
      .withIndex("by_run", (q) => q.eq("runId", latest._id))
      .collect();
    const totalPlaces = 1 + business.peers.length;
    return rows
      .sort((a, b) => b.score - a.score)
      .map((g) => ({
        ...g,
        inYourReviews: g.apps.includes(business.name),
        totalPlaces,
      }));
  },
});

export const pulseHome = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await requireUser(ctx);
    const business = await ctx.db.get(businessId);
    if (!business) return null;

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
    const done = doneRows.filter((a) => (a.doneAt ?? 0) >= sevenDaysAgo);

    const allRuns = await ctx.db
      .query("runs")
      .withIndex("by_kind_term", (q) => q.eq("kind", "pulse").eq("term", businessId))
      .collect();
    const sortedRuns = [...allRuns].sort((a, b) => b.startedAt - a.startedAt);
    const week = sortedRuns
      .slice(0, 7)
      .reverse()
      .map((r) => ({
        day: new Date(r.startedAt).toISOString().slice(0, 10),
        reviewCount: r.reviewCount ?? 0,
        liveCalls: r.liveCalls ?? 0,
        cachedCalls: r.cachedCalls ?? 0,
        status: r.status,
      }));

    const latest = sortedRuns.filter((r) => r.status === "done")[0] ?? null;
    let gapsHitting = 0;
    let gapsTotal = 0;
    let aiCited = false;
    if (latest) {
      const gapRows = await ctx.db
        .query("gaps")
        .withIndex("by_run", (q) => q.eq("runId", latest._id))
        .collect();
      gapsTotal = gapRows.length;
      gapsHitting = gapRows.filter((g) => g.apps.includes(business.name)).length;

      const day = new Date(latest.startedAt).toISOString().slice(0, 10);
      const aiRows = await ctx.db
        .query("ai_answers")
        .withIndex("by_business_day", (q) => q.eq("businessId", businessId).eq("day", day))
        .collect();
      aiCited = aiRows.some((a) => a.cited);
    }

    return {
      business,
      today,
      carried,
      done,
      week,
      gapsHitting,
      gapsTotal,
      latestRunId: latest?._id ?? null,
      aiCited,
    };
  },
});

// Most recent day that has any rows -- fine to scan at demo scale (a
// handful of businesses, a handful of days each).
export const aiAnswers = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await requireUser(ctx);
    const rows = await ctx.db
      .query("ai_answers")
      .withIndex("by_business_day", (q) => q.eq("businessId", businessId))
      .collect();
    if (rows.length === 0) return [];
    const latestDay = rows.reduce((max, r) => (r.day > max ? r.day : max), rows[0].day);
    return rows.filter((r) => r.day === latestDay);
  },
});

export const drafts = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await requireUser(ctx);
    const rows = await ctx.db
      .query("drafts")
      .withIndex("by_business_status", (q) => q.eq("businessId", businessId))
      .collect();
    const sorted = [...rows].sort((a, b) => {
      const aFirst = a.status === "drafted" ? 0 : 1;
      const bFirst = b.status === "drafted" ? 0 : 1;
      return aFirst - bFirst;
    });
    return await Promise.all(
      sorted.map(async (d) => {
        const review = await ctx.db.get(d.reviewId);
        return {
          ...d,
          review: review
            ? { text: review.text, rating: review.rating, source: review.source, placeId: review.placeId }
            : null,
        };
      }),
    );
  },
});

export const experiments = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await requireUser(ctx);
    const rows = await ctx.db
      .query("experiments")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect();
    return await Promise.all(
      rows.map(async (e) => {
        const action = await ctx.db.get(e.actionId);
        return { ...e, actionTitle: action?.title ?? "" };
      }),
    );
  },
});

export const quota = query({
  args: {},
  handler: async (ctx) => {
    const { userId, role } = await requireUser(ctx);
    const now = new Date();
    const startOfMonth = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
    // ponytail: full scan over `calls` -- fine at hackathon scale (a few
    // hundred rows across all runs). Add a by_live_at index if that changes.
    const allCalls = await ctx.db.query("calls").collect();
    const usedHere = allCalls.filter((c) => c.live && c.at >= startOfMonth).length;
    // SerpApi's own counters when we have them (polled hourly), else this
    // app's live-call count as a floor.
    const account = await ctx.db.query("serp_account").first();
    const used = account ? Math.max(account.thisMonthUsage, usedHere) : usedHere;
    const limit = account?.searchesPerMonth || 250;

    const usageRow = await ctx.db
      .query("usage")
      .withIndex("by_user_day", (q) => q.eq("userId", userId).eq("day", todayKey()))
      .unique();

    return {
      used,
      limit,
      usedHere,
      accountFetchedAt: account?.fetchedAt ?? null,
      role,
      liveToday: usageRow?.liveSearches ?? 0,
      capToday: LIVE_CAPS[role],
    };
  },
});

// ---------------------------------------------------------------------------
// writes (admin or judge only)
// ---------------------------------------------------------------------------

export const markActionDone = mutation({
  args: { actionId: v.id("actions") },
  handler: async (ctx, { actionId }) => {
    await requireRole(ctx, "admin", "judge");
    const action = await ctx.db.get(actionId);
    if (!action) throw new Error("action not found");

    if (action.state === "done") {
      // Idempotent: return the experiment it already started, if any.
      return action.experimentId ? await ctx.db.get(action.experimentId) : null;
    }

    const latest = await latestDonePulseRun(ctx, action.businessId);
    let baselineMentions = 0;
    let baselinePain = 0;
    if (latest) {
      const gapRows = await ctx.db
        .query("gaps")
        .withIndex("by_run", (q) => q.eq("runId", latest._id))
        .collect();
      const gap = gapRows.find((g) => g.theme === action.theme);
      if (gap) {
        baselineMentions = gap.mentions;
        baselinePain = gap.pain;
      }
    }

    const now = Date.now();
    const experimentId = await ctx.db.insert("experiments", {
      businessId: action.businessId,
      actionId,
      theme: action.theme,
      baselineMentions,
      baselinePain,
      startedAt: now,
      reads: [],
      verdict: "measuring",
      createdAt: now,
    });

    await ctx.db.patch(actionId, { state: "done", doneAt: now, experimentId });
    return await ctx.db.get(experimentId);
  },
});

export const snoozeAction = mutation({
  args: { actionId: v.id("actions") },
  handler: async (ctx, { actionId }) => {
    await requireRole(ctx, "admin", "judge");
    await ctx.db.patch(actionId, { state: "snoozed" });
  },
});

export const setDraftStatus = mutation({
  args: { draftId: v.id("drafts"), status: v.union(v.literal("approved"), v.literal("skipped")) },
  handler: async (ctx, { draftId, status }) => {
    await requireRole(ctx, "admin", "judge");
    await ctx.db.patch(draftId, { status });
  },
});
