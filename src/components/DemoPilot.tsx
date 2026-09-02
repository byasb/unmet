import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useBusinesses, useRunBuild, useRunPulse } from "../data/api";

// Autopilot for the demo: walks every screen on a timer and fires the two
// cached runs for real. Esc or the stop button ends it. Started by the
// Topbar's DEMO button (window event "unmet:demo-start").
type Step =
  | { to: string; dwell: number; note: string }
  | { action: "build" | "pulse"; dwell: number; note: string; waitFor: RegExp };

const STEPS: Step[] = [
  { to: "/", dwell: 3500, note: "Two doors, one engine" },
  { to: "/build", dwell: 2200, note: "Build · habit tracker" },
  { action: "build", dwell: 9000, note: "Build board · the users' own words", waitFor: /^\/build\/[^/]+$/ },
  { to: "/pulse", dwell: 2200, note: "Pulse · Stiles Switch BBQ, Austin" },
  { action: "pulse", dwell: 9000, note: "Pulse board · already hitting you", waitFor: /^\/pulse\/[^/]+$/ },
  { to: "/pulse/ai", dwell: 8000, note: "What Google's AI answer says" },
  { to: "/pulse/home", dwell: 8000, note: "Tomorrow morning's card" },
  { to: "/pulse/replies", dwell: 6000, note: "Reply desk · three checks, then a human" },
  { to: "/pulse/experiments", dwell: 5000, note: "Did the fix move the number" },
  { to: "/", dwell: 1500, note: "That's Unmet" },
];

export function DemoPilot() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const runBuild = useRunBuild();
  const runPulse = useRunPulse();
  const businesses = useBusinesses();
  const [step, setStep] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const waiting = useRef<RegExp | null>(null);
  const timer = useRef<number | null>(null);

  const stop = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    waiting.current = null;
    setStep(null);
  };

  useEffect(() => {
    const start = () => {
      window.dispatchEvent(new Event("unmet:show-guide"));
      setStep(0);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && stop();
    window.addEventListener("unmet:demo-start", start);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("unmet:demo-start", start);
      window.removeEventListener("keydown", key);
    };
  }, []);

  // Execute the current step.
  useEffect(() => {
    if (step === null) return;
    const s = STEPS[step];
    if (!s) {
      stop();
      return;
    }
    const advance = () => setStep((n) => (n === null ? null : n + 1));
    const dwellThen = (ms: number) => {
      setProgress(0);
      const t0 = Date.now();
      const tick = window.setInterval(() => setProgress(Math.min(1, (Date.now() - t0) / ms)), 100);
      timer.current = window.setTimeout(() => {
        window.clearInterval(tick);
        advance();
      }, ms);
      return () => window.clearInterval(tick);
    };
    if ("to" in s) {
      if (pathname !== s.to) navigate(s.to);
      return dwellThen(s.dwell);
    }
    // action steps: fire the run, then wait for the board route before dwelling
    waiting.current = s.waitFor;
    (async () => {
      try {
        if (s.action === "build") {
          const runId = await runBuild({ term: "habit tracker" });
          navigate(`/run/build/${runId}`);
        } else {
          const stiles = businesses?.find((b) => /stiles/i.test(b.name)) ?? businesses?.[0];
          if (!stiles) throw new Error("no business to pulse");
          const result = await runPulse({ businessId: stiles._id });
          navigate(`/run/pulse/${result.runId}`);
        }
      } catch (err) {
        console.error("[demo]", err);
        stop();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // When a run lands on its board, start that step's dwell.
  useEffect(() => {
    if (step === null || !waiting.current) return;
    if (!waiting.current.test(pathname)) return;
    waiting.current = null;
    const s = STEPS[step];
    setProgress(0);
    const t0 = Date.now();
    const tick = window.setInterval(() => setProgress(Math.min(1, (Date.now() - t0) / s.dwell)), 100);
    timer.current = window.setTimeout(() => {
      window.clearInterval(tick);
      setStep((n) => (n === null ? null : n + 1));
    }, s.dwell);
    return () => window.clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, step]);

  if (step === null || !STEPS[step]) return null;
  return (
    <div className="pilot" role="status">
      <span className="dot" />
      DEMO · {step + 1}/{STEPS.length} · {STEPS[step].note}
      <span className="bar">
        <i style={{ width: `${progress * 100}%` }} />
      </span>
      <button type="button" onClick={stop}>STOP · ESC</button>
    </div>
  );
}
