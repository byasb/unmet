import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";
import { usePlacesRead } from "../data/api";

// design-unmet/StartLocal.dc.html
export function PulsePreflight() {
  const navigate = useNavigate();
  const places = usePlacesRead();
  const [query, setQuery] = useState("barbecue near SerpApi, Austin TX");
  const [youIndex, setYouIndex] = useState(0);
  const included = places.slice(0, 7);

  return (
    <div className="root">
      <Topbar activeSeg="pulse" back={{ label: "paths", to: "/" }} />

      <div className="stage" style={{ alignItems: "center", padding: "48px 120px 18px", gap: 24 }}>
        <div className="ask">
          <h1>What's breaking on your street?</h1>
          <p>A kind of business and where — or paste a Google Maps link to a place, and that place is you.</p>
        </div>

        <div className="cmdwrap">
          <div className="cmdbig">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4d5661" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flexGrow: 1, background: "none", border: "none", color: "var(--ink)", font: "inherit", outline: "none" }}
            />
            <span className="caret" />
          </div>
          <div className="read">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4d5661" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
            <span className="srcbadge warm">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Pulse
            </span>
            <span>
              category <b>barbecue</b>
            </span>
            <span className="arrow">·</span>
            <span>
              around <b>SerpApi HQ, Austin TX</b>
            </span>
            <span className="arrow">·</span>
            <span>
              radius <b>3 km</b>
            </span>
            <div className="quick">
              <span className="chip">
                <i />
                habit tracker
              </span>
              <span className="chip">
                <i />
                receipt scanner
              </span>
            </div>
          </div>
        </div>

        <div className="rules">
          <div className="rule">
            <span className="in">barbecue near Austin TX</span>
            <span className="out">
              <b>category</b> around a place · pick who is "you"
            </span>
          </div>
          <div className="rule">
            <span className="in">coffee near 78701</span>
            <span className="out">
              <b>category</b> around a zip or address
            </span>
          </div>
          <div className="rule">
            <span className="in">maps.app.goo.gl/…</span>
            <span className="out">
              <b>one place</b> is "you" · peers found for you
            </span>
          </div>
          <div className="rule">
            <span className="in">Franklin Barbecue, Austin</span>
            <span className="out">
              <b>one place</b> by name · peers found for you
            </span>
          </div>
        </div>

        <div className="preflight">
          <div className="targets">
            <div className="th">
              <span className="lab">
                Pre-flight · found <b>8</b> places · 1 call · 1.1s
              </span>
              <span className="lab" style={{ color: "var(--orange)" }}>
                sample · Austin pull pending
              </span>
            </div>
            {places.map((p, i) => (
              <div className="trow" key={p.name} style={i === 7 ? { color: "var(--dim)" } : undefined}>
                <span className={i < 7 ? "box on" : "box"} />
                <span className="n">{p.name}</span>
                <span className="m">
                  {p.rating} · {p.reviewCount?.toLocaleString()} reviews
                </span>
                <button type="button" className={i === youIndex ? "youtag on" : "youtag"} onClick={() => setYouIndex(i)}>
                  you
                </button>
              </div>
            ))}
            <div className="trow" style={{ color: "var(--dim)" }}>
              <span className="box" />
              <span className="n">Rudy's Country Store — chain, 6 locations</span>
              <span className="m">4.4 · 8,100</span>
              <span className="youtag">you</span>
            </div>
          </div>

          <div className="plan">
            <span className="lab">Flight plan</span>
            <div className="line">
              <span>discovery · google_maps</span>
              <span>1 · spent</span>
            </div>
            <div className="line">
              <span>reviews · {included.length} places × 2 sorts</span>
              <span>{included.length * 2}</span>
            </div>
            <div className="line">
              <span>demand · google_trends US-TX</span>
              <span>1</span>
            </div>
            <div className="line">
              <span>phrasing · google_autocomplete</span>
              <span>1</span>
            </div>
            <div className="line">
              <span>taxonomy</span>
              <span>local · 10 themes</span>
            </div>
            <div className="line">
              <span>mode</span>
              <span style={{ color: "var(--orange)" }}>live</span>
            </div>
            <div className="line">
              <span>estimated</span>
              <span>~12s</span>
            </div>
            <div className="line sum warm">
              <span>quota after</span>
              <span>202 / 250</span>
            </div>
            <button type="button" className="btn lg" onClick={() => navigate("/run/pulse")}>
              <span>RUN ANALYSIS</span>
              <span>16 calls to go</span>
            </button>
          </div>
        </div>
      </div>

      <StatusBar
        items={[
          { content: <>SOURCES <b>apple_app_store · apple_reviews · google_maps · google_maps_reviews · google_trends · google_autocomplete</b></> },
          { content: <>2 CACHED RUNS · <b>replay free</b></>, push: true },
        ]}
      />
    </div>
  );
}
