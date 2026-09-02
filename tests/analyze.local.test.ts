// Ports the two local-taxonomy tests from unmet/tests/test_analyze.py
// (test_local_taxonomy_ignores_barbecue_praise_vocabulary and
// test_local_taxonomy_scores_with_the_same_engine) against the TS port in
// convex/analyze.local.ts. No Convex imports involved -- runs with no
// deployment.
import { describe, expect, it } from "vitest";
import { classifyLocal, rankGapsLocal, type LocalReview } from "../convex/analyze.local";

function review(appId: string, rating: number, text: string, title = ""): LocalReview {
  return { app_id: appId, rating, text, title };
}

describe("local taxonomy ignores barbecue praise vocabulary", () => {
  it("'dry rub' and 'worth the line' are praise, not meat_quality", () => {
    const praise = classifyLocal(review("1", 5, "Perfect dry rub, cold beer, waited in line and it was worth it."));
    expect(praise.themes).not.toContain("meat_quality");
    expect(praise.intent).toBe("praise");
  });

  it("actual dry/bland complaints hit meat_quality and sides", () => {
    const dry = classifyLocal(review("1", 2, "Brisket was dry and the potato salad was bland."));
    expect(dry.themes).toContain("meat_quality");
    expect(dry.themes).toContain("sides");
  });

  it("a real wait complaint hits lines_wait", () => {
    const wait = classifyLocal(review("1", 2, "Waited over two hours in line with no sign of how long."));
    expect(wait.themes).toContain("lines_wait");
  });
});

describe("local taxonomy scores with the same engine", () => {
  it("three places, one dry-meat complaint each -> breadth 3, top gap is meat_quality", () => {
    const rows = [
      classifyLocal(review("Stiles", 2, "Brisket was dry.")),
      classifyLocal(review("Franklin", 1, "Dry brisket, tough ribs.")),
      classifyLocal(review("Terry", 2, "The brisket was so dry.")),
    ];
    const gaps = rankGapsLocal(rows, {
      Stiles: { title: "Stiles" },
      Franklin: { title: "Franklin" },
      Terry: { title: "Terry" },
    });
    expect(gaps[0].theme).toBe("meat_quality");
    expect(gaps[0].breadth).toBe(3);
    expect(gaps[0].label).toBe("Dry, tough or bland meat");
  });
});
