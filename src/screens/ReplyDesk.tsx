import { useState } from "react";
import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";
import { Pips } from "../components/Pips";
import { SourceSquare } from "../components/SourceSquare";
import { useBusiness, useDrafts } from "../data/api";

const TONES = ["warm", "brief", "formal"] as const;

// design-unmet/Replies.dc.html
export function ReplyDesk() {
  const business = useBusiness();
  const drafts = useDrafts();
  const [activeId, setActiveId] = useState(drafts.find((d) => !d.isPraise)?._id ?? drafts[0]._id);
  const [tone, setTone] = useState<(typeof TONES)[number]>("warm");
  const [approvedCount, setApprovedCount] = useState(0);

  const active = drafts.find((d) => d._id === activeId) ?? drafts[0];
  const needReply = drafts.filter((d) => !d.isPraise).length;
  const passed = active.checks.filter((c) => c.pass).length;

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
            <b>reply desk</b>
          </>
        }
      >
        <span className="tag warm">sample · Austin pull pending</span>
      </Topbar>

      <div className="body2">
        <div className="queue">
          <div className="qh">
            <span className="lab">New since yesterday · {drafts.length}</span>
            <span className="lab">{needReply} to review</span>
          </div>
          {drafts.map((d) => (
            <button key={d._id} type="button" className={d._id === activeId ? "qi on" : "qi"} onClick={() => setActiveId(d._id)}>
              <div className="l1">
                <SourceSquare code={d.reviewSource} />
                <Pips rating={d.reviewRating} />
                <span className={d.isPraise ? "tag dim" : "tag"}>{d.isPraise ? "praise · optional" : "drafted"}</span>
                <span className="ago">{d.daysAgo}d</span>
              </div>
              <span className="t">{d.reviewText}</span>
            </button>
          ))}
        </div>

        <div className="main">
          <div className="review">
            <div className="meta">
              <SourceSquare code={active.reviewSource} />
              <Pips rating={active.reviewRating} />
              <span className="lab">
                [reviewer] · Google Maps · {active.daysAgo} days ago
              </span>
            </div>
            <p>{active.reviewText}</p>
            <div className="themes">
              {active.themes.map((t) => (
                <span key={t} className={t.startsWith("praise") ? "tag dim" : "tag warm"}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {!active.isPraise && (
            <>
              <div>
                <div className="ph" style={{ marginBottom: 8 }}>
                  <span className="lab">Drafted reply · Sonnet</span>
                  <span className="lab">edit anything · critic below</span>
                </div>
                <div className="draft">
                  <p>
                    {active.text || "Drafting…"}
                    <span className="caret ok" style={{ display: "inline-block", height: 16, verticalAlign: -3, marginLeft: 2 }} />
                  </p>
                </div>
              </div>

              {active.checks.length > 0 && (
                <div className="critic">
                  <div className="ph">
                    <span className="lab">
                      Critic · {passed} of {active.checks.length} passed
                    </span>
                    <span className="lab">rules, not taste</span>
                  </div>
                  {active.checks.map((c, i) => (
                    <div className="ck" key={i}>
                      <i className={c.pass ? "ok" : "flag"} />
                      <span>{c.rule}</span>
                      {c.note && <em>· {c.note}</em>}
                    </div>
                  ))}
                </div>
              )}

              <div className="tones">
                <span className="lab" style={{ marginRight: 4 }}>
                  Tone
                </span>
                {TONES.map((t) => (
                  <button key={t} type="button" className={tone === t ? "tone on" : "tone"} onClick={() => setTone(t)}>
                    {t}
                  </button>
                ))}
                <span className="lab" style={{ marginLeft: "auto" }}>
                  regenerate on change · ~1 second
                </span>
              </div>
            </>
          )}
        </div>

        <div className="side" style={{ width: 300 }}>
          <button type="button" className="btn" onClick={() => setApprovedCount((n) => n + 1)}>
            APPROVE &amp; COPY
          </button>
          <button type="button" className="btn ghost">
            SKIP THIS ONE
          </button>
          <div className="note">
            Unmet never posts for you. Approve, paste it on the platform, done. The critic's flag stays visible until you fix it or
            override it.
          </div>
          <div className="kv">
            <div>
              <span>approved today</span>
              <span>
                {approvedCount} of {needReply}
              </span>
            </div>
            <div>
              <span>avg time to reply</span>
              <span>—</span>
            </div>
            <div>
              <span>unanswered &gt; 7 days</span>
              <span style={{ color: "var(--orange)" }}>3</span>
            </div>
          </div>
          <div className="kv" style={{ marginTop: "auto" }}>
            <div>
              <span>draft model</span>
              <span>claude-sonnet-5</span>
            </div>
            <div>
              <span>fallback</span>
              <span>local template</span>
            </div>
            <div>
              <span>cost this card</span>
              <span>$0.004</span>
            </div>
          </div>
        </div>
      </div>

      <StatusBar
        items={[
          { content: <>QUEUE <b>{drafts.length} new · {needReply} need a reply · {drafts.length - needReply} praise</b></> },
          { content: <>CRITIC <b>4 rules · deterministic</b></> },
          { content: <>DRAFTS <b>never auto-sent</b></>, push: true },
        ]}
      />
    </div>
  );
}
