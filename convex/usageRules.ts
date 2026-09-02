// Pure quota decision logic -- no Convex imports, so tests/usage.test.ts can
// exercise it without a deployment. Same reasoning as cacheKey.ts, dedupe.ts
// and llmCore.ts.
export type Role = "admin" | "judge" | "viewer";

// BUILD-PLAN.md Rules #3: viewer cannot trigger live fetches; judge capped
// at 30 live searches/day; admin uncapped. null = no cap.
export const LIVE_CAPS: Record<Role, number | null> = {
  admin: null,
  judge: 30,
  viewer: 0,
};

/** UTC calendar day key, e.g. "2026-09-02". Matches the `usage.day` field. */
export function todayKey(now: number = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

/** Can `role` spend `n` more live searches today, having already spent `used`? */
export function canSpend(role: Role, used: number, n: number = 1): boolean {
  const cap = LIVE_CAPS[role];
  if (cap === null) return true;
  return used + n <= cap;
}
