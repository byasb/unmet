// Reply desk: draft answers to the business's own low-rated reviews from the
// latest Pulse run. The model writes the words (llm.ts, cache-first, local
// template fallback); critic.ts grades every draft; nothing is ever sent from
// here -- a human approves or skips in the cockpit (BUILD-PLAN §Replies).
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { classifyLocal } from "./analyze.local";
import { runCritic } from "./critic";
import { draftReply } from "./llm";

const MAX_DRAFTS_PER_RUN = 5;

export const candidates = internalQuery({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    const business = await ctx.db.get(businessId);
    if (!business) return null;
    const runs = await ctx.db
      .query("runs")
      .withIndex("by_kind_term", (q) => q.eq("kind", "pulse").eq("term", businessId))
      .collect();
    const latest = runs.filter((r) => r.status === "done").sort((a, b) => b.startedAt - a.startedAt)[0];
    if (!latest) return { business, reviews: [], startedActions: [] };

    const drafted = new Set<string>();
    for (const status of ["drafted", "approved", "skipped"] as const) {
      const rows = await ctx.db
        .query("drafts")
        .withIndex("by_business_status", (q) => q.eq("businessId", businessId).eq("status", status))
        .collect();
      for (const d of rows) drafted.add(d.reviewId);
    }

    const all = await ctx.db
      .query("reviews")
      .withIndex("by_run", (q) => q.eq("runId", latest._id))
      .collect();
    // ponytail: reviews.placeId is whatever the source engine keyed the place
    // by (pulse.ts saves the display title for every source), so match on
    // either the stored placeId or the business name.
    const own = all.filter(
      (r) =>
        (r.placeId === business.placeId || r.placeId === business.name) &&
        (r.rating ?? 5) <= 3 &&
        (r.text ?? "").length > 40 &&
        !drafted.has(r._id),
    );
    own.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0) || (b.text?.length ?? 0) - (a.text?.length ?? 0));

    const started: string[] = [];
    for (const state of ["today", "done"] as const) {
      const rows = await ctx.db
        .query("actions")
        .withIndex("by_business_state", (q) => q.eq("businessId", businessId).eq("state", state))
        .collect();
      started.push(...rows.map((a) => a.title));
    }
    return { business, reviews: own.slice(0, MAX_DRAFTS_PER_RUN), startedActions: started };
  },
});

export const insertDraft = internalMutation({
  args: {
    businessId: v.id("businesses"),
    reviewId: v.id("reviews"),
    text: v.string(),
    tone: v.string(),
    checks: v.array(v.object({ rule: v.string(), pass: v.boolean(), note: v.string() })),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("drafts", { ...args, status: "drafted", createdAt: Date.now() });
  },
});

export const draftReplies = action({
  args: { businessId: v.id("businesses"), tone: v.optional(v.string()) },
  handler: async (ctx, { businessId, tone }): Promise<{ drafted: number }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const role = await ctx.runQuery(internal.pulse.getRole, { userId });
    if (role === "viewer" || !role) throw new Error("viewer role cannot draft replies");

    const data = await ctx.runQuery(internal.replies.candidates, { businessId });
    if (!data) throw new Error("business not found");
    const t = tone ?? "warm, specific, no excuses";
    let drafted = 0;
    for (const r of data.reviews) {
      const themes = classifyLocal({ app_id: r.placeId, rating: r.rating, text: r.text, title: r.title }).themes;
      const out = await draftReply(
        ctx,
        { text: r.text, rating: r.rating, place: data.business.name },
        themes,
        t,
        data.startedActions,
      );
      const checks = runCritic({
        text: out.text,
        theme: themes[0] ?? "",
        reviewThemes: themes,
        hasActiveAction: data.startedActions.length > 0,
      });
      await ctx.runMutation(internal.replies.insertDraft, {
        businessId,
        reviewId: r._id as Id<"reviews">,
        text: out.text,
        tone: t,
        checks,
      });
      drafted++;
    }
    return { drafted };
  },
});
