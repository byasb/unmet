import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuota } from "../data/api";

interface TopbarProps {
  activeSeg?: "build" | "pulse";
  back?: { label: string; to: string };
  crumb?: ReactNode;
  liveDot?: boolean;
  showQuota?: boolean;
  children?: ReactNode;
}

export function Topbar({ activeSeg, back, crumb, liveDot, showQuota = true, children }: TopbarProps) {
  const quota = useQuota();
  const pct = (quota.used / quota.limit) * 100;

  return (
    <div className="topbar">
      <div className="brand">
        <span className={liveDot ? "dot live" : "dot"} />
        UNMET
      </div>

      {back && (
        <Link className="back" to={back.to}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          {back.label}
        </Link>
      )}

      {crumb && <div className="crumb">{crumb}</div>}

      {activeSeg && (
        <div className="seg">
          <Link to="/build" className={activeSeg === "build" ? "on" : ""}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="2" width="12" height="20" rx="2" />
              <path d="M11 18h2" />
            </svg>
            Build
          </Link>
          <Link to="/pulse" className={activeSeg === "pulse" ? "on" : ""}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Pulse
          </Link>
        </div>
      )}

      {children}

      {showQuota && (
        <div className={crumb || children ? "quota" : "quota push"}>
          <div className="ph">
            <span className="lab">SerpApi quota</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink)" }}>
              {quota.used} / {quota.limit}
            </span>
          </div>
          <div className="track">
            <div className="fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
