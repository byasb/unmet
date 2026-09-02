// Three deterministic checks on a reply draft, per BUILD-PLAN §Critic. Pure
// functions -- no Convex imports, no model calls. llm.ts (Subagent B) drafts
// the text; this only ever grades it.
import { THEMES, LOCAL_THEMES } from "./analyze";

export type CriticCheck = { rule: string; pass: boolean; note: string };

function themeRegex(theme: string): RegExp | undefined {
  // LOCAL_THEMES entries are empty-bodied until Fable fills them in (see
  // analyze.ts) -- an empty pattern would match everything, so treat it as
  // "no regex" rather than "matches anything".
  const source = THEMES[theme]?.[1] || LOCAL_THEMES[theme]?.[1];
  return source ? new RegExp(source, "i") : undefined;
}

/** Rule 1: the draft has to name the specific issue, not just apologise. */
export function checkNamesIssue(draftText: string, themes: string[]): CriticCheck {
  const regexes = themes.map(themeRegex).filter((r): r is RegExp => Boolean(r));
  const pass = regexes.length > 0 && regexes.some((rx) => rx.test(draftText));
  return {
    rule: "names_issue",
    pass,
    note: pass
      ? "shares a theme keyword with the review"
      : "draft doesn't reference the review's theme",
  };
}

const LIABILITY_WORDS =
  /\brefunds?\b|\breimburse(d|ment)?\b|\bcompensat(e|ed|ion)\b|\bliab(le|ility)\b|\bguarantee(d)?\b|\bfree (meal|item|replacement|refill)\b|\bwe(’|')?ll pay\b|\bmoney back\b/i;

/** Rule 2: no promise the business can be held to -- refunds, comp, liability. */
export function checkNoLiability(draftText: string): CriticCheck {
  const hit = LIABILITY_WORDS.exec(draftText);
  return {
    rule: "no_liability",
    pass: !hit,
    note: hit
      ? `contains liability language ("${hit[0]}")`
      : "no refund/compensation language",
  };
}

const PROMISE_STARTED =
  /\bwe(’|')?re starting\b|\bwe now\b|\bwe(’|')?ve (added|started)\b|\bwe just (added|launched|started)\b|\bnow offering\b/i;

/**
 * Rule 3: no promise of something not started. `hasActiveAction` is true
 * when the caller found a matching `actions` row in state "today" or "done"
 * for this theme -- that lookup needs the DB, so it stays outside this pure
 * function.
 */
export function checkNoUnstartedPromise(
  draftText: string,
  hasActiveAction: boolean,
): CriticCheck {
  const claimsStarted = PROMISE_STARTED.test(draftText);
  const pass = !claimsStarted || hasActiveAction;
  return {
    rule: "no_unstarted_promise",
    pass,
    note: !claimsStarted
      ? "no started-work claim"
      : hasActiveAction
        ? "matching action is today/done"
        : "claims work already started with no matching action in today/done",
  };
}

export function runCritic(input: {
  text: string;
  theme: string;
  reviewThemes: string[];
  hasActiveAction: boolean;
}): CriticCheck[] {
  const themes = input.reviewThemes.length ? input.reviewThemes : [input.theme];
  return [
    checkNamesIssue(input.text, themes),
    checkNoLiability(input.text),
    checkNoUnstartedPromise(input.text, input.hasActiveAction),
  ];
}
