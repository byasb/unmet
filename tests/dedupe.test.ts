// Ported from api.py's run_category dedupe step (the two review sorts,
// mosthelpful and mostrecent, overlap).
import { describe, expect, it } from "vitest";
import { dedupeReviews, hashReviewText } from "../convex/dedupe";

describe("dedupeReviews", () => {
  it("drops the same review pulled from both sorts", () => {
    const mostHelpful = [
      { app_id: "1", text: "Crashes constantly, unusable." },
      { app_id: "1", text: "Great app overall." },
    ];
    const mostRecent = [
      { app_id: "1", text: "Crashes constantly, unusable." }, // duplicate
      { app_id: "1", text: "New review since last pull." },
    ];
    const deduped = dedupeReviews([...mostHelpful, ...mostRecent]);
    expect(deduped).toHaveLength(3);
  });

  it("keeps reviews with the same text from different apps", () => {
    const deduped = dedupeReviews([
      { app_id: "1", text: "Too many ads" },
      { app_id: "2", text: "Too many ads" },
    ]);
    expect(deduped).toHaveLength(2);
  });

  it("keys on the first 200 characters, like the Python reference", () => {
    const long = "x".repeat(500);
    const a = { app_id: "1", text: long + " tail A" };
    const b = { app_id: "1", text: long + " tail B" }; // differs only after char 200
    expect(dedupeReviews([a, b])).toHaveLength(1);
  });

  it("attaches a stable hash usable as a dedupe/index key", () => {
    expect(hashReviewText("same text")).toBe(hashReviewText("  same text  "));
    expect(hashReviewText("a")).not.toBe(hashReviewText("b"));
  });
});
