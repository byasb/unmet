// Convex Auth: email + password only. No OAuth, no anonymous (BUILD-PLAN.md
// "Stack" section is explicit about this).
//
// New accounts default to role "viewer" (least privilege — cannot trigger
// live fetches, see usage.ts). Promote a user to "judge" or "admin" by
// editing their row in the Convex dashboard's Data tab; there is no UI for
// it in v1. See MERGE-NOTES.md for the judge account Ankit needs to create.
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: params.email as string,
          role: "viewer" as const,
          createdAt: Date.now(),
        };
      },
    }),
  ],
});

export type Role = "admin" | "judge" | "viewer";

type AuthedCtx = QueryCtx | MutationCtx;

/** Throws when unauthenticated. Every public query/mutation entry point
 * calls this (or requireRole) first -- see BUILD-PLAN.md Rules #3. */
export async function requireUser(
  ctx: AuthedCtx,
): Promise<{ userId: Id<"users">; role: Role }> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not authenticated");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("Not authenticated");
  return { userId, role: user.role };
}

export async function requireRole(
  ctx: AuthedCtx,
  ...roles: Role[]
): Promise<{ userId: Id<"users">; role: Role }> {
  const found = await requireUser(ctx);
  if (!roles.includes(found.role)) {
    throw new Error(`Requires role ${roles.join(" or ")}, has ${found.role}`);
  }
  return found;
}
