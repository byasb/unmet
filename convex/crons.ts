// Scheduled jobs: the nightly Pulse run for every business, the Monday
// experiment read, and a daily sweep of expired serp_cache rows.
import { cronJobs } from "convex/server";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// TODO(v1 limitation): one fixed UTC hour for every business, not each
// business's own timezone (businesses.timezone is stored but unused here).
// 10:00 UTC = 05:00 in Austin's Central Time (CDT, UTC-5) -- close enough for
// a single-city demo. Real per-timezone scheduling needs either one cron
// entry per distinct timezone in use, or an hourly tick that only fires the
// businesses whose local hour is currently 05:00. Revisit once Pulse
// supports more than one city.
export const runAllScheduledPulses = internalAction({
  args: {},
  handler: async (ctx) => {
    const businessIds: Id<"businesses">[] = await ctx.runQuery(internal.pulse.listBusinessIds, {});
    for (const businessId of businessIds) {
      // Sequential on purpose -- keeps this well inside SerpApi quota for a
      // handful of demo businesses. Fan out with Promise.all if that ever
      // becomes the bottleneck.
      await ctx.runAction(internal.pulse.runPulseScheduled, { businessId });
    }
  },
});

export const purgeExpiredCache = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    // ponytail: `.filter` scan, not an index on expiresAt -- serp_cache is
    // small at hackathon scale (a few thousand rows at most). Add a
    // by_expiresAt index in schema.ts if this table grows enough to matter.
    const rows = await ctx.db
      .query("serp_cache")
      .filter((q) => q.and(q.neq(q.field("expiresAt"), undefined), q.lt(q.field("expiresAt"), now)))
      .collect();
    for (const row of rows) await ctx.db.delete(row._id);
    return rows.length;
  },
});

const crons = cronJobs();

crons.daily("pulse daily run", { hourUTC: 10, minuteUTC: 0 }, internal.crons.runAllScheduledPulses);

crons.weekly(
  "pulse monday measure",
  { dayOfWeek: "monday", hourUTC: 10, minuteUTC: 30 },
  internal.pulse.measureExperiments,
);

crons.daily("serp cache purge", { hourUTC: 4, minuteUTC: 0 }, internal.crons.purgeExpiredCache);

crons.interval("serp account counters", { hours: 1 }, internal.serp.refreshAccount, {});

export default crons;
