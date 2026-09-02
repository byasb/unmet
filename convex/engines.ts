// Per-engine wrappers, ported from app/serp.py. Each returns the same
// normalised shape as its Python counterpart. Build-path engines
// (searchApps, appReviews, trendQueries, autocomplete) are fully ported;
// Pulse-path engines are typed stubs Fable fills in after the Austin pull
// (SerpApi quota is real, subagents never call it live).
import type { ActionCtx, Id } from "./serverApi";
import { call, SerpError } from "./serp";

export type AppResult = {
  id?: number | string;
  position?: number;
  title?: string;
  bundle_id?: string;
  developer?: string;
  price?: string;
  rating?: number;
  rating_count?: number;
  genres: (string | undefined)[];
  link?: string;
  description: string;
};

export type AppReview = {
  id: string;
  app_id: string;
  title: string;
  text: string;
  rating?: number;
  author?: string;
};

export type TrendQuery = { query?: string; value?: unknown };

/** engine=apple_app_store -- the apps currently ranking for a search term. */
export async function searchApps(
  ctx: ActionCtx,
  runId: Id<"runs">,
  term: string,
  country = "us",
  num = 10,
): Promise<AppResult[]> {
  const data = await call(ctx, runId, {
    engine: "apple_app_store",
    term,
    country,
    num,
  });
  const results = (data.organic_results ?? []) as any[];
  return results.map((r) => {
    const ratings: any[] = r.rating ?? [];
    const overall =
      ratings.find((x) => x.type === "All Times") ?? ratings[0] ?? {};
    return {
      id: r.id,
      position: r.position,
      title: r.title,
      bundle_id: r.bundle_id,
      developer: r.developer?.name,
      price: r.price?.type,
      rating: overall.rating,
      rating_count: overall.count,
      genres: (r.genres ?? []).map((g: any) => g?.name),
      link: r.link,
      description: (r.description ?? "").slice(0, 1200),
    };
  });
}

/** engine=apple_reviews -- real user reviews for one app. */
export async function appReviews(
  ctx: ActionCtx,
  runId: Id<"runs">,
  productId: number | string,
  country = "us",
  sort: "mostrecent" | "mosthelpful" = "mostrecent",
  page = 1,
): Promise<AppReview[]> {
  const data = await call(ctx, runId, {
    engine: "apple_reviews",
    product_id: String(productId),
    country,
    sort,
    page,
  });
  const reviews: any[] = data.reviews ?? [];
  return reviews.map((r) => ({
    id: `${r.position ?? ""}-${productId}-p${page}`,
    app_id: String(productId),
    title: r.title ?? "",
    text: r.text ?? "",
    rating: r.rating,
    author: r.author?.name,
  }));
}

const TREND_STOP_WORDS = new Set([
  "app",
  "apps",
  "best",
  "free",
  "the",
  "for",
  "and",
  "with",
]);

/** engine=google_trends, RELATED_QUERIES -- is there search demand behind a gap? */
export async function trendQueries(
  ctx: ActionCtx,
  runId: Id<"runs">,
  query: string,
  geo = "",
): Promise<TrendQuery[]> {
  const params: Record<string, string> = {
    engine: "google_trends",
    q: query.slice(0, 100),
    data_type: "RELATED_QUERIES",
  };
  if (geo) params.geo = geo;

  let data: any;
  try {
    data = await call(ctx, runId, params);
  } catch (err) {
    if (err instanceof SerpError) return [];
    throw err;
  }

  const rq = data.related_queries ?? {};
  // "top" first: "rising" carries unrelated breakout noise (a run for
  // "habit tracker" surfaced "anthropic news"). Then drop anything that
  // shares no meaningful word with the term the user actually asked about.
  const rows = [...(rq.top ?? []), ...(rq.rising ?? [])];
  const tokens = new Set(
    (query.toLowerCase().match(/[a-z]+/g) ?? []).filter(
      (w) => !TREND_STOP_WORDS.has(w) && w.length > 2,
    ),
  );

  const out: TrendQuery[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const q = (r.query ?? "").toLowerCase();
    if (!q || seen.has(q)) continue;
    if (tokens.size && ![...tokens].some((t) => q.includes(t))) continue;
    seen.add(q);
    out.push({ query: r.query, value: r.value });
  }
  return out.slice(0, 10);
}

/** engine=google_autocomplete -- the phrasing real people use for a gap. */
export async function autocomplete(
  ctx: ActionCtx,
  runId: Id<"runs">,
  query: string,
): Promise<string[]> {
  let data: any;
  try {
    data = await call(ctx, runId, {
      engine: "google_autocomplete",
      q: query.slice(0, 100),
    });
  } catch (err) {
    if (err instanceof SerpError) return [];
    throw err;
  }
  const suggestions: any[] = data.suggestions ?? [];
  return suggestions
    .slice(0, 10)
    .map((s) => s.value)
    .filter(Boolean);
}

// -- Pulse-path stubs -----------------------------------------------------
// Typed signatures only. Fable fills these in after the Austin pull once
// the real response shapes are known; subagents never call these engines
// live (no quota, no key in this environment).

export type PlaceResult = {
  place_id?: string;
  data_id?: string;
  title?: string;
  rating?: number;
  reviews?: number;
};

/** engine=google_maps -- q + (ll | location) -> places with data_id/place_id. */
export async function googleMaps(
  _ctx: ActionCtx,
  _runId: Id<"runs">,
  _q: string,
  _location: string,
): Promise<PlaceResult[]> {
  throw new Error("TODO(Fable): googleMaps -- wire up after the Austin pull");
}

export type PlaceReview = {
  id: string;
  place_id: string;
  text: string;
  rating?: number;
  author?: string;
  date?: string;
};

/** engine=google_maps_reviews -- data_id, sort_by. */
export async function googleMapsReviews(
  _ctx: ActionCtx,
  _runId: Id<"runs">,
  _dataId: string,
  _sortBy: string,
): Promise<PlaceReview[]> {
  throw new Error(
    "TODO(Fable): googleMapsReviews -- wire up after the Austin pull",
  );
}

/** engine=yelp -- search for a Yelp business id (no dedicated find-id
 * engine exists; skip Yelp for a business if this can't resolve one). */
export async function yelpSearch(
  _ctx: ActionCtx,
  _runId: Id<"runs">,
  _q: string,
  _location: string,
): Promise<PlaceResult[]> {
  throw new Error("TODO(Fable): yelpSearch -- wire up after the Austin pull");
}

/** engine=yelp_reviews -- place_id. */
export async function yelpReviews(
  _ctx: ActionCtx,
  _runId: Id<"runs">,
  _placeId: string,
): Promise<PlaceReview[]> {
  throw new Error("TODO(Fable): yelpReviews -- wire up after the Austin pull");
}

/** TripAdvisor search -> location id. */
export async function tripadvisorSearch(
  _ctx: ActionCtx,
  _runId: Id<"runs">,
  _q: string,
  _location: string,
): Promise<PlaceResult[]> {
  throw new Error(
    "TODO(Fable): tripadvisorSearch -- wire up after the Austin pull",
  );
}

/** engine=tripadvisor_reviews. */
export async function tripadvisorReviews(
  _ctx: ActionCtx,
  _runId: Id<"runs">,
  _locationId: string,
): Promise<PlaceReview[]> {
  throw new Error(
    "TODO(Fable): tripadvisorReviews -- wire up after the Austin pull",
  );
}

/** engine=opentable_reviews -- restaurant id. If a source has no search
 * engine to find the id, skip that source and log it; do not fake one. */
export async function openTableReviews(
  _ctx: ActionCtx,
  _runId: Id<"runs">,
  _restaurantId: string,
): Promise<PlaceReview[]> {
  throw new Error(
    "TODO(Fable): openTableReviews -- wire up after the Austin pull",
  );
}

export type AiOverview = {
  cited: boolean;
  position?: number;
  sources: { name: string; count: number }[];
  excerpt: string;
};

/** engine=google, ai_overview page_token -- or the inline ai_overview on the
 * originating `google` search when SerpApi returns it directly. */
export async function aiOverview(
  _ctx: ActionCtx,
  _runId: Id<"runs">,
  _query: string,
): Promise<AiOverview> {
  throw new Error("TODO(Fable): aiOverview -- wire up after the Austin pull");
}
