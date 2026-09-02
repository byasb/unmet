// Thin Convex bindings around llmCore.ts's pure orchestration. Runs on the
// default runtime (no "use node") -- plain fetch is all we need.
import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  cardHeadlineMessages,
  completeCore,
  draftReplyMessages,
  type CompleteResult,
  type DraftReplyArgs,
} from "./llmCore";

export const getCachedLlm = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const row = await ctx.db
      .query("llm_cache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    return row ? { output: row.output } : null;
  },
});

export const putCachedLlm = internalMutation({
  args: { key: v.string(), model: v.string(), output: v.string(), createdAt: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("llm_cache")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("llm_cache", args);
  },
});

async function runComplete(
  ctx: ActionCtx,
  messages: Parameters<typeof completeCore>[1]["messages"],
  purpose: string,
  localArgs: unknown,
): Promise<CompleteResult> {
  return completeCore(
    {
      getCached: (key) => ctx.runQuery(internal.llm.getCachedLlm, { key }),
      putCache: (row) => ctx.runMutation(internal.llm.putCachedLlm, row),
      apiKey: process.env.OPENROUTER_API_KEY,
    },
    { messages, purpose, localArgs },
  );
}

const messageValidator = v.object({
  role: v.union(v.literal("system"), v.literal("user"), v.literal("assistant")),
  content: v.string(),
});

/** Generic entry point -- pipeline.ts / pulse.ts can call this directly for
 * a one-off completion; draftReply/cardHeadline below are the two named
 * shapes BUILD-PLAN.md asks for. */
export const complete = action({
  args: { messages: v.array(messageValidator), purpose: v.string(), localArgs: v.optional(v.any()) },
  handler: async (ctx, { messages, purpose, localArgs }) => runComplete(ctx, messages, purpose, localArgs),
});

export async function draftReply(
  ctx: ActionCtx,
  review: DraftReplyArgs["review"],
  themes: string[],
  tone: string,
  startedActions: string[],
): Promise<CompleteResult> {
  const messages = draftReplyMessages(review, themes, tone, startedActions);
  return runComplete(ctx, messages, "draftReply", { review, themes, tone, startedActions });
}

export async function cardHeadline(
  ctx: ActionCtx,
  summary: Parameters<typeof cardHeadlineMessages>[0],
): Promise<CompleteResult> {
  const messages = cardHeadlineMessages(summary);
  return runComplete(ctx, messages, "cardHeadline", { summary });
}
