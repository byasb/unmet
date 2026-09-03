# Unmet

**Reviews in. Ranked gaps out. Built on nine SerpApi engines.**

Two doors, one engine.

- **Build** — type an App Store category. Unmet reads hundreds of reviews across the apps already
  ranking for it and shows the gaps none of them fill, with the users' own words as evidence.
- **Pulse** — name a kind of business and a place. Every morning Unmet reads this week's reviews across
  Google Maps, Yelp and TripAdvisor for the places like yours, ranks what's going wrong, tells you
  whether it's hit you yet, checks whether Google's AI answer cites you, prescribes actions from a
  playbook, drafts replies, and — next Monday — measures whether what you did moved the number.

SerpApi is the only data source. Every response is cached; the cost of every run is on screen.

Built for the DevNetwork [API + Cloud + AI] Hackathon 2026, SerpApi track. Solo build, AI-assisted.

Live: **https://unmet.byasb.com** · Source: https://github.com/byasb/unmet · Demo video (3:50): https://youtu.be/0ylqUzXVKJc

## The demo set

"You" is **Stiles Switch BBQ** — 6610 N Lamar, half a mile up the street from SerpApi's office. Peers:
Franklin, Terry Black's, Cooper's, Micklethwait, Iron Works, Brotherton's. 491 real reviews across three
platforms, pulled on Sep 2 2026.

The category's number-one gap is **dry, tough or bland meat** — 80 mentions, all seven places, all three
platforms. Stiles is hit on it, on value, and on cleanliness — the three actions on its morning card. Google's AI answer to *"is stiles switch
bbq worth it"* says it "rarely ranks as the absolute top brisket in Austin", citing Reddit, Yelp and
TripAdvisor. Same finding, two directions.

## Where SerpApi does the real work

| Engine | Role |
|---|---|
| `apple_app_store`, `apple_reviews` | Build: the ranking apps and their reviews, two sorts |
| `google_maps`, `google_maps_reviews` | Pulse: the places like yours, and their reviews |
| `yelp`, `yelp_reviews` | Pulse: the richest review source — 49 a call |
| `tripadvisor`, `tripadvisor_reviews` | Pulse: third platform, so a gap on all three is a fact, not a mood |
| `google` → `google_ai_overview` | Pulse: are you in Google's AI answer, and which sources did it lean on |
| `google_trends`, `google_autocomplete` | Both: is there search demand behind the gap, and how people phrase it |

Apple publishes no complaint API and Google's AI answer has no API at all. These engines are the only
practical way to read either programmatically.

## How the ranking works

```
score = mentions × pain × (1 + log₂ breadth)
```

- **mentions** — complaints and requests naming the theme; praise is excluded
- **pain** — mean (5 − stars) of those reviews
- **breadth** — how many *distinct* places or apps share it. A gap in one is that one's bug; a gap in
  seven is a hole in the category. There is a test asserting three places with one complaint each
  outrank one place with five.

Every number on screen comes from this function and a regex taxonomy. The model never writes a score.

## Where the model is, and isn't

Claude (Sonnet 5 via OpenRouter, Gemini Flash fallback, local template last) writes **words**: reply
drafts, the morning headline, and an optional re-label flagged `source: model` that is compared against
the regex, never trusted over it. Every draft passes a three-rule critic — names the specific issue, no
liability language, no promise of something you haven't started — and a human before it leaves. Every
model call is cached by input hash; a replayed demo makes zero model calls.

## What real data taught me

The taxonomy was written from memory — fourteen App Store releases and a restaurant — then run against
real reviews. Every category has vocabulary that looks exactly like a complaint:

- In a habit tracker, `add a` matched "add a habit" and `tracking` matched "tracking habits".
- In Austin barbecue, `dry` matched "dry rub" (praise), `cold` matched "cold beer" (praise), and "waited
  in line and it was worth it" is a five-star review.

All of these are regression tests now. None were visible until real data hit them.

## Run it

```bash
npm install
npx convex dev            # creates your deployment; set env vars in the dashboard:
                          #   SERPAPI_KEY, OPENROUTER_API_KEY, OFFLINE (1 to replay only)
npx @convex-dev/auth      # generates the auth keys
npm run dev
```

Sign in, then run **Build → habit tracker** (fully cached, zero live calls) or **Pulse → barbecue near
Austin** (cached for the seven-place set; live for anything else).

Tests: `npm test` — the ported analyzer tests, cache-key round-trip, critic rules, usage caps.

## Quota honesty

The free SerpApi plan is 250 searches a month. A fresh seven-place Pulse run is ~49 searches; ~35 daily
once the place lookups are cached. Judge accounts are capped at 30 live searches a day and drop to
replay past the cap — the run says so. `OFFLINE=1` forbids live calls entirely.

## Notes for SerpApi

What I'd ask for, having built on nine engines in three days:

1. **A Yelp place lookup by name that returns `place_ids` at the top level** — it's inside
   `organic_results[0].place_ids[0]` today, which took a fixture read to find.
2. **Review dates as ISO on every reviews engine** — Google Maps has `iso_date`, Yelp and TripAdvisor
   don't, and "did the fix move the number this week" depends on it.
3. **An OpenTable lookup** — the reviews engine needs an `rid` and there's no search to find one.
4. **A cheaper batch mode for reviews** — a daily habit product is ~330 searches per customer per
   month; most of those are the same seven places at 5am.
5. The AI Overview engine is the most interesting thing in the catalogue and almost nobody uses it.
   A worked example on "what Google says about a local business" would sell it.

## What's next

Cloudflare Durable Objects as per-business actors with their own alarms; the public gap-index pages;
Google Play alongside the App Store; OpenTable where the place is on it.

## Licence

MIT.
