import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

// Route-aware "what to do next" card. Mounted once in App.tsx; the Topbar's
// "?" button dispatches "unmet:toggle-guide" to show/hide it with no prop
// drilling between the two.
interface Step { test: (path: string) => boolean; title: string; body: string; cta?: { label: string; to: string } }

const STEPS: Step[] = [
  { test: (p) => p === "/signin", title: "Sign in with the account from the Devpost testing notes.",
    body: "Judge accounts get 30 live SerpApi searches a day; the two demo runs below are cached and cost zero." },
  { test: (p) => p === "/", title: "Two doors, one engine.",
    body: "Build reads App Store reviews for a category. Pulse reads this week's reviews for the businesses on a street. Start with Build — it's fully cached.",
    cta: { label: "Open Build", to: "/build" } },
  { test: (p) => p === "/build", title: "Type habit tracker and press Run.",
    body: "The flight plan prices the run before spending anything: this category is cached, so you'll see 0 live calls." },
  { test: (p) => p.startsWith("/run/"), title: "Watch each SerpApi call land.",
    body: "Rows are a live subscription on the calls table. Green = cached, orange = live. The quota badge top-right is counted from the same table." },
  { test: (p) => /^\/build\/[^/]+$/.test(p), title: "Click a gap to read the users' own words.",
    body: "Score = mentions × pain × (1 + log₂ breadth). Then open Pulse.", cta: { label: "Open Pulse", to: "/pulse" } },
  { test: (p) => p === "/pulse", title: "Run the Austin barbecue set.",
    body: "Name Stiles Switch BBQ, category barbecue, location Austin, TX. Seven places, three platforms, 556 reviews — cached, zero live calls." },
  { test: (p) => /^\/pulse\/[^/]+$/.test(p) && !["home", "ai", "replies", "experiments"].includes(p.split("/")[2]),
    title: "The strip on top says which gaps already hit you.",
    body: "Then check the Google AI answer screen — it's the part nobody else built.", cta: { label: "AI answer", to: "/pulse/ai" } },
  { test: (p) => p === "/pulse/ai", title: "Two states are real.",
    body: 'Cited with sources for "is stiles switch bbq worth it"; no AI answer at all for the local-intent query.' },
  { test: (p) => p === "/pulse/home", title: "This is tomorrow morning.",
    body: "Three actions with evidence, reply drafts checked by three rules, and next Monday the same engines measure whether the fix moved the number. Mark an action done to start an experiment." },
  { test: (p) => p === "/pulse/replies", title: "Nothing is sent from here.",
    body: "Draft, read the three checks, approve or skip. Approving copies the text for you to paste on the platform." },
];

const KEY = "unmet.guide";
const save = (v: string) => { try { localStorage.setItem(KEY, v); } catch { /* private mode etc */ } };

export function Guide() {
  const { pathname } = useLocation();
  const stepIndex = STEPS.findIndex((s) => s.test(pathname));
  const [visible, setVisible] = useState(true);
  const lastStep = useRef(stepIndex);

  // Reopen automatically whenever the route lands on a new step.
  useEffect(() => {
    if (stepIndex !== lastStep.current) {
      lastStep.current = stepIndex;
      setVisible(true);
    }
  }, [stepIndex]);

  // Respect a dismissal from an earlier session, on first mount only.
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === "closed") setVisible(false);
    } catch { /* ignore */ }
  }, []);

  // The Topbar's "?" button.
  useEffect(() => {
    const toggle = () => setVisible((v) => { save(!v ? "open" : "closed"); return !v; });
    window.addEventListener("unmet:toggle-guide", toggle);
    return () => window.removeEventListener("unmet:toggle-guide", toggle);
  }, []);

  if (stepIndex === -1 || !visible) return null;
  const step = STEPS[stepIndex];

  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, width: 300, zIndex: 50, background: "var(--panel)", border: "1px solid var(--hairline3)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="mono lab">GUIDE · step {stepIndex + 1} of {STEPS.length}</span>
        <button type="button" aria-label="Dismiss guide" onClick={() => { setVisible(false); save("closed"); }}
          style={{ background: "none", border: "none", color: "var(--mute)", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>
          ×
        </button>
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{step.title}</div>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--mute2)", lineHeight: 1.5 }}>{step.body}</p>
      {step.cta && (
        <Link to={step.cta.to} className="btn ghost" style={{ alignSelf: "flex-start", textDecoration: "none", marginTop: 4 }}>
          {step.cta.label}
        </Link>
      )}
    </div>
  );
}
