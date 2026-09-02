import { Link, useNavigate, useParams } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";
import { Gauge } from "../components/Gauge";
import { Pips } from "../components/Pips";
import { SourceSquare } from "../components/SourceSquare";
import { CallLogLine } from "../components/CallLogLine";
import { useCalls, useGaps, usePlacesRead, useRun } from "../data/api";
import type { SourceCode } from "../data/types";

const PLATFORMS: SourceCode[] = ["G", "Y", "T", "O"];

// design-unmet/Local.dc.html
export function PulseBoard() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const run = useRun(runId);
  const gaps = useGaps("pulse");
  const calls = useCalls(runId);
  const places = usePlacesRead();
  const top = gaps[0]?.score ?? 1;
  const hitting = gaps.filter((g) => g.inYourReviews);

  return (
    <div className="root">
      <Topbar activeSeg="pulse">
        <div className="cmd">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4d5661" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
          <span style={{ flexGrow: 1 }}>{run.term} near SerpApi, Austin TX</span>
          <span className="chip">3 km</span>
          <span className="chip">{places.length} places</span>
          <span className="chip">this week</span>
        </div>
        <button type="button" className="run" onClick={() => navigate("/pulse")}>
          RUN ANALYSIS
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </button>
      </Topbar>

      <div className="body2">
        <div className="main">
          <div className="head">
            <div>
              <div className="lab">Gap board · Pulse</div>
              <div className="title">{run.term} · Austin, TX</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <span className="chip" style={{ color: "var(--orange)", borderColor: "var(--orange-soft)" }}>
                Sample data · Austin pull pending
              </span>
              <div className="mono" style={{ fontSize: 11.5, color: "var(--mute)", textAlign: "right", lineHeight: 1.6 }}>
                {run.reviewCount} reviews · {places.length} places · 4 platforms · this week vs last
              </div>
            </div>
          </div>

          <div className="you">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff6b3d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
            <span className="k">
              If you ran Franklin — <b>{hitting.length} of {gaps.length}</b> category gaps are in your reviews
            </span>
            <div className="hits">
              {gaps.map((g) => (
                <span key={g._id} className={g.inYourReviews ? "hit on" : "hit"}>
                  {g.label}
                </span>
              ))}
            </div>
          </div>

          <div className="rows">
            {gaps.map((g, i) => (
              <div className="row" key={g._id}>
                <div className="rowtop">
                  <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                  <span className="name">
                    {g.label} {g.inYourReviews && <span className="flag">in your reviews</span>}
                  </span>
                  {i > 0 && (
                    <span className="inl">
                      <b>{g.mentions}</b> mentions · pain <b>{g.pain}</b> · <b>{g.breadth} / {g.totalPlaces}</b> places ·{" "}
                      <b style={{ color: g.deltaWeek && g.deltaWeek > 0 ? "var(--orange)" : undefined }}>
                        {g.deltaWeek != null ? (g.deltaWeek > 0 ? `+${g.deltaWeek}` : g.deltaWeek) : 0}
                      </b>{" "}
                      wk
                    </span>
                  )}
                  <span className="score">{g.score.toFixed(1)}</span>
                </div>
                <Gauge percent={(g.score / top) * 100} />
                {i === 0 && (
                  <>
                    <div className="stats">
                      <div className="stat">
                        <b>{g.mentions}</b>
                        <span className="lab">mentions</span>
                      </div>
                      <div className="stat">
                        <b>{g.pain}</b>
                        <span className="lab">pain / 4</span>
                      </div>
                      <div className="stat">
                        <b>
                          {g.breadth} / {g.totalPlaces}
                        </b>
                        <span className="lab">places</span>
                      </div>
                      <div className="stat">
                        <b style={{ color: "var(--orange)" }}>+{g.deltaWeek}</b>
                        <span className="lab">vs last week</span>
                      </div>
                      <div className="stat">
                        <b>
                          {PLATFORMS.map((p) => (
                            <SourceSquare key={p} code={p} variant="src4" on={g.platforms?.includes(p)} />
                          ))}
                        </b>
                        <span className="lab">seen on {g.platforms?.length ?? 0} of 4</span>
                      </div>
                    </div>
                    {g.quotes[0] && (
                      <div className="quote">
                        <p>“{g.quotes[0].text}”</p>
                        <div className="src">
                          <Pips rating={g.quotes[0].rating} />
                          <span className="lab">
                            {g.quotes[0].place} · Google Maps · {g.quotes[0].daysAgo} days ago
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="side">
          <div className="panel">
            <div className="ph">
              <span className="lab">Telemetry · {calls.length + 11} calls</span>
              <span className="tagtxt live">{calls.length} live · 0 cache</span>
            </div>
            <div className="log">
              {calls.map((c) => (
                <CallLogLine key={c._id} call={c} />
              ))}
              <div>
                <span className="eng" style={{ color: "var(--dim)" }}>
                  + 11 more
                </span>
                <span className="prm" />
                <span className="tagtxt" />
                <span className="ms" />
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="ph">
              <span className="lab">Places read · {places.length}</span>
              <span className="lab">rating · Δ wk</span>
            </div>
            {places.map((p) => (
              <div className={p.isYou ? "arow me" : "arow"} key={p.name}>
                <span className="n">{p.name}</span>
                <span className="v">{p.rating}</span>
                <span className="d">
                  {p.deltaWeek === 0 ? "0.0" : p.deltaWeek! > 0 ? `+${p.deltaWeek}` : p.deltaWeek}
                </span>
              </div>
            ))}
          </div>

          <div className="panel">
            <div className="ph">
              <span className="lab">AI answer · google_ai_overview</span>
              <span className="tagtxt live">today</span>
            </div>
            <div className="mono" style={{ fontSize: 12, color: "var(--ink)", lineHeight: 1.7 }}>
              “best barbecue austin” → <b style={{ color: "var(--green)", fontWeight: 500 }}>cited</b>, 2nd of 4 named
              <br />
              <span style={{ color: "var(--mute)" }}>AI leaned on: Yelp ×3 · Eater ×1 · TripAdvisor ×1</span>
            </div>
            <Link to="/pulse/ai" className="link" style={{ marginTop: 4 }}>
              <span>AI answer watch</span>
              <span className="r">open</span>
            </Link>
          </div>

          <div className="panel">
            <div className="ph">
              <span className="lab">Next run</span>
              <span className="lab">daily</span>
            </div>
            <div className="mono" style={{ fontSize: 12, color: "var(--mute2)", lineHeight: 1.7 }}>
              Tomorrow 05:00 CT · diff against today
              <br />
              <span style={{ color: "var(--dim)" }}>~11 searches/day on the Pro cadence</span>
            </div>
          </div>

          <Link to="/pulse/home" className="btn" style={{ textDecoration: "none" }}>
            OPEN PULSE HOME
          </Link>
        </div>
      </div>

      <StatusBar
        items={[
          { content: <>RUN <b>{new Date(run.startedAt).toISOString()}</b></> },
          { content: <>SOURCE <b>google_maps_reviews</b></> },
          { content: <>MODE <b style={{ color: "var(--orange)" }}>live</b></> },
          { content: <>17 LIVE · 0 CACHE · {run.reviewCount} REVIEWS · <b>9.8s</b></>, push: true },
        ]}
      />
    </div>
  );
}
