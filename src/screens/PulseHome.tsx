import { Link } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";
import { TaskRow } from "../components/TaskRow";
import { WeekStrip } from "../components/WeekStrip";
import { useBusiness, useMarkActionDone, useMorningHeadline, usePulseHome, useSnoozeAction } from "../data/api";

// design-unmet/Morning.dc.html, collapsing to Phone.dc.html under 430px
// (see the @media block in tokens.css — same markup, no separate screen).
//
// ponytail: the design's "since last pulse" delta panel and the per-theme
// "last wk -> this wk" movement table need day-over-day diffing nothing in
// cockpit.pulseHome computes yet (it returns today's snapshot + a 7-run
// window, not a paired-diff). Both panels are cut here rather than faked.
export function PulseHome() {
  const business = useBusiness();
  const home = usePulseHome(business?._id);
  const headline = useMorningHeadline(business?._id);
  const markDone = useMarkActionDone();
  const snooze = useSnoozeAction();

  if (business === undefined || home === undefined) {
    return (
      <div className="root">
        <Topbar activeSeg="pulse">
          <span className="lab">Loading…</span>
        </Topbar>
      </div>
    );
  }

  if (business === null || home === null) {
    return (
      <div className="root">
        <Topbar activeSeg="pulse">
          <span className="lab">No business yet</span>
        </Topbar>
        <div className="stage" style={{ alignItems: "center", justifyContent: "center", gap: 16 }}>
          <span className="lab">Start your first pulse to see a morning card here.</span>
          <Link to="/pulse" className="btn lg" style={{ textDecoration: "none" }}>
            START · PULSE
          </Link>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const weekDays = home.week.map((w) => ({
    label: new Date(w.day).toLocaleDateString("en-US", { weekday: "short" }),
    date: w.day.slice(8, 10),
    newReviews: w.reviewCount,
    actionsDone: w.status === "done" ? 1 : 0,
    actionsTotal: 1,
    isToday: w.day === today,
  }));

  return (
    <div className="root">
      <Topbar
        activeSeg="pulse"
        crumb={
          <>
            <b>{business.name}</b>
            <span>/</span>
            <span>pulse home</span>
          </>
        }
      >
        <span className="tag warm">live</span>
      </Topbar>

      <div className="body2">
        <div className="main">
          <div className="head">
            <div>
              <div className="lab">This morning · read {new Date().toLocaleTimeString()}</div>
              <div className="title">{headline?.headline ?? `${home.today.length} actions today. ${home.gapsHitting} of ${home.gapsTotal} gaps hitting you.`}</div>
            </div>
            <div className="mono" style={{ fontSize: 11.5, color: "var(--mute)", textAlign: "right", lineHeight: 1.6 }}>
              this week <b style={{ color: "var(--ink)" }}>{home.done.length}</b> actions done
            </div>
          </div>

          <div className="sec" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="sh" style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="lab">Last 7 pulses · new reviews</span>
              <span className="lab">today at right</span>
            </div>
            <WeekStrip days={weekDays} />
          </div>

          <div className="sec" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="sh" style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="lab">Today · from this morning's pulse</span>
              <span className="lab">{home.today.length} new · each with evidence</span>
            </div>
            {home.today.map((a, i) => (
              <TaskRow
                key={a._id}
                title={a.title}
                sub={a.why}
                col1={a.effort}
                action={{ label: a.theme === "ai_answer" ? "Reply desk" : "Do it", variant: i === 0 ? "solid" : "ghost" }}
                onAction={() => markDone({ actionId: a._id })}
              />
            ))}
            {home.today.length === 0 && <span className="lab">Nothing prescribed today.</span>}
          </div>

          <div className="sec" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="sh" style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="lab">Carried over · not finished from earlier pulses</span>
              <span className="lab" style={{ color: "var(--orange)" }}>
                {home.carried.length} open
              </span>
            </div>
            {home.carried.map((a, i) => (
              <TaskRow
                key={a._id}
                open
                box={i === 0 ? "half" : "off"}
                title={a.title}
                sub={a.why}
                col1={a.effort}
                action={i === 0 ? { label: "Continue", variant: "ghost" } : { label: "Snooze", variant: "dim" }}
                onAction={() => (i === 0 ? markDone({ actionId: a._id }) : snooze({ actionId: a._id }))}
              />
            ))}
            {home.carried.length === 0 && <span className="lab">Nothing carried over.</span>}
          </div>

          <div className="sec" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="sh" style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="lab">Done this week · what you actually did</span>
              <span className="lab">{home.done.length}</span>
            </div>
            {home.done.map((a) => (
              <TaskRow key={a._id} box="on" title={a.title} sub={a.why} col1={a.effort} />
            ))}
            {home.done.length === 0 && <span className="lab">Nothing done yet this week.</span>}
          </div>
        </div>

        <div className="side">
          <div className="panel">
            <div className="ph">
              <span className="lab">Open loops</span>
            </div>
            <Link className="link" to="/pulse/replies">
              <span>Reply desk</span>
              <span className="r">open</span>
            </Link>
            <Link className="link" to="/pulse/experiments">
              <span>Experiments</span>
              <span className="r">open</span>
            </Link>
            <Link className="link" to="/pulse/ai">
              <span>AI answer watch</span>
              <span className="r">{home.aiCited ? "cited today" : "not cited today"}</span>
            </Link>
            {home.latestRunId && (
              <Link className="link" to={`/pulse/${home.latestRunId}`}>
                <span>Gap board · this week</span>
                <span className="r">
                  <b>
                    {home.gapsHitting} of {home.gapsTotal}
                  </b>{" "}
                  hitting you
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <StatusBar
        items={[
          { content: <>BUSINESS <b>{business.name}</b></> },
          { content: <>THIS WEEK <b>{home.done.length} done</b></> },
          { content: <>SOURCES <b>maps · yelp · tripadvisor · ai_overview</b></>, push: true },
        ]}
      />
    </div>
  );
}
