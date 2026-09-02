// Not in the original file-ownership list, but deliverable 5 of this
// subagent's brief explicitly asks for it: "a test that loads the cached
// google_maps fixture for barbecue and asserts Stiles Switch is in it with
// the data_id from ENGINE-NOTES." See MERGE-NOTES.md.
//
// The fake `call` below resolves fixtures the same way convex/serp.ts does
// (engine + cacheKey(params) -> fixtures/<engine>-<key16>.json), so this
// doubles as a check that engines.local.ts's wrappers send the exact params
// the real Austin fixtures were cached under -- get that wrong and every
// Pulse call would miss the cache and (outside OFFLINE mode) go live.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cacheKey } from "../convex/cacheKey";
import { googleMaps, googleMapsReviews, tripadvisorReviews, tripadvisorSearch, yelpReviews, yelpSearch } from "../convex/engines.local";

const FIXTURES = join(__dirname, "..", "fixtures");

const fixtureCall = async (engine: string, params: Record<string, string | number | boolean>) => {
  const key = await cacheKey({ engine, ...params });
  const path = join(FIXTURES, `${engine}-${key}.json`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error(`no fixture for ${engine} ${JSON.stringify(params)} (looked for ${path})`);
  }
};

// ENGINE-NOTES.md's Austin set.
const STILES_DATA_ID = "0x8644ca48760d6971:0xa5521d488ea5860d";
const STILES_YELP_ID = "zDVjN3dC9EfQno21m3O8Pg";
const IRON_WORKS_TRIPADVISOR_ID = "469571";

describe("googleMaps (barbecue fixture)", () => {
  it("includes Stiles Switch with the data_id from ENGINE-NOTES.md", async () => {
    const places = await googleMaps(fixtureCall, { q: "barbecue", ll: "@30.3178,-97.7318,12z" });
    expect(places.length).toBeGreaterThan(0);
    const stiles = places.find((p) => p.title.toLowerCase().includes("stiles switch"));
    expect(stiles).toBeDefined();
    expect(stiles?.dataId).toBe(STILES_DATA_ID);
  });
});

describe("googleMapsReviews", () => {
  it("returns non-empty, trimmed review text for a cached place", async () => {
    const reviews = await googleMapsReviews(fixtureCall, {
      dataId: "0x8644b5b97f094707:0x73413af34fe2662d", // Micklethwait, per ENGINE-NOTES.md
      place: "Micklethwait Craft Meats",
      sortBy: "ratingLow",
    });
    expect(reviews.length).toBeGreaterThan(0);
    for (const r of reviews) {
      expect(r.source).toBe("google");
      expect(r.text.length).toBeGreaterThan(0);
    }
  });
});

describe("yelpSearch + yelpReviews", () => {
  it("resolves Stiles Switch's Yelp place id and pulls review text", async () => {
    const placeId = await yelpSearch(fixtureCall, { findDesc: "Stiles Switch BBQ", findLoc: "Austin, TX, USA" });
    expect(placeId).toBe(STILES_YELP_ID);
    const reviews = await yelpReviews(fixtureCall, { placeId: "sjgbSELDpzaabRe8bZwUbw", place: "Micklethwait" });
    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews[0].source).toBe("yelp");
  });
});

describe("tripadvisorSearch + tripadvisorReviews", () => {
  it("resolves a place id and joins title + snippet as the review text", async () => {
    const placeId = await tripadvisorSearch(fixtureCall, { q: "Iron Works Barbecue Austin" });
    expect(placeId).toBe(IRON_WORKS_TRIPADVISOR_ID);
    const reviews = await tripadvisorReviews(fixtureCall, { placeId: "7363750", place: "Cooper's" });
    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews[0].text).toContain(".");
  });
});
