// Single swap point: every screen consumes these hooks, never src/data/mock.ts
// directly. Each hook currently returns mock data; the comment above it names
// the Convex function that will replace the body once convex/ is wired up.
// ponytail: no loading/error union yet (mock data is always "ready") — add
// once the real useQuery/useAction results can be pending or errored.

import { useMemo } from "react";
import type { UsageInfo } from "./types";
import {
  BUILD_APPS,
  BUILD_BRIEF_MARKDOWN,
  BUILD_CALLS,
  BUILD_DEMAND,
  BUILD_GAPS,
  BUILD_RUN,
  PULSE_ACTIONS_CARRIED,
  PULSE_ACTIONS_DONE,
  PULSE_ACTIONS_TODAY,
  PULSE_AI_ANSWERS,
  PULSE_BUSINESS,
  PULSE_CALLS,
  PULSE_DRAFTS,
  PULSE_EXPERIMENTS,
  PULSE_GAPS,
  PULSE_PLACES,
  PULSE_RUN,
  PULSE_WEEK,
  READING_APPS_FOUND,
  READING_CALLS,
} from "./mock";

// api.runBuild / api.runPulse (query on runs by _id)
export function useRun(runId: string | undefined) {
  return useMemo(() => {
    if (runId === PULSE_RUN._id) return PULSE_RUN;
    return BUILD_RUN;
  }, [runId]);
}

// api.calls.listByRun (subscribed query — the Reading screen streams this)
export function useCalls(runId: string | undefined) {
  return useMemo(() => {
    if (runId === PULSE_RUN._id) return PULSE_CALLS;
    if (runId === BUILD_RUN._id) return BUILD_CALLS;
    return READING_CALLS;
  }, [runId]);
}

// api.gaps.listByRun
export function useGaps(kind: "build" | "pulse") {
  return kind === "build" ? BUILD_GAPS : PULSE_GAPS;
}

// api.engines.appsRead / api.engines.placesRead (side panel on the boards)
export function useAppsRead() {
  return BUILD_APPS;
}
export function usePlacesRead() {
  return PULSE_PLACES;
}
export function useDemand() {
  return BUILD_DEMAND;
}
export function useReadingAppsFound() {
  return READING_APPS_FOUND;
}

// api.businesses.get
export function useBusiness() {
  return PULSE_BUSINESS;
}

// api.pipeline.morningCard (PulseHome)
export function usePulseHome() {
  return useMemo(
    () => ({
      business: PULSE_BUSINESS,
      today: PULSE_ACTIONS_TODAY,
      carried: PULSE_ACTIONS_CARRIED,
      done: PULSE_ACTIONS_DONE,
      week: PULSE_WEEK,
      gapsHitting: 3,
      gapsTotal: 5,
    }),
    [],
  );
}

// api.drafts.listByBusinessStatus
export function useDrafts() {
  return PULSE_DRAFTS;
}

// api.experiments.listByBusiness
export function useExperiments() {
  return PULSE_EXPERIMENTS;
}

// api.aiAnswers.listByBusinessDay
export function useAiAnswers() {
  return PULSE_AI_ANSWERS;
}

// api.usage.quota (per-user daily cap + SerpApi remaining quota)
export function useQuota(): UsageInfo {
  return { used: 219, limit: 250, role: "admin" };
}

// api.brief.render (BuildBoard -> Brief)
export function useBrief() {
  return BUILD_BRIEF_MARKDOWN;
}

// auth.signIn (Convex Auth Password provider) — resolves/rejects like the
// real action will; UI just needs the shape today.
export function useSignIn() {
  return async (_email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 300));
    return { ok: true as const };
  };
}
