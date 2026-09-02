// serp.call() cache-hit and OFFLINE behaviour. Exercised against a fake
// ActionCtx (just the runQuery/runMutation surface call() actually uses) so
// this runs with no Convex deployment, per BUILD-PLAN's testability note.
import { afterEach, describe, expect, it, vi } from "vitest";
import { call, SerpError } from "../convex/serp";

function fakeCtx(cached: unknown) {
  const runMutation = vi.fn().mockResolvedValue(undefined);
  const runQuery = vi.fn().mockResolvedValue(cached);
  return { ctx: { runQuery, runMutation } as any, runQuery, runMutation };
}

const RUN_ID = "run_1" as any;

describe("serp.call", () => {
  const originalOffline = process.env.OFFLINE;
  const originalKey = process.env.SERPAPI_KEY;

  afterEach(() => {
    process.env.OFFLINE = originalOffline;
    process.env.SERPAPI_KEY = originalKey;
    vi.restoreAllMocks();
  });

  it("returns the cached response and records a non-live call on a hit", async () => {
    const { ctx, runMutation } = fakeCtx({ response: { hello: "world" } });
    const data = await call(ctx, RUN_ID, { engine: "google_autocomplete", q: "habit tracker" });
    expect(data).toEqual({ hello: "world" });
    expect(runMutation).toHaveBeenCalledTimes(1);
    const [, args] = runMutation.mock.calls[0];
    expect(args.live).toBe(false);
    expect(args.engine).toBe("google_autocomplete");
  });

  it("throws SerpError on a miss when OFFLINE=1, without ever calling fetch", async () => {
    process.env.OFFLINE = "1";
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { ctx } = fakeCtx(null);
    await expect(
      call(ctx, RUN_ID, { engine: "apple_app_store", term: "habit tracker", country: "us", num: 8 }),
    ).rejects.toThrow(SerpError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("throws SerpError on a miss with no SERPAPI_KEY set (even if not OFFLINE)", async () => {
    process.env.OFFLINE = undefined;
    delete process.env.OFFLINE;
    delete process.env.SERPAPI_KEY;
    const { ctx } = fakeCtx(null);
    await expect(
      call(ctx, RUN_ID, { engine: "apple_app_store", term: "habit tracker", country: "us", num: 8 }),
    ).rejects.toThrow(SerpError);
  });
});
