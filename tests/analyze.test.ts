// Ported from tests/test_analyze.py in the Python reference. Same sample
// data, same assertions -- this is the ground truth the TS port has to
// match.
import { describe, expect, it } from "vitest";
import { classifyLocal, rankGaps, writeBrief, type Review } from "../convex/analyze";

const APPS: Record<string, { title: string; rating?: number }> = {
  "1": { title: "HabitOne" },
  "2": { title: "StreakPro" },
  "3": { title: "DailyDot" },
};

function review(appId: string, rating: number, text: string, title = ""): Review {
  return { id: `${appId}-${rating}-${text.length}`, app_id: appId, rating, text, title };
}

const REVIEWS: Review[] = [
  review("1", 1, "Everything useful is behind a subscription now. It used to be free."),
  review("2", 2, "Won't sync to my iPad at all, iCloud backup just spins forever."),
  review("3", 2, "I wish there was a way to export my data to csv. No way to get it out."),
  review("1", 1, "Crashes every time I open the widget on my home screen."),
  review("2", 3, "Please add a lock screen widget, would love that."),
  review("3", 5, "Beautiful app, works perfectly for me."),
  review("1", 2, "Paywall after three habits is a rip off."),
  review("2", 1, "Lost all my data when I switched phones, no backup at all."),
];

describe("classifyLocal / rankGaps / writeBrief (ported from test_analyze.py)", () => {
  it("detects paywall, sync and export", () => {
    const labelled = REVIEWS.map(classifyLocal);
    const themes = new Set(labelled.flatMap((r) => r.themes));
    expect(themes.has("paywall")).toBe(true);
    expect(themes.has("sync")).toBe(true);
    expect(themes.has("export")).toBe(true);
  });

  it("separates requests from complaints and praise", () => {
    const labelled = REVIEWS.map(classifyLocal);
    const byPrefix = new Map(labelled.map((r) => [(r.text ?? "").slice(0, 20), r.intent]));
    expect(byPrefix.get("Please add a lock sc")).toBe("request");
    expect(byPrefix.get("Beautiful app, works")).toBe("praise");
    expect(byPrefix.get("Paywall after three ")).toBe("complaint");
  });

  it("excludes praise from gaps", () => {
    const labelled = REVIEWS.map(classifyLocal);
    const gaps = rankGaps(labelled, APPS);
    for (const g of gaps) {
      for (const q of g.quotes) {
        expect(q.rating ?? 0).toBeLessThanOrEqual(4);
      }
    }
  });

  it("breadth outranks a single loud app", () => {
    const narrow = Array.from({ length: 5 }, () => review("1", 1, "ads ads ads"));
    const broad = ["1", "2", "3"].map((id) => review(id, 1, "so many ads everywhere"));
    const onlyNarrow = rankGaps(narrow.map(classifyLocal), APPS)[0];
    const onlyBroad = rankGaps(broad.map(classifyLocal), APPS)[0];
    expect(onlyBroad.breadth).toBe(3);
    expect(onlyBroad.score).toBeGreaterThan(onlyNarrow.score);
  });

  it("brief names the top gap", () => {
    const labelled = REVIEWS.map(classifyLocal);
    const gaps = rankGaps(labelled, APPS);
    const text = writeBrief("habit tracker", Object.values(APPS), gaps, []);
    expect(text).toContain("habit tracker");
    expect(text).toContain(gaps[0].label);
  });

  it("does not crash on empty input", () => {
    expect(rankGaps([], APPS)).toEqual([]);
    expect(writeBrief("x", [], [], [])).toContain("No gaps found");
  });

  it("does not treat app vocabulary as a feature request", () => {
    // "Add a habit" is what the app does, not something a user is asking for.
    const usage = classifyLocal(
      review("1", 5, "Love it. I just add a habit and it tracks the streak."),
    );
    expect(usage.intent).toBe("praise");
    const asking = classifyLocal(
      review("1", 5, "Great app, but they should add a web version."),
    );
    expect(asking.intent).toBe("request");
  });

  it("quotes the passage that matched the theme, not the opening", () => {
    // A long review tripping several themes must not be quoted from its
    // opening under every one of them -- the quote has to evidence its own
    // theme.
    const longText =
      "I have used this for a year. " +
      "Filler sentence about nothing. ".repeat(12) +
      "They sell my data to advertisers which is unacceptable.";
    const labelled = [classifyLocal(review("1", 1, longText))];
    const gaps = rankGaps(labelled, APPS);
    const privacy = gaps.find((g) => g.theme === "privacy");
    expect(privacy).toBeDefined();
    expect(privacy!.quotes[0].text).toContain("sell");
  });

  it("does not treat category vocabulary as a privacy complaint", () => {
    // "Tracking habits" is the product working, not surveillance.
    const using = classifyLocal(review("1", 5, "Great for tracking habits every morning."));
    expect(using.themes).not.toContain("privacy");
    const real = classifyLocal(review("1", 1, "They track my location constantly, awful."));
    expect(real.themes).toContain("privacy");
  });
});
