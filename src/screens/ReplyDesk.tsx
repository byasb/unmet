import { useEffect, useState } from "react";
import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";
import { Pips } from "../components/Pips";
import { SourceSquare } from "../components/SourceSquare";
import { useBusiness, useDraftReplies, useDrafts, useSetDraftStatus, toSourceCode } from "../data/api";

// design-unmet/Replies.dc.html
export function ReplyDesk() {
  const business = useBusiness();
  const drafts = useDrafts(business?._id);
  const setStatus = useSetDraftStatus();
  const draftReplies = useDraftReplies();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);

  useEffect(() => {
    if (drafts && drafts.length > 0 && !activeId) {
      setActiveId(drafts.find((d) => d.status === "drafted")?._id ?? drafts[0]._id);
    }
  }, [drafts, activeId]);

  if (business === undefined || drafts === undefined) {
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

  async function onDraftReplies() {
    if (!business || drafting) return;
    setDrafting(true);
    try {
      await draftReplies({ businessId: business._id });
    } finally {
      setDrafting(false);
    }
  }

  const active = drafts.find((d) => d._id === activeId) ?? drafts[0];
  const needReply = drafts.filter((d) => d.review && (d.review.rating ?? 5) <= 3).length;
  const approvedCount = drafts.filter((d) => d.status === "approved").length;

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
        <span className="tag warm">live</span>
      </Topbar>

      {drafts.length === 0 ? (
        <div className="stage" style={{ alignItems: "center", justifyContent: "center", gap: 16 }}>
          <span className="lab">No drafts yet for this business.</span>
          <button type="button" className="btn" onClick={onDraftReplies} disabled={drafting}>
            {drafting ? "DRAFTING…" : "DRAFT REPLIES"}
          </button>
        </div>
      ) : (
        <div className="body2">
          <div className="queue">
            <div className="qh">
              <span className="lab">Drafts · {drafts.length}</span>
              <span className="lab">{needReply} need a reply</span>
            </div>
            {drafts.map((d) => (
              <button key={d._id} type="button" className={d._id === activeId ? "qi on" : "qi"} onClick={() => setActiveId(d._id)}>
                <div className="l1">
                  {d.review && <SourceSquare code={toSourceCode(d.review.source)} />}
                  <Pips rating={d.review?.rating ?? 0} />
                  <span className="tag">{d.status}</span>
                </div>
                <span className="t">{d.review?.text ?? "(review deleted)"}</span>
              </button>
            ))}
          </div>

          {active && (
            <>
              <div className="main">
                <div className="review">
                  <div className="meta">
                    {active.review && <SourceSquare code={toSourceCode(active.review.source)} />}
                    <Pips rating={active.review?.rating ?? 0} />
                    <span className="lab">{active.review?.placeId ?? ""}</span>
                  </div>
                  <p>{active.review?.text ?? "(review deleted)"}</p>
                </div>

                <div>
                  <div className="ph" style={{ marginBottom: 8 }}>
                    <span className="lab">Drafted reply</span>
                    <span className="lab">edit anything · critic below</span>
                  </div>
                  <div className="draft">
                    <p>{active.text || "Drafting…"}</p>
                  </div>
                </div>

                {active.checks.length > 0 && (
                  <div className="critic">
                    <div className="ph">
                      <span className="lab">
                        Critic · {active.checks.filter((c) => c.pass).length} of {active.checks.length} passed
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
              </div>

              <div className="side" style={{ width: 300 }}>
                <button
                  type="button"
                  className="btn"
                  disabled={active.status !== "drafted"}
                  onClick={() => {
                    navigator.clipboard?.writeText(active.text);
                    setStatus({ draftId: active._id, status: "approved" });
                  }}
                >
                  APPROVE &amp; COPY
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  disabled={active.status !== "drafted"}
                  onClick={() => setStatus({ draftId: active._id, status: "skipped" })}
                >
                  SKIP THIS ONE
                </button>
                <div className="note">
                  Unmet never posts for you. Approve, paste it on the platform, done.
                </div>
                <div className="kv">
                  <div>
                    <span>approved</span>
                    <span>
                      {approvedCount} of {drafts.length}
                    </span>
                  </div>
                </div>
                <button type="button" className="btn ghost" style={{ marginTop: "auto" }} onClick={onDraftReplies} disabled={drafting}>
                  {drafting ? "DRAFTING…" : "DRAFT MORE"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <StatusBar
        items={[
          { content: <>QUEUE <b>{drafts.length} drafts</b></> },
          { content: <>CRITIC <b>3 rules · deterministic</b></> },
          { content: <>DRAFTS <b>never auto-sent</b></>, push: true },
        ]}
      />
    </div>
  );
}
