import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";
import { PulseTabs } from "../components/PulseTabs";
import { useAiAnswers, useBusiness } from "../data/api";

// design-unmet/AIAnswer.dc.html
//
// ponytail: the design's 30-day cited/out history strip and the "named
// competitors" breakdown need per-day time series and NER over the AI
// overview text that nothing in the schema stores yet (ai_answers has one
// row per query per day: cited, position, sources, excerpt). This renders
// today's real rows instead of the fabricated history/named blocks.
export function AIAnswer() {
  const business = useBusiness();
  const answers = useAiAnswers(business?._id);

  if (business === undefined || answers === undefined) {
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

  const main = answers[0];

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
            <b>AI answer watch</b>
          </>
        }
      >
        <PulseTabs active="ai" />
      </Topbar>

      <div className="body2">
        <div className="main">
          <div>
            <div className="lab">AI answer watch · google_ai_overview · read daily</div>
            {main ? (
              <div className="title" style={{ fontSize: 28 }}>
                When someone asks Google "{main.query}",{" "}
                <b>{main.cited ? `you're in the answer${main.position ? ` — ${main.position}${main.position === 1 ? "st" : "nd"}` : ""}.` : "you're not cited."}</b>
              </div>
            ) : (
              <div className="title" style={{ fontSize: 28 }}>No AI overview read yet for this business.</div>
            )}
          </div>

          {main && (
            <div className="two">
              <div className="card">
                <div className="ph">
                  <span className="lab">What the AI said today</span>
                </div>
                <p className="answer" style={{ margin: 0 }}>
                  {main.excerpt || "No excerpt captured for this query."}
                </p>
              </div>

              <div className="card">
                <div className="ph">
                  <span className="lab">Where the AI got it</span>
                  <span className="lab">sources it cited</span>
                </div>
                {main.sources.length === 0 && <span className="lab">no sources recorded</span>}
                {main.sources.map((s) => (
                  <div className="src" key={s.name}>
                    <span style={{ width: 110, flexShrink: 0 }}>{s.name}</span>
                    <div className="bar" style={{ flexGrow: 1 }}>
                      <div style={{ width: `${Math.min(100, (s.count / 3) * 100)}%`, background: "var(--ink)" }} />
                    </div>
                    <span className="v" style={{ width: 30 }}>
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ gap: 6 }}>
            <div className="ph">
              <span className="lab">Other questions tracked · {answers.length} queries today</span>
            </div>
            <div className="qs">
              {answers.map((a) => (
                <div className="q" key={a._id}>
                  <span className="qq">{a.query}</span>
                  <span className={a.cited ? "tag ok" : a.sources.length ? "tag warm" : "tag"} style={{ justifySelf: "start" }}>
                    {a.cited ? `cited${a.position ? ` · ${a.position}` : ""}` : a.sources.length ? "not cited" : "no AI answer"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <StatusBar
        items={[
          { content: <>ENGINE <b>google_ai_overview</b></> },
          { content: <>QUERIES <b>{answers.length}</b></> },
          { content: <>SOURCE <b>day's real read</b></>, push: true },
        ]}
      />
    </div>
  );
}
