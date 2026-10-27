import type { PracticeId } from "./types";
import { addMonths } from "./dates";

/**
 * Practice registry. A practice is a self-contained module: prompt, fields, and how it resurfaces.
 * Adding a practice = adding one object here (and its id to PracticeId).
 */
export interface Field {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  long?: boolean;
  /** this field's text becomes the entry body (searchable, shown large) */
  isBody?: boolean;
}

export interface Practice {
  id: PracticeId;
  title: string;
  blurb: string;
  prompt: string;
  fields: Field[];
  /** the field whose text is used as a short subject line in the archive */
  subjectKey?: string;
  /** days after the entry that it should resurface; return undefined for none */
  checkBack?: { label: string; months: number }[];
  why: string; // one honest line on why this works
  /** show the user's Enough Line above the form */
  showEnough?: boolean;
  /** only offered when the user has opted in (Settings → Counted Days) */
  optIn?: "countedDays";
}

export const PRACTICES: Record<PracticeId, Practice> = {
  past_self: {
    id: "past_self",
    title: "Past-Self Wishlist",
    blurb: "What a younger you once hoped for",
    prompt: "What do you have right now that a younger you once hoped for?",
    fields: [
      { key: "then", label: "How old were you, and what did you hope for?", placeholder: "At 22, I wanted…", required: false },
      { key: "now", label: "What do you have now?", placeholder: "Right now I have…", long: true, required: true, isBody: true },
    ],
    subjectKey: "then",
    why: "Every goal you hit moves the finish line. This puts the old finish line back in view.",
  },
  mental_subtraction: {
    id: "mental_subtraction",
    title: "Mental Subtraction",
    blurb: "Imagine it never happened",
    prompt: "Pick one thing in your life. Imagine it never happened. Describe the version of you without it.",
    fields: [
      { key: "thing", label: "The thing", placeholder: "How I met…, that job, that house…", required: true },
      { key: "without", label: "The version of you without it", placeholder: "Without it, I would be…", long: true, required: true, isBody: true },
    ],
    subjectKey: "thing",
    why: "Imagining absence tends to build more appreciation than listing what you have (Koo et al., 2008).",
  },
  win_thank: {
    id: "win_thank",
    title: "Win → Thank",
    blurb: "Pride, with its roots showing",
    prompt: "What did you get done? And who or what made it possible?",
    fields: [
      { key: "win", label: "The win", placeholder: "Don't shrink it. Say it plainly.", required: true },
      { key: "thanks", label: "Who or what made it possible?", placeholder: "A person, a circumstance, a lucky break…", long: true, required: true, isBody: true },
    ],
    subjectKey: "win",
    why: "The win stays exactly as big. You just see what's underneath it.",
  },
  grind: {
    id: "grind",
    title: "Grateful for the Grind",
    blurb: "Today's hard thing, two years on",
    prompt: "What's hard right now that you'll be grateful for in two years?",
    fields: [
      { key: "hard", label: "The hard thing", placeholder: "What's difficult right now", required: true },
      { key: "future", label: "Why future-you might thank you", placeholder: "In two years I'll probably be glad because…", long: true, required: true, isBody: true },
    ],
    subjectKey: "hard",
    checkBack: [
      { label: "3 months", months: 3 },
      { label: "6 months", months: 6 },
      { label: "1 year", months: 12 },
      { label: "2 years", months: 24 },
    ],
    why: "Struggle reads differently once it's filed as something future-you inherits. We'll bring it back to you on the date you pick.",
  },
  invisible_chain: {
    id: "invisible_chain",
    title: "Invisible Chain",
    blurb: "The strangers behind an ordinary thing",
    prompt: "Pick one ordinary thing you used today: your coffee, the road you drove, the light switch. Trace the chain of people behind it.",
    fields: [
      { key: "thing", label: "The ordinary thing", placeholder: "My morning coffee, the road to work…", required: true },
      { key: "chain", label: "The people behind it, as far back as you can imagine", placeholder: "Someone picked it, someone shipped it, someone built the machine that…", long: true, required: true, isBody: true },
    ],
    subjectKey: "thing",
    why: "Almost nothing you rely on was made by you. Seeing the chain loosens the self-made-man isolation without shrinking what you've built.",
  },
  counted_days: {
    id: "counted_days",
    title: "Counted Days",
    blurb: "A warm look at time with someone you love",
    optIn: "countedDays",
    prompt: "Roughly how many more summers will someone you love be living under your roof, or within easy reach? What would you like those summers to hold?",
    fields: [
      { key: "who", label: "Who comes to mind?", placeholder: "A child, a parent, a friend…", required: true },
      { key: "hold", label: "What would you like the time you have to hold?", placeholder: "I'd like us to…", long: true, required: true, isBody: true },
    ],
    subjectKey: "who",
    why: "Time with people is finite but not as small as it feels. This is for appreciating it, not for counting down.",
  },
  enough_line: {
    id: "enough_line",
    title: "Enough Line check",
    blurb: "Are you already past your own line?",
    showEnough: true,
    prompt: "Look at the Enough Line you wrote. Are you already past it in any area?",
    fields: [
      { key: "area", label: "Which area?", placeholder: "Money, health, relationships, time, or something else", required: false },
      { key: "past", label: "Where are you already at or past the line? Where are you not yet?", placeholder: "Honestly, I'm past it on… and still short on…", long: true, required: true, isBody: true },
    ],
    subjectKey: "area",
    why: "You drew the line when you were calm. This holds today's hunger up against it, without asking you to stop climbing.",
  },
};

export const PRACTICE_ORDER: PracticeId[] = ["past_self", "mental_subtraction", "win_thank", "grind", "invisible_chain", "enough_line", "counted_days"];

export function availablePractices(opts: { countedDays: boolean; hasEnough: boolean }) {
  return PRACTICE_ORDER.filter((id) => {
    const p = PRACTICES[id];
    if (p.optIn === "countedDays" && !opts.countedDays) return false;
    if (p.showEnough && !opts.hasEnough) return false;
    return true;
  });
}

export const SUGGESTED_TAGS = ["people", "work", "health", "home", "craft", "money", "family", "body", "nature", "luck"];

export function checkBackDate(from: string, months: number) {
  return addMonths(from, months);
}
