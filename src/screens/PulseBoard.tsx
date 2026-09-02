import { Link, useNavigate, useParams } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";
import { Gauge } from "../components/Gauge";
import { Pips } from "../components/Pips";
import { SourceSquare } from "../components/SourceSquare";
import { CallLogLine } from "../components/CallLogLine";
import { useAiAnswers, useCalls, useGaps, usePlacesRead, useRun, toSourceCode } from "../data/api";
import type { SourceCode } from "../data/types";

const PLATFORMS: SourceCode[] = ["G", "Y", "T", "O"];

// design-unmet/Local.dc.html
export function PulseBoard() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const run = useRun(runId);
  // Pulse runs key `term` = the businessId (see pulse.ts's createRun).
  const businessId = run && "term" in run ? run.term : undefined;
  const gaps = useGaps("pulse", businessId);
  const calls = useCalls(runId);
  const places = usePlacesRead(businessId);
  const aiAnswers = useAiAnswers(businessId);

  if (run === undefined || gaps === undefined || calls === undefined || places === undefined) {
    return (
      <div className="root">
        <Topbar activeSeg="pulse">
          <span className="lab">Loading gap board…</span>
        </Topbar>
      </div>
    );
  }
  if (run === null || places === null) {
    return (
      <div className="root">
        <Topbar activeSeg="pulse">
          <span className="lab">Run not found.</span>
        </Topbar>
      </div>
    );
  }

  const you = places.find((p) => p.isYou);
  const top = gaps[0]?.score ?? 1;
  const hitting = gaps.filter((g) => g.inYourReviews);
  const topAnswer = aiAnswers?.[0];

  return (
    <div className="root">
      <Topbar activeSeg="pulse">
        <div className="cmd">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4d5661" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
          <span style={{ flexGrow: 1 }}>{you?.name ?? "Pulse"} · {run.location ?? ""}</span>
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
              <div className="title">{you?.name ?? run.location ?? "Pulse"}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <span className="chip" style={{ color: "var(--orange)", borderColor: "var(--orange-soft)" }}>
                {run.mode}
              </span>
              <div className="mono" style={{ fontSize: 11.5, color: "var(--mute)", textAlign: "right", lineHeight: 1.6 }}>
                {run.reviewCount} reviews · {places.length} places · this week
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
              <b>{hitting.length} of {gaps.length}</b> category gaps are in your reviews
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
            {gaps.map((g, i) => {
              const codes = new Set((g.platforms ?? []).map(toSourceCode));
              return (
                <div className="row" key={g._id}>
                  <div className="rowtop">
                    <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                    <span className="name">
                      {g.label} {g.inYourReviews && <span className="flag">in your reviews</span>}
                    </span>
                    {i > 0 && (
                      <span className="inl">
                        <b>{g.mentions}</b> mentions · pain <b>{g.pain}</b> · <b>{g.breadth} / {g.totalPlaces}</b> places
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
                          <b>
                            {PLATFORMS.map((p) => (
                              <SourceSquare key={p} code={p} variant="src4" on={codes.has(p)} />
                            ))}
                          </b>
                          <span className="lab">seen on {codes.size} of 4</span>
                        </div>
                      </div>
                      {g.quotes[0] && (
                        <div className="quote">
                          <p>“{g.quotes[0].text}”</p>
                          <div className="src">
                            <Pips rating={g.quotes[0].rating ?? 0} />
                            <span className="lab">{g.quotes[0].place}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="side">
          <div className="panel">
            <div className="ph">
              <span className="lab">Telemetry · {calls.length} calls</span>
              <span className="tagtxt live">{calls.filter((c) => c.live).length} live · {calls.filter((c) => !c.live).length} cache</span>
            </div>
            <div className="log">
              {calls.map((c) => (
                <CallLogLine key={c._id} call={c} />
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="ph">
              <span className="lab">Places read · {places.length}</span>
              <span className="lab">rating</span>
            </div>
            {places.map((p) => (
              <div className={p.isYou ? "arow me" : "arow"} key={p.name}>
                <span className="n">{p.name}</span>
                <span className="v">{p.rating || "—"}</span>
              </div>
            ))}
          </div>

          <div className="panel">
            <div className="ph">
              <span className="lab">AI answer · google_ai_overview</span>
              <span className="tagtxt live">today</span>
            </div>
            {topAnswer ? (
              <div className="mono" style={{ fontSize: 12, color: "var(--ink)", lineHeight: 1.7 }}>
                “{topAnswer.query}” →{" "}
                <b style={{ color: topAnswer.cited ? "var(--green)" : "var(--orange)", fontWeight: 500 }}>
                  {topAnswer.cited ? "cited" : "not cited"}
                </b>
                <br />
                <span style={{ color: "var(--mute)" }}>
                  {topAnswer.sources.map((s) => `${s.name} ×${s.count}`).join(" · ") || "no sources recorded"}
                </span>
              </div>
            ) : (
              <span className="lab">no AI overview read yet</span>
            )}
            <Link to="/pulse/ai" className="link" style={{ marginTop: 4 }}>
              <span>AI answer watch</span>
              <span className="r">open</span>
            </Link>
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
          { content: <>MODE <b style={{ color: "var(--orange)" }}>{run.mode}</b></> },
          {
            content: (
              <>
                {calls.filter((c) => c.live).length} LIVE · {calls.filter((c) => !c.live).length} CACHE · {run.reviewCount} REVIEWS
              </>
            ),
            push: true,
          },
        ]}
      />
    </div>
  );
}
