// Pure module, no Convex imports -- ported from api.py's `run_category`
// dedupe step. The two review sorts (mosthelpful, mostrecent) overlap, so
// without this the same review is counted twice and every gap's mention
// count is inflated.

// ponytail: cyrb53, a fast non-cryptographic string hash -- not sha256.
// It only has to distinguish review texts well enough to dedupe and to key
// the `reviews.by_place_hash` index; it's never used for anything security
// sensitive. Upgrade to a real digest (see cacheKey.ts's sha256Hex) if that
// ever stops being true.
function cyrb53(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

/** Same truncation api.py's dedupe key uses: the point is to key on the
 * substance of a review, not its exact length. */
export function hashReviewText(text: string | undefined): string {
  return cyrb53((text ?? "").trim().slice(0, 200));
}

export function dedupeReviews<T extends { app_id: string; text?: string }>(
  reviews: T[],
): (T & { hash: string })[] {
  const seen = new Set<string>();
  const out: (T & { hash: string })[] = [];
  for (const r of reviews) {
    const hash = hashReviewText(r.text);
    const key = `${r.app_id} ${hash}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...r, hash });
  }
  return out;
}
