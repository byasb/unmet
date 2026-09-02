// Mirrors BUILD-PLAN.md §Schema (convex/schema.ts). Frontend-only shapes for the
// mock data layer — field names match the future Convex documents so the swap
// in src/data/api.ts is mechanical.

export type RunKind = "build" | "pulse";
export type RunStatus = "queued" | "running" | "done" | "error";

export interface Run {
  _id: string;
  kind: RunKind;
  term: string;
  country?: string;
  location?: string;
  status: RunStatus;
  startedAt: number;
  finishedAt?: number;
  reviewCount: number;
  liveCalls: number;
  cachedCalls: number;
  mode: "live" | "offline replay";
}

export interface CallRow {
  _id: string;
  runId: string;
  engine: string;
  paramsSummary: string;
  live: boolean;
  ms: number | null;
  at: number;
}

export interface Quote {
  text: string;
  rating: number;
  place: string;
  source?: SourceCode;
  daysAgo?: number;
}

export type SourceCode = "G" | "Y" | "T" | "O";

export interface Gap {
  _id: string;
  runId: string;
  theme: string;
  label: string;
  mentions: number;
  requests?: number;
  pain: number;
  breadth: number;
  totalPlaces: number;
  score: number;
  apps: string[];
  quotes: Quote[];
  platforms?: SourceCode[];
  deltaWeek?: number;
  inYourReviews?: boolean;
  requestPhrases?: { text: string; count: number }[];
  dayOfWeek?: number[];
}

export interface AppRead {
  name: string;
  rating: number;
  ratingsCount?: number;
  cached?: boolean;
}

export interface PlaceRead {
  name: string;
  rating: number;
  reviewCount?: number;
  isYou?: boolean;
  deltaWeek?: number;
}

export interface DemandTerm {
  term: string;
  value: number;
}

export interface Business {
  _id: string;
  name: string;
  category: string;
  location: string;
  timezone: string;
}

export type ActionState = "today" | "carried" | "done" | "snoozed";

export interface ActionItem {
  _id: string;
  businessId: string;
  theme: string;
  title: string;
  why?: string;
  effort: string;
  cadence?: string;
  state: ActionState;
  prescribedAt: number;
  doneAt?: number;
  experimentId?: string;
  meta?: string;
  daysOpen?: number;
  progress?: string;
}

export type ExperimentVerdict = "measuring" | "moved" | "flat" | "too_few";

export interface Experiment {
  _id: string;
  businessId: string;
  actionId: string;
  theme: string;
  actionTitle: string;
  startedAt: number;
  baselineMentions: number;
  baselinePain: number;
  reads: { at: number; mentions: number; pain: number }[];
  verdict: ExperimentVerdict;
  note: string;
}

export type DraftStatus = "drafted" | "approved" | "skipped";

export interface CriticCheck {
  rule: string;
  pass: boolean;
  note?: string;
}

export interface Draft {
  _id: string;
  businessId: string;
  reviewId: string;
  reviewText: string;
  reviewSource: SourceCode;
  reviewRating: number;
  reviewer: string;
  daysAgo: number;
  themes: string[];
  text: string;
  tone: "warm" | "brief" | "formal";
  checks: CriticCheck[];
  status: DraftStatus;
  isPraise?: boolean;
}

export interface AiAnswer {
  _id: string;
  businessId: string;
  query: string;
  day: string;
  cited: boolean;
  position?: number;
  sources: { name: string; count: number }[];
  excerpt: string;
  named: { rank: number; name: string; note: string; isYou?: boolean }[];
  history: ("in" | "out" | "none")[];
}

export interface UsageInfo {
  used: number;
  limit: number;
  role: "admin" | "judge" | "viewer";
}

export interface WeekDay {
  label: string;
  date: string;
  newReviews: number;
  actionsDone: number;
  actionsTotal: number;
  isToday?: boolean;
}
