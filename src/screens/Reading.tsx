import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { Provenance } from "../components/Provenance";

import { StatusBar } from "../components/StatusBar";
import { CallLogLine } from "../components/CallLogLine";
import { useCalls, useRun } from "../data/api";

// design-unmet/Loading.dc.html — subscribes to `run` + `calls` and streams
// real rows as the action inserts them. Gaps/apps only exist once the run
// finishes (pipeline.finishRun / pulse.finishRun write them in one batch at
// the end), so unlike the original mock-driven version there is no partial
// gap preview mid-run — this reads honestly instead of animating fake ranks.
export function Reading() {
  const { kind, runId } = useParams<{ kind: string; runId: string }>();
  const isPulse = kind === "pulse";
  const navigate = useNavigate();
  const run = useRun(runId);
  const calls = useCalls(runId);

  useEffect(() => {
    if (!run) return;
    if (run.status === "done") {
      const target = isPulse ? `/pulse/${run._id}` : `/build/${run._id}`;
      navigate(target, { replace: true });
    }
  }, [run, isPulse, navigate]);

  if (run === undefined || calls === undefined) {
    return (
      <div className="root" data-path={isPulse ? undefined : "build"}>
        <Topbar liveDot activeSeg={isPulse ? "pulse" : "build"} showQuota={false} />
        <div className="stage" style={{ alignItems: "center", justifyContent: "center" }}>
          <span className="lab">Loading run…</span>
        </div>
      </div>
    );
  }

  if (run === null) {
    return (
      <div className="root" data-path={isPulse ? undefined : "build"}>
        <Topbar liveDot activeSeg={isPulse ? "pulse" : "build"} showQuota={false} />
        <div className="stage" style={{ alignItems: "center", justifyContent: "center" }}>
          <span className="lab">Run not found.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="root" data-path={isPulse ? undefined : "build"}>
      <Topbar liveDot activeSeg={isPulse ? "pulse" : "build"} showQuota={false}>
        <div className="cmd">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4d5661" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
          <span style={{ flexGrow: 1 }}>
            {run.term}
            {run.location ? ` · ${run.location}` : ""}
          </span>
          <span className="chip">{isPulse ? "pulse" : "build"}</span>
        </div>
        <div className="run pending">
          {run.status === "error" ? "FAILED" : "READING"}
          {run.status !== "error" && <span className="cursor" />}
        </div>
      </Topbar>

      <div className="body2">
        <div className="main">
          <div className="readout">
            <div>
              <div className="lab">Reading reviews · live run</div>
              <div className="big">{String(calls.length).padStart(2, "0")}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <div className="signal">
                {Array.from({ length: 30 }, (_, i) => (
                  <span key={i} style={{ animationDelay: `${(i % 5) * 0.15}s` }} />
                ))}
              </div>
              <div className="mono" style={{ fontSize: 11, color: "var(--mute)" }}>
                {calls.length ? calls[calls.length - 1].engine : "starting"} ·{" "}
                <span style={{ color: "var(--orange)" }}>{run.status === "error" ? "error" : "live"}</span>
              </div>
            </div>
          </div>

          {run.status === "error" && (
            <div className="skel filled">
              <span style={{ color: "var(--orange)" }}>{run.error ?? "Run failed."}</span>
            </div>
          )}

          {run.status !== "error" && (
            <div className="rows">
              {calls.length === 0 && (
                <div className="skel" style={{ animationDelay: "0s" }}>
                  <span className="lab">Waiting for the first call…</span>
                </div>
              )}
              {Array.from({ length: 4 }, (_, i) => (
                <div className="skel" key={`skel-${i}`} style={{ animationDelay: `${i * 0.3}s` }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <span className="mono" style={{ fontSize: 12, color: "var(--mute)", width: 22 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="l" style={{ width: 200 - i * 20 }} />
                  </div>
                  <div className="g">
                    <div style={{ width: `${Math.max(0, 20 - i * 6)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="side">
          <div className="panel">
            <div className="ph">
              <span className="lab">Telemetry · live</span>
              <span className="tagtxt live">{calls.length} calls</span>
            </div>
            <div className="log">
              {calls.map((c, i) => (
                <CallLogLine key={c._id} call={c} arrive delayMs={i * 20} />
              ))}
              {run.status === "running" && (
                <div>
                  <span className="eng">
                    <span className="cursor" />
                  </span>
                  <span className="prm" style={{ color: "var(--dim)" }}>
                    reading…
                  </span>
                  <span className="tagtxt" />
                  <span className="ms" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <StatusBar
        items={[
          { content: <>RUN <b>{new Date(run.startedAt).toISOString()}</b></> },
          { content: <Provenance compact liveCalls={calls.filter((c) => c.live).length} cachedCalls={calls.filter((c) => !c.live).length} /> },
          {
            content: (
              <>
                {calls.filter((c) => c.live).length} LIVE · {calls.filter((c) => !c.live).length} CACHE
              </>
            ),
            push: true,
          },
        ]}
      />
    </div>
  );
}
