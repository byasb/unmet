import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";
import { useRunBuild } from "../data/api";
import { Processing } from "../components/Processing";

// design-unmet/StartApp.dc.html
export function BuildPreflight() {
  const navigate = useNavigate();
  const runBuild = useRunBuild();
  const [term, setTerm] = useState("habit tracker");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!term.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const runId = await runBuild({ term: term.trim() });
      navigate(`/run/build/${runId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <div className="root">
      {busy && <Processing kind="build" title={`Reading the apps ranking for "${term.trim()}"`} />}
      <Topbar activeSeg="build" back={{ label: "paths", to: "/" }} />

      <div className="stage" style={{ alignItems: "center", padding: "48px 120px 18px", gap: 24 }}>
        <div className="ask">
          <h1>What should you build next?</h1>
          <p>A category people search for — or paste an App Store link, and that app is you.</p>
        </div>

        <div className="cmdwrap">
          <div className="cmdbig ok">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4d5661" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              disabled={busy}
              onKeyDown={(e) => e.key === "Enter" && run()}
              style={{ flexGrow: 1, background: "none", border: "none", color: "var(--ink)", font: "inherit", outline: "none" }}
            />
            <span className="caret ok" />
          </div>
          <div className="read">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4d5661" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
            <span className="srcbadge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="2" width="12" height="20" rx="2" />
                <path d="M11 18h2" />
              </svg>
              Build
            </span>
            <span>
              category <b>{term}</b>
            </span>
            <span className="arrow">·</span>
            <span>
              store <b>US</b>
            </span>
            <div className="quick">
              <span className="chip" onClick={() => setTerm("receipt scanner")}>
                <i />
                receipt scanner
              </span>
              <span className="chip" onClick={() => setTerm("budget app")}>
                <i className="warm" />
                budget app
              </span>
            </div>
          </div>
        </div>

        <div className="rules">
          <div className="rule">
            <span className="in">habit tracker</span>
            <span className="out">
              <b>category</b> · the apps ranking for it · US
            </span>
          </div>
          <div className="rule">
            <span className="in">habit tracker · gb</span>
            <span className="out">
              <b>category</b> in another storefront
            </span>
          </div>
          <div className="rule">
            <span className="in">apps.apple.com/us/app/…/id6803901837</span>
            <span className="out">
              <b>one app</b> is "you" · its category found for you
            </span>
          </div>
          <div className="rule">
            <span className="in">SnipStash</span>
            <span className="out">
              <b>one app</b> found by name, then its category
            </span>
          </div>
        </div>

        <div className="preflight">
          <div className="plan" style={{ width: "100%" }}>
            <span className="lab">Flight plan</span>
            <div className="line">
              <span>discovery · apple_app_store</span>
              <span>1 call</span>
            </div>
            <div className="line">
              <span>reviews</span>
              <span>up to 8 apps × 2 sorts</span>
            </div>
            <div className="line">
              <span>demand · google_trends</span>
              <span>1 call</span>
            </div>
            <div className="line">
              <span>phrasing · google_autocomplete</span>
              <span>1 call</span>
            </div>
            <div className="line">
              <span>taxonomy</span>
              <span>app store · 13 themes</span>
            </div>
            <div className="line">
              <span>cache</span>
              <span style={{ color: "var(--green)" }}>a cached term replays free</span>
            </div>
            {error && (
              <div className="line" style={{ color: "var(--orange)" }}>
                <span>error</span>
                <span>{error}</span>
              </div>
            )}
            <button type="button" className="btn lg" onClick={run} disabled={busy || !term.trim()}>
              <span>{busy ? "STARTING…" : "RUN ANALYSIS"}</span>
              <span>reads live or from cache</span>
            </button>
          </div>
        </div>
      </div>

      <StatusBar
        items={[
          { content: <>SOURCES <b>apple_app_store · apple_reviews · google_trends · google_autocomplete</b></> },
          { content: <>cached terms replay free</>, push: true },
        ]}
      />
    </div>
  );
}
