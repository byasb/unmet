import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";
import { CallLogLine } from "../components/CallLogLine";
import { Gauge } from "../components/Gauge";
import { useCalls, useReadingAppsFound } from "../data/api";
import { BUILD_GAPS, BUILD_RUN, PULSE_GAPS, PULSE_RUN } from "../data/mock";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// design-unmet/Loading.dc.html — subscribes to `calls` and grows the list as
// rows arrive. `kind` in the URL picks which mock run/gap set to stream.
export function Reading() {
  const { kind } = useParams<{ kind: string }>();
  const isPulse = kind === "pulse";
  const navigate = useNavigate();
  const calls = useCalls(undefined);
  const appsFound = useReadingAppsFound();
  const gaps = isPulse ? PULSE_GAPS : BUILD_GAPS;
  const targetRun = isPulse ? PULSE_RUN : BUILD_RUN;
  const total = calls.length + 8; // matches the "09 / 17" style readout in the design

  const reduced = useMemo(() => prefersReducedMotion(), []);
  const [step, setStep] = useState(reduced ? calls.length : 0);

  useEffect(() => {
    if (reduced) {
      navigate(isPulse ? `/pulse/${targetRun._id}` : `/build/${targetRun._id}`, { replace: true });
      return;
    }
    if (step >= calls.length) {
      const t = setTimeout(() => navigate(isPulse ? `/pulse/${targetRun._id}` : `/build/${targetRun._id}`, { replace: true }), 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 380);
    return () => clearTimeout(t);
  }, [step, calls.length, reduced, isPulse, navigate, targetRun._id]);

  const seen = calls.slice(0, step);
  const seenGaps = gaps.slice(0, Math.min(gaps.length, Math.ceil((step / Math.max(1, calls.length)) * gaps.length) + 1));

  return (
    <div className="root">
      <Topbar liveDot activeSeg={isPulse ? "pulse" : "build"} showQuota={false}>
        <div className="cmd">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4d5661" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
          <span style={{ flexGrow: 1 }}>{targetRun.term}{targetRun.location ? ` · ${targetRun.location}` : ""}</span>
          <span className="chip">{isPulse ? "7 places" : "US"}</span>
          <span className="chip">2 sorts</span>
        </div>
        <div className="run pending">
          READING
          <span className="cursor" />
        </div>
      </Topbar>

      <div className="body2">
        <div className="main">
          <div className="readout">
            <div>
              <div className="lab">Reading reviews · first live run</div>
              <div className="big">
                {String(Math.min(step, calls.length)).padStart(2, "0")} <span>/ {total}</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <div className="signal">
                {Array.from({ length: 30 }, (_, i) => (
                  <span key={i} style={{ animationDelay: `${(i % 5) * 0.15}s` }} />
                ))}
              </div>
              <div className="mono" style={{ fontSize: 11, color: "var(--mute)" }}>
                {seen.length ? seen[seen.length - 1].engine : calls[0].engine} ·{" "}
                <span style={{ color: "var(--orange)" }}>live</span>
              </div>
            </div>
          </div>

          <div className="sweep">
            <div className="done2" style={{ width: `${Math.min(100, (step / calls.length) * 100)}%` }} />
            <div className="head2" />
          </div>

          <div className="rows">
            {seenGaps.map((g, i) => (
              <div className="skel filled" key={g._id}>
                <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
                  <span className="mono" style={{ fontSize: 12, color: "var(--mute)", width: 22 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 700, flexGrow: 1 }}>{g.label}</span>
                  <span className="mono" style={{ fontSize: 20, fontWeight: 600, color: "var(--orange)" }}>
                    {g.score.toFixed(1)}
                  </span>
                </div>
                <Gauge percent={(g.score / gaps[0].score) * 100} />
                <div className="mono" style={{ fontSize: 11, color: "var(--mute)" }}>
                  {g.mentions} mentions so far · {g.breadth} {isPulse ? "places" : "apps"} · still counting
                </div>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 5 - seenGaps.length) }, (_, i) => (
              <div className="skel" key={`skel-${i}`} style={{ animationDelay: `${i * 0.3}s` }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: 12, color: "var(--mute)", width: 22 }}>
                    {String(seenGaps.length + i + 1).padStart(2, "0")}
                  </span>
                  <div className="l" style={{ width: 200 - i * 20 }} />
                  <div style={{ flexGrow: 1 }} />
                  <div className="l" style={{ width: 56 }} />
                </div>
                <div className="g">
                  <div style={{ width: `${Math.max(0, 20 - i * 6)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="side">
          <div className="panel">
            <div className="ph">
              <span className="lab">Telemetry · live</span>
              <span className="tagtxt live">{seen.length} live · 0 cache</span>
            </div>
            <div className="log">
              {seen.map((c, i) => (
                <CallLogLine key={c._id} call={c} arrive delayMs={i * 20} />
              ))}
              {step < calls.length && (
                <div>
                  <span className="eng">
                    <span className="cursor" />
                  </span>
                  <span className="prm" style={{ color: "var(--dim)" }}>
                    {calls.length - step} calls queued
                  </span>
                  <span className="tagtxt" />
                  <span className="ms" />
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="ph">
              <span className="lab">Apps found · {appsFound.length}</span>
              <span className="lab">rating</span>
            </div>
            {appsFound.map((n, i) => (
              <div className={i < step ? "arow" : "arow pending"} key={n}>
                <span className="n">{n}</span>
                <span className="v">{i < step ? "—" : "—"}</span>
              </div>
            ))}
          </div>

          <div className="panel">
            <div className="ph">
              <span className="lab">Search demand</span>
              <span className="lab" style={{ color: "var(--dim)" }}>
                after reviews
              </span>
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--dim)" }}>
              google_trends · google_autocomplete · queued
            </div>
          </div>
        </div>
      </div>

      <StatusBar
        items={[
          { content: <>RUN <b>{new Date(targetRun.startedAt).toISOString()}</b></> },
          { content: <>MODE <b style={{ color: "var(--orange)" }}>live</b></> },
          { content: <>{seen.length} LIVE · 0 CACHE</>, push: true },
        ]}
      />
    </div>
  );
}
