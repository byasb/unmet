// One-time (idempotent) load of fixtures/*.json into serp_cache. Run with:
//   npx tsx scripts/seedFixtures.ts
// Requires `npx convex dev` to have run at least once (so a deployment and
// CONVEX_DEPLOYMENT exist) -- this shells out to `npx convex run`, which is
// the CLI's own supported way to invoke an internal function.
//
// This is a plain Node script, not a Convex function: Convex functions
// can't read the repo's local filesystem (see convex/seed.ts).
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFixtureName } from "../convex/cacheKey";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const FIXTURES_DIR = join(ROOT, "fixtures");

function main() {
  const files = readdirSync(FIXTURES_DIR).filter((f) => f.endsWith(".json"));
  let seeded = 0;
  let skipped = 0;

  for (const file of files) {
    const parsed = parseFixtureName(file);
    if (!parsed) {
      console.warn(`skip ${file}: doesn't match <engine>-<hash16>.json`);
      skipped++;
      continue;
    }
    const raw = readFileSync(join(FIXTURES_DIR, file), "utf8");
    const response = JSON.parse(raw);
    const row = {
      key: parsed.key,
      engine: parsed.engine,
      // Best-effort only: SerpApi's own echoed search_parameters, not
      // necessarily byte-identical to the original request dict (SerpApi
      // adds defaults like `lang`/`device`). The filename's hash is what
      // actually has to match a live serp.call(); this is just for display.
      params: response.search_parameters ?? {},
      response,
    };

    execFileSync(
      "npx",
      ["convex", "run", "seed:importFixture", JSON.stringify(row)],
      { cwd: ROOT, stdio: "inherit" },
    );
    seeded++;
  }

  console.log(`seeded ${seeded} fixture(s), skipped ${skipped}`);
}

main();
