// Imports fixtures/*.json into serp_cache. Convex functions can't read the
// repo's filesystem at runtime (default-runtime functions have no `fs`, and
// a deployed "use node" action's sandbox doesn't have your local fixtures/
// directory either) -- so this only exposes the write side. A local Node
// script (scripts/seedFixtures.ts, run with `npx convex dev` already
// logged in) reads the files and calls `seedAll` once per batch via
// `npx convex run seed:seedAll <json>`.
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

const fixtureRow = v.object({
  key: v.string(),
  engine: v.string(),
  params: v.any(),
  response: v.any(),
});

async function importOne(
  ctx: { db: any },
  row: { key: string; engine: string; params: unknown; response: unknown },
) {
  const existing = await ctx.db
    .query("serp_cache")
    .withIndex("by_key", (q: any) => q.eq("key", row.key))
    .unique();
  if (existing) return false; // idempotent: already seeded
  await ctx.db.insert("serp_cache", {
    key: row.key,
    engine: row.engine,
    params: row.params,
    response: row.response,
    source: "fixture" as const,
    fetchedAt: Date.now(),
    // Fixtures never expire.
    expiresAt: undefined,
    createdAt: Date.now(),
  });
  return true;
}

export const importFixture = internalMutation({
  args: fixtureRow,
  handler: async (ctx, row) => importOne(ctx, row),
});

export const seedAll = internalMutation({
  args: { fixtures: v.array(fixtureRow) },
  handler: async (ctx, { fixtures }) => {
    let inserted = 0;
    for (const row of fixtures) {
      if (await importOne(ctx, row)) inserted++;
    }
    return { inserted, skipped: fixtures.length - inserted };
  },
});
