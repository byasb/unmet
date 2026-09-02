// Pure param-hashing logic, ported from serp.py's `_cache_path`. No Convex
// imports here on purpose -- this file must be importable from a plain
// vitest run with no deployment, and from both convex/serp.ts (default
// runtime) and convex/seed.ts.
//
// Fixture files are named `<engine>-<hash16>.json`, where hash16 is the
// first 16 hex chars of sha256(json.dumps(params_minus_api_key,
// sort_keys=True)) as produced by CPython's json module: default separators
// (", " and ": ") and ensure_ascii=True. To replay a fixture we have to
// reproduce that exact string, byte for byte, before hashing it.

export type SerpParams = Record<string, string | number | boolean>;

function pyEscapeString(s: string): string {
  // JSON.stringify already escapes control chars / quote / backslash the
  // same way Python's json module does (both follow the JSON spec here).
  // The one gap is ensure_ascii: Python escapes anything outside the
  // printable ASCII range (0x20-0x7e) as a \u escape; JS leaves those
  // characters raw. Walk the already-quoted string and escape anything
  // Python would.
  const quoted = JSON.stringify(s);
  let out = "";
  for (let i = 0; i < quoted.length; i++) {
    const code = quoted.charCodeAt(i);
    out += code >= 0x7f ? "\\u" + code.toString(16).padStart(4, "0") : quoted[i];
  }
  return out;
}

function pyEncodeValue(v: string | number | boolean): string {
  if (typeof v === "string") return pyEscapeString(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (!Number.isFinite(v)) throw new Error(`cannot encode ${v} as JSON`);
  return String(v);
}

/** Reproduces Python's `json.dumps(params, sort_keys=True)` (default separators). */
export function pyJsonDumpsSorted(params: SerpParams): string {
  const keys = Object.keys(params).sort();
  const body = keys
    .map((k) => `${pyEscapeString(k)}: ${pyEncodeValue(params[k])}`)
    .join(", ");
  return `{${body}}`;
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * engine + params (minus api_key) -> the 16-hex-char key used both for the
 * fixture filenames and the serp_cache.key index.
 */
export async function cacheKey(params: SerpParams): Promise<string> {
  const { api_key: _apiKey, ...rest } = params as SerpParams & {
    api_key?: unknown;
  };
  const hash = await sha256Hex(pyJsonDumpsSorted(rest));
  return hash.slice(0, 16);
}

export function fixtureName(engine: string, key: string): string {
  return `${engine}-${key}.json`;
}

/** Splits `<engine>-<hash16>.json` back into its parts, or null if it doesn't match. */
export function parseFixtureName(
  filename: string,
): { engine: string; key: string } | null {
  const m = /^(.+)-([0-9a-f]{16})\.json$/.exec(filename);
  return m ? { engine: m[1], key: m[2] } : null;
}
