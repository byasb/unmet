import { describe, expect, it } from "vitest";
import { checkNamesIssue, checkNoLiability, checkNoUnstartedPromise, runCritic } from "../convex/critic";

describe("checkNamesIssue", () => {
  it("passes when the draft shares a theme keyword with the review", () => {
    const check = checkNamesIssue("Sorry the sync to iCloud has been unreliable.", ["sync"]);
    expect(check.pass).toBe(true);
  });

  it("fails a generic apology with no theme keyword", () => {
    const check = checkNamesIssue("Sorry to hear that, we appreciate your feedback.", ["sync"]);
    expect(check.pass).toBe(false);
  });

  it("never auto-passes on an unfilled local theme (empty regex)", () => {
    // lines_wait's regex is empty until Fable fills it in -- an empty
    // pattern would match any string, which must not read as "names the
    // issue".
    const check = checkNamesIssue("Anything at all", ["lines_wait"]);
    expect(check.pass).toBe(false);
  });
});

describe("checkNoLiability", () => {
  it("fails on refund/compensation language", () => {
    expect(checkNoLiability("We'll issue a refund for your order.").pass).toBe(false);
    expect(checkNoLiability("We guarantee this won't happen again.").pass).toBe(false);
  });

  it("passes ordinary acknowledgement text", () => {
    expect(checkNoLiability("Thanks for the feedback on our sync issue.").pass).toBe(true);
  });
});

describe("checkNoUnstartedPromise", () => {
  it("fails a claim of started work with no matching action", () => {
    const check = checkNoUnstartedPromise("We've added a fix for this already.", false);
    expect(check.pass).toBe(false);
  });

  it("passes the same claim when a matching action exists", () => {
    const check = checkNoUnstartedPromise("We've added a fix for this already.", true);
    expect(check.pass).toBe(true);
  });

  it("passes text that makes no started-work claim regardless of actions", () => {
    expect(checkNoUnstartedPromise("Thanks for flagging this, we'll look into it.", false).pass).toBe(true);
  });
});

describe("runCritic", () => {
  it("runs all three rules", () => {
    const checks = runCritic({
      text: "Sorry about the sync issue -- we're starting work on it now.",
      theme: "sync",
      reviewThemes: ["sync"],
      hasActiveAction: false,
    });
    expect(checks.map((c) => c.rule)).toEqual([
      "names_issue",
      "no_liability",
      "no_unstarted_promise",
    ]);
    expect(checks.find((c) => c.rule === "names_issue")?.pass).toBe(true);
    expect(checks.find((c) => c.rule === "no_unstarted_promise")?.pass).toBe(false);
  });
});
