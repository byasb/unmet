// theme -> prescribed actions, per BUILD-PLAN §Playbook. Pure and
// deterministic: the model never decides what to prescribe, only helps
// phrase reply drafts (llm.ts). Wording is lifted from design-unmet's
// Morning.dc.html / Action.dc.html so the cockpit and the plan agree.
import type { Gap } from "./analyze";

export type PlaybookAction = {
  title: string;
  why: string;
  effort: string;
  cadence: string;
};

// Two to three entries per local theme. `why` and `title` read best when
// filled from a real gap (see fillPlaybook below); these are the templates.
export const PLAYBOOK: Record<string, PlaybookAction[]> = {
  lines_wait: [
    {
      title: "Post today's expected wait on Google Maps by 10am, update at 12 and 2",
      why: "The complaint is not the wait, it's the surprise. The rival praised for waits posts hours daily and has 0 wait complaints this week.",
      effort: "10 min",
      cadence: "daily",
    },
    {
      title: "Add the pre-order link to the Maps listing and the pinned post",
      why: "A nearby competitor is advertising exactly this right now, to the same customers, the same search.",
      effort: "20 min",
      cadence: "once",
    },
    {
      title: "Put water and shade near the line on your busiest day",
      why: "Mentioned in complaints and in five-star reviews alike as the reason people stayed.",
      effort: "cost",
      cadence: "one-off",
    },
  ],
  sold_out: [
    {
      title: "Post the cut-off time the moment you run low",
      why: "Guests who show up after the sell-out and get no warning leave a review; guests who are warned don't.",
      effort: "2 min",
      cadence: "daily",
    },
    {
      title: "Show remaining stock on the Maps post each morning",
      why: "Removes the wasted trip that turns into a one-star review about hours, not food.",
      effort: "5 min",
      cadence: "daily",
    },
  ],
  price_portion: [
    {
      title: "Add portion size or weight to the menu description",
      why: "Most price complaints are really a value-for-size surprise, not the price itself.",
      effort: "15 min",
      cadence: "once",
    },
    {
      title: "Call out the value option in the reply and the listing",
      why: "Reviewers who mention a cheaper alternative on the menu rate the visit higher.",
      effort: "10 min",
      cadence: "weekly",
    },
  ],
  staff: [
    {
      title: "Coach the specific moment named in this week's quotes",
      why: "Staff complaints cluster on one interaction point, not the whole shift.",
      effort: "15 min",
      cadence: "weekly",
    },
    {
      title: "Reply naming the shift and thanking the guest for the flag",
      why: "A specific reply reads as taken-seriously; a generic one reads as ignored.",
      effort: "5 min",
      cadence: "per review",
    },
  ],
  consistency: [
    {
      title: "Keep the daily cut-list / prep post running",
      why: "Reviewers who see today's batch called out stop comparing it to \"how it used to be\".",
      effort: "10 min",
      cadence: "daily",
    },
    {
      title: "Standardise the recipe step named in the complaints",
      why: "Same theme keeps recurring across different reviewers and different days.",
      effort: "30 min",
      cadence: "once",
    },
  ],
  cleanliness: [
    {
      title: "Add a visible mid-shift cleaning pass at the flagged spot",
      why: "Cleanliness complaints name the same area repeatedly; fixing that one spot moves the number.",
      effort: "10 min",
      cadence: "daily",
    },
  ],
  parking: [
    {
      title: "Pin a parking post on Maps with the nearest real option",
      why: "A description alone reads as flat; a pinned post with a photo gets referenced in replies.",
      effort: "10 min",
      cadence: "once",
    },
  ],
  delivery: [
    {
      title: "Note the real delivery window in the listing, not the platform default",
      why: "Delivery complaints are mostly expectation gaps against the platform's estimate, not your kitchen.",
      effort: "10 min",
      cadence: "once",
    },
  ],
  noise: [
    {
      title: "Offer the quieter table or hour proactively in replies",
      why: "Noise complaints convert to repeat visits once a quieter option is offered by name.",
      effort: "5 min",
      cadence: "per review",
    },
  ],
  used_to_be_better: [
    {
      title: "Name what changed and what's coming back in a reply and a post",
      why: "\"Used to be better\" reviews want acknowledgement of the change, not just a discount.",
      effort: "10 min",
      cadence: "once",
    },
  ],
};

/** Fills the top playbook action for a gap's theme with its own evidence. */
export function fillPlaybook(gap: Pick<Gap, "theme" | "mentions">): PlaybookAction[] {
  const actions = PLAYBOOK[gap.theme];
  if (!actions) return [];
  return actions.map((a) => ({
    ...a,
    why: `${a.why} (${gap.mentions} mentions this week)`,
  }));
}
