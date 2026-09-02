import { useParams } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";
import { Gauge } from "../components/Gauge";
import { Pips } from "../components/Pips";
import { SourceSquare } from "../components/SourceSquare";
import { useBusiness, useGaps } from "../data/api";
import type { SourceCode } from "../data/types";

const PLATFORMS: SourceCode[] = ["G", "Y", "T", "O"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// design-unmet/Action.dc.html — playbook-prescribed actions for one gap.
export function ActionDetail() {
  const { theme } = useParams<{ theme: string }>();
  const business = useBusiness();
  const gaps = useGaps("pulse");
  const gap = gaps.find((g) => g.theme === theme) ?? gaps[0];
  const rank = gaps.findIndex((g) => g._id === gap._id) + 1;

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
        <span className="tag warm">sample · Austin pull pending</span>
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
              <b style={{ color: "var(--orange)" }}>{gap.score}</b>
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
              <b style={{ color: "var(--orange)" }}>+{gap.deltaWeek}</b>
              <span className="lab">vs last week</span>
            </div>
            <div className="stat">
              <b>
                {PLATFORMS.map((p) => (
                  <SourceSquare key={p} code={p} variant="src4" on={gap.platforms?.includes(p)} />
                ))}
              </b>
              <span className="lab">verified on {gap.platforms?.length ?? 0} of 4 platforms</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 24 }}>
            {gap.dayOfWeek && (
              <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="lab">When it's said · by day of visit</span>
                <div className="when">
                  {gap.dayOfWeek.map((v, i) => (
                    <span key={i} className={v >= 80 ? "hot" : undefined} style={{ height: `${v}%` }} />
                  ))}
                </div>
                <div className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--dim)" }}>
                  {DAYS.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </div>
            )}
            {gap.requestPhrases && (
              <div style={{ width: 260, display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="lab">What they say they wanted</span>
                <div className="mono" style={{ fontSize: 12, color: "#cfd4da", lineHeight: 1.7 }}>
                  {gap.requestPhrases.map((r, i) => (
                    <span key={r.text}>
                      {i > 0 && <br />}
                      {r.text} <span style={{ color: "var(--mute)" }}>×{r.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
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
                  {q.source && <SourceSquare code={q.source} />}
                  <Pips rating={q.rating} small />
                  <span className="lab">
                    {q.place} · {q.daysAgo} days ago
                  </span>
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
            <div className="rx lead">
              <span className="n">01 · fixes "nobody told us" · 9 of {gap.mentions}</span>
              <span className="do">Post today's expected wait on Google Maps by 10am, update at 12 and 2</span>
              <span className="why">
                The complaint is not the wait, it's the surprise. The one rival praised for waits posts hours daily and has 0 wait
                complaints this week.
              </span>
              <div className="row">
                <span className="lab">10 min · weekly habit</span>
                <button type="button" className="btn">
                  Start tracking
                </button>
              </div>
            </div>
            <div className="rx">
              <span className="n">02 · fixes "order ahead" · 3 of {gap.mentions}</span>
              <span className="do">Add the pre-order link to the Maps listing and the pinned post</span>
              <span className="why">[place 3] is advertising exactly this on Google Ads right now. Same customers, same search.</span>
              <div className="row">
                <span className="lab">20 min · once</span>
                <button type="button" className="btn ghost">
                  Start tracking
                </button>
              </div>
            </div>
            <div className="rx">
              <span className="n">03 · fixes "shade or water in line" · 2 of {gap.mentions}</span>
              <span className="do">Water and shade for the Saturday line</span>
              <span className="why">Mentioned in 2 complaints and in 1 five-star review as the reason they stayed.</span>
              <div className="row">
                <span className="lab">cost · one-off</span>
                <button type="button" className="btn ghost">
                  Start tracking
                </button>
              </div>
            </div>
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
              <div>
                <span>first result</span>
                <span>Mon 9 Sep</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StatusBar
        items={[
          { content: <>GAP <b>{gap.theme}</b></> },
          { content: <>EVIDENCE <b>{gap.mentions} reviews · 3 platforms · 7 days</b></> },
          { content: <>NO EXPERIMENT RUNNING · <b>start one above</b></>, push: true },
        ]}
      />
    </div>
  );
}
