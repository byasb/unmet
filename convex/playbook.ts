// theme -> prescribed actions, per BUILD-PLAN §Playbook. Pure and deterministic:
// the model never decides what to prescribe, only helps phrase reply drafts.
//
// Keys match LOCAL_THEMES exactly — the taxonomy built against 556 real Austin
// barbecue reviews (see ENGINE-NOTES.md). Written by the owner of a restaurant,
// not by a model: every action is something a counter-service kitchen can do
// this week, and every `why` is the pattern that showed up in the reviews.
import type { Gap } from "./analyze";

export type PlaybookAction = {
  title: string;
  why: string;
  effort: string;
  cadence: string;
};

export const PLAYBOOK: Record<string, PlaybookAction[]> = {
  meat_quality: [
    {
      title: "Taste every batch at open, noon and 2pm — pull anything that reads dry",
      why: "\"Dry\", \"tough\" and \"bland\" cluster in reviews written after 1pm. It's the hold, not the cook: brisket that sat two hours reads as a bad recipe.",
      effort: "5 min × 3",
      cadence: "daily",
    },
    {
      title: "Offer moist or lean at the counter and say it out loud",
      why: "A share of dry complaints come from lean cuts handed to people who wanted fatty. Asking costs nothing and moves the review from the meat to the choice.",
      effort: "staff brief",
      cadence: "once",
    },
    {
      title: "Post today's cut and pit time on Google Maps each morning",
      why: "The rival with the fewest meat complaints tells people what came off the pit and when. Reviewers who know the batch stop comparing it to a legend.",
      effort: "5 min",
      cadence: "daily",
    },
  ],
  value: [
    {
      title: "Put weight and what's included on the menu board and the Maps menu",
      why: "Most price complaints are a surprise at the register, not the price itself — \"per pound\" and \"for the price\" appear in the same sentence as \"small\".",
      effort: "15 min",
      cadence: "once",
    },
    {
      title: "Name the value plate in replies and on the listing",
      why: "Reviewers who mention a cheaper plate they could have had rate the visit higher than those who found out later.",
      effort: "10 min",
      cadence: "weekly",
    },
  ],
  sides: [
    {
      title: "Re-taste the two sides named most this week and fix or drop them",
      why: "Sides complaints name the same dish repeatedly — potato salad and mac and cheese in this set. A weak side drags the meat's rating down with it.",
      effort: "30 min",
      cadence: "once",
    },
    {
      title: "Make the best side the default and the weak one opt-in",
      why: "The five-star reviews that mention sides mention one of them. Lead with it.",
      effort: "menu edit",
      cadence: "once",
    },
  ],
  lines_wait: [
    {
      title: "Post today's expected wait on Google Maps by 10am, update at 12 and 2",
      why: "The complaint is rarely the wait — it's not knowing. The rival praised for short waits posts them; the one famous for long ones gets forgiven when people knew.",
      effort: "10 min",
      cadence: "daily",
    },
    {
      title: "Add the order-ahead link to the listing and the pinned post",
      why: "\"A way to order ahead\" is the second most-asked thing in the wait complaints, and a competitor is advertising exactly that.",
      effort: "20 min",
      cadence: "once",
    },
    {
      title: "Water and shade on the line on your busiest day",
      why: "Named in complaints and in five-star reviews alike as the reason people stayed or left.",
      effort: "cost",
      cadence: "one-off",
    },
  ],
  sold_out: [
    {
      title: "Post the cut-off time the moment you run low",
      why: "Guests who drive in after the sell-out with no warning leave a review; guests who were warned don't.",
      effort: "2 min",
      cadence: "daily",
    },
    {
      title: "Show what's left on the morning Maps post",
      why: "Turns a wasted trip into a decision made at home. The one-star review about hours never gets written.",
      effort: "5 min",
      cadence: "daily",
    },
  ],
  staff: [
    {
      title: "Coach the exact moment named in this week's quotes — usually the counter hand-off",
      why: "Staff complaints cluster on one interaction, not the shift. Fix the moment, not the person.",
      effort: "15 min",
      cadence: "weekly",
    },
    {
      title: "Reply naming the day and thanking them for the flag",
      why: "A specific reply reads as taken seriously; a generic one reads as ignored, and the next reviewer says so.",
      effort: "5 min",
      cadence: "per review",
    },
  ],
  consistency: [
    {
      title: "Post the daily cut list and who's on the pit",
      why: "\"Not what it used to be\" reviews want to know the batch and the hands. Naming both stops the comparison to a memory.",
      effort: "10 min",
      cadence: "daily",
    },
    {
      title: "Standardise the one step the complaints name",
      why: "The same failure recurs across different reviewers on different days — that's a process, not a bad day.",
      effort: "30 min",
      cadence: "once",
    },
  ],
  cleanliness: [
    {
      title: "Add a visible mid-shift clean of the spot the reviews name",
      why: "Cleanliness complaints name the same place — tables, the drink station, the restroom. One spot, fixed visibly, moves the number.",
      effort: "10 min",
      cadence: "daily",
    },
  ],
  parking: [
    {
      title: "Pin a parking post on Maps with the nearest real option and a photo",
      why: "A line in the description reads as flat; a pinned post gets found by people planning the trip and quoted back in replies.",
      effort: "10 min",
      cadence: "once",
    },
  ],
  seating: [
    {
      title: "Offer the quieter hour or the patio by name in replies",
      why: "Crowding complaints convert to repeat visits when a specific alternative is offered, not an apology.",
      effort: "5 min",
      cadence: "per review",
    },
  ],
  takeout: [
    {
      title: "Set the real pickup window in the listing, not the platform default",
      why: "Takeout complaints are expectation gaps against the app's estimate, not your kitchen. Change the number, not the kitchen.",
      effort: "10 min",
      cadence: "once",
    },
    {
      title: "Pack sauce and bread separately for every to-go order",
      why: "\"Soggy\" and \"cold\" are packaging words in this set, not cooking words.",
      effort: "staff brief",
      cadence: "once",
    },
  ],
  billing: [
    {
      title: "Read the total back at the counter before charging",
      why: "\"Charged\", \"unauthorized\" and \"forgot\" reviews are one-star every time and never about the food. A read-back removes the surprise.",
      effort: "staff brief",
      cadence: "once",
    },
    {
      title: "Reply with the fix, not the excuse, and make it right in the same reply",
      why: "A billing review answered publicly with a correction is the only kind that gets edited upward.",
      effort: "5 min",
      cadence: "per review",
    },
  ],
};

/** The playbook actions for a gap, each carrying its evidence count. */
export function fillPlaybook(gap: Pick<Gap, "theme" | "mentions">): PlaybookAction[] {
  const actions = PLAYBOOK[gap.theme];
  if (!actions) return [];
  return actions.map((a) => ({ ...a, why: `${a.why} (${gap.mentions} mentions this week)` }));
}
