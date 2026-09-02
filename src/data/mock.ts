// Real numbers copied from design-unmet/*.dc.html (Main/StartApp = real cached
// "habit tracker" run; Local/Morning/Action/Replies/Experiments/AIAnswer = the
// sample Austin barbecue numbers, kept as "sample" per the designs — the
// Austin pull is still pending per BUILD-PLAN.md).

import type {
  ActionItem,
  AiAnswer,
  AppRead,
  Business,
  CallRow,
  DemandTerm,
  Draft,
  Experiment,
  Gap,
  PlaceRead,
  Run,
  WeekDay,
} from "./types";

export const BUILD_RUN: Run = {
  _id: "run_build_habit",
  kind: "build",
  term: "habit tracker",
  country: "US",
  status: "done",
  startedAt: Date.parse("2026-09-02T04:13:00Z"),
  finishedAt: Date.parse("2026-09-02T04:13:01Z"),
  reviewCount: 302,
  liveCalls: 0,
  cachedCalls: 17,
  mode: "offline replay",
};

export const BUILD_APPS: AppRead[] = [
  { name: "Habit Tracker", rating: 4.79, ratingsCount: 146150, cached: true },
  { name: "Habit Tracker: Habit OK", rating: 4.81, ratingsCount: 42, cached: true },
  { name: "Habit Tracker — HabitKit", rating: 4.85, ratingsCount: 2385, cached: true },
  { name: "Finch: Self-Care Pet", rating: 4.95, ratingsCount: 746410, cached: true },
  { name: "Onrise: Habit Tracker & Focus", rating: 4.84, ratingsCount: 2534, cached: true },
  { name: "Productive — Habit Tracker", rating: 4.6, ratingsCount: 91085, cached: true },
  { name: "Habit Tracker — Daily Goals", rating: 4.85, ratingsCount: 3297, cached: true },
];

export const BUILD_DEMAND: DemandTerm[] = [
  { term: "app habit tracker", value: 100 },
  { term: "habit app", value: 98 },
  { term: "2026 habit tracker", value: 73 },
  { term: "best habit tracker", value: 57 },
];

export const BUILD_GAPS: Gap[] = [
  {
    _id: "gap_paywalls",
    runId: "run_build_habit",
    theme: "paywalls",
    label: "Paywalled too aggressively",
    mentions: 19,
    requests: 11,
    pain: 1.89,
    breadth: 5,
    totalPlaces: 7,
    score: 119.6,
    apps: ["Habit Tracker", "Daily Goals", "HabitKit", "Onrise", "Productive"],
    quotes: [
      {
        text: "$5.99 a week or $99.99 a year. Without paying one of those, you are limited to only 5 free habits. No more than that. Doesn't work for what I need.",
        rating: 1,
        place: "Productive — Habit Tracker",
      },
    ],
  },
  {
    _id: "gap_crashes",
    runId: "run_build_habit",
    theme: "crashes",
    label: "Crashes and bugs",
    mentions: 11,
    requests: 2,
    pain: 2.36,
    breadth: 3,
    totalPlaces: 7,
    score: 67.2,
    apps: ["Habit Tracker — Daily Goals", "Habit Tracker", "HabitKit"],
    quotes: [
      {
        text: "It deleted my habits twice. I uninstalled and downloaded again to fix it and it still deleted my habits after a month or two.",
        rating: 1,
        place: "Habit Tracker — Daily Goals",
      },
    ],
  },
  {
    _id: "gap_sync",
    runId: "run_build_habit",
    theme: "sync",
    label: "Sync and backup",
    mentions: 9,
    requests: 4,
    pain: 1.89,
    breadth: 4,
    totalPlaces: 7,
    score: 51.0,
    apps: [],
    quotes: [],
  },
  {
    _id: "gap_reminders",
    runId: "run_build_habit",
    theme: "reminders",
    label: "Reminders and notifications",
    mentions: 16,
    requests: 12,
    pain: 0.94,
    breadth: 5,
    totalPlaces: 7,
    score: 49.8,
    apps: [],
    quotes: [],
  },
  {
    _id: "gap_custom",
    runId: "run_build_habit",
    theme: "customisation",
    label: "Customisation",
    mentions: 19,
    requests: 17,
    pain: 0.79,
    breadth: 5,
    totalPlaces: 7,
    score: 49.8,
    apps: [],
    quotes: [],
  },
];

export const BUILD_CALLS: CallRow[] = [
  { _id: "c1", runId: "run_build_habit", engine: "apple_app_store", paramsSummary: "term=habit tracker", live: false, ms: 4, at: 1 },
  { _id: "c2", runId: "run_build_habit", engine: "apple_reviews", paramsSummary: "1438388363 · mosthelpful", live: false, ms: 2, at: 2 },
  { _id: "c3", runId: "run_build_habit", engine: "apple_reviews", paramsSummary: "1438388363 · mostrecent", live: false, ms: 2, at: 3 },
  { _id: "c4", runId: "run_build_habit", engine: "apple_reviews", paramsSummary: "6749204658 · mosthelpful", live: false, ms: 1, at: 4 },
  { _id: "c5", runId: "run_build_habit", engine: "apple_reviews", paramsSummary: "6443918070 · mosthelpful", live: false, ms: 2, at: 5 },
  { _id: "c6", runId: "run_build_habit", engine: "apple_reviews", paramsSummary: "1528595748 · mostrecent", live: false, ms: 1, at: 6 },
  { _id: "c7", runId: "run_build_habit", engine: "apple_reviews", paramsSummary: "983826477 · mosthelpful", live: false, ms: 2, at: 7 },
  { _id: "c8", runId: "run_build_habit", engine: "google_trends", paramsSummary: "RELATED_QUERIES", live: false, ms: 3, at: 8 },
  { _id: "c9", runId: "run_build_habit", engine: "google_autocomplete", paramsSummary: "q=habit tracker", live: false, ms: 1, at: 9 },
];

// Reading-screen live-run telemetry (habit tracker, first live run) — used to
// drive the streaming animation on /run/:id.
export const READING_CALLS: CallRow[] = [
  { _id: "r1", runId: "run_live_demo", engine: "apple_app_store", paramsSummary: "term=habit tracker", live: true, ms: 812, at: 1 },
  { _id: "r2", runId: "run_live_demo", engine: "apple_reviews", paramsSummary: "1438388363 · mosthelpful", live: true, ms: 640, at: 2 },
  { _id: "r3", runId: "run_live_demo", engine: "apple_reviews", paramsSummary: "1438388363 · mostrecent", live: true, ms: 598, at: 3 },
  { _id: "r4", runId: "run_live_demo", engine: "apple_reviews", paramsSummary: "6749204658 · mosthelpful", live: true, ms: 711, at: 4 },
  { _id: "r5", runId: "run_live_demo", engine: "apple_reviews", paramsSummary: "6749204658 · mostrecent", live: true, ms: 655, at: 5 },
  { _id: "r6", runId: "run_live_demo", engine: "apple_reviews", paramsSummary: "6443918070 · mosthelpful", live: true, ms: 690, at: 6 },
  { _id: "r7", runId: "run_live_demo", engine: "apple_reviews", paramsSummary: "6443918070 · mostrecent", live: true, ms: 602, at: 7 },
  { _id: "r8", runId: "run_live_demo", engine: "apple_reviews", paramsSummary: "1528595748 · mosthelpful", live: true, ms: 733, at: 8 },
  { _id: "r9", runId: "run_live_demo", engine: "apple_reviews", paramsSummary: "1547137474 · mosthelpful", live: true, ms: 640, at: 9 },
];

export const READING_APPS_FOUND = [
  "Habit Tracker",
  "Habit Tracker: Habit OK",
  "Habit Tracker — HabitKit",
  "Finch: Self-Care Pet",
  "Onrise: Habit Tracker & Focus",
  "Productive — Habit Tracker",
  "Habit Tracker — Daily Goals",
];

// ---------- Pulse / Austin barbecue sample ----------

export const PULSE_BUSINESS: Business = {
  _id: "biz_franklin",
  name: "Franklin Barbecue",
  category: "barbecue",
  location: "Austin, TX",
  timezone: "America/Chicago",
};

export const PULSE_RUN: Run = {
  _id: "run_pulse_austin",
  kind: "pulse",
  term: "barbecue",
  location: "Austin, TX",
  status: "done",
  startedAt: Date.parse("2026-09-02T09:52:00Z"),
  finishedAt: Date.parse("2026-09-02T09:52:10Z"),
  reviewCount: 214,
  liveCalls: 17,
  cachedCalls: 0,
  mode: "live",
};

export const PULSE_PLACES: PlaceRead[] = [
  { name: "Franklin Barbecue", rating: 4.7, reviewCount: 12400, isYou: true, deltaWeek: -0.1 },
  { name: "Terry Black's Barbecue", rating: 4.6, reviewCount: 9800, deltaWeek: 0.0 },
  { name: "la Barbecue", rating: 4.6, reviewCount: 3100, deltaWeek: -0.2 },
  { name: "Micklethwait Craft Meats", rating: 4.6, reviewCount: 2000, deltaWeek: 0.1 },
  { name: "Interstellar BBQ", rating: 4.8, reviewCount: 1700, deltaWeek: 0.0 },
  { name: "Stiles Switch BBQ", rating: 4.5, reviewCount: 2900, deltaWeek: -0.3 },
  { name: "Cooper's Old Time Pit", rating: 4.3, reviewCount: 6200, deltaWeek: 0.0 },
];

export const PULSE_GAPS: Gap[] = [
  {
    _id: "gap_lines",
    runId: "run_pulse_austin",
    theme: "lines_wait",
    label: "Lines and wait times",
    mentions: 14,
    pain: 2.8,
    breadth: 6,
    totalPlaces: 7,
    score: 140.5,
    apps: [],
    deltaWeek: 5,
    inYourReviews: true,
    platforms: ["G", "Y", "T"],
    requestPhrases: [
      { text: "to know the wait", count: 9 },
      { text: "a way to order ahead", count: 3 },
      { text: "shade or water in line", count: 2 },
    ],
    dayOfWeek: [25, 20, 30, 35, 55, 100, 80],
    quotes: [
      {
        text: "Two and a half hours in line on a Saturday and nobody told us how long it would be. Brisket was great; the wait ruined the day.",
        rating: 1,
        place: "Franklin Barbecue",
        source: "G",
        daysAgo: 3,
      },
      {
        text: "Line wrapped the building at 10am. No sign, no estimate, no one walking the queue. We left at 11:30 without eating.",
        rating: 1,
        place: "Franklin Barbecue",
        source: "Y",
        daysAgo: 5,
      },
      {
        text: "Food is a 5. The wait management is a 1. Tell people it's three hours and let them decide.",
        rating: 2,
        place: "Franklin Barbecue",
        source: "T",
        daysAgo: 6,
      },
    ],
  },
  {
    _id: "gap_soldout",
    runId: "run_pulse_austin",
    theme: "sold_out",
    label: "Sold out early",
    mentions: 11,
    pain: 2.2,
    breadth: 4,
    totalPlaces: 7,
    score: 72.6,
    apps: [],
    deltaWeek: 1,
    inYourReviews: true,
    quotes: [],
  },
  {
    _id: "gap_price",
    runId: "run_pulse_austin",
    theme: "price_portion",
    label: "Price per pound",
    mentions: 9,
    pain: 2.6,
    breadth: 4,
    totalPlaces: 7,
    score: 70.2,
    apps: [],
    deltaWeek: 3,
    quotes: [],
  },
  {
    _id: "gap_consistency",
    runId: "run_pulse_austin",
    theme: "consistency",
    label: "Consistency",
    mentions: 8,
    pain: 1.9,
    breadth: 4,
    totalPlaces: 7,
    score: 45.6,
    apps: [],
    deltaWeek: 0,
    inYourReviews: true,
    quotes: [],
  },
  {
    _id: "gap_parking",
    runId: "run_pulse_austin",
    theme: "parking",
    label: "Parking",
    mentions: 6,
    pain: 1.5,
    breadth: 3,
    totalPlaces: 7,
    score: 23.3,
    apps: [],
    deltaWeek: -2,
    quotes: [],
  },
];

export const PULSE_CALLS: CallRow[] = [
  { _id: "p1", runId: "run_pulse_austin", engine: "google_maps", paramsSummary: "q=barbecue · Austin TX", live: true, ms: 1100, at: 1 },
  { _id: "p2", runId: "run_pulse_austin", engine: "google_maps_reviews", paramsSummary: "Franklin Barbecue · newest", live: true, ms: 744, at: 2 },
  { _id: "p3", runId: "run_pulse_austin", engine: "google_maps_reviews", paramsSummary: "Franklin Barbecue · lowest", live: true, ms: 690, at: 3 },
  { _id: "p4", runId: "run_pulse_austin", engine: "google_maps_reviews", paramsSummary: "[place 2] · newest", live: true, ms: 812, at: 4 },
  { _id: "p5", runId: "run_pulse_austin", engine: "google_maps_reviews", paramsSummary: "[place 2] · lowest", live: true, ms: 655, at: 5 },
  { _id: "p6", runId: "run_pulse_austin", engine: "google_trends", paramsSummary: "RELATED_QUERIES · geo=US-TX", live: true, ms: 903, at: 6 },
];

export const PULSE_ACTIONS_TODAY: ActionItem[] = [
  {
    _id: "act_wait",
    businessId: "biz_franklin",
    theme: "lines_wait",
    title: "Post today's expected wait on Google Maps by 10am",
    meta: "lines & wait · 14",
    effort: "10 min",
    cadence: "weekly",
    state: "today",
    prescribedAt: Date.parse("2026-09-02T05:02:00Z"),
    progress: "starts an experiment",
  },
  {
    _id: "act_soldout",
    businessId: "biz_franklin",
    theme: "sold_out",
    title: "Post the cut-off time the moment ribs run low",
    meta: "sold out early · 11",
    effort: "2 min",
    cadence: "daily",
    state: "today",
    prescribedAt: Date.parse("2026-09-02T05:02:00Z"),
  },
  {
    _id: "act_replies",
    businessId: "biz_franklin",
    theme: "ai_answer",
    title: "Answer your 3 unanswered Yelp reviews",
    meta: "AI answer · Yelp ×3",
    effort: "15 min",
    cadence: "once",
    state: "today",
    prescribedAt: Date.parse("2026-09-02T05:02:00Z"),
    progress: "drafts ready",
  },
];

export const PULSE_ACTIONS_CARRIED: ActionItem[] = [
  {
    _id: "act_carry_replies",
    businessId: "biz_franklin",
    theme: "ai_answer",
    title: "Approve Sunday's drafted replies",
    meta: "from Sun · 2 drafted",
    effort: "1 of 2 done",
    state: "carried",
    prescribedAt: Date.parse("2026-08-31T05:00:00Z"),
    daysOpen: 2,
  },
  {
    _id: "act_carry_parking",
    businessId: "biz_franklin",
    theme: "parking",
    title: "Pin a parking post on Maps",
    meta: "from Sat · parking · description alone was flat",
    effort: "not started",
    state: "carried",
    prescribedAt: Date.parse("2026-08-30T05:00:00Z"),
    daysOpen: 3,
  },
];

export const PULSE_ACTIONS_DONE: ActionItem[] = [
  {
    _id: "act_done_cutlist",
    businessId: "biz_franklin",
    theme: "consistency",
    title: "Kept up the daily cut-list post",
    meta: "consistency · running since 11 Aug",
    effort: "Sun · Mon · 2 of 2",
    state: "done",
    prescribedAt: Date.parse("2026-08-11T05:00:00Z"),
    doneAt: Date.parse("2026-09-01T09:00:00Z"),
    progress: "moved −67% · over 3 wks",
  },
  {
    _id: "act_done_replies",
    businessId: "biz_franklin",
    theme: "ai_answer",
    title: "Approved 3 replies, posted on Google",
    meta: "reply desk · Mon's queue",
    effort: "Mon · 3 of 5 that day",
    state: "done",
    prescribedAt: Date.parse("2026-09-01T05:00:00Z"),
    doneAt: Date.parse("2026-09-01T10:00:00Z"),
  },
  {
    _id: "act_done_trip",
    businessId: "biz_franklin",
    theme: "reviews",
    title: "Answered the 5-day-old 1-star on TripAdvisor",
    meta: "from Fri",
    effort: "Sun",
    state: "done",
    prescribedAt: Date.parse("2026-08-28T05:00:00Z"),
    doneAt: Date.parse("2026-08-31T09:00:00Z"),
  },
  {
    _id: "act_done_cutoff",
    businessId: "biz_franklin",
    theme: "sold_out",
    title: "Posted the cut-off time at noon",
    meta: "sold out early · from Sat",
    effort: "Sat · Sun · 2 of 2 days",
    state: "done",
    prescribedAt: Date.parse("2026-08-30T05:00:00Z"),
    doneAt: Date.parse("2026-08-31T12:00:00Z"),
  },
  {
    _id: "act_done_opentable",
    businessId: "biz_franklin",
    theme: "reviews",
    title: "Replied to the OpenTable 2-star",
    meta: "from Fri",
    effort: "Sat",
    state: "done",
    prescribedAt: Date.parse("2026-08-29T05:00:00Z"),
    doneAt: Date.parse("2026-08-30T09:00:00Z"),
  },
];

export const PULSE_WEEK: WeekDay[] = [
  { label: "Wed", date: "27", newReviews: 3, actionsDone: 3, actionsTotal: 3 },
  { label: "Thu", date: "28", newReviews: 2, actionsDone: 2, actionsTotal: 2 },
  { label: "Fri", date: "29", newReviews: 4, actionsDone: 1, actionsTotal: 3 },
  { label: "Sat", date: "30", newReviews: 6, actionsDone: 2, actionsTotal: 3 },
  { label: "Sun", date: "31", newReviews: 4, actionsDone: 3, actionsTotal: 3 },
  { label: "Mon", date: "1", newReviews: 5, actionsDone: 2, actionsTotal: 3 },
  { label: "Tue", date: "today", newReviews: 7, actionsDone: 0, actionsTotal: 3, isToday: true },
];

export const PULSE_EXPERIMENTS: Experiment[] = [
  {
    _id: "exp_lines",
    businessId: "biz_franklin",
    actionId: "act_wait",
    theme: "Lines & wait",
    actionTitle: "Post today's expected wait on Google Maps by 10am, update at 12 and 2",
    startedAt: Date.parse("2026-09-02T05:00:00Z"),
    baselineMentions: 14,
    baselinePain: 2.8,
    reads: [],
    verdict: "measuring",
    note: "first read Mon 9 Sep",
  },
  {
    _id: "exp_consistency",
    businessId: "biz_franklin",
    actionId: "act_done_cutlist",
    theme: "Consistency",
    actionTitle: "Posted the day's cut list and who's on the pit, daily",
    startedAt: Date.parse("2026-08-11T05:00:00Z"),
    baselineMentions: 9,
    baselinePain: 2.1,
    reads: [
      { at: Date.parse("2026-08-18T05:00:00Z"), mentions: 7, pain: 1.9 },
      { at: Date.parse("2026-08-25T05:00:00Z"), mentions: 5, pain: 1.7 },
      { at: Date.parse("2026-09-01T05:00:00Z"), mentions: 3, pain: 1.5 },
    ],
    verdict: "moved",
    note: "9 → 3 / wk · pain 2.1 → 1.5 · 3 wks",
  },
  {
    _id: "exp_parking",
    businessId: "biz_franklin",
    actionId: "act_carry_parking",
    theme: "Parking",
    actionTitle: "Added “park at the lot on 11th, free after 6” to the Maps description",
    startedAt: Date.parse("2026-08-18T05:00:00Z"),
    baselineMentions: 6,
    baselinePain: 1.5,
    reads: [
      { at: Date.parse("2026-08-25T05:00:00Z"), mentions: 6, pain: 1.5 },
      { at: Date.parse("2026-09-01T05:00:00Z"), mentions: 5, pain: 1.5 },
    ],
    verdict: "flat",
    note: "6 → 5 / wk · try a pinned post instead",
  },
];

export const PULSE_DRAFTS: Draft[] = [
  {
    _id: "draft_1",
    businessId: "biz_franklin",
    reviewId: "rev_1",
    reviewText:
      "Two and a half hours in line on a Saturday and nobody told us how long it would be. Brisket was great; the wait ruined the day.",
    reviewSource: "G",
    reviewRating: 1,
    reviewer: "reviewer",
    daysAgo: 3,
    themes: ["lines & wait", "praise · food"],
    text: "Thank you for coming out on a Saturday, and I'm sorry the wait caught you by surprise — that's on us, not you. We're starting to post the expected wait on our Google listing each morning and updating it through the day, so next time you'll know before you drive over. Glad the brisket held up its end. Come back on a weekday afternoon and ask for me; I'll get you through faster.",
    tone: "warm",
    checks: [
      { rule: "Names the specific problem they raised, not a generic apology", pass: true, note: "“caught you by surprise”" },
      { rule: "No liability language, no refund offered in public", pass: true },
      { rule: "Only promises what's already started", pass: true, note: "“posting the expected wait” — action 01 started today" },
      { rule: "Offers one reviewer preferential treatment in public", pass: false, note: "“ask for me; I'll get you through faster” — cut the last sentence" },
    ],
    status: "drafted",
  },
  {
    _id: "draft_2",
    businessId: "biz_franklin",
    reviewId: "rev_2",
    reviewText: "Sold out of ribs by 12:40. Drove an hour. A sign or a post would have saved the trip.",
    reviewSource: "Y",
    reviewRating: 2,
    reviewer: "reviewer",
    daysAgo: 3,
    themes: ["sold out early"],
    text: "",
    tone: "warm",
    checks: [],
    status: "drafted",
  },
  {
    _id: "draft_3",
    businessId: "biz_franklin",
    reviewId: "rev_3",
    reviewText: "Portion was smaller than two years ago for the same price per pound. Still good, just not the same value.",
    reviewSource: "T",
    reviewRating: 2,
    reviewer: "reviewer",
    daysAgo: 4,
    themes: ["price per pound"],
    text: "",
    tone: "warm",
    checks: [],
    status: "drafted",
  },
  {
    _id: "draft_4",
    businessId: "biz_franklin",
    reviewId: "rev_4",
    reviewText: "Great food, cramped seating on a busy day, parking was the hardest part of the visit.",
    reviewSource: "O",
    reviewRating: 4,
    reviewer: "reviewer",
    daysAgo: 5,
    themes: ["parking"],
    text: "",
    tone: "warm",
    checks: [],
    status: "drafted",
  },
  {
    _id: "draft_5",
    businessId: "biz_franklin",
    reviewId: "rev_5",
    reviewText: "Worth every minute of the line. Best brisket I have had anywhere, and the staff kept the queue moving with water.",
    reviewSource: "G",
    reviewRating: 5,
    reviewer: "reviewer",
    daysAgo: 2,
    themes: ["praise"],
    text: "",
    tone: "warm",
    checks: [],
    status: "drafted",
    isPraise: true,
  },
  {
    _id: "draft_6",
    businessId: "biz_franklin",
    reviewId: "rev_6",
    reviewText: "Drove from San Antonio. Would do it again.",
    reviewSource: "G",
    reviewRating: 5,
    reviewer: "reviewer",
    daysAgo: 1,
    themes: ["praise"],
    text: "",
    tone: "warm",
    checks: [],
    status: "drafted",
    isPraise: true,
  },
  {
    _id: "draft_7",
    businessId: "biz_franklin",
    reviewId: "rev_7",
    reviewText: "Sausage is underrated here. Get the sausage.",
    reviewSource: "Y",
    reviewRating: 4,
    reviewer: "reviewer",
    daysAgo: 1,
    themes: ["praise"],
    text: "",
    tone: "warm",
    checks: [],
    status: "drafted",
    isPraise: true,
  },
];

export const PULSE_AI_ANSWERS: AiAnswer[] = [
  {
    _id: "ai_best_bbq",
    businessId: "biz_franklin",
    query: "best barbecue austin",
    day: "2026-09-02",
    cited: true,
    position: 2,
    sources: [
      { name: "Yelp", count: 3 },
      { name: "Eater Austin", count: 1 },
      { name: "TripAdvisor", count: 1 },
      { name: "Google Maps", count: 0 },
    ],
    excerpt:
      "Austin's best-known barbecue is [place 2], praised for brisket and shorter lines after 3pm. Franklin Barbecue remains the benchmark for brisket, with reviewers warning of multi-hour waits and early sell-outs. [place 3] is recommended for ordering ahead, and [place 5] is a rising favourite with consistently high recent ratings.",
    named: [
      { rank: 1, name: "[place 2]", note: "“shorter lines after 3pm”" },
      { rank: 2, name: "Franklin Barbecue", note: "“benchmark” · “multi-hour waits” · “sell-outs”", isYou: true },
      { rank: 3, name: "[place 3]", note: "“ordering ahead”" },
      { rank: 4, name: "[place 5]", note: "“rising” · first seen 2 days ago" },
    ],
    history: [
      "in", "in", "in", "in", "none", "in", "in", "in", "in", "in",
      "in", "in", "out", "out", "out", "out", "out", "none", "in", "in",
      "in", "in", "in", "in", "none", "in", "in", "in", "in", "in",
    ],
  },
  {
    _id: "ai_brisket",
    businessId: "biz_franklin",
    query: "best brisket in austin",
    day: "2026-09-02",
    cited: true,
    position: 1,
    sources: [{ name: "Eater Austin", count: 2 }],
    excerpt: "",
    named: [],
    history: [],
  },
  {
    _id: "ai_nowait",
    businessId: "biz_franklin",
    query: "bbq austin no wait",
    day: "2026-09-02",
    cited: false,
    sources: [],
    excerpt: "",
    named: [],
    history: [],
  },
  {
    _id: "ai_waittime",
    businessId: "biz_franklin",
    query: "franklin barbecue wait time",
    day: "2026-09-02",
    cited: false,
    sources: [],
    excerpt: "",
    named: [],
    history: [],
  },
];

export const BUILD_BRIEF_MARKDOWN = `# Unmet needs in "habit tracker"

7 apps ranking for the term, mean rating 4.81, 302 reviews read. Gaps below are ranked by mentions × pain × how many apps share them. A gap in one app is that app's bug; a gap in five is a hole in the category.

## 01 · Paywalled too aggressively — 119.6 · 5 of 7 apps

19 complaints and requests, mean pain 1.89 / 4, 11 of them explicit requests. The category's monetisation has outrun its free tier.

> "$5.99 a week or $99.99 a year. Without paying one of those, you are limited to only 5 free habits."
> — Productive — Habit Tracker

## 02 · Crashes and bugs — 67.2 · 3 of 7 apps

11 mentions at the highest pain in the set, 2.36 / 4. Fewer apps, angrier users — reliability is where the leaders are losing people.

> "It deleted my habits twice. I uninstalled and downloaded again to fix it and it still deleted my habits after a month or two."
> — Habit Tracker — Daily Goals

## 03 · Sync and backup — 51.0 · 4 of 7 apps

9 mentions, pain 1.89 / 4. Cross-device state is table stakes and four of seven apps are failing it.
`;
