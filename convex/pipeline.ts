// Build pipeline: search -> reviews -> dedupe -> classify -> rank -> write.
// Ported from api.py's `run_category`. Actions stay thin -- all DB access
// goes through the internal mutations/query below.
import { v } from "convex/values";
import { action, internal, internalMutation, internalQuery } from "./serverApi";
import type { Id } from "./serverApi";
import { getAuthUserId } from "@convex-dev/auth/server";
import * as engines from "./engines";
import { classifyLocal, rankGaps, writeBrief } from "./analyze";
import { dedupeReviews } from "./dedupe";
import { SerpError } from "./serp";

export const runBuild = action({
  args: {
    term: v.string(),
    country: v.optional(v.string()),
    apps: v.optional(v.number()),
    pages: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Id<"runs">> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    // TODO(Subagent B): enforce role/usage caps here via usage.ts before any
    // live fetch happens -- viewer can't trigger live fetches, judge is
    // capped at 30 live searches/day (see BUILD-PLAN Rule 3).

    const country = args.country ?? "us";
    const numApps = args.apps ?? 8;
    const pages = Math.max(0, Math.min(2, args.pages ?? 2));

    const runId = await ctx.runMutation(internal.pipeline.createRun, {
      kind: "build" as const,
      term: args.term,
      country,
      userId,
    });

    try {
      const found = await engines.searchApps(ctx, runId, args.term, country, numApps);
      if (!found.length) {
        await ctx.runMutation(internal.pipeline.failRun, {
          runId,
          error: `No apps ranking for ${args.term}`,
        });
        return runId;
      }

      // Both sorts, because they surface different material: "mostrecent" is
      // dominated by short praise, "mosthelpful" is where the long
      // grievances live.
      const sorts = (["mosthelpful", "mostrecent"] as const).slice(0, pages);
      let rawReviews: engines.AppReview[] = [];
      for (const a of found) {
        if (!a.id) continue;
        for (const sort of sorts) {
          try {
            const batch = await engines.appReviews(ctx, runId, a.id, country, sort);
            rawReviews = rawReviews.concat(batch);
          } catch (err) {
            if (err instanceof SerpError) break; // offline, no fixture for this sort
            throw err;
          }
        }
      }

      const deduped = dedupeReviews(rawReviews);
      const labelled = deduped.map(classifyLocal);
      const byId = Object.fromEntries(found.map((a) => [String(a.id), a]));
      const gaps = rankGaps(labelled, byId);
      const demand = await engines.trendQueries(ctx, runId, args.term);
      const phrasing = await engines.autocomplete(ctx, runId, args.term);
      const brief = writeBrief(args.term, found, gaps, demand);

      await ctx.runMutation(internal.pipeline.finishRun, {
        runId,
        reviewCount: deduped.length,
        apps: found,
        reviews: labelled.map((r) => ({
          app_id: r.app_id,
          hash: r.hash,
          title: r.title,
          text: r.text,
          rating: r.rating,
          author: r.author,
        })),
        gaps,
        brief,
        demand,
        phrasing,
      });
      return runId;
    } catch (err) {
      await ctx.runMutation(internal.pipeline.failRun, {
        runId,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  },
});

export const createRun = internalMutation({
  args: {
    kind: v.union(v.literal("build"), v.literal("pulse")),
    term: v.string(),
    country: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("runs", {
      ...args,
      status: "running" as const,
      startedAt: now,
      createdAt: now,
    });
  },
});

export const failRun = internalMutation({
  args: { runId: v.id("runs"), error: v.string() },
  handler: async (ctx, { runId, error }) => {
    await ctx.db.patch(runId, {
      status: "error",
      error,
      finishedAt: Date.now(),
    });
  },
});

export const finishRun = internalMutation({
  args: {
    runId: v.id("runs"),
    reviewCount: v.number(),
    reviews: v.array(
      v.object({
        app_id: v.string(),
        hash: v.string(),
        title: v.optional(v.string()),
        text: v.optional(v.string()),
        rating: v.optional(v.number()),
        author: v.optional(v.string()),
      }),
    ),
    apps: v.array(v.any()),
    gaps: v.array(v.any()),
    brief: v.string(),
    demand: v.array(v.any()),
    phrasing: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    for (const r of args.reviews) {
      await ctx.db.insert("reviews", {
        runId: args.runId,
        source: "apple_app_store",
        placeId: r.app_id,
        hash: r.hash,
        title: r.title,
        text: r.text,
        rating: r.rating,
        author: r.author,
        createdAt: now,
      });
    }

    for (const g of args.gaps) {
      await ctx.db.insert("gaps", {
        runId: args.runId,
        theme: g.theme,
        label: g.label,
        mentions: g.mentions,
        requests: g.requests,
        pain: g.pain,
        breadth: g.breadth,
        score: g.score,
        apps: g.apps,
        quotes: g.quotes.map((q: any) => ({
          text: q.text,
          rating: q.rating,
          place: q.app,
        })),
        createdAt: now,
      });
    }

    const calls = await ctx.db
      .query("calls")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();
    const liveCalls = calls.filter((c) => c.live).length;
    const cachedCalls = calls.length - liveCalls;

    await ctx.db.patch(args.runId, {
      status: "done",
      finishedAt: now,
      reviewCount: args.reviewCount,
      liveCalls,
      cachedCalls,
      apps: args.apps,
      brief: args.brief,
      demand: args.demand,
      phrasing: args.phrasing,
    });
  },
});

/** Everything the board needs for one run. */
export const getRun = internalQuery({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }) => {
    const run = await ctx.db.get(runId);
    if (!run) return null;
    const [calls, reviews, gaps] = await Promise.all([
      ctx.db
        .query("calls")
        .withIndex("by_run", (q) => q.eq("runId", runId))
        .collect(),
      ctx.db
        .query("reviews")
        .withIndex("by_run", (q) => q.eq("runId", runId))
        .collect(),
      ctx.db
        .query("gaps")
        .withIndex("by_run", (q) => q.eq("runId", runId))
        .collect(),
    ]);
    return { run, calls, reviews, gaps };
  },
});
