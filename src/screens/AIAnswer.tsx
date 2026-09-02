import { Link } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";
import { useAiAnswers, useBusiness } from "../data/api";

// design-unmet/AIAnswer.dc.html
export function AIAnswer() {
  const business = useBusiness();
  const answers = useAiAnswers();
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
        <span className="tag warm">sample · Austin pull pending</span>
      </Topbar>

      <div className="body2">
        <div className="main">
          <div>
            <div className="lab">AI answer watch · google_ai_overview · read daily at 05:00</div>
            <div className="title" style={{ fontSize: 28 }}>
              When someone asks Google "{main.query}", <b>you're in the answer — 2nd of 4 mentioned.</b>
            </div>
          </div>

          <div className="days">
            <div className="ph">
              <span className="lab">Last 30 days · cited 22 · out 5 · no AI answer shown 3</span>
              <span className="lab">today at right</span>
            </div>
            <div className="strip">
              {main.history.map((h, i) => (
                <span key={i} className={h} />
              ))}
            </div>
            <div className="legend">
              <span>
                <i style={{ background: "var(--green)" }} />
                cited
              </span>
              <span>
                <i style={{ background: "var(--orange)" }} />
                not cited · Aug 14–18 · that week you had no new reviews
              </span>
              <span>
                <i style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.14)" }} />
                Google showed no AI answer
              </span>
            </div>
          </div>

          <div className="two">
            <div className="card">
              <div className="ph">
                <span className="lab">What the AI said today</span>
                <span className="tag ok">unchanged since Fri</span>
              </div>
              <p className="answer" style={{ margin: 0 }}>
                Austin's best-known barbecue is <b>[place 2]</b>, praised for brisket and shorter lines after 3pm.{" "}
                <mark>
                  <b>Franklin Barbecue</b> remains the benchmark for brisket, with reviewers warning of multi-hour waits and early
                  sell-outs.
                </mark>{" "}
                <b>[place 3]</b> is recommended for ordering ahead, and <b>[place 5]</b> is a rising favourite with consistently high
                recent ratings.
              </p>
              <div className="named">
                {main.named.map((n) => (
                  <div key={n.rank} className={n.isYou ? "nm you" : "nm"}>
                    <span className="r">{n.rank}</span>
                    <span className="n">{n.name}</span>
                    <span className="s">{n.note}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="ph">
                <span className="lab">Where the AI got it</span>
                <span className="lab">sources it cited</span>
              </div>
              {main.sources.map((s) => (
                <div className="src" key={s.name}>
                  <span style={{ width: 110, flexShrink: 0 }}>{s.name}</span>
                  <div className="bar" style={{ flexGrow: 1 }}>
                    <div style={{ width: `${(s.count / 3) * 100}%`, background: "var(--ink)" }} />
                  </div>
                  <span className="v" style={{ width: 30 }}>
                    {s.count}
                  </span>
                </div>
              ))}
              <p className="p" style={{ marginTop: 4 }}>
                Three of the five citations are Yelp. Your last Yelp reply was 19 days ago; three Yelp reviews are unanswered. The two
                words the AI attached to you — "waits", "sell-outs" — are also your two biggest gaps on the Pulse board.
              </p>
            </div>
          </div>

          <div className="card" style={{ gap: 6 }}>
            <div className="ph">
              <span className="lab">Other questions people ask · tracked daily</span>
              <span className="lab">4 queries · 4 searches a day</span>
            </div>
            <div className="qs">
              {answers.map((a) => (
                <div className="q" key={a._id}>
                  <span className="qq">{a.query}</span>
                  <span className={a.cited ? "tag ok" : a.sources.length ? "tag warm" : "tag"} style={{ justifySelf: "start" }}>
                    {a.cited ? `cited · ${a.position}${a.position === 1 ? "st" : "nd"}` : a.sources.length ? "not cited" : "no AI answer"}
                  </span>
                  <span className="m">{a.cited ? "22 / 30" : "0 / 30"}</span>
                  <span className="m">{a.cited ? "Yelp-led" : "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="side" style={{ width: 440 }}>
          <div className="panel">
            <div className="ph">
              <span className="lab">What you can change</span>
              <span className="lab">from what the AI cited · no promises about Google</span>
            </div>
            <div className="rx lead ok">
              <span className="n">01 · the source that carries the answer</span>
              <span className="do">Answer your 3 unanswered Yelp reviews this week</span>
              <span className="why">
                The AI cited Yelp three times out of five, and three of your Yelp reviews have no reply. That's the one input on this
                screen that's yours to fix today. Drafts are in the reply desk.
              </span>
              <div className="row">
                <span className="lab">15 min · once</span>
                <Link className="btn" to="/pulse/replies">
                  Open reply desk
                </Link>
              </div>
            </div>
            <div className="rx">
              <span className="n">02 · the words it attached to you</span>
              <span className="do">Post the expected wait daily so "multi-hour waits" stops being the whole story</span>
              <span className="why">
                "Waits" and "sell-outs" are also your two biggest gaps this week. Fixing the gap is the only lever you have on the
                wording; the same action is already tracking under lines &amp; wait.
              </span>
              <div className="row">
                <span className="lab">already tracking · lines &amp; wait</span>
                <Link className="btn ghost" to="/pulse/gap/lines_wait">
                  Open
                </Link>
              </div>
            </div>
            <div className="rx">
              <span className="n">03 · the question with no source yet</span>
              <span className="do">Own "franklin barbecue wait time" with a pinned Maps post</span>
              <span className="why">
                Google shows no AI answer for it today and none of the four places has a source that answers it. A pinned Maps post is
                the cheapest place to put one. Whether the AI picks it up is Google's call; we'll see it here if it does.
              </span>
              <div className="row">
                <span className="lab">10 min · weekly</span>
                <button type="button" className="btn ghost">
                  Start tracking
                </button>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="ph">
              <span className="lab">Watch</span>
              <span className="lab">rival velocity</span>
            </div>
            <p className="p">
              <b style={{ color: "var(--ink)", fontWeight: 700 }}>[place 5]</b> was first seen in the answer 2 days ago. The same week
              it had 12 new reviews, the most in the set. Two things we can observe; a cause we can't prove. Worth watching, not
              copying blindly.
            </p>
          </div>
        </div>
      </div>

      <StatusBar
        items={[
          { content: <>ENGINE <b>google_ai_overview</b></> },
          { content: <>QUERIES <b>4 · read daily</b></> },
          { content: <>COST <b>4 searches / day</b></> },
          { content: <>NEXT READ <b>Wed 05:00 CT</b></>, push: true },
        ]}
      />
    </div>
  );
}
