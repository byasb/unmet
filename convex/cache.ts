// serp_cache reads/writes. Kept separate from serp.ts so the cache-key
// derivation (cacheKey.ts) and the HTTP client (serp.ts) each stay small.
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./serverApi";

export const getCached = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    return await ctx.db
      .query("serp_cache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
  },
});

export const putCache = internalMutation({
  args: {
    key: v.string(),
    engine: v.string(),
    params: v.any(),
    response: v.any(),
    source: v.union(v.literal("live"), v.literal("fixture")),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("serp_cache")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("serp_cache", {
      ...args,
      fetchedAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});
