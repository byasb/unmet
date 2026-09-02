import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";
import { useAppsRead } from "../data/api";
import { BUILD_RUN } from "../data/mock";

// design-unmet/StartApp.dc.html
export function BuildPreflight() {
  const navigate = useNavigate();
  const apps = useAppsRead();
  const [term, setTerm] = useState("habit tracker");

  return (
    <div className="root">
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
            <span className="arrow">·</span>
            <span>
              pulled <b>2026-09-02</b>
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
          <div className="targets">
            <div className="th">
              <span className="lab">
                Pre-flight · found <b>{apps.length}</b> apps · 1 call · from cache
              </span>
              <span className="lab" style={{ color: "var(--green)", fontSize: 11 }}>
                real run · 2026-09-02 · nothing to spend
              </span>
            </div>
            {apps.map((a) => (
              <div className="trow" key={a.name}>
                <span className="box on" />
                <span className="n">{a.name}</span>
                <span className="m">
                  {a.rating.toFixed(2)} · {a.ratingsCount?.toLocaleString()} ratings
                </span>
                <span className="cached">cached</span>
              </div>
            ))}
          </div>

          <div className="plan">
            <span className="lab">Flight plan</span>
            <div className="line">
              <span>discovery · apple_app_store</span>
              <span>1 · cache</span>
            </div>
            <div className="line">
              <span>reviews · {apps.length} apps × 2 sorts</span>
              <span>{apps.length * 2} · cache</span>
            </div>
            <div className="line">
              <span>demand · google_trends</span>
              <span>1 · cache</span>
            </div>
            <div className="line">
              <span>phrasing · google_autocomplete</span>
              <span>1 · cache</span>
            </div>
            <div className="line">
              <span>taxonomy</span>
              <span>app store · 13 themes</span>
            </div>
            <div className="line">
              <span>mode</span>
              <span style={{ color: "var(--green)" }}>offline replay</span>
            </div>
            <div className="line">
              <span>estimated</span>
              <span>~1s</span>
            </div>
            <div className="line sum">
              <span>quota after</span>
              <span>219 / 250 · unchanged</span>
            </div>
            <button type="button" className="btn lg" onClick={() => navigate(`/build/${BUILD_RUN._id}`)}>
              <span>RUN ANALYSIS</span>
              <span>17 calls · 0 live</span>
            </button>
          </div>
        </div>
      </div>

      <StatusBar
        items={[
          { content: <>SOURCES <b>apple_app_store · apple_reviews · google_trends · google_autocomplete</b></> },
          { content: <>2 CACHED RUNS · <b>replay free</b></>, push: true },
        ]}
      />
    </div>
  );
}
