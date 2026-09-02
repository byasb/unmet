// Single swap point: every screen consumes these hooks. This file used to
// return static data from ./mock; it now talks to the real Convex backend
// (convex/cockpit.ts, convex/pipeline.ts, convex/pulse.ts, convex/replies.ts).
//
// Real queries return `undefined` while loading and `null` when the row
// doesn't exist -- screens must handle both (see each screen's guard near
// the top of its render).
import { useEffect, useMemo, useState } from "react";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { SourceCode } from "./types";

type PulseGap = Doc<"gaps"> & { inYourReviews: boolean; totalPlaces: number };

function skip<T extends Record<string, unknown>>(cond: boolean, args: T) {
  return cond ? args : ("skip" as const);
}

// google_maps* -> "G", yelp* -> "Y", tripadvisor* -> "T", opentable* -> "O".
// apple_app_store reviews have no platform badge in the design, default "G".
export function toSourceCode(source: string | undefined): SourceCode {
  if (source === "yelp") return "Y";
  if (source === "tripadvisor") return "T";
  if (source === "opentable") return "O";
  return "G";
}

// api.cockpit.run
export function useRun(runId: string | undefined) {
  const run = useQuery(api.cockpit.run, skip(!!runId, { runId: runId as Id<"runs"> }));
  return useMemo(() => {
    if (!run) return run; // undefined (loading) or null (not found) pass through
    // Schema has no `mode` column (see BUILD-PLAN's runs table) -- derive the
    // live/offline-replay badge the design wants from the call counters.
    return { ...run, mode: (run.liveCalls ?? 0) > 0 ? ("live" as const) : ("offline replay" as const) };
  }, [run]);
}

// api.cockpit.calls -- the Reading screen's streaming subscription
export function useCalls(runId: string | undefined) {
  return useQuery(api.cockpit.calls, skip(!!runId, { runId: runId as Id<"runs"> }));
}

// api.cockpit.gaps (build, keyed by runId) / api.cockpit.pulseGaps (pulse,
// keyed by businessId -- for a pulse run, `run.term` IS the businessId, see
// pulse.ts's createRun). Overloaded so a call site passing the "pulse"
// literal gets the pulseGaps shape (inYourReviews/totalPlaces) instead of
// the union of both branches.
export function useGaps(kind: "build", id: string | undefined): Doc<"gaps">[] | undefined;
export function useGaps(kind: "pulse", id: string | undefined): PulseGap[] | undefined;
export function useGaps(kind: "build" | "pulse", id: string | undefined): any {
  const buildGaps = useQuery(api.cockpit.gaps, skip(kind === "build" && !!id, { runId: id as Id<"runs"> }));
  const pulseGaps = useQuery(
    api.cockpit.pulseGaps,
    skip(kind === "pulse" && !!id, { businessId: id as Id<"businesses"> }),
  );
  return kind === "build" ? buildGaps : pulseGaps;
}

// BuildBoard's "apps read" panel -- pipeline.runBuild stores the apps it
// found straight on the run doc (schema.ts's comment on `runs.apps`).
export function useAppsRead(runId: string | undefined) {
  const run = useRun(runId);
  return useMemo(() => {
    if (run === undefined) return undefined;
    if (run === null) return null;
    return (run.apps ?? []).map((a: any) => ({
      name: a.title ?? String(a.id ?? "Unknown"),
      rating: a.rating ?? 0,
      ratingsCount: a.rating_count,
      cached: true,
    }));
  }, [run]);
}

// PulseBoard's "places read" panel -- you + peers, from the business doc.
// ponytail: no per-place rating/review-count on `businesses` (that lives in
// reviews/gaps rows, not aggregated anywhere yet) -- rendered as 0 until a
// real aggregate query exists.
export function usePlacesRead(businessId: string | undefined) {
  const business = useBusiness(businessId);
  return useMemo(() => {
    if (business === undefined) return undefined;
    if (business === null) return null;
    return [
      { name: business.name, rating: 0, isYou: true },
      ...business.peers.map((p: { title: string }) => ({ name: p.title, rating: 0, isYou: false })),
    ];
  }, [business]);
}

// run.demand rows come from engines.trendQueries as {query, value} (see
// engines.ts) -- the design's DemandTerm shape names them {term, value}.
export function useDemand(runId: string | undefined) {
  const run = useRun(runId);
  if (run === undefined) return undefined;
  if (run === null) return null;
  return (run.demand ?? []).map((d: any) => ({ term: d.query ?? d.term ?? "", value: Number(d.value) || 0 }));
}

export function useBrief(runId: string | undefined) {
  const run = useRun(runId);
  if (run === undefined) return undefined;
  if (run === null) return null;
  return run.brief ?? "";
}

// api.cockpit.businesses -- demo scope, every authenticated user sees every
// business (see cockpit.ts's ponytail note).
export function useBusinesses() {
  return useQuery(api.cockpit.businesses, {});
}

// No id -> first business (PulseHome's "pick the first business" rule).
export function useBusiness(businessId?: string) {
  const businesses = useBusinesses();
  return useMemo(() => {
    if (businesses === undefined) return undefined;
    if (!businessId) return businesses[0] ?? null;
    return businesses.find((b) => b._id === businessId) ?? null;
  }, [businesses, businessId]);
}

// api.cockpit.pulseHome
export function usePulseHome(businessId: string | undefined) {
  return useQuery(api.cockpit.pulseHome, skip(!!businessId, { businessId: businessId as Id<"businesses"> }));
}

// api.cockpit.drafts
export function useDrafts(businessId: string | undefined) {
  return useQuery(api.cockpit.drafts, skip(!!businessId, { businessId: businessId as Id<"businesses"> }));
}

// api.cockpit.experiments
export function useExperiments(businessId: string | undefined) {
  return useQuery(api.cockpit.experiments, skip(!!businessId, { businessId: businessId as Id<"businesses"> }));
}

// api.cockpit.aiAnswers
export function useAiAnswers(businessId: string | undefined) {
  return useQuery(api.cockpit.aiAnswers, skip(!!businessId, { businessId: businessId as Id<"businesses"> }));
}

// api.cockpit.quota -- Topbar renders on the (unauthenticated) Landing and
// SignIn screens too, and the query throws server-side without a session, so
// skip it entirely until Convex Auth confirms one.
export function useQuota() {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(api.cockpit.quota, skip(isAuthenticated, {}));
}

// api.cockpit.markActionDone / snoozeAction / setDraftStatus
export function useMarkActionDone() {
  return useMutation(api.cockpit.markActionDone);
}
export function useSnoozeAction() {
  return useMutation(api.cockpit.snoozeAction);
}
export function useSetDraftStatus() {
  return useMutation(api.cockpit.setDraftStatus);
}

// api.pipeline.runBuild
export function useRunBuild() {
  return useAction(api.pipeline.runBuild);
}

// api.pulse.runPulse
export function useRunPulse() {
  return useAction(api.pulse.runPulse);
}

// api.replies.draftReplies (convex/replies.ts, owned by the backend lead).
export function useDraftReplies() {
  return useAction(api.replies.draftReplies);
}

// api.pulse.morningCard -- run once per businessId, result held in state
// (it's an action with a live LLM call, not a reactive query).
export function useMorningHeadline(businessId: string | undefined) {
  const morningCard = useAction(api.pulse.morningCard);
  const [result, setResult] = useState<{ headline?: string; headlineFallback?: boolean } | undefined>(undefined);

  useEffect(() => {
    if (!businessId) {
      setResult(undefined);
      return;
    }
    let cancelled = false;
    setResult(undefined);
    morningCard({ businessId: businessId as Id<"businesses"> })
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch(() => {
        if (!cancelled) setResult({ headline: undefined, headlineFallback: true });
      });
    return () => {
      cancelled = true;
    };
    // morningCard's identity is stable per useAction; only re-run on businessId change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  return result;
}

// auth.signIn (Convex Auth Password provider)
export function useSignIn() {
  const { signIn } = useAuthActions();
  return async (email: string, password: string) => {
    await signIn("password", { email, password, flow: "signIn" });
    return { ok: true as const };
  };
}

export function useSignOut() {
  const { signOut } = useAuthActions();
  return signOut;
}
