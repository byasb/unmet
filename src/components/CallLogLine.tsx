import type { CallRow } from "../data/types";

// One row of the telemetry log in the side panel — engine, params, live/cache
// tag, latency. `arrive` animates it in for the Reading screen.
export function CallLogLine({ call, arrive, delayMs }: { call: CallRow; arrive?: boolean; delayMs?: number }) {
  return (
    <div style={arrive ? { opacity: 0, animation: "arrive 0.35s ease-out forwards", animationDelay: `${delayMs ?? 0}ms` } : undefined}>
      <span className="eng">{call.engine}</span>
      <span className="prm">{call.paramsSummary}</span>
      <span className={call.live ? "tagtxt live" : "tagtxt ok"}>{call.live ? "live" : "cache"}</span>
      <span className="ms">{call.ms == null ? "—" : `${call.ms}ms`}</span>
    </div>
  );
}
