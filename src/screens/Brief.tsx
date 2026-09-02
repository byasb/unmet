import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";
import { useBrief, useRun } from "../data/api";

interface BriefGap {
  n: string;
  title: string;
  score: string;
  body: string;
  quote?: string;
  quoteAttr?: string;
}

// Tiny parser for the specific brief markdown shape produced by
// api.brief.render (see BUILD_BRIEF_MARKDOWN) — good enough without a
// markdown dependency: a title, a lede paragraph, then "## N · Title —
// score" sections each with a paragraph and an optional blockquote.
function parseBrief(md: string) {
  const blocks = md.trim().split(/\n\n+/);
  const title = blocks[0].replace(/^#\s+/, "");
  const lede = blocks[1];
  const gaps: BriefGap[] = [];
  for (let i = 2; i < blocks.length; i++) {
    const heading = blocks[i].match(/^##\s+(\d+)\s*·\s*(.+?)\s+—\s+(.+)$/);
    if (!heading) continue;
    const [, n, title2, score] = heading;
    const body = blocks[i + 1] ?? "";
    let quote: string | undefined;
    let quoteAttr: string | undefined;
    const next = blocks[i + 2];
    if (next?.startsWith(">")) {
      const lines = next.split("\n").map((l) => l.replace(/^>\s?/, ""));
      quote = lines[0]?.replace(/^"|"$/g, "");
      quoteAttr = lines[1]?.replace(/^—\s*/, "");
      i += 1;
    }
    gaps.push({ n, title: title2, score, body, quote, quoteAttr });
    i += 1;
  }
  return { title, lede, gaps };
}

// design-unmet/Brief.dc.html — PDF/Doctavian is cut per BUILD-PLAN.md
// ("No: ... Doctavian (cut)"), so this renders markdown as simple HTML only.
export function Brief() {
  const { runId } = useParams<{ runId: string }>();
  const run = useRun(runId);
  const md = useBrief();
  const parsed = useMemo(() => parseBrief(md), [md]);
  const [format, setFormat] = useState<"markdown" | "json">("markdown");

  return (
    <div className="root">
      <Topbar
        crumb={
          <>
            <span>{run.term}</span>
            <span style={{ color: "var(--dim)" }}>/</span>
            <b>build brief</b>
          </>
        }
      >
        <span className="lab" style={{ marginLeft: "auto" }}>
          Output · rendered document
        </span>
      </Topbar>

      <div className="body2">
        <div className="rail">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="lab">Format</span>
            <button type="button" className={format === "markdown" ? "opt on" : "opt"} onClick={() => setFormat("markdown")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h10" />
              </svg>
              Markdown
            </button>
            <button type="button" className={format === "json" ? "opt on" : "opt"} onClick={() => setFormat("json")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 4H6a2 2 0 0 0-2 2v4c0 1-1 2-2 2 1 0 2 1 2 2v4a2 2 0 0 0 2 2h2" />
                <path d="M16 4h2a2 2 0 0 1 2 2v4c0 1 1 2 2 2-1 0-2 1-2 2v4a2 2 0 0 1-2 2h-2" />
              </svg>
              JSON
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span className="lab">Source</span>
            <div className="kv">
              <div>
                <span>run</span>
                <span>{run.term}</span>
              </div>
              <div>
                <span>gaps</span>
                <span>{parsed.gaps.length} rendered</span>
              </div>
              <div>
                <span>reviews</span>
                <span>{run.reviewCount}</span>
              </div>
              <div>
                <span>PDF export</span>
                <span>cut — markdown only</span>
              </div>
            </div>
          </div>
        </div>

        <div className="brief-stage">
          {format === "markdown" ? (
            <div className="paper">
              <div className="pmeta">
                <span>Unmet · build brief</span>
                <span>Generated {new Date().toISOString().slice(0, 10)}</span>
              </div>
              <h1 className="ptitle">{parsed.title}</h1>
              <p className="plede">{parsed.lede}</p>
              {parsed.gaps.map((g) => (
                <div className="gap" key={g.n}>
                  <div className="gh">
                    <span className="n">{g.n}</span>
                    <span className="t">{g.title}</span>
                    <span className="s">{g.score}</span>
                  </div>
                  <p>{g.body}</p>
                  {g.quote && (
                    <blockquote>
                      "{g.quote}"<span>{g.quoteAttr}</span>
                    </blockquote>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <pre className="mono paper" style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(parsed, null, 2)}
            </pre>
          )}
        </div>

        <div className="actions">
          <button type="button" className="btn" onClick={() => navigator.clipboard?.writeText(md)}>
            COPY MARKDOWN
          </button>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span className="lab">Render</span>
            <div className="step">
              <span className="ok2" />
              <span className="t">data compiled</span>
              <span className="c">{run.reviewCount} reviews</span>
            </div>
            <div className="step">
              <span className="ok2" />
              <span className="t">template bound</span>
              <span className="c">{parsed.gaps.length} gaps</span>
            </div>
            <div className="step">
              <span className="ok2" />
              <span className="t">generated</span>
              <span className="c">{md.length}</span>
            </div>
          </div>
        </div>
      </div>

      <StatusBar
        items={[
          { content: <>RUN <b>{new Date(run.startedAt).toISOString()}</b></> },
          { content: <>FORMAT <b>{format}</b></>, push: true },
        ]}
      />
    </div>
  );
}
