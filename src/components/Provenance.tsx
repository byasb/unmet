// Where did the numbers on this screen come from? One chip, same everywhere:
// green = every call replayed from cache (demo set / fixtures, zero quota),
// orange = some calls hit SerpApi live during this run.
export function Provenance({
  liveCalls,
  cachedCalls,
  at,
  compact,
}: {
  liveCalls?: number | null;
  cachedCalls?: number | null;
  at?: number | null;
  compact?: boolean;
}) {
  const live = liveCalls ?? 0;
  const cached = cachedCalls ?? 0;
  const replay = live === 0;
  const when = at ? new Date(at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : null;
  return (
    <span className={`prov ${replay ? "replay" : "live"}`} title={replay ? "Every SerpApi call in this run was answered from the cache — demo data, zero quota spent." : "This run made live SerpApi calls."}>
      <i />
      {replay ? "CACHED REPLAY" : "LIVE DATA"}
      {!compact && (
        <>
          <b>·</b> {live} live · {cached} cached
          {when && (
            <>
              <b>·</b> {when}
            </>
          )}
        </>
      )}
    </span>
  );
}
