// Ported verbatim from app/analyze.py: the taxonomy, the request detector,
// the deterministic per-review classifier, and the scoring functions. Only
// the LLM re-classifier (analyze.py's `classify`/`_classify_llm`) is left
// out -- that is llm.ts's job (Subagent B).

export type Review = {
  id?: string;
  app_id: string;
  title?: string;
  text?: string;
  rating?: number;
  author?: string;
};

export type Intent = "complaint" | "request" | "praise";

export type ClassifiedReview = Review & {
  themes: string[];
  intent: Intent;
};

export type Quote = { text: string; rating?: number; app: string };

export type Gap = {
  theme: string;
  label: string;
  mentions: number;
  requests: number;
  pain: number;
  breadth: number;
  apps: string[];
  score: number;
  quotes: Quote[];
};

// theme key -> [human label, regex source]. Mirrors analyze.py's THEMES
// dict; the regex sources are copied character for character (Python's `re`
// and JS's RegExp agree on this syntax).
export const THEMES: Record<string, [string, string]> = {
  paywall: [
    "Paywalled too aggressively",
    "paywall|subscription|subscribe|pay ?wall|too expensive|overpriced|" +
      "free version|locked behind|behind a pay|per month|monthly fee|rip ?off|" +
      "money grab|used to be free",
  ],
  sync: [
    "Sync and backup",
    "\\bsync\\b|syncing|icloud|across devices|second device|backup|back up|" +
      "restore|lost (my |all )?data|transfer to",
  ],
  ads: ["Advertising load", "\\bads?\\b|advert|commercial|pop-?up ad"],
  stability: [
    "Crashes and bugs",
    "crash|\\bbugs?\\b|buggy|freeze|frozen|glitch|broken|won'?t open|" +
      "doesn'?t work|stopped working|error message",
  ],
  export: [
    "Data export and lock-in",
    "export|import|\\bcsv\\b|my own data|get my data out|locked in|no backup file",
  ],
  complexity: [
    "Too complicated",
    "confusing|complicated|hard to use|not intuitive|cluttered|" +
      "learning curve|overwhelming|too many steps",
  ],
  widgets: ["Widgets and home screen", "widget|home ?screen|lock ?screen"],
  offline: [
    "Offline use",
    "offline|without (the )?internet|no wi-?fi|needs? internet",
  ],
  reminders: [
    "Reminders and notifications",
    "notification|reminder|remind me|\\balerts?\\b|never notifies|doesn'?t remind",
  ],
  customisation: [
    "Customisation",
    "customi[sz]|\\bthemes?\\b|dark mode|colou?rs?|personali[sz]|rearrange|reorder",
  ],
  performance: [
    "Speed and battery",
    "\\bslow\\b|laggy|\\blag\\b|sluggish|battery|drains",
  ],
  privacy: [
    "Privacy and forced accounts",
    // "tracking" alone is category vocabulary -- a habit tracker's reviews
    // are full of "tracking habits". Privacy tracking needs an object.
    "privacy|track(s|ing)? (me|my|you|your|user|location|everything)|" +
      "sells? (my|your) data|account required|forced to (sign|create)|" +
      "require[sd] (an )?(email|account|login)|why do i need an account|" +
      "data (harvest|collection|mining)",
  ],
  platform: [
    "Missing on other Apple devices",
    "\\bipad\\b|apple ?watch|\\bwatch app\\b|\\bmac\\b|macos|vision ?pro",
  ],
};

// Local (Pulse) taxonomy -- new, not in the Python reference. The ten keys
// are fixed by BUILD-PLAN; the regexes are left empty on purpose.
// FABLE: fill after Austin pull -- these have to be checked against real
// local-business reviews, not guessed (see analyze.py THEMES.privacy's
// comment for why a guessed regex bites you later).
export const LOCAL_THEMES: Record<string, [string, string]> = {
  lines_wait: ["Lines and wait times", ""],
  sold_out: ["Sells out early", ""],
  price_portion: ["Price and portion size", ""],
  staff: ["Staff and service", ""],
  consistency: ["Consistency", ""],
  cleanliness: ["Cleanliness", ""],
  parking: ["Parking", ""],
  delivery: ["Delivery", ""],
  noise: ["Noise", ""],
  used_to_be_better: ["Used to be better", ""],
};

// Deliberately narrow. Earlier versions matched "can't" and "missing", which
// swept ordinary complaints into the request bucket and made the "explicit
// requests" number meaningless. A request has to actually ask for something.
const REQUEST =
  /\bwish\b|would love|please add|please give|hope (they|you) (add|make)|should (add|include|let)|would be (nice|great|amazing)|(would|could|should|please|hope|need to|want them to)\s+\w{0,12}\s?add|feature request|my only (request|ask)|all i want|if (they|you) (added|add)/i;

const COMPILED: Record<string, RegExp> = Object.fromEntries(
  Object.entries(THEMES).map(([k, [, pattern]]) => [k, new RegExp(pattern, "i")]),
);

// Generic over T so extra fields the caller already attached (pipeline.ts
// adds `hash` before classifying, for the dedupe/index key) survive the
// spread instead of being narrowed away to bare `Review`.
export function classifyLocal<T extends Review>(review: T): T & ClassifiedReview {
  const blob = `${review.title ?? ""} ${review.text ?? ""}`;
  const hits = Object.keys(COMPILED).filter((k) => COMPILED[k].test(blob));
  const rating = review.rating ?? 0;
  const isRequest = REQUEST.test(blob);
  const intent: Intent = isRequest
    ? "request"
    : rating && rating <= 3
      ? "complaint"
      : "praise";
  return { ...review, themes: hits, intent };
}

/**
 * The passage that actually matched, not the first 260 characters.
 *
 * A long review often trips several themes; quoting its opening under every
 * one of them files sync complaints under "privacy" and reads as sloppy. So
 * centre the quote on the regex hit and snap to sentence edges.
 */
function evidence(text: string, theme: string, width = 260): string {
  const trimmed = (text ?? "").trim();
  const rx = COMPILED[theme];
  const m = rx ? rx.exec(trimmed) : null;
  if (!m || trimmed.length <= width) return trimmed.slice(0, width);
  const mid = Math.floor((m.index + (m.index + m[0].length)) / 2);
  const start = Math.max(0, mid - Math.floor(width / 2));
  const end = Math.min(trimmed.length, start + width);
  let snippet = trimmed.slice(start, end);
  if (start) {
    // do not begin mid-word
    const cut = snippet.indexOf(" ");
    snippet = cut !== -1 ? "…" + snippet.slice(cut + 1) : snippet;
  }
  if (end < trimmed.length) snippet = snippet.replace(/\s+$/, "") + "…";
  return snippet;
}

function quoteSortKey(r: ClassifiedReview): [number, number, number] {
  // Angriest first, but a two-word review is not evidence, so substantive
  // text outranks a marginally lower star rating. Mirrors the Python tuple
  // sort key exactly: (short-text flag, rating-or-5, -raw-length).
  const trimmedLen = (r.text ?? "").trim().length;
  const rawLen = (r.text ?? "").length;
  return [trimmedLen < 60 ? 1 : 0, r.rating ?? 5, -rawLen];
}

function cmpTuple(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

/**
 * Score each theme by how much pain it causes across how many apps.
 *
 * mentions   how many complaints and requests name it
 * pain       mean (5 - stars) of those reviews, so a 1-star gripe outweighs
 *            a 4-star aside
 * breadth    how many distinct apps share it -- a gap in one app is that
 *            app's bug, a gap in six is a hole in the category
 */
export function rankGaps(
  reviews: ClassifiedReview[],
  appsById: Record<string, { title?: string } | undefined>,
): Gap[] {
  const buckets = new Map<string, ClassifiedReview[]>();
  for (const r of reviews) {
    if (r.intent === "praise") continue;
    for (const theme of r.themes ?? []) {
      const bucket = buckets.get(theme) ?? [];
      bucket.push(r);
      buckets.set(theme, bucket);
    }
  }

  const gaps: Gap[] = [];
  for (const [theme, rows] of buckets) {
    const ratings = rows
      .map((r) => r.rating)
      .filter((x): x is number => Boolean(x));
    const pain = ratings.length
      ? ratings.reduce((sum, x) => sum + (5 - x), 0) / ratings.length
      : 2.0;
    const appIds = new Set(rows.map((r) => r.app_id));
    const breadth = appIds.size;
    const score = breadth ? rows.length * pain * (1 + Math.log2(breadth)) : 0.0;
    const requests = rows.filter((r) => r.intent === "request");
    const appTitles = [...appIds].map((id) => appsById[id]?.title ?? id);

    const sortedForQuotes = [...rows].sort((a, b) =>
      cmpTuple(quoteSortKey(a), quoteSortKey(b)),
    );

    gaps.push({
      theme,
      label:
        THEMES[theme]?.[0] ??
        LOCAL_THEMES[theme]?.[0] ??
        theme.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      mentions: rows.length,
      requests: requests.length,
      pain: Math.round(pain * 100) / 100,
      breadth,
      apps: [...new Set(appTitles)].sort(),
      score: Math.round(score * 10) / 10,
      quotes: sortedForQuotes.slice(0, 4).map((r) => ({
        text: evidence(r.text ?? "", theme),
        rating: r.rating,
        app: appsById[r.app_id]?.title ?? r.app_id,
      })),
    });
  }
  return gaps.sort((a, b) => b.score - a.score);
}

/** The one page you would actually read before deciding to build. */
export function writeBrief(
  term: string,
  apps: { rating?: number }[],
  gaps: Gap[],
  demand: { query?: string; value?: unknown }[],
): string {
  if (!gaps.length) {
    return `# ${term}\n\nNo gaps found — either the category is healthy or the sample is too small.`;
  }

  const rated = apps.map((a) => a.rating).filter((x): x is number => Boolean(x));
  const avg = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : 0;

  const lines: string[] = [
    `# Unmet needs in “${term}”`,
    "",
    `${apps.length} apps ranking for the term, mean rating ${avg.toFixed(2)}. ` +
      `Gaps below are ranked by mentions × pain × how many apps share them.`,
    "",
  ];

  gaps.slice(0, 5).forEach((g, i) => {
    lines.push(
      `## ${i + 1}. ${g.label}`,
      "",
      `${g.mentions} complaints and requests across ${g.breadth} of ` +
        `${apps.length} apps. Mean pain ${g.pain}/4. ` +
        `${g.requests} are explicit feature requests.`,
      "",
      `Affected: ${g.apps.slice(0, 6).join(", ")}`,
      "",
    );
    g.quotes.slice(0, 2).forEach((q) => {
      lines.push(`> “${q.text}” — ${q.rating}★ on ${q.app}`);
      lines.push("");
    });
  });

  if (demand.length) {
    lines.push(
      "## Search demand behind the gap",
      "",
      "Google Trends related queries, as evidence people look for this outside the store:",
      "",
    );
    demand.slice(0, 8).forEach((d) => lines.push(`- ${d.query} (${d.value})`));
  }

  return lines.join("\n");
}
