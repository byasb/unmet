// Operator-only helpers, run from the CLI (`npx convex run admin:setRole ...`).
// Internal on purpose: nothing in the app can call these.
import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { executeBuild } from "./pipeline";
import { executePulse } from "./pulse";

export const setRole = internalMutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("judge"), v.literal("viewer")),
  },
  handler: async (ctx, { email, role }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (!user) throw new Error(`no user with email ${email}`);
    await ctx.db.patch(user._id, { role });
    return { userId: user._id, role };
  },
});

export const userByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) =>
    ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique(),
});

/** Seed the demo from the CLI as a given user (cached fixtures -> zero live
 * calls when OFFLINE=1). The public actions need a signed-in browser; this
 * is the operator's back door for populating the cockpit before a demo. */
export const runBuildAs = internalAction({
  args: { email: v.string(), term: v.string(), country: v.optional(v.string()) },
  handler: async (ctx, { email, term, country }): Promise<any> => {
    const user = await ctx.runQuery(internal.admin.userByEmail, { email });
    if (!user) throw new Error(`no user ${email}`);
    return executeBuild(ctx, user._id, { term, country });
  },
});

export const runPulseAs = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
    category: v.string(),
    location: v.string(),
    ll: v.optional(v.string()),
  },
  handler: async (ctx, { email, name, category, location, ll }): Promise<any> => {
    const user = await ctx.runQuery(internal.admin.userByEmail, { email });
    if (!user) throw new Error(`no user ${email}`);
    const businessId = await ctx.runMutation(internal.pulse.createBusiness, {
      userId: user._id,
      name,
      placeId: "",
      category,
      location,
      peers: [],
      timezone: "America/Chicago",
    });
    const business = await ctx.runQuery(internal.pulse.getBusiness, { businessId });
    if (!business) throw new Error("business not created");
    return executePulse(ctx, business, user._id, user.role, { ll });
  },
});

/** Wipe every Pulse-side row so a demo can be re-seeded cleanly. Leaves
 * serp_cache, users and Build runs alone. */
export const wipePulse = internalMutation({
  args: {},
  handler: async (ctx) => {
    let n = 0;
    const runs = (await ctx.db.query("runs").collect()).filter((r) => r.kind === "pulse");
    for (const run of runs) {
      for (const table of ["calls", "reviews", "gaps"] as const) {
        const rows = await ctx.db
          .query(table)
          .withIndex("by_run", (q) => q.eq("runId", run._id))
          .collect();
        for (const r of rows) {
          await ctx.db.delete(r._id);
          n++;
        }
      }
      await ctx.db.delete(run._id);
      n++;
    }
    for (const table of ["actions", "experiments", "drafts", "ai_answers", "businesses"] as const) {
      const rows = await ctx.db.query(table).collect();
      for (const r of rows) {
        await ctx.db.delete(r._id);
        n++;
      }
    }
    return { deleted: n };
  },
});
