import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";
import { useBusinesses, useRunPulse } from "../data/api";
import { Processing } from "../components/Processing";
import type { Id } from "../../convex/_generated/dataModel";

// design-unmet/StartLocal.dc.html
export function PulsePreflight() {
  const navigate = useNavigate();
  const runPulse = useRunPulse();
  const businesses = useBusinesses();
  const [name, setName] = useState("Franklin Barbecue");
  const [category, setCategory] = useState("barbecue");
  const [location, setLocation] = useState("Austin, TX");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runNew() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await runPulse({ name, category, location });
      navigate(`/run/pulse/${result.runId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  async function runExisting(businessId: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await runPulse({ businessId: businessId as Id<"businesses"> });
      navigate(`/run/pulse/${result.runId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <div className="root">
      {busy && <Processing kind="pulse" title="Reading this week's reviews for the places like yours" />}
      <Topbar activeSeg="pulse" back={{ label: "paths", to: "/" }} />

      <div className="stage" style={{ alignItems: "center", padding: "48px 120px 18px", gap: 24 }}>
        <div className="ask">
          <h1>What's breaking on your street?</h1>
          <p>A kind of business and where — or paste a Google Maps link to a place, and that place is you.</p>
        </div>

        {businesses && businesses.length > 0 && (
          <div className="preflight" style={{ width: "100%" }}>
            <div className="targets" style={{ width: "100%" }}>
              <div className="th">
                <span className="lab">Re-run a business you've already pulsed</span>
              </div>
              {businesses.map((b) => (
                <div className="trow" key={b._id}>
                  <span className="n">{b.name}</span>
                  <span className="m">
                    {b.category} · {b.location}
                  </span>
                  <button type="button" className="btn ghost" disabled={busy} onClick={() => runExisting(b._id)}>
                    Run today's pulse
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="cmdwrap" style={{ width: "100%" }}>
          <span className="lab">Or start a new business</span>
          <div className="cmdbig">
            <input
              disabled={busy}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="business name"
              style={{ flexGrow: 1, background: "none", border: "none", color: "var(--ink)", font: "inherit", outline: "none" }}
            />
          </div>
          <div className="cmdbig">
            <input
              disabled={busy}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="category, e.g. barbecue"
              style={{ flexGrow: 1, background: "none", border: "none", color: "var(--ink)", font: "inherit", outline: "none" }}
            />
          </div>
          <div className="cmdbig">
            <input
              disabled={busy}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="location, e.g. Austin, TX"
              style={{ flexGrow: 1, background: "none", border: "none", color: "var(--ink)", font: "inherit", outline: "none" }}
            />
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
        </div>

        <div className="preflight" style={{ width: "100%" }}>
          <div className="plan" style={{ width: "100%" }}>
            <span className="lab">Flight plan</span>
            <div className="line">
              <span>discovery · google_maps</span>
              <span>1 call</span>
            </div>
            <div className="line">
              <span>reviews · maps · yelp · tripadvisor</span>
              <span>per place found</span>
            </div>
            <div className="line">
              <span>AI answer · google_ai_overview</span>
              <span>3 queries</span>
            </div>
            <div className="line">
              <span>taxonomy</span>
              <span>local · 12 themes</span>
            </div>
            <div className="line">
              <span>mode</span>
              <span style={{ color: "var(--green)" }}>cache-first</span>
            </div>
            {error && (
              <div className="line" style={{ color: "var(--orange)" }}>
                <span>error</span>
                <span>{error}</span>
              </div>
            )}
            <button type="button" className="btn lg" onClick={runNew} disabled={busy || !name.trim() || !category.trim() || !location.trim()}>
              <span>{busy ? "STARTING…" : "RUN ANALYSIS"}</span>
              <span>discovers peers, reads this week's reviews</span>
            </button>
          </div>
        </div>
      </div>

      <StatusBar
        items={[
          { content: <>SOURCES <b>google_maps · google_maps_reviews · yelp · tripadvisor · google_ai_overview</b></> },
          { content: <>quota-guarded · capped roles fall back to cache</>, push: true },
        ]}
      />
    </div>
  );
}
