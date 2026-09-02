import { Link } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";
import { TaskRow } from "../components/TaskRow";
import { WeekStrip } from "../components/WeekStrip";
import { usePulseHome } from "../data/api";

// design-unmet/Morning.dc.html, collapsing to Phone.dc.html under 430px
// (see the @media block in tokens.css — same markup, no separate screen).
export function PulseHome() {
  const { business, today, carried, done, week, gapsHitting, gapsTotal } = usePulseHome();

  return (
    <div className="root">
      <Topbar
        activeSeg="pulse"
        crumb={
          <>
            <b>{business.name}</b>
            <span>/</span>
            <span>pulse home</span>
            <span>/</span>
            <span>Tue 2 Sep · pulse #23</span>
          </>
        }
      >
        <span className="tag warm">sample · Austin pull pending</span>
      </Topbar>

      <div className="body2">
        <div className="main">
          <div className="head">
            <div>
              <div className="lab">This morning · 4 platforms · read 05:02 CT</div>
              <div className="title">7 new reviews. Lines rising. 2 carried over.</div>
            </div>
            <div className="mono" style={{ fontSize: 11.5, color: "var(--mute)", textAlign: "right", lineHeight: 1.6 }}>
              last pulse <b style={{ color: "var(--ink)" }}>Mon 1 Sep</b> · 5 new · you did <b style={{ color: "var(--ink)" }}>2 of 3</b>
              <br />
              this week <b style={{ color: "var(--ink)" }}>24 new</b> · <b style={{ color: "var(--ink)" }}>13 of 17</b> actions done · 1 experiment moved
            </div>
          </div>

          <div className="sec" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="sh" style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="lab">Last 7 pulses · new reviews · actions done</span>
              <span className="lab">today at right</span>
            </div>
            <WeekStrip days={week} />
          </div>

          <div className="sec" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="sh" style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="lab">Today · from this morning's pulse</span>
              <span className="lab">{today.length} new · each with evidence</span>
            </div>
            {today.map((a, i) => (
              <TaskRow
                key={a._id}
                title={a.title}
                sub={a.meta}
                col1={
                  <>
                    {a.effort} · {a.cadence}
                  </>
                }
                col2={a.progress}
                action={{ label: a.theme === "ai_answer" ? "Reply desk" : "Do it", variant: i === 0 ? "solid" : "ghost" }}
              />
            ))}
          </div>

          <div className="sec" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="sh" style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="lab">Carried over · not finished from earlier pulses</span>
              <span className="lab" style={{ color: "var(--orange)" }}>
                {carried.length} open
              </span>
            </div>
            {carried.map((a, i) => (
              <TaskRow
                key={a._id}
                open
                box={i === 0 ? "half" : "off"}
                title={a.title}
                sub={a.meta}
                col1={a.effort}
                col2={
                  <>
                    open <b>{a.daysOpen} days</b>
                  </>
                }
                action={{ label: i === 0 ? "Continue" : "Snooze", variant: i === 0 ? "ghost" : "dim" }}
              />
            ))}
          </div>

          <div className="sec" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="sh" style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="lab">Done this week · what you actually did</span>
              <span className="lab">showing {done.length} of 13 · see all</span>
            </div>
            {done.map((a) => (
              <TaskRow key={a._id} box="on" title={a.title} sub={a.meta} col1={a.effort} col2={a.progress ? <span className="tag ok">{a.progress.split(" · ")[0]}</span> : undefined} />
            ))}
          </div>
        </div>

        <div className="side">
          <div className="panel">
            <div className="ph">
              <span className="lab">Since last pulse</span>
              <span className="lab">Mon → Tue</span>
            </div>
            <div className="kv">
              <div>
                <span>new reviews</span>
                <span>7 · G 3 · Y 2 · T 1 · O 1</span>
              </div>
              <div>
                <span>rating · 7 days</span>
                <span>
                  4.7 <span className="up">−0.1</span>
                </span>
              </div>
              <div>
                <span>rising theme</span>
                <span>
                  lines &amp; wait <span className="up">+5</span>
                </span>
              </div>
              <div>
                <span>AI answer · best barbecue austin</span>
                <span className="dn">cited · 2nd · unchanged</span>
              </div>
              <div>
                <span>unanswered &gt; 7 days</span>
                <span className="up">3</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="ph">
              <span className="lab">Open loops</span>
            </div>
            <Link className="link" to="/pulse/replies">
              <span>Reply desk</span>
              <span className="r">
                <b>4</b> to review
              </span>
            </Link>
            <Link className="link" to="/pulse/experiments">
              <span>Experiments</span>
              <span className="r">1 measuring · 1 moved · 1 flat</span>
            </Link>
            <Link className="link" to="/pulse/ai">
              <span>AI answer watch</span>
              <span className="r">4 queries · 2 cited</span>
            </Link>
            <Link className="link" to={`/pulse/run_pulse_austin`}>
              <span>Gap board · this week</span>
              <span className="r">
                <b>{gapsHitting} of {gapsTotal}</b> hitting you
              </span>
            </Link>
          </div>

          <div className="panel">
            <div className="ph">
              <span className="lab">Theme movement</span>
              <span className="lab">last wk → this wk</span>
            </div>
            <div className="kv">
              <div>
                <span>lines &amp; wait</span>
                <span>
                  9 → 14 <span className="up">+5</span>
                </span>
              </div>
              <div>
                <span>sold out early</span>
                <span>
                  10 → 11 <span className="up">+1</span>
                </span>
              </div>
              <div>
                <span>price per pound</span>
                <span>
                  6 → 9 <span className="up">+3</span>
                </span>
              </div>
              <div>
                <span>consistency</span>
                <span>
                  3 → 3 <span style={{ color: "var(--mute)" }}>0</span>
                </span>
              </div>
              <div>
                <span>parking</span>
                <span>
                  6 → 5 <span className="dn">−1</span>
                </span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="ph">
              <span className="lab">Next pulse</span>
              <span className="lab">daily</span>
            </div>
            <div className="kv">
              <div>
                <span>runs</span>
                <span>Wed 05:00 CT</span>
              </div>
              <div>
                <span>reads</span>
                <span>4 platforms · 7 places</span>
              </div>
              <div>
                <span>cost</span>
                <span>11 searches</span>
              </div>
              <div>
                <span>experiment read</span>
                <span>Mon 9 Sep · lines &amp; wait</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StatusBar
        items={[
          { content: <>PULSE <b>#23 · Tue 2 Sep</b></> },
          { content: <>OPENED <b>7 of 7 pulses this week</b></> },
          { content: <>THIS WEEK <b>13 of 17 done</b></> },
          { content: <>SOURCES <b>maps · yelp · tripadvisor · opentable · ai_overview</b></>, push: true },
        ]}
      />
    </div>
  );
}
