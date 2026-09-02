import { Link, useNavigate, useParams } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { Provenance } from "../components/Provenance";

import { StatusBar } from "../components/StatusBar";
import { Gauge } from "../components/Gauge";
import { Pips } from "../components/Pips";
import { CallLogLine } from "../components/CallLogLine";
import { useAppsRead, useCalls, useDemand, useGaps, useRun } from "../data/api";

// design-unmet/Main.dc.html
export function BuildBoard() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const run = useRun(runId);
  const gaps = useGaps("build", runId);
  const calls = useCalls(runId);
  const apps = useAppsRead(runId);
  const demand = useDemand(runId);

  if (run === undefined || gaps === undefined || calls === undefined || apps === undefined || demand === undefined) {
    return (
      <div className="root" data-path="build">
        <Topbar activeSeg="build" showQuota />
        <div className="stage" style={{ alignItems: "center", justifyContent: "center" }}>
          <span className="lab">Loading gap board…</span>
        </div>
      </div>
    );
  }
  if (run === null || apps === null || demand === null) {
    return (
      <div className="root" data-path="build">
        <Topbar activeSeg="build" showQuota />
        <div className="stage" style={{ alignItems: "center", justifyContent: "center" }}>
          <span className="lab">Run not found.</span>
        </div>
      </div>
    );
  }

  const top = gaps[0]?.score ?? 1;

  return (
    <div className="root" data-path="build">
      <Topbar activeSeg="build" showQuota>
        <div className="cmd">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4d5661" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
          <span style={{ flexGrow: 1 }}>{run.term}</span>
          <span className="chip">US</span>
          <span className="chip">{apps.length} apps</span>
          <span className="chip">2 sorts</span>
        </div>
        <button type="button" className="run" onClick={() => navigate("/build")}>
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
              <div className="lab">Gap board</div>
              <div className="title">{run.term}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <span className="chip" style={{ color: "var(--green)", borderColor: "var(--green-soft)" }}>
                Real run · replayed from cache
              </span>
              <div className="mono" style={{ fontSize: 11.5, color: "var(--mute)", textAlign: "right", lineHeight: 1.6 }}>
                {run.reviewCount} reviews · {apps.length} apps · mean 4.81 · score = mentions × pain × (1 + log₂ breadth)
              </div>
            </div>
          </div>

          {demand.length > 0 && (
            <div className="demand">
              <span className="lab">demand</span>
              <span>
                <b>{run.term}</b> · {demand.length} related quer{demand.length === 1 ? "y" : "ies"} rising
              </span>
              <div className="bars">
                {demand.slice(0, 8).map((d, i) => (
                  <i key={i} style={{ height: `${Math.max(4, (d.value / 100) * 18)}px` }} />
                ))}
              </div>
            </div>
          )}

          <div className="rows">
            {gaps.map((g, i) => (
              <div className="row" key={g._id}>
                <div className="rowtop">
                  <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                  <span className="name">
                    {g.label}
                    {!!g.requests && <span className="req">{g.requests} EXPLICIT REQUESTS</span>}
                  </span>
                  {i >= 2 && (
                    <span className="inl">
                      <b>{g.mentions}</b> mentions · <b>{g.requests}</b> requests · pain <b>{g.pain}</b> · <b>{g.breadth} / {apps.length}</b> apps
                    </span>
                  )}
                  <span className="score">{g.score.toFixed(1)}</span>
                </div>
                <Gauge percent={(g.score / top) * 100} />
                {i < 2 && (
                  <>
                    <div className="stats">
                      <div className="stat">
                        <b>{g.mentions}</b>
                        <span className="lab">mentions</span>
                      </div>
                      <div className="stat">
                        <b>{g.requests}</b>
                        <span className="lab">requests</span>
                      </div>
                      <div className="stat">
                        <b>{g.pain}</b>
                        <span className="lab">pain / 4</span>
                      </div>
                      <div className="stat">
                        <b>
                          {g.breadth} / {apps.length}
                        </b>
                        <span className="lab">apps</span>
                      </div>
                    </div>
                    {g.apps.length > 0 && <div className="apps">{g.apps.join(" · ")}</div>}
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
            ))}
          </div>

          <Link to={`/build/${run._id}/brief`} className="btn ghost" style={{ alignSelf: "flex-start", textDecoration: "none" }}>
            OPEN BUILD BRIEF
          </Link>
        </div>

        <div className="side">
          <div className="panel">
            <div className="ph">
              <span className="lab">Telemetry · {calls.length} calls</span>
              <span className="tagtxt ok">{calls.filter((c) => c.live).length} live · {calls.filter((c) => !c.live).length} cache</span>
            </div>
            <div className="log">
              {calls.slice(0, 9).map((c) => (
                <CallLogLine key={c._id} call={c} />
              ))}
              <div>
                <span className="eng" style={{ color: "var(--dim)" }}>
                  + 8 more
                </span>
                <span className="prm" />
                <span className="tagtxt" />
                <span className="ms" />
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="ph">
              <span className="lab">Apps read · {apps.length}</span>
              <span className="lab">rating</span>
            </div>
            {apps.map((a) => (
              <div className="arow" key={a.name}>
                <span className="n">{a.name}</span>
                <div className="bar">
                  <div style={{ width: `${(a.rating / 5) * 100}%` }} />
                </div>
                <span className="v">{a.rating.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="panel">
            <div className="ph">
              <span className="lab">Search demand</span>
              <span className="lab">trends</span>
            </div>
            {demand.map((d) => (
              <div className="arow" key={d.term}>
                <span className="n">{d.term}</span>
                <div className="bar">
                  <div style={{ width: `${d.value}%` }} />
                </div>
                <span className="v">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <StatusBar
        items={[
          { content: <>RUN <b>{new Date(run.startedAt).toISOString()}</b></> },
          { content: <>SOURCE <b>apple_app_store</b></> },
          { content: <Provenance compact liveCalls={run.liveCalls} cachedCalls={run.cachedCalls} /> },
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
