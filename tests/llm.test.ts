// Tests convex/llmCore.ts's pure orchestration (completeCore, deriveKey,
// localTemplate) with a mocked fetch and an in-memory cache stand-in -- no
// network, no Convex deployment. convex/llm.ts is the thin action wrapper
// around this that supplies the real cache and real fetch; it isn't
// exercised here since it imports ./_generated (see MERGE-NOTES.md).
import { describe, expect, it, vi } from "vitest";
import {
  cardHeadlineMessages,
  completeCore,
  deriveKey,
  draftReplyMessages,
  localTemplate,
  type CompleteDeps,
  type LlmCacheRow,
} from "../convex/llmCore";

function fakeCache() {
  const store = new Map<string, LlmCacheRow>();
  return {
    store,
    getCached: vi.fn(async (key: string) => {
      const row = store.get(key);
      return row ? { output: row.output } : null;
    }),
    putCache: vi.fn(async (row: LlmCacheRow) => {
      store.set(row.key, row);
    }),
  };
}

const messages = draftReplyMessages({ text: "Brisket was dry.", rating: 2, place: "Stiles Switch" }, ["meat_quality"], "apologetic", []);

describe("deriveKey", () => {
  it("is stable for the same model + messages", async () => {
    const a = await deriveKey("anthropic/claude-sonnet-5", messages);
    const b = await deriveKey("anthropic/claude-sonnet-5", messages);
    expect(a).toBe(b);
  });

  it("changes when the model or the messages change", async () => {
    const base = await deriveKey("anthropic/claude-sonnet-5", messages);
    const otherModel = await deriveKey("google/gemini-3.5-flash", messages);
    const otherMessages = await deriveKey("anthropic/claude-sonnet-5", cardHeadlineMessages({ topGapLabel: "x" }));
    expect(otherModel).not.toBe(base);
    expect(otherMessages).not.toBe(base);
  });
});

describe("completeCore", () => {
  it("cache hit returns the cached output and never calls fetch", async () => {
    const cache = fakeCache();
    const key = await deriveKey("anthropic/claude-sonnet-5", messages);
    cache.store.set(key, { key, model: "anthropic/claude-sonnet-5", output: "cached reply", createdAt: 0 });
    const fetchImpl = vi.fn();

    const deps: CompleteDeps = { getCached: cache.getCached, putCache: cache.putCache, apiKey: "sk-test", fetchImpl };
    const result = await completeCore(deps, { messages, purpose: "draftReply", localArgs: {} });

    expect(result).toEqual({ text: "cached reply", fallback: false, cached: true });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("a non-2xx response falls back to the local template and never throws", async () => {
    const cache = fakeCache();
    const fetchImpl = vi.fn(async () => new Response("rate limited", { status: 429 }));
    const localArgs = { review: { text: "Brisket was dry.", rating: 2, place: "Stiles Switch" }, themes: ["meat_quality"], startedActions: [] };

    const deps: CompleteDeps = { getCached: cache.getCached, putCache: cache.putCache, apiKey: "sk-test", fetchImpl };
    const result = await completeCore(deps, { messages, purpose: "draftReply", localArgs });

    expect(result.fallback).toBe(true);
    expect(result.text).toBe(localTemplate("draftReply", localArgs));
    expect(result.text.length).toBeGreaterThan(0);
    expect(cache.putCache).not.toHaveBeenCalled();
  });

  it("missing API key also falls back locally instead of throwing", async () => {
    const cache = fakeCache();
    const fetchImpl = vi.fn();
    const deps: CompleteDeps = { getCached: cache.getCached, putCache: cache.putCache, apiKey: undefined, fetchImpl };

    const result = await completeCore(deps, { messages, purpose: "cardHeadline", localArgs: { summary: {} } });

    expect(result.fallback).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("a 2xx response is cached for next time", async () => {
    const cache = fakeCache();
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: "Thanks for the heads up." } }] }), { status: 200 }),
    );
    const deps: CompleteDeps = { getCached: cache.getCached, putCache: cache.putCache, apiKey: "sk-test", fetchImpl };

    const result = await completeCore(deps, { messages, purpose: "draftReply", localArgs: {} });

    expect(result).toEqual({ text: "Thanks for the heads up.", fallback: false, cached: false });
    expect(cache.putCache).toHaveBeenCalledTimes(1);
  });
});
