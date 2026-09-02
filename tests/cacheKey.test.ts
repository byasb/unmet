// Proves the TS cache-key derivation reproduces Python's exactly, using a
// real fixture from fixtures/. If this test breaks, live SerpApi calls
// would silently miss the cache and burn quota against a fixture that's
// already on disk.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { cacheKey, fixtureName, parseFixtureName, pyJsonDumpsSorted } from "../convex/cacheKey";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const FIXTURES_DIR = join(ROOT, "fixtures");

describe("pyJsonDumpsSorted", () => {
  it("matches Python's json.dumps(params, sort_keys=True) separators", () => {
    expect(pyJsonDumpsSorted({ b: 2, a: "x" })).toBe('{"a": "x", "b": 2}');
  });

  it("ensure_ascii-escapes non-ASCII the way CPython does", () => {
    expect(pyJsonDumpsSorted({ q: "café" })).toBe('{"q": "caf\\u00e9"}');
  });
});

describe("cacheKey round-trips real fixtures", () => {
  // These params are exactly what app/serp.py's search_apps/app_reviews/
  // trend_queries/autocomplete pass to serp.call() -- reverse-engineered by
  // hashing candidate param dicts in Python until they matched the fixture
  // filenames on disk (see BUILD-PLAN's note on the key derivation).
  const cases: { file: string; params: Record<string, string | number> }[] = [
    {
      file: "apple_app_store-1b9a8516d4a344da.json",
      params: { engine: "apple_app_store", term: "receipt scanner", country: "us", num: 6 },
    },
    {
      file: "apple_app_store-75d25c64b2c0efe8.json",
      params: { engine: "apple_app_store", term: "habit tracker", country: "us", num: 8 },
    },
    {
      file: "apple_reviews-093e233a6f6d642f.json",
      params: {
        engine: "apple_reviews",
        product_id: "1182474649",
        country: "us",
        sort: "mosthelpful",
        page: 1,
      },
    },
    {
      file: "google_trends-956416db64a547ed.json",
      params: { engine: "google_trends", q: "receipt scanner", data_type: "RELATED_QUERIES" },
    },
    {
      file: "google_autocomplete-2ddc38a2860d973f.json",
      params: { engine: "google_autocomplete", q: "habit tracker" },
    },
  ];

  it.each(cases)("$file", async ({ file, params }) => {
    const expected = parseFixtureName(file)!.key;
    expect(await cacheKey(params)).toBe(expected);
    expect(fixtureName(String(params.engine), expected)).toBe(file);
  });

  it("drops api_key before hashing (it must never affect the cache key)", async () => {
    const withKey = await cacheKey({ engine: "google_autocomplete", q: "habit tracker", api_key: "secret" });
    const without = await cacheKey({ engine: "google_autocomplete", q: "habit tracker" });
    expect(withKey).toBe(without);
  });

  it("every fixture on disk parses as <engine>-<hash16>.json", () => {
    const { readdirSync } = require("node:fs") as typeof import("node:fs");
    const files = readdirSync(FIXTURES_DIR).filter((f) => f.endsWith(".json"));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      expect(parseFixtureName(f)).not.toBeNull();
      // sanity: it's valid JSON
      JSON.parse(readFileSync(join(FIXTURES_DIR, f), "utf8"));
    }
  });
});
