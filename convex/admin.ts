// Operator-only helpers, run from the CLI (`npx convex run admin:setRole ...`).
// Internal on purpose: nothing in the app can call these.
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

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
