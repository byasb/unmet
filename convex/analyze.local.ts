// Pure port of app/analyze.py's LOCAL_THEMES, LOCAL_REQUEST,
// classify_local(taxonomy="local"), _evidence and rank_gaps. Ported
// verbatim, not redesigned -- see BUILD-PLAN.md's "Port map" table and
// ENGINE-NOTES.md for how these regexes were built (556 real Austin
// barbecue reviews, Sep 2 2026).
//
// No Convex imports on purpose (same reasoning as cacheKey.ts/dedupe.ts):
// this file must be importable from a plain vitest run with no deployment.
//
// Field names match the Python reference exactly (`app_id`, an `appsById`
// lookup of {title}) even though in Pulse the id is a Google/Yelp/
// TripAdvisor place id and the "apps" are business names -- see
// unmet/scripts/austin.py's `load()`, which reuses the same generic field
// name for exactly this reason. convex/pulse.ts maps `placeId` -> `app_id`
// at the edges when it calls into this module.

export type LocalReview = {
  app_id: string;
  rating?: number | null;
  text?: string;
  title?: string;
};

export type LocalIntent = "complaint" | "request" | "praise";

export type ClassifiedLocalReview = LocalReview & {
  themes: string[];
  intent: LocalIntent;
};

export type LocalGapQuote = { text: string; rating?: number | null; app: string };

export type LocalGap = {
  theme: string;
  label: string;
  mentions: number;
  requests: number;
  pain: number;
  breadth: number;
  apps: string[];
  score: number;
  quotes: LocalGapQuote[];
};

// theme key -> [human label, regex source]. Category vocabulary that is NOT
// a complaint is excluded on purpose: "dry rub" is praise, "the line was
// worth it" is praise, "cold beer" is praise.
export const LOCAL_THEMES: Record<string, [string, string]> = {
  lines_wait: [
    "Lines and wait times",
    "\\b(long|hour|hours|2|two|three|3)[- ]?(hr|hour|hours)? ?(in|of) ?line|waited (over|for|an|two|three|\\d)|" +
      "\\bwait(ed|ing)? (was|is|time|times) (too )?long|\\bline (was|is) (too )?long|" +
      "(hour|hours) (wait|in line|to (get|order))|\\bqueue|no (idea|sign|estimate) (of|how long)",
  ],
  sold_out: [
    "Sold out early",
    "sold out|ran out|run out|sell(s|ing)? out|out of (brisket|ribs|meat|sausage|everything)|" +
      "nothing left|gone by (noon|1|2|12)",
  ],
  value: [
    "Price vs portion",
    "overpriced|too expensive|not worth (it|the (price|money|wait))|waste of (money|time)|" +
      "your money|for the price|per pound|\\$\\d+ (for|a|per)|portion(s)? (was|were|are|is) (small|tiny)|" +
      "small portion|skimp|rip ?off",
  ],
  meat_quality: [
    "Dry, tough or bland meat",
    "\\bdry\\b(?! rub)|\\btough\\b|\\bchewy\\b|\\bbland\\b|\\bfatty\\b|no (smoke|bark|flavor|flavour)|" +
      "\\bcold\\b(?! (beer|drink|drinks|sides))|over ?cooked|under ?cooked|\\bburnt\\b|" +
      "tasted like|\\bsalty\\b|\\bgreasy\\b|\\bmediocre\\b",
  ],
  sides: [
    "Sides let it down",
    "(potato salad|mac (and|&|n) cheese|beans|coleslaw|cole slaw|creamed corn|the sides?)[^.]{0,60}" +
      "(bland|dry|cold|bad|terrible|awful|mediocre|forgettable|disappoint|nothing special|meh|worst)",
  ],
  staff: [
    "Counter staff and service",
    "\\brude\\b|attitude|unfriendly|unhelpful|ignored (us|me)|behind the counter[^.]{0,40}(rude|slow|attitude)|" +
      "(service|staff|cashier|employee|guy|lady|girl)[^.]{0,30}(rude|terrible|awful|slow|horrible|unfriendly|attitude)|" +
      "(rude|terrible|awful|slow|horrible) (service|staff|employee)|customer service (was|is) (bad|terrible|poor|awful)",
  ],
  consistency: [
    "Not what it used to be",
    "used to be|not (as good|the same|what it (was|used to))|went ?down ?hill|gone downhill|" +
      "inconsistent|hit or miss|hit-or-miss|(this|last) time (it )?was (different|worse|a let ?down)|" +
      "fell off|lost (its|their) (touch|way)|overrated|over-rated|overhyped",
  ],
  cleanliness: [
    "Cleanliness",
    "\\bdirty\\b|\\bflies\\b|\\bsticky\\b|(bathroom|restroom)[^.]{0,40}(dirty|gross|disgusting|filthy|no (soap|paper))|" +
      "\\bfilthy\\b|\\bgross\\b|food poisoning|got sick",
  ],
  parking: [
    "Parking",
    "parking (was|is) (a|terrible|awful|hard|impossible|limited|non-?existent|a nightmare|tough)|no parking|" +
      "hard to (find )?park|nowhere to park|park(ed)? (blocks|far|down the street)",
  ],
  seating: [
    "Seating and crowding",
    "no (where|place) to sit|nowhere to sit|(cramped|crowded|packed)[^.]{0,20}(seat|table|inside|room)|" +
      "couldn'?t find a (seat|table)|(seating|tables?) (was|were|is) (limited|scarce|full|hard)|too loud|so loud",
  ],
  takeout: [
    "Takeout and delivery",
    "(to[- ]?go|takeout|take[- ]out|delivery|doordash|uber ?eats|online order)[^.]{0,50}" +
      "(wrong|cold|missing|forgot|late|soggy|mess|disaster|took (an hour|forever))",
  ],
  billing: [
    "Order and billing mistakes",
    "wrong order|got (my|our) order wrong|forgot (my|our|the)|missing (my|our|the|an|a) |over ?charged|" +
      "charged (me|us) (for|twice|extra)|unauthori[sz]ed|double charged|refund",
  ],
};

// Deliberately narrow -- see app/analyze.py's REQUEST docstring: earlier
// versions matched "can't"/"missing" and swept ordinary complaints into the
// request bucket.
export const LOCAL_REQUEST = new RegExp(
  "\\bwish\\b|would love|please (add|get|fix|bring)|should (add|have|get|post|put)|" +
    "would be (nice|great|better)|if (they|you) (had|added|posted|would)|my only (complaint|gripe|ask|suggestion)|" +
    "suggestion:|needs? (a|an|to) |could use (a|an|some)",
  "i",
);

const COMPILED_LOCAL: Record<string, RegExp> = Object.fromEntries(
  Object.entries(LOCAL_THEMES).map(([k, [, source]]) => [k, new RegExp(source, "i")]),
);

export function classifyLocal(review: LocalReview): ClassifiedLocalReview {
  const blob = `${review.title ?? ""} ${review.text ?? ""}`;
  const hits = Object.entries(COMPILED_LOCAL)
    .filter(([, rx]) => rx.test(blob))
    .map(([k]) => k);
  const rating = review.rating ?? 0;
  const isRequest = LOCAL_REQUEST.test(blob);
  const intent: LocalIntent = isRequest ? "request" : rating && rating <= 3 ? "complaint" : "praise";
  return { ...review, themes: hits, intent };
}

/** The passage that actually matched, not the first `width` characters. A
 * long review often trips several themes; quoting its opening under every
 * one of them files sync complaints under "privacy" and reads as sloppy --
 * so centre the quote on the regex hit and snap to sentence edges. */
export function evidenceLocal(rawText: string, theme: string, width = 260): string {
  const text = (rawText ?? "").trim();
  const rx = COMPILED_LOCAL[theme];
  const m = rx ? rx.exec(text) : null;
  if (!m || text.length <= width) return text.slice(0, width);
  const matchStart = m.index;
  const matchEnd = m.index + m[0].length;
  const mid = Math.floor((matchStart + matchEnd) / 2);
  const start = Math.max(0, mid - Math.floor(width / 2));
  const end = Math.min(text.length, start + width);
  let snippet = text.slice(start, end);
  if (start) {
    // do not begin mid-word
    const cut = snippet.indexOf(" ");
    snippet = cut !== -1 ? "…" + snippet.slice(cut + 1) : snippet;
  }
  if (end < text.length) snippet = snippet.trimEnd() + "…";
  return snippet;
}

/**
 * Score each theme by how much pain it causes across how many places.
 *
 * mentions   how many complaints and requests name it
 * pain       mean (5 - stars) of those reviews, so a 1-star gripe outweighs a 4-star aside
 * breadth    how many distinct places share it -- a gap at one place is that
 *            place's problem, a gap at six is a hole in the category
 */
export function rankGapsLocal(
  reviews: ClassifiedLocalReview[],
  appsById: Record<string, { title: string }>,
): LocalGap[] {
  const buckets = new Map<string, ClassifiedLocalReview[]>();
  for (const r of reviews) {
    if (r.intent === "praise") continue;
    for (const theme of r.themes) {
      const bucket = buckets.get(theme);
      if (bucket) bucket.push(r);
      else buckets.set(theme, [r]);
    }
  }

  const gaps: LocalGap[] = [];
  for (const [theme, rows] of buckets) {
    const ratings = rows.map((r) => r.rating).filter((r): r is number => !!r);
    const pain = ratings.length > 0 ? ratings.reduce((sum, x) => sum + (5 - x), 0) / ratings.length : 2.0;
    const appIds = new Set(rows.map((r) => r.app_id));
    const breadth = appIds.size;
    const score = breadth ? rows.length * pain * (1 + Math.log2(breadth)) : 0.0;
    const requests = rows.filter((r) => r.intent === "request");
    const apps = Array.from(new Set([...appIds].map((id) => appsById[id]?.title ?? id))).sort();

    // Angriest first, but a two-word review is not evidence, so substantive
    // text outranks a marginally lower star rating.
    const sortedForQuotes = [...rows].sort((a, b) => {
      const shortA = (a.text ?? "").trim().length < 60 ? 1 : 0;
      const shortB = (b.text ?? "").trim().length < 60 ? 1 : 0;
      if (shortA !== shortB) return shortA - shortB;
      const ratingA = a.rating ?? 5;
      const ratingB = b.rating ?? 5;
      if (ratingA !== ratingB) return ratingA - ratingB;
      return (b.text ?? "").length - (a.text ?? "").length;
    });

    gaps.push({
      theme,
      label: LOCAL_THEMES[theme]?.[0] ?? theme.replace(/_/g, " "),
      mentions: rows.length,
      requests: requests.length,
      pain: Math.round(pain * 100) / 100,
      breadth,
      apps,
      score: Math.round(score * 10) / 10,
      quotes: sortedForQuotes.slice(0, 4).map((r) => ({
        text: evidenceLocal(r.text ?? "", theme),
        rating: r.rating,
        app: appsById[r.app_id]?.title ?? r.app_id,
      })),
    });
  }

  return gaps.sort((a, b) => b.score - a.score);
}
