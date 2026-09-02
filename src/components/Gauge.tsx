// Ticks ruler + filled gauge bar, as seen under every gap row's rank line.
export function Gauge({ percent }: { percent: number }) {
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div>
      <div className="ticks" />
      <div className="gauge">
        <div style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
