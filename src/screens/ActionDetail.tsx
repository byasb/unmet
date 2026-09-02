import { useParams } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";
import { Gauge } from "../components/Gauge";
import { Pips } from "../components/Pips";
import { SourceSquare } from "../components/SourceSquare";
import { useBusiness, useGaps, useMarkActionDone, usePulseHome, toSourceCode } from "../data/api";
import type { SourceCode } from "../data/types";

const PLATFORMS: SourceCode[] = ["G", "Y", "T", "O"];

// design-unmet/Action.dc.html — playbook-prescribed actions for one gap.
export function ActionDetail() {
  const { theme } = useParams<{ theme: string }>();
  const business = useBusiness();
  const gaps = useGaps("pulse", business?._id);
  const home = usePulseHome(business?._id);
  const markDone = useMarkActionDone();

  if (business === undefined || gaps === undefined) {
    return (
      <div className="root">
        <Topbar back={{ label: "morning card", to: "/pulse/home" }}>
          <span className="lab">Loading…</span>
        </Topbar>
      </div>
    );
  }
  if (business === null || !gaps.length) {
    return (
      <div className="root">
        <Topbar back={{ label: "morning card", to: "/pulse/home" }}>
          <span className="lab">No pulse data yet — run a Pulse first.</span>
        </Topbar>
      </div>
    );
  }

  const gap = gaps.find((g) => g.theme === theme) ?? gaps[0];
  const rank = gaps.findIndex((g) => g._id === gap._id) + 1;
  const codes = new Set((gap.platforms ?? []).map(toSourceCode));
  const allActions = home ? [...home.today, ...home.carried, ...home.done] : [];
  const liveAction = allActions.find((a) => a.theme === gap.theme);

  return (
    <div className="root">
      <Topbar
        back={{ label: "morning card", to: "/pulse/home" }}
        crumb={
          <>
            <b>{business.name}</b>
            <span>/</span>
            <span>pulse</span>
            <span>/</span>
            <b>{gap.label.toLowerCase()}</b>
          </>
        }
      >
        <span className="tag warm">live · {business.location}</span>
      </Topbar>

      <div className="body2">
        <div className="main">
          <div>
            <div className="lab">Gap · rank {String(rank).padStart(2, "0")}</div>
            <div className="title" style={{ fontSize: 28 }}>{gap.label}</div>
          </div>

          <Gauge percent={100} />

          <div className="stats">
            <div className="stat">
              <b style={{ color: "var(--orange)" }}>{gap.score.toFixed(1)}</b>
              <span className="lab">score</span>
            </div>
            <div className="stat">
              <b>{gap.mentions}</b>
              <span className="lab">mentions · 7d</span>
            </div>
            <div className="stat">
              <b>{gap.pain}</b>
              <span className="lab">pain / 4</span>
            </div>
            <div className="stat">
              <b>
                {gap.breadth} / {gap.totalPlaces}
              </b>
              <span className="lab">places</span>
            </div>
            <div className="stat">
              <b>
                {PLATFORMS.map((p) => (
                  <SourceSquare key={p} code={p} variant="src4" on={codes.has(p)} />
                ))}
              </b>
              <span className="lab">verified on {codes.size} of 4 platforms</span>
            </div>
          </div>

          <div className="ev" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="ph">
              <span className="lab">
                Evidence · {gap.quotes.length} of {gap.mentions}
              </span>
              <span className="lab">angriest first</span>
            </div>
            {gap.quotes.map((q, i) => (
              <div className="q" key={i} style={{ gridTemplateColumns: "1fr", height: "auto", border: "1px solid var(--hairline2)", background: "var(--panel2)", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                <p>“{q.text}”</p>
                <div className="src">
                  <Pips rating={q.rating ?? 0} small />
                  <span className="lab">{q.place}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="side" style={{ width: 460 }}>
          <div className="panel">
            <div className="ph">
              <span className="lab">Prescribed · playbook v1</span>
              <span className="lab">evidence-backed</span>
            </div>
            {liveAction ? (
              <div className="rx lead">
                <span className="n">{liveAction.state === "done" ? "done" : "today"}</span>
                <span className="do">{liveAction.title}</span>
                {liveAction.why && <span className="why">{liveAction.why}</span>}
                <div className="row">
                  <span className="lab">{liveAction.effort}</span>
                  {liveAction.state !== "done" ? (
                    <button type="button" className="btn" onClick={() => markDone({ actionId: liveAction._id })}>
                      Mark done
                    </button>
                  ) : (
                    <span className="tag ok">done · measuring</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="rx">
                <span className="do">No action prescribed for this gap yet — it lands on the next pulse.</span>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="ph">
              <span className="lab">How it'll be measured</span>
              <span className="lab">same engines</span>
            </div>
            <div className="kv">
              <div>
                <span>baseline</span>
                <span>
                  {gap.mentions} mentions / wk · pain {gap.pain}
                </span>
              </div>
              <div>
                <span>check</span>
                <span>every Monday · 4 platforms</span>
              </div>
              <div>
                <span>counts as moved</span>
                <span>−30% mentions or pain −0.5</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StatusBar
        items={[
          { content: <>GAP <b>{gap.theme}</b></> },
          { content: <>EVIDENCE <b>{gap.mentions} reviews · {codes.size} platforms</b></> },
          { content: <>{liveAction ? "TRACKING" : "NO ACTION YET"}</>, push: true },
        ]}
      />
    </div>
  );
}
