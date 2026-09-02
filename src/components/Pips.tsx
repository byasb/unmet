// 5-square star-rating rendered as filled squares (quote evidence, review rows).
export function Pips({ rating, small }: { rating: number; small?: boolean }) {
  const filled = Math.round(rating);
  return (
    <div className={small ? "pips sm" : "pips"}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < filled ? "on" : undefined} />
      ))}
    </div>
  );
}
