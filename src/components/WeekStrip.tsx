import type { WeekDay } from "../data/types";

// 7-day cell strip from Morning.dc.html — new-review count + done/pending bars.
export function WeekStrip({ days }: { days: WeekDay[] }) {
  return (
    <div className="week">
      {days.map((d) => (
        <div key={d.label} className={d.isToday ? "day today" : "day"}>
          <span className="d">
            <span>{d.label}</span>
            <span style={d.isToday ? { color: "var(--orange)" } : undefined}>{d.date}</span>
          </span>
          <span className="n">
            {d.newReviews}
            {d.isToday && <span>new</span>}
          </span>
          <div className="done">
            {Array.from({ length: d.actionsTotal }, (_, i) => (
              <i key={i} className={i < d.actionsDone ? (d.isToday ? "p" : "y") : undefined} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
