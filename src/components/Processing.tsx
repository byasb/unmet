import { useEffect, useState } from "react";

// Full-screen "something is happening" overlay for the seconds between
// pressing Run and the run existing (the action returns only when it's done).
// Deterministic rotation, real product lines, no model call.
const LINES: Record<"build" | "pulse" | "replies", string[]> = {
  build: [
    "Reading the reviews so you don't have to. Thumb saved.",
    "Skipping every \"great app!!!\" — nothing to learn there.",
    "\"Add a habit\" is not a feature request. We checked.",
    "Asking SerpApi nicely. It always says yes.",
    "Cache hit. That one was free.",
    "Two sorts: recent for the mood, helpful for the grievances.",
    "Same rant on two apps, counted once.",
    "Scoring: mentions × pain × how many apps share it.",
    "Centering the quote on the sentence that hurt.",
    "The model never writes a score. Not even a little one.",
    "Checking whether anyone actually searches for this.",
    "Turning complaints into a roadmap. Yours.",
  ],
  pulse: [
    "Finding the places like yours. The busy ones.",
    "Google Maps, then Yelp, then TripAdvisor. Three witnesses.",
    "\"Dry rub\" is praise. \"Dry brisket\" is not. We know the difference.",
    "\"Cold beer\" is five stars. \"Cold brisket\" is one.",
    "Waiting in line at Franklin. Worth it, apparently.",
    "Yelp gives 49 a call. Generous.",
    "Cache hit. That one was free.",
    "Same rant on two platforms, counted once.",
    "Asking Google's AI answer whether it knows your name.",
    "Scoring: mentions × pain × how many places share it.",
    "Reading the playbook. The one written by someone who runs a place.",
    "Turning this week's complaints into tomorrow's card.",
  ],
  replies: [
    "Reading the one-star review again. Slowly.",
    "Drafting a reply that names the actual problem.",
    "No liability language. Lawyers are expensive.",
    "Not promising anything you haven't started.",
    "Three checks, then a human. Always a human.",
    "Nothing gets sent from here. Ever.",
  ],
};

export function Processing({ kind, title }: { kind: "build" | "pulse" | "replies"; title: string }) {
  const lines = LINES[kind];
  const [i, setI] = useState(0);
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const a = setInterval(() => setI((n) => (n + 1) % lines.length), 2400);
    const b = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, [lines.length]);
  return (
    <div className="proc" role="status" aria-live="polite">
      <div className="proc-card">
        <div className="proc-eyebrow">
          <span className="proc-dot" />
          {kind === "replies" ? "OPENROUTER · CACHE-FIRST" : "SERPAPI · CACHE-FIRST"}
          <span className="proc-secs">{secs}s</span>
        </div>
        <div className="proc-title">{title}</div>
        <div className="proc-scan">
          <span />
        </div>
        <div className="proc-line" key={i}>
          {lines[i]}
        </div>
        <div className="proc-pips">
          {lines.map((_, n) => (
            <i key={n} className={n === i ? "on" : n < i ? "done" : ""} />
          ))}
        </div>
      </div>
    </div>
  );
}
