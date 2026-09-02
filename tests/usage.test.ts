// Tests the pure quota logic in convex/usageRules.ts directly (not
// convex/usage.ts, which also imports ./_generated/server -- unresolvable
// before `npx convex dev` has run once. Same split as cacheKey.ts/dedupe.ts;
// see usageRules.ts's header comment).
import { describe, expect, it } from "vitest";
import { canSpend, LIVE_CAPS, todayKey } from "../convex/usageRules";

describe("LIVE_CAPS", () => {
  it("admin is uncapped, judge capped at 30/day, viewer capped at 0", () => {
    expect(LIVE_CAPS.admin).toBeNull();
    expect(LIVE_CAPS.judge).toBe(30);
    expect(LIVE_CAPS.viewer).toBe(0);
  });
});

describe("canSpend", () => {
  it("admin can always spend, no matter how much was already used", () => {
    expect(canSpend("admin", 0)).toBe(true);
    expect(canSpend("admin", 10_000, 50)).toBe(true);
  });

  it("viewer can never spend a live search", () => {
    expect(canSpend("viewer", 0)).toBe(false);
    expect(canSpend("viewer", 0, 1)).toBe(false);
  });

  it("judge can spend up to 30/day, then is blocked", () => {
    expect(canSpend("judge", 0)).toBe(true);
    expect(canSpend("judge", 29)).toBe(true);
    expect(canSpend("judge", 30)).toBe(false);
    expect(canSpend("judge", 25, 5)).toBe(true);
    expect(canSpend("judge", 25, 6)).toBe(false);
  });
});

describe("todayKey", () => {
  it("formats as a UTC calendar day (YYYY-MM-DD)", () => {
    // 2026-09-02T12:00:00Z
    expect(todayKey(Date.UTC(2026, 8, 2, 12, 0, 0))).toBe("2026-09-02");
  });

  it("is stable across two calls in the same millisecond-ish window", () => {
    expect(todayKey()).toBe(todayKey());
  });
});
