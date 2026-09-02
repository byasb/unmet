# Merge notes — Subagent B (auth + LLM + Pulse)

Written after A's files (schema.ts, serp.ts, cache.ts, cacheKey.ts, dedupe.ts, analyze.ts,
engines.ts, pipeline.ts, seed.ts, playbook.ts, critic.ts, serverApi.ts, tests/analyze.test.ts +
3 more test files) landed **concurrently, in the same working tree**, partway through this
session. Everything below reflects the actual state of both agents' files as of this write-up,
not a guess about what A would do. `npx tsc --noEmit -p tsconfig.backend.json` and
`npx vitest run` (the whole suite, both agents' tests) are clean: **0 type errors, 9 test files,
54 tests passing.**

## Files I own (all new)

`convex/auth.ts`, `convex/auth.config.ts`, `convex/http.ts`, `convex/llm.ts`, `convex/usage.ts`,
`convex/crons.ts`, `convex/pulse.ts`, `convex/engines.local.ts`, `convex/analyze.local.ts`,
`tests/llm.test.ts`, `tests/analyze.local.test.ts`, `tests/usage.test.ts`, this file.

**Two files beyond the original list**, added for the same reason A split `cacheKey.ts` and
`dedupe.ts` out of `serp.ts` (its own header comment: "must be importable from a plain vitest
run with no deployment"):

- `convex/usageRules.ts` — pure quota logic (`canSpend`, `todayKey`, `LIVE_CAPS`). `usage.ts`
  wraps it with the actual `internalQuery`/`internalMutation` db access. Any file that imports
  `internalQuery`/`internalMutation` as *values* (not `import type`) cannot be imported by vitest
  before `_generated` exists, full stop — `import type` is erased by esbuild and is safe, a value
  import is not. `tests/usage.test.ts` imports `usageRules.ts` directly.
- `convex/llmCore.ts` — pure OpenRouter orchestration (`completeCore`, `deriveKey`,
  `localTemplate`, the message builders). `llm.ts` wraps it with the real cache
  reads/writes and real `fetch`. `tests/llm.test.ts` imports `llmCore.ts` directly and mocks
  `fetch` + an in-memory cache.
- One more test file beyond the list, for the same reason: **`tests/engines.local.test.ts`**.
  Deliverable 5 explicitly asked for "a test that loads the cached google_maps fixture for
  barbecue and asserts Stiles Switch is in it with the data_id from ENGINE-NOTES" — that test
  needed a file, and it wasn't in the ownership list, so I added it.

`convex/pulse.ts` and `convex/crons.ts` needed no such split — they're actions/mutations/queries
through and through, never imported by a test.

## 1. Convex Auth

`schema.ts` **already had** `...authTables` and the `role` field on `users` when I read it — A
built it in from the start, so there is nothing for A to add here. Good.

`convex/auth.ts` exports `{ auth, signIn, signOut, store, isAuthenticated }` from a single
`Password` provider (`profile()` sets `role: "viewer"` and `createdAt` on sign-up), plus
`requireUser(ctx)` / `requireRole(ctx, ...roles)` for queries/mutations. Actions can't use these
(no `ctx.db`) — see pulse.ts's `requireActionUser`, which does the equivalent via
`getAuthUserId(ctx)` + an internal query for the role.

**Env vars Ankit needs to set** (Convex dashboard, or `npx convex env set`):

- `SERPAPI_KEY`, `OPENROUTER_API_KEY`, `OFFLINE` — already documented in BUILD-PLAN.md.
- Auth needs three more, normally written by running **`npx @convex-dev/auth`** once (it's an
  interactive setup wizard, not something a subagent should run):
  - `SITE_URL` — the deployed frontend origin (e.g. the Vite dev URL or the production domain).
  - `JWT_PRIVATE_KEY` and `JWKS` — an RS256 keypair the wizard generates and pushes with
    `npx convex env set`. Without these, sign-in/sign-up actions throw `requireEnv("...")` errors
    at call time (verified by reading `@convex-dev/auth`'s compiled source — see
    `node_modules/@convex-dev/auth/dist/server/implementation/tokens.js` and
    `.../redirects.js`).
  - `CONVEX_SITE_URL` is set automatically by the deployment itself — never set this one by hand
    (see the comment in `auth.config.ts`).

**Judge account**: no signup UI restricts role, so the simplest path is: sign up normally
(defaults to `viewer`), then open the Convex dashboard's Data tab and change that user's `role`
to `"judge"` (30 live searches/day) or `"admin"` (uncapped). There's no self-serve promotion
flow in v1 — flagged, not built, since nothing in BUILD-PLAN asked for one.

## 2. `convex/usage.ts` + `convex/usageRules.ts`

`LIVE_CAPS = { admin: null, judge: 30, viewer: 0 }`. `canSpend(role, used, n)` and `todayKey()`
are pure and unit-tested directly. `usage.ts` adds `getUsage`, `canSpendLive`, `recordLive`,
`recordTokens` (internal query/mutations, `by_user_day` index). `recordTokens` exists (the table
has a `tokens` column) but **nothing calls it yet** — `llm.complete`'s signature per the brief
(`{messages, purpose}`) carries no `userId`, so token accounting per user isn't wired. If that
matters for the demo, the natural place to add it is `pulse.ts`'s `runComplete`-adjacent call
sites, once there's a `userId` in scope there (there is, in `runPulse`/`executePulse` — it would
take one `ctx.runMutation(internal.usage.recordTokens, ...)` call after `cardHeadline`/
`draftReply` if OpenRouter ever returns token counts we want to track). Left undone: not asked
for by name, and the demo doesn't need a running-total to work.

## 3. `convex/llm.ts` + `convex/llmCore.ts`

`completeCore` is cache-first (sha256 of `model + JSON.stringify(messages)`), POSTs to
OpenRouter with `model: "anthropic/claude-sonnet-5"` and `models: ["google/gemini-3.5-flash"]`,
marks the first (system) message `cache_control: {type: "ephemeral"}` for Anthropic prompt
caching, and **never throws** — any failure (no key, network error, non-2xx, empty completion)
returns `{text: localTemplate(...), fallback: true}`. `draftReply(ctx, review, themes, tone,
startedActions)` and `cardHeadline(ctx, summary)` build on it. All three
`tests/llm.test.ts` requirements are covered: cache hit skips fetch, non-2xx falls back to
template, key derivation is stable (and changes when model or messages change).

One thing to watch: **A's `convex/critic.ts` already has a comment naming this integration**
("`llm.ts` (Subagent B) drafts the text; this only ever grades it.") and imports `THEMES,
LOCAL_THEMES` from `./analyze` (its own file) for keyword matching — it does not import
anything from `llm.ts` directly, so there's no live coupling to verify, but the two files agree
on the contract.

## 4. `convex/analyze.local.ts` — **the taxonomy divergence, read this one**

I ported `LOCAL_THEMES`, `LOCAL_REQUEST`, `classifyLocal`, `evidenceLocal`, `rankGapsLocal`
verbatim from `unmet/app/analyze.py`'s `taxonomy="local"` path (12 themes: lines_wait, sold_out,
value, meat_quality, sides, staff, consistency, cleanliness, parking, seating, takeout, billing).
Both Python tests I was asked to port
(`test_local_taxonomy_ignores_barbecue_praise_vocabulary`, `test_local_taxonomy_scores_with_the_
same_engine`) pass against this port, plus a third I added for `lines_wait` coverage.

**A's `convex/analyze.ts` also has a `LOCAL_THEMES` export, and it is a stale placeholder**:
10 keys (`lines_wait, sold_out, price_portion, staff, consistency, cleanliness, parking,
delivery, noise, used_to_be_better`), every regex source is `""` (an empty string — `new
RegExp("", "i")` matches *every* string), and the comment above it says `FABLE: fill after
Austin pull`. The Austin pull already happened (ENGINE-NOTES.md, Sep 2 2026) and the real
regexes are in the Python file — this stub was written before that, and nobody has gone back to
fill it in. **`convex/pulse.ts` never imports A's `LOCAL_THEMES`** — it only ever imports
`./analyze.local` — so Pulse itself is unaffected. But if `pipeline.ts` or anything else Pulse-
related ever imports `LOCAL_THEMES` from `./analyze` expecting real regexes, every review will
match every theme silently (empty pattern = universal match) with no error to catch it.
**Recommended fix**: delete `LOCAL_THEMES` from `analyze.ts` (it's Build-only in the original
BUILD-PLAN layout anyway) and have anyone who needs the Pulse taxonomy import from
`analyze.local.ts` instead, which is the one that's actually filled in and tested.

Also note: A's `analyze.ts` exports a function also named `classifyLocal` (for the *Build*
taxonomy, generic-typed `<T extends Review>`) — same name, different taxonomy, different file.
Not a runtime collision (different modules), but a naming trap for whoever writes `pipeline.ts`
imports later: `import { classifyLocal } from "./analyze"` and `import { classifyLocal } from
"./analyze.local"` need aliasing if ever used in the same file.

`rankGaps` in `analyze.ts` does **not** take a `taxonomy` parameter (it's hardcoded to the Build
`THEMES`/`COMPILED`), so per the brief's fallback instruction I wrote `rankGapsLocal` with the
identical formula (mentions × pain × (1 + log2(breadth))) rather than trying to force a taxonomy
argument onto A's function. This is the "note the duplication for later unification" case the
brief anticipated. Unifying them later is straightforward (parameterize `analyze.ts`'s internals
on a `{themes, compiled, request}` bundle) but out of scope for either of us right now.

## 5. `convex/engines.local.ts` — **also duplicated, and this one has a real bug in the other copy**

Wrappers take an injected `call: (engine, params) => Promise<any>` rather than importing
`convex/serp.ts` directly, so they're testable against fixtures with no deployment. `pulse.ts`
adapts A's real `serp.call(ctx, runId, params)` into that shape via `makeCallFn`, which also
enforces the per-role live-search cap (a cache hit is free; a live fetch beyond the daily cap
throws `QuotaExceeded` and the caller skips that source gracefully).

**`convex/engines.ts` (A's file) already has functions with the same six names**
(`googleMaps`, `googleMapsReviews`, `yelpSearch`, `yelpReviews`, `tripadvisorSearch`,
`tripadvisorReviews`) plus `openTableReviews` and `aiOverview` — but every one of them is a stub
that throws `"TODO(Fable): ... -- wire up after the Austin pull"`. Nothing currently calls them
(`pipeline.ts`'s `runBuild` only touches the Build engines), so there's no live conflict, but
whoever wires Pulse into `pipeline.ts` will find two implementations. **Recommended**: delete
the six stub functions from `engines.ts` and have that code import from `engines.local.ts`
instead (adapting the same way `pulse.ts`'s `makeCallFn` does), since `engines.local.ts` is
fixture-verified and working, not a stub.

**The bug**, found empirically while writing `tests/engines.local.test.ts`: the cached Austin
`google_maps` fixture (`fixtures/google_maps-74c7994c39cfea95.json`) was fetched with params
`{engine, type: "search", q: "barbecue", ll: "@30.3178,-97.7318,12z", hl: "en"}` — **no
`google_domain`**. `cacheKey()` is a straight hash of the params object, so adding *any* extra
field (I first wrote `google_domain: "google.com"` myself, by habit) changes the hash and misses
the cache entirely, forcing a live fetch outside `OFFLINE` mode. I verified every other engine's
exact param set the same way (computing `cacheKey()` against candidate param objects and
diffing against the real fixture filenames) — `google_maps_reviews`, `yelp`, `yelp_reviews`,
`tripadvisor`, `tripadvisor_reviews` and `google` (for AI Overview) were all already correct on
the first try; only `google_maps` needed the fix, which is in the file now. **If `engines.ts`'s
stubs ever get filled in instead of deleted, whoever does it should re-derive each engine's exact
param set the same way** (`node -e "import('./convex/cacheKey.ts').then(...)"`,  comparing
against `fixtures/<engine>-<hash>.json`) rather than guessing from SerpApi's docs — the echoed
`search_parameters` in a fixture's response includes SerpApi's own defaults (`google_domain`,
`device`, `hl`, `num`, `start`, `tripadvisor_domain`, `offset`, `limit` all showed up in echoed
responses that were **not** part of the actual request), so copying that dict verbatim gets the
cache key wrong.

## 6. `convex/pulse.ts`

`runPulse` (public action), `runPulseScheduled` (internal action, cron entry point),
`morningCard` (public action), `measureExperiments` (internal action). All DB access is through
internal queries/mutations defined in this file; the actions themselves never call `ctx.db`.

Design notes worth knowing about:

- **`runs` has no `businessId` column.** Pulse idempotency (BUILD-PLAN Rules #6: "Pulse run id =
  businessId + day") is implemented by setting `term = businessId` (a string, which `Id<...>` is
  structurally) on pulse-kind runs and reusing the existing `by_kind_term` index, rather than
  adding a column to a shared schema file I don't own. `createRun` reuses today's run for a
  business even if its `status` is `"error"` (doesn't retry) — flagged as a known gap, not built,
  since it wasn't clear a retry path was worth the complexity for a hackathon demo.
- **`businesses.peers` is `v.array(v.string())` with no name field.** I encode each peer as
  `"<title>::<dataId>"` and decode on read (`encodePeer`/`decodePeer` in pulse.ts). This avoids
  either a schema change or a second `googleMaps` call every run just to recover competitor
  names. If the schema ever grows a proper `{name, placeId}` shape for peers, switch to that.
- **Discovery reconstructs the real Austin 7-place set without hardcoding it.** `discoverPlaces`
  calls `googleMaps({q: category, ll})`, takes the top 10 results by position, matches "you" by
  a case-insensitive substring of the business name, and takes the next 6 (by position) as
  peers. Checked against `fixtures/google_maps-74c7994c39cfea95.json`: Stiles Switch (pos 5),
  Terry Black's (1), Franklin (3), Iron Works (6), Cooper's (8), Brown's (9), Micklethwait (10)
  are exactly the top 10 minus one irrelevant result — this reproduces ENGINE-NOTES.md's 7-place
  table exactly. `ll` defaults to Austin's (`@30.3178,-97.7318,12z`) since v1 only demos one
  city — pass `ll` explicitly for anywhere else; there's no geocoder.
- **`prescribeLocal` wraps A's real `convex/playbook.ts`.** This started the session as a
  placeholder (`playbook.ts` didn't exist yet when I wrote `pulse.ts`'s first draft) and A's file
  landed complete and correct partway through — same theme keys as `analyze.local.ts`'s real
  taxonomy, unlike `analyze.ts`'s stub (see §4). I swapped the placeholder out for
  `fillPlaybook(gap)` once I could read it; `cadence` is dropped from its output since the
  `actions` table has no such column.
- **`google_domain`/`device`/etc. omission** — see §5's fixture-param note; the same pattern
  applies to every `call(...)` site inside `pulse.ts` via `engines.local.ts`, not just discovery.
- Sequential, not parallelized, per-place review pulls inside `Promise.all` (one promise per
  place, three-source pull each) — fine at 7 places; would need a concurrency cap well before it
  became a real business's scale.

`morningCard` gathers today/carried actions, done-this-week count, the latest run's top gaps
(with week-over-week trend against the previous run), and whether any of today's AI Overview
answers cited the business, then asks `cardHeadline` for a one-line summary (falls back to a
local template on any LLM failure, same as everything else in `llm.ts`).

`measureExperiments`: recomputes `mentions`/`pain` for each `"measuring"` experiment's theme from
its business's latest **done** run, appends a `{at, mentions, pain}` read, and sets verdict —
`too_few` if `mentions < 5`; `moved` if mentions dropped ≥30% or pain dropped ≥0.5 vs baseline;
`flat` if this read is within ±15% of the previous read (or baseline, if there is no previous
read); else stays `"measuring"`. `experimentVerdict` is exported as a plain function (not
Convex-wrapped) in case anyone wants to unit test it later — I didn't add a test file for it
since it wasn't in the deliverable list and needs a live deployment to exercise end-to-end
anyway (it reads `gaps`/`experiments` via `ctx.db`).

## 7. `convex/crons.ts`

Three jobs: `pulse daily run` (10:00 UTC ≈ 05:00 Austin CDT — **one fixed UTC hour for every
business, not per-timezone**, even though `businesses.timezone` is stored; a real fix needs
either one cron per distinct timezone in use or an hourly tick that checks each business's local
hour, and v1 only demos one city so it wasn't worth building), `pulse monday measure` (Monday
10:30 UTC, calls `internal.pulse.measureExperiments`), and `serp cache purge` (04:00 UTC, deletes
expired `serp_cache` rows via a `.filter` scan — no index on `expiresAt`, fine at hackathon
scale, add one if `serp_cache` ever grows past a few thousand rows).

## `_generated/` now exists — a heads-up for A's `serverApi.ts`

`.env.local` already has `CONVEX_DEPLOYMENT`/`VITE_CONVEX_URL` set (Ankit must have run
`npx convex dev` to log in while both of us were working), so I ran
`npx convex codegen --typecheck enable` myself to get a real `convex/_generated/` and verify
everything end to end — it exited 0 with the whole project (both agents' files) included, and
that's the codegen output all the type-check numbers above come from. **This makes A's
`convex/serverApi.ts` hand-written shim obsolete** — its own header comment says exactly this
("Once Ankit runs `npx convex dev` for real, ... switch every `from './serverApi'` import ... to
the matching `from './_generated/...'` import and delete this file"). A's `serp.ts`, `cache.ts`,
and `pipeline.ts` still import from `./serverApi`, which still typechecks fine (it's a type-only
shim over the same `convex/server` builder functions the real generated file uses), so nothing is
broken — but it's now safe, and probably worth doing, to make that swap and delete `serverApi.ts`.
I didn't do it myself since `serp.ts`/`cache.ts`/`pipeline.ts` aren't mine to edit.

Also note for whoever runs `npx convex dev` next: it will regenerate `_generated/` again anyway,
so nothing here needs to survive by hand — I'm calling it out only so the "why does `_generated`
already exist" question doesn't cause confusion later.

## Verification run

```
$ npx tsc --noEmit -p .                       # only checks src/ (app+node refs) -- clean, but N/A to convex/
$ npx tsc --noEmit -p tsconfig.backend.json   # the actually-relevant one: convex/**, tests/**
  -> 0 errors
$ npx convex codegen --typecheck enable       # full project incl. both agents' files, exit 0
$ npx vitest run
  Test Files  9 passed (9)
       Tests  54 passed (54)
```

The 9 files: my 4 (`llm`, `analyze.local`, `usage`, `engines.local`) + A's 5 (`analyze`,
`cacheKey`, `critic`, `dedupe`, `serp`).

## What's not done / explicitly out of scope

- No live SerpApi or OpenRouter calls were made at any point (per the brief) — everything above
  was verified against cached fixtures and mocked fetch.
- No `tests/pulse.test.ts` or `tests/crons.test.ts` — neither was in the deliverable list, and
  both need a real deployment (`ctx.db`, `ctx.scheduler`) to exercise meaningfully; `vitest` can't
  run them without one.
- `recordTokens` (usage.ts) is unused — see §2.
- Per-business-timezone cron scheduling — see §7.
- Retrying an `"error"`-status Pulse run same-day — see §6's `createRun` note.
- Judge/admin role promotion has no UI — manual dashboard edit only, see §1.
