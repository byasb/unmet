import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Convex Auth owns everything under authTables (accounts, sessions, etc).
// `users` is inlined rather than spread so we can add `role` and `createdAt` —
// see https://labs.convex.dev/auth/setup/schema.
const roleValidator = v.union(
  v.literal("admin"),
  v.literal("judge"),
  v.literal("viewer"),
);

const quoteValidator = v.object({
  text: v.string(),
  rating: v.optional(v.number()),
  place: v.string(),
});

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: roleValidator,
    createdAt: v.number(),
  }).index("email", ["email"]),

  // engine + sorted params (minus api_key) -> raw SerpApi response. See
  // convex/cacheKey.ts for the hash derivation.
  serp_cache: defineTable({
    key: v.string(),
    engine: v.string(),
    params: v.any(),
    response: v.any(),
    storageId: v.optional(v.id("_storage")),
    fetchedAt: v.number(),
    expiresAt: v.optional(v.number()),
    source: v.union(v.literal("live"), v.literal("fixture")),
    createdAt: v.number(),
  }).index("by_key", ["key"]),

  runs: defineTable({
    kind: v.union(v.literal("build"), v.literal("pulse")),
    term: v.string(),
    country: v.optional(v.string()),
    location: v.optional(v.string()),
    userId: v.id("users"),
    status: v.union(
      v.literal("running"),
      v.literal("done"),
      v.literal("error"),
    ),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    liveCalls: v.optional(v.number()),
    cachedCalls: v.optional(v.number()),
    error: v.optional(v.string()),
    // Build-run display data (BuildBoard, the Brief screen). Not in the
    // BUILD-PLAN schema table verbatim, but cheap to keep and avoids
    // recomputing writeBrief()'s inputs (apps/demand snapshot) on reload.
    apps: v.optional(v.array(v.any())),
    brief: v.optional(v.string()),
    demand: v.optional(v.array(v.any())),
    phrasing: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_kind_term", ["kind", "term"]),

  // The cockpit's Reading screen subscribes to this by runId to stream rows
  // as a run progresses.
  calls: defineTable({
    runId: v.id("runs"),
    engine: v.string(),
    paramsSummary: v.string(),
    live: v.boolean(),
    ms: v.number(),
    at: v.number(),
    createdAt: v.number(),
  }).index("by_run", ["runId"]),

  reviews: defineTable({
    runId: v.id("runs"),
    source: v.string(),
    placeId: v.string(),
    hash: v.string(),
    title: v.optional(v.string()),
    text: v.optional(v.string()),
    rating: v.optional(v.number()),
    author: v.optional(v.string()),
    date: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_run", ["runId"])
    // Unique by convention: check (runId, placeId, hash) before insert
    // rather than relying on a DB constraint Convex doesn't have.
    .index("by_place_hash", ["runId", "placeId", "hash"]),

  gaps: defineTable({
    runId: v.id("runs"),
    theme: v.string(),
    label: v.string(),
    mentions: v.number(),
    requests: v.number(),
    pain: v.number(),
    breadth: v.number(),
    score: v.number(),
    apps: v.array(v.string()),
    quotes: v.array(quoteValidator),
    platforms: v.optional(v.array(v.string())),
    createdAt: v.number(),
  }).index("by_run", ["runId"]),

  businesses: defineTable({
    userId: v.id("users"),
    name: v.string(),
    placeId: v.string(),
    category: v.string(),
    location: v.string(),
    peers: v.array(v.string()),
    // The street: coordinates + counters for you and every peer, from the
    // google_maps result that discovered them (no other geo source).
    geo: v.optional(
      v.array(
        v.object({
          title: v.string(),
          dataId: v.string(),
          lat: v.number(),
          lng: v.number(),
          rating: v.optional(v.number()),
          reviews: v.optional(v.number()),
          isYou: v.boolean(),
        }),
      ),
    ),
    timezone: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  actions: defineTable({
    businessId: v.id("businesses"),
    theme: v.string(),
    title: v.string(),
    why: v.string(),
    effort: v.string(),
    state: v.union(
      v.literal("today"),
      v.literal("carried"),
      v.literal("done"),
      v.literal("snoozed"),
    ),
    prescribedAt: v.number(),
    doneAt: v.optional(v.number()),
    experimentId: v.optional(v.id("experiments")),
    createdAt: v.number(),
  }).index("by_business_state", ["businessId", "state"]),

  experiments: defineTable({
    businessId: v.id("businesses"),
    actionId: v.id("actions"),
    theme: v.string(),
    baselineMentions: v.number(),
    baselinePain: v.number(),
    startedAt: v.number(),
    reads: v.array(
      v.object({ at: v.number(), mentions: v.number(), pain: v.number() }),
    ),
    verdict: v.union(
      v.literal("measuring"),
      v.literal("moved"),
      v.literal("flat"),
      v.literal("too_few"),
    ),
    createdAt: v.number(),
  }).index("by_business", ["businessId"]),

  drafts: defineTable({
    businessId: v.id("businesses"),
    reviewId: v.id("reviews"),
    text: v.string(),
    tone: v.string(),
    checks: v.array(
      v.object({ rule: v.string(), pass: v.boolean(), note: v.string() }),
    ),
    status: v.union(
      v.literal("drafted"),
      v.literal("approved"),
      v.literal("skipped"),
    ),
    createdAt: v.number(),
  }).index("by_business_status", ["businessId", "status"]),

  ai_answers: defineTable({
    businessId: v.id("businesses"),
    query: v.string(),
    day: v.string(),
    cited: v.boolean(),
    position: v.optional(v.number()),
    sources: v.array(v.object({ name: v.string(), count: v.number() })),
    excerpt: v.string(),
    createdAt: v.number(),
  }).index("by_business_day", ["businessId", "day"]),

  // SerpApi's own account counters (account.json), polled hourly so the quota
  // badge is the real number, not this app's guess.
  serp_account: defineTable({
    searchesPerMonth: v.number(),
    thisMonthUsage: v.number(),
    planSearchesLeft: v.number(),
    fetchedAt: v.number(),
    createdAt: v.number(),
  }),

  llm_cache: defineTable({
    key: v.string(),
    model: v.string(),
    output: v.string(),
    createdAt: v.number(),
  }).index("by_key", ["key"]),

  usage: defineTable({
    userId: v.id("users"),
    day: v.string(),
    liveSearches: v.number(),
    tokens: v.number(),
    createdAt: v.number(),
  }).index("by_user_day", ["userId", "day"]),
});
