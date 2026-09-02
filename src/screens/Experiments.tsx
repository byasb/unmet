import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";
import { useBusiness, useExperiments } from "../data/api";
import type { Doc } from "../../convex/_generated/dataModel";

type ExperimentRowDoc = Doc<"experiments"> & { actionTitle: string };

// design-unmet/Experiments.dc.html
export function Experiments() {
  const business = useBusiness();
  const experiments = useExperiments(business?._id);

  if (business === undefined || experiments === undefined) {
    return (
      <div className="root">
        <Topbar back={{ label: "morning card", to: "/pulse/home" }}>
          <span className="lab">Loading…</span>
        </Topbar>
      </div>
    );
  }
  if (business === null) {
    return (
      <div className="root">
        <Topbar back={{ label: "morning card", to: "/pulse/home" }}>
          <span className="lab">No business yet — run a Pulse first.</span>
        </Topbar>
      </div>
    );
  }

  const moved = experiments.filter((e) => e.verdict === "moved").length;
  const measuring = experiments.filter((e) => e.verdict === "measuring").length;
  const flat = experiments.filter((e) => e.verdict === "flat").length;

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
            <b>experiments</b>
          </>
        }
      >
        <span className="tag warm">sample · shows the three states</span>
      </Topbar>

      <div className="body2">
        <div className="main">
          <div className="head">
            <div>
              <div className="lab">Closed loop · did it work</div>
              <div className="title">Experiments</div>
            </div>
            <div className="mono" style={{ fontSize: 11.5, color: "var(--mute)", textAlign: "right", lineHeight: 1.6 }}>
              measured every Monday with the same engines that found the gap
            </div>
          </div>

          <div className="tiles">
            <div className="tile">
              <span className="lab">Running</span>
              <b>{experiments.length}</b>
              <span className="sub">
                {measuring} measuring · {moved} moved · {flat} no change
              </span>
            </div>
            <div className="tile">
              <span className="lab">Complaints removed · 30d</span>
              <b style={{ color: "var(--green)" }}>−6</b>
              <span className="sub">per week · from the one moved experiment</span>
            </div>
            <div className="tile">
              <span className="lab">Next result</span>
              <b style={{ fontSize: 18, paddingTop: 4 }}>Mon 9 Sep</b>
              <span className="sub">lines &amp; wait · started today</span>
            </div>
            <div className="tile">
              <span className="lab">Measurement cost</span>
              <b style={{ fontSize: 18, paddingTop: 4 }}>4 / wk</b>
              <span className="sub">searches · inside the Monday pulse</span>
            </div>
          </div>

          <div className="tbl">
            <div className="tr h">
              <span className="lab">Gap</span>
              <span className="lab">Action taken</span>
              <span className="lab">Started</span>
              <span className="lab">Baseline · wk</span>
              <span className="lab">Now · wk</span>
              <span className="lab">Status</span>
            </div>
            {experiments.map((e) => (
              <ExperimentRow key={e._id} exp={e} />
            ))}
          </div>
        </div>

        <div className="side">
          <div className="panel">
            <div className="ph">
              <span className="lab">How a result is decided</span>
              <span className="lab">no model judges it</span>
            </div>
            <div className="kv">
              <div>
                <span>read</span>
                <span>every Monday 05:00 local</span>
              </div>
              <div>
                <span>window</span>
                <span>7 days, 4 platforms</span>
              </div>
              <div>
                <span>moved</span>
                <span>mentions −30% or pain −0.5</span>
              </div>
              <div>
                <span>no change</span>
                <span>2 reads inside ±15%</span>
              </div>
              <div>
                <span>noise floor</span>
                <span>&lt; 5 mentions · says "too few"</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="ph">
              <span className="lab">Why it's honest</span>
            </div>
            <p className="p">
              The same engines, the same cadence, the same scorer that surfaced the gap also judge the fix. The model labels reviews;
              it never decides whether an experiment worked. If the number doesn't move, the card says so and offers the next action
              from the playbook.
            </p>
          </div>

          <div className="panel">
            <div className="ph">
              <span className="lab">What this is worth</span>
              <span className="lab" style={{ color: "var(--orange)" }}>
                estimate · not measured
              </span>
            </div>
            <div className="kv">
              <div>
                <span>rating drag removed</span>
                <span>≈ +0.1 over 30 days</span>
              </div>
              <div>
                <span>unanswered 1-star avoided</span>
                <span>≈ 8</span>
              </div>
              <div>
                <span>owner time</span>
                <span>~6 min / day</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StatusBar
        items={[
          { content: <>EXPERIMENTS <b>{experiments.length}</b></> },
          { content: <>NEXT READ <b>Mon 9 Sep 05:00 CT</b></> },
          { content: <>RESULTS <b>measured</b> · VALUE <b>estimated</b></>, push: true },
        ]}
      />
    </div>
  );
}

function ExperimentRow({ exp }: { exp: ExperimentRowDoc }) {
  const bars = [exp.baselineMentions, ...exp.reads.map((r) => r.mentions)];
  const max = Math.max(...bars, 1);
  const startedLabel = new Date(exp.startedAt).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
  const tagClass = exp.verdict === "moved" ? "tag ok" : exp.verdict === "measuring" ? "tag warm" : "tag";
  const barClass = exp.verdict === "moved" ? "g" : exp.verdict === "flat" ? "n" : "b";
  const latest = exp.reads[exp.reads.length - 1];
  const note = latest
    ? `${exp.baselineMentions} → ${latest.mentions} / wk`
    : `first read after next Monday's pulse`;

  return (
    <div className="tr">
      <span className="th">{exp.theme}</span>
      <span className="act">{exp.actionTitle}</span>
      <span className="m">{startedLabel}</span>
      <span className="m">
        <b>{exp.baselineMentions}</b> mentions · pain <b>{exp.baselinePain}</b>
      </span>
      <div className="spark">
        {bars.map((v, i) => (
          <span key={i} className={barClass} style={{ height: `${(v / max) * 100}%` }} />
        ))}
        {Array.from({ length: Math.max(0, 6 - bars.length) }, (_, i) => (
          <span key={`pending-${i}`} className="pending" style={{ height: "100%" }} />
        ))}
      </div>
      <div className="st">
        <span className={tagClass}>
          {exp.verdict === "moved" ? "moved" : exp.verdict === "measuring" ? "measuring" : exp.verdict === "too_few" ? "too few" : "no change"}
        </span>
        <span className="m">{note}</span>
      </div>
    </div>
  );
}
