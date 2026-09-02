// Per-engine wrappers for the Pulse path (Google Maps, Yelp, TripAdvisor,
// Google AI Overview), returning the normalised shapes documented in
// ENGINE-NOTES.md. Ported from unmet/scripts/austin.py's `load()` and the
// engine notes gathered from the live Austin pull.
//
// No Convex imports here -- each function takes a `call` function as its
// first argument instead of importing convex/serp.ts directly. That keeps
// this file testable with fixtures and no deployment, and lets
// convex/pulse.ts adapt A's real `call(ctx, runId, params)` (which also
// handles caching, quota and the `calls` bookkeeping row) into the simple
// `(engine, params) => Promise<any>` shape used here.

export type CallFn = (engine: string, params: Record<string, string | number | boolean>) => Promise<any>;

export type MapsPlace = {
  dataId: string;
  placeId: string;
  title: string;
  rating?: number;
  reviews?: number;
  address?: string;
};

/** google_maps: q + ll, type=search -> local_results[]. 20 results/call,
 * cached 7d. `dataId` is what google_maps_reviews needs. */
export async function googleMaps(
  call: CallFn,
  params: { q: string; ll?: string },
): Promise<MapsPlace[]> {
  // No `google_domain` here -- the cached Austin fixture was pulled without
  // it, and adding it would change the cache key and force a live refetch.
  const data = await call("google_maps", {
    type: "search",
    hl: "en",
    q: params.q,
    ...(params.ll ? { ll: params.ll } : {}),
  });
  const results: any[] = data?.local_results ?? [];
  return results.map((r) => ({
    dataId: r.data_id,
    placeId: r.place_id,
    title: r.title,
    rating: r.rating,
    reviews: r.reviews,
    address: r.address,
  }));
}

export type NormalisedReview = {
  source: "google" | "yelp" | "tripadvisor";
  placeId: string;
  place: string;
  rating?: number | null;
  text: string;
  date?: string;
};

export type MapsSortBy = "newestFirst" | "ratingLow" | "ratingHigh" | "qualityScore";

/** google_maps_reviews: 8 (sometimes 5) reviews per call, per sort. Thin --
 * ENGINE-NOTES.md recommends two sorts (newestFirst + ratingLow) per place. */
export async function googleMapsReviews(
  call: CallFn,
  params: { dataId: string; place: string; sortBy?: MapsSortBy },
): Promise<NormalisedReview[]> {
  const data = await call("google_maps_reviews", {
    data_id: params.dataId,
    sort_by: params.sortBy ?? "newestFirst",
    hl: "en",
  });
  const reviews: any[] = data?.reviews ?? [];
  return reviews
    .map((r) => ({
      source: "google" as const,
      placeId: params.dataId,
      place: params.place,
      rating: r.rating,
      text: (r.snippet ?? "").trim(),
      date: r.date,
    }))
    .filter((r) => r.text.length > 0);
}

/** yelp search: find_desc + find_loc -> organic_results[0].place_ids[0]
 * (NOT `place_id` -- see ENGINE-NOTES.md). Returns null if nothing found. */
export async function yelpSearch(
  call: CallFn,
  params: { findDesc: string; findLoc: string },
): Promise<string | null> {
  const data = await call("yelp", { find_desc: params.findDesc, find_loc: params.findLoc });
  return data?.organic_results?.[0]?.place_ids?.[0] ?? null;
}

/** yelp_reviews: 49 reviews/call, the richest source. */
export async function yelpReviews(
  call: CallFn,
  params: { placeId: string; place: string },
): Promise<NormalisedReview[]> {
  const data = await call("yelp_reviews", { place_id: params.placeId });
  const reviews: any[] = data?.reviews ?? [];
  return reviews
    .map((r) => ({
      source: "yelp" as const,
      placeId: params.placeId,
      place: params.place,
      rating: r.rating,
      text: (r.comment?.text ?? "").trim(),
      date: r.date,
    }))
    .filter((r) => r.text.length > 0);
}

/** tripadvisor search: q + ssrc="r" -> places[0].place_id (integer, cast to
 * string). Returns null if nothing found. */
export async function tripadvisorSearch(call: CallFn, params: { q: string }): Promise<string | null> {
  const data = await call("tripadvisor", { q: params.q, ssrc: "r" });
  const place = data?.places?.[0];
  return place?.place_id != null ? String(place.place_id) : null;
}

/** tripadvisor_reviews: 10 reviews/call. Title + snippet together are the
 * text (ENGINE-NOTES.md). */
export async function tripadvisorReviews(
  call: CallFn,
  params: { placeId: string; place: string },
): Promise<NormalisedReview[]> {
  const data = await call("tripadvisor_reviews", { place_id: params.placeId });
  const reviews: any[] = data?.reviews ?? [];
  return reviews
    .map((r) => {
      const title = (r.title ?? "").trim();
      const snippet = (r.snippet ?? "").trim();
      return {
        source: "tripadvisor" as const,
        placeId: params.placeId,
        place: params.place,
        rating: r.rating,
        text: [title, snippet].filter(Boolean).join(". "),
        date: r.date,
      };
    })
    .filter((r) => r.text.length > 0);
}

export type AiOverviewReference = { name: string; title?: string; link?: string };

export type AiOverviewResult = {
  present: boolean;
  textBlocks: string[];
  references: AiOverviewReference[];
  /** Source names cited, in reference order (may repeat). */
  cited: string[];
};

/**
 * google (for AI Overview): q, hl, gl -- NO location. Local-intent queries
 * ("best barbecue austin") return the map pack and no ai_overview at all --
 * that is the real "no AI answer today" state (present: false). If the
 * inline response only has a page_token, follow up with google_ai_overview.
 */
export async function aiOverview(
  call: CallFn,
  params: { q: string; hl?: string; gl?: string },
): Promise<AiOverviewResult> {
  const data = await call("google", { q: params.q, hl: params.hl ?? "en", gl: params.gl ?? "us" });
  let ao = data?.ai_overview;
  if (ao && !ao.text_blocks && ao.page_token) {
    const follow = await call("google_ai_overview", { page_token: ao.page_token });
    ao = follow?.ai_overview ?? ao;
  }
  if (!ao?.text_blocks) {
    return { present: false, textBlocks: [], references: [], cited: [] };
  }
  const textBlocks: string[] = (ao.text_blocks ?? [])
    .map((b: any) => b.snippet ?? "")
    .filter((s: string) => s.length > 0);
  const references: AiOverviewReference[] = (ao.references ?? []).map((r: any) => ({
    name: r.source,
    title: r.title,
    link: r.link,
  }));
  const cited = references.map((r) => r.name).filter(Boolean);
  return { present: true, textBlocks, references, cited };
}
