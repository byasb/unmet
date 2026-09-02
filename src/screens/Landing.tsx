import { Link } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";

export function Landing() {
  return (
    <div className="root">
      <Topbar>
        <span className="lab">Review intelligence · built on SerpApi</span>
      </Topbar>

      <div className="stage">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 46, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>
            Customer complaints are your roadmap.
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: "var(--mute2)" }}>
            Pick where to look. Both paths read hundreds of reviews, rank the gaps, and quote them in their own words.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 24, flexGrow: 1, minHeight: 0 }}>
          <PathCard
            num="PATH 01 · BUILD"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="2" width="12" height="20" rx="2" />
                <path d="M11 18h2" />
              </svg>
            }
            title="What should you build next?"
            body="Name a category. It reads hundreds of reviews across the apps already ranking for it and shows the gaps none of them have filled — before you write a line."
            engines={[
              ["apple_app_store", "the apps ranking for the term"],
              ["apple_reviews", "hundreds of their reviews, two sorts"],
              ["google_trends · autocomplete", "is there search demand behind the gap"],
            ]}
            tries={[
              { label: "habit tracker", warm: false },
              { label: "receipt scanner", warm: false },
              { label: "budget app", warm: true },
            ]}
            alt="or paste an App Store link — that app is treated as yours, and the gaps are checked against it"
            last={{
              label: "Last run · real",
              color: "var(--green)",
              term: "habit tracker",
              detail: (
                <>
                  302 reviews · 7 apps · top gap <b style={{ color: "var(--orange)", fontWeight: 500 }}>paywalls 119.6</b> in 5 of 7
                </>
              ),
            }}
            cta={{ label: "START · BUILD", sub: "for people who ship apps", to: "/build" }}
          />
          <PathCard
            num="PATH 02 · PULSE"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            }
            title="What's breaking on your street?"
            body="Name a kind of business and a place. It reads this week's reviews across the businesses like yours nearby, ranks what's going wrong, and tells you whether it's reached you yet."
            engines={[
              ["google_maps", "the businesses like yours nearby"],
              ["maps · yelp · tripadvisor · opentable", "this week's reviews on four platforms"],
              ["google_ai_overview", "are you cited when people ask Google"],
            ]}
            tries={[
              { label: "barbecue near Austin, TX", warm: true },
              { label: "coffee near 78701", warm: true },
            ]}
            alt="or paste a Google Maps link — that place is treated as yours, and the gaps are checked against it"
            last={{
              label: "Next run · live",
              color: "var(--orange)",
              term: "barbecue · Austin, TX",
              detail: (
                <>
                  7 places · 2 sorts · <b style={{ color: "var(--ink)", fontWeight: 500 }}>17 calls</b> · ~12s
                </>
              ),
            }}
            cta={{ label: "START · PULSE", sub: "for people who run a place · daily", to: "/pulse" }}
          />
        </div>
      </div>

      <StatusBar
        items={[
          { content: <>SOURCES <b>9 SerpApi engines</b></> },
          { content: <>CACHED <b>habit tracker · receipt scanner</b> · replay free</> },
          { content: <>green dot <b>cached</b> · orange dot <b>live</b></>, push: true },
        ]}
      />
    </div>
  );
}

function PathCard(props: {
  num: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  engines: [string, string][];
  tries: { label: string; warm: boolean }[];
  alt: string;
  last: { label: string; color: string; term: string; detail: React.ReactNode };
  cta: { label: string; sub: string; to: string };
}) {
  return (
    <div style={{ border: "1px solid var(--hairline3)", background: "var(--panel)", padding: "28px 30px 26px", display: "flex", flexDirection: "column", gap: 18, position: "relative" }}>
      <span className="mono" style={{ position: "absolute", top: 22, right: 26, fontSize: 11, letterSpacing: "0.14em", color: "var(--dim)" }}>
        {props.num}
      </span>
      <div style={{ width: 44, height: 44, border: "1px solid var(--hairline3)", display: "flex", alignItems: "center", justifyContent: "center" }}>{props.icon}</div>
      <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.015em", lineHeight: 1.1 }}>{props.title}</h2>
      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: "#b6bec7", maxWidth: "46ch" }}>{props.body}</p>
      <div className="mono" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11.5, color: "var(--mute)" }}>
        {props.engines.map(([name, desc]) => (
          <div key={name} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
            <b style={{ color: "var(--ink)", fontWeight: 500, width: 214, flexShrink: 0 }}>{name}</b>
            <span>{desc}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span className="lab">Try</span>
        {props.tries.map((t) => (
          <span key={t.label} className="chip">
            <i className={t.warm ? "warm" : undefined} />
            {t.label}
          </span>
        ))}
      </div>
      <span className="mono" style={{ fontSize: 11, color: "var(--mute2)" }}>{props.alt}</span>
      <div style={{ border: "1px solid var(--hairline2)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        <span className="lab" style={{ color: props.last.color }}>{props.last.label}</span>
        <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{props.last.term}</span>
          <span className="mono" style={{ fontSize: 11.5, color: "var(--mute2)" }}>{props.last.detail}</span>
        </div>
      </div>
      <Link to={props.cta.to} className="btn lg" style={{ marginTop: "auto", textDecoration: "none" }}>
        <span>{props.cta.label}</span>
        <span>{props.cta.sub}</span>
      </Link>
    </div>
  );
}
