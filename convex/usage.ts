// Convex bindings for the `usage` table. Decision logic itself lives in
// usageRules.ts (pure, testable without a deployment); this file is just
// the db plumbing around it.
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { canSpend, todayKey, LIVE_CAPS } from "./usageRules";

export { canSpend, todayKey, LIVE_CAPS };
export type { Role } from "./usageRules";

const roleValidator = v.union(v.literal("admin"), v.literal("judge"), v.literal("viewer"));

async function findRow(ctx: QueryCtx | MutationCtx, userId: Id<"users">, day: string) {
  return ctx.db
    .query("usage")
    .withIndex("by_user_day", (q) => q.eq("userId", userId).eq("day", day))
    .unique();
}

export const getUsage = internalQuery({
  args: { userId: v.id("users"), day: v.optional(v.string()) },
  handler: async (ctx, { userId, day }) => {
    return (await findRow(ctx, userId, day ?? todayKey())) ?? null;
  },
});

/** Role-aware quota check for one user, today. Called by pulse.ts before any
 * live SerpApi fetch (BUILD-PLAN.md Rules #3). */
export const canSpendLive = internalQuery({
  args: { userId: v.id("users"), role: roleValidator, n: v.optional(v.number()) },
  handler: async (ctx, { userId, role, n }) => {
    const row = await findRow(ctx, userId, todayKey());
    return canSpend(role, row?.liveSearches ?? 0, n ?? 1);
  },
});

export const recordLive = internalMutation({
  args: { userId: v.id("users"), n: v.optional(v.number()) },
  handler: async (ctx, { userId, n }) => {
    const day = todayKey();
    const amount = n ?? 1;
    const row = await findRow(ctx, userId, day);
    if (row) {
      await ctx.db.patch(row._id, { liveSearches: row.liveSearches + amount });
    } else {
      await ctx.db.insert("usage", { userId, day, liveSearches: amount, tokens: 0, createdAt: Date.now() });
    }
  },
});

export const recordTokens = internalMutation({
  args: { userId: v.id("users"), tokens: v.number() },
  handler: async (ctx, { userId, tokens }) => {
    const day = todayKey();
    const row = await findRow(ctx, userId, day);
    if (row) {
      await ctx.db.patch(row._id, { tokens: row.tokens + tokens });
    } else {
      await ctx.db.insert("usage", { userId, day, liveSearches: 0, tokens, createdAt: Date.now() });
    }
  },
});
