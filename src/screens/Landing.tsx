import { Link } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";

// design-unmet-v2/Main.dc.html
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

        <div className="doors">
          <Door
            accent="build"
            num="PATH 01 · BUILD"
            visual={<BuildVisual />}
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
              label: "Demo set · cached",
              color: "var(--green)",
              term: "habit tracker",
              detail: (
                <>
                  302 reviews · 7 apps · top gap <b style={{ color: "var(--blue)", fontWeight: 500 }}>paywalls 119.6</b> in 5 of 7
                </>
              ),
            }}
            cta={{ label: "START · BUILD", sub: "for people who ship apps", to: "/build" }}
          />

          <div className="seam">
            <div className="seamline" />
            <span className="pk l" />
            <span className="pk r" />
            <div className="core">
              <i />
            </div>
            <span className="lab">one engine</span>
          </div>

          <Door
            accent="pulse"
            num="PATH 02 · PULSE"
            visual={<PulseVisual />}
            title="What's breaking on your street?"
            body="Name a kind of business and a place. It reads this week's reviews across the businesses like yours nearby, ranks what's going wrong, and tells you whether it's reached you yet."
            engines={[
              ["google_maps", "the businesses like yours nearby"],
              ["maps · yelp · tripadvisor", "this week's reviews on three platforms"],
              ["google_ai_overview", "are you cited when people ask Google"],
            ]}
            tries={[
              { label: "barbecue near Austin, TX", warm: true },
              { label: "coffee near 78701", warm: true },
            ]}
            alt="or paste a Google Maps link — that place is treated as yours, and the gaps are checked against it"
            last={{
              label: "Demo set · cached",
              color: "var(--green)",
              term: "barbecue · Austin, TX",
              detail: (
                <>
                  7 places · 3 platforms · <b style={{ color: "var(--ink)", fontWeight: 500 }}>51 calls · 0 live</b> · ~40s
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

function BuildVisual() {
  return (
    <>
      <div className="phone">
        <svg width="120" height="236" viewBox="0 0 120 236" fill="none">
          <rect className="frame" x="1" y="1" width="118" height="234" rx="18" />
          <path className="line a" d="M24 60h72" />
          <path className="line b" d="M24 92h58" />
          <path className="line c" d="M24 124h66" />
          <rect x="46" y="212" width="28" height="4" rx="2" fill="var(--blue-soft)" />
        </svg>
      </div>
      <div className="stars">★★☆☆☆</div>
      <div className="bub one">
        <b>2★</b>"paywall after three days"
      </div>
      <div className="bub two">
        <b>1★</b>"lost a 40-day streak"
      </div>
      <div className="bub three">
        <b>3★</b>"widgets, please"
      </div>
    </>
  );
}

function PulseVisual() {
  return (
    <>
      <div className="street">
        <svg viewBox="0 0 600 250" preserveAspectRatio="xMidYMid slice">
          <path className="road" d="M0 60 L600 40" />
          <path className="road" d="M0 150 L600 130" />
          <path className="road" d="M0 230 L600 210" />
          <path className="road" d="M120 0 L100 250" />
          <path className="road" d="M480 0 L460 250" />
          <path className="road main" d="M300 0 L300 250" />
          <path className="road" d="M0 0 L600 250" />
        </svg>
      </div>
      <span className="peer" style={{ left: "22%", top: "40%", animationDelay: "2.2s" }} />
      <span className="peer hot" style={{ left: "31%", top: "66%", animationDelay: "2.4s" }} />
      <span className="peer" style={{ left: "70%", top: "30%", animationDelay: "2.6s" }} />
      <span className="peer hot" style={{ left: "76%", top: "72%", animationDelay: "2.8s" }} />
      <span className="peer" style={{ left: "58%", top: "82%", animationDelay: "3s" }} />
      <span className="peer hot" style={{ left: "40%", top: "20%", animationDelay: "3.2s" }} />
      <div className="orbit">
        <span className="g">G</span>
        <span className="y">Y</span>
        <span className="t">T</span>
      </div>
      <div className="pin">
        <span className="ring a" />
        <span className="ring b" />
        <span className="ring c" />
        <i />
      </div>
      <div className="hq">
        <i />
        SERPAPI HQ · 0.5 MI
      </div>
    </>
  );
}

function Door(props: {
  accent: "build" | "pulse";
  num: string;
  visual: React.ReactNode;
  title: string;
  body: string;
  engines: [string, string][];
  tries: { label: string; warm: boolean }[];
  alt: string;
  last: { label: string; color: string; term: string; detail: React.ReactNode };
  cta: { label: string; sub: string; to: string };
}) {
  return (
    <div className={`door ${props.accent}`}>
      <span className="num">{props.num}</span>
      <div className="vis">{props.visual}</div>
      <div className="copy">
        <h2>{props.title}</h2>
        <p>{props.body}</p>
        <div className="eng">
          {props.engines.map(([name, desc]) => (
            <div key={name}>
              <b>{name}</b>
              <span>{desc}</span>
            </div>
          ))}
        </div>
        <div className="try">
          <span className="lab">try</span>
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
      </div>
      <Link to={props.cta.to} className="enter">
        <span>{props.cta.label} →</span>
        <span>{props.cta.sub}</span>
      </Link>
    </div>
  );
}
