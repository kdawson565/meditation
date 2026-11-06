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
  /** "value": pick one of the person's core values (stored as its name). Hidden when no values are set. */
  kind?: "value";
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
  /** never offered as a choice (e.g. the short day, which has its own flow) */
  hidden?: boolean;
  /** only offered once the person has chosen values */
  needsValues?: boolean;
  /** show the person's values and definitions above the form */
  showValues?: boolean;
}

export const PRACTICES: Record<PracticeId, Practice> = {
  one_move: {
    id: "one_move",
    title: "One honest move",
    blurb: "The smallest real step on what matters",
    prompt: "What matters most to you right now? What is the smallest real step you could take on it today?",
    fields: [
      { key: "matters", label: "What matters most right now", placeholder: "The thing I keep circling is…", required: true },
      { key: "move", label: "The smallest real step, today", placeholder: "Before tonight I'll…", required: true, isBody: true },
    ],
    subjectKey: "matters",
    why: "Drive stalls on size, not desire. A step small enough to take today gets momentum going again.",
  },
  future_pull: {
    id: "future_pull",
    title: "Future pull",
    blurb: "What you'd regret not attempting",
    prompt: "A year from now, what would you regret not having attempted? Not finished, just attempted.",
    fields: [
      { key: "regret", label: "What you'd regret not attempting", placeholder: "I'd be sorry I never tried…", long: true, required: true, isBody: true },
      { key: "start", label: "What would starting look like this week?", placeholder: "One email, one sketch, one call…" },
    ],
    subjectKey: "start",
    why: "People tend to regret what they never tried more than what they tried and missed. Naming it puts a bit of wind in the sail.",
  },
  whose_hunger: {
    id: "whose_hunger",
    title: "Whose hunger is this?",
    blurb: "Sort your own ambitions from borrowed ones",
    prompt: "Name one goal you're pushing hard on. If no one would ever know you'd reached it, would you still want it?",
    fields: [
      { key: "goal", label: "The goal", placeholder: "The thing I'm pushing on…", required: true },
      { key: "honest", label: "Would you still want it, unseen? What part is truly yours?", placeholder: "Honestly, the part I'd want anyway is…", long: true, required: true, isBody: true },
    ],
    subjectKey: "goal",
    why: "Borrowed goals drain you and your own goals fuel you. Sorting them keeps the drive and drops some of the strain.",
  },
  short_day: {
    id: "short_day",
    title: "Short day",
    blurb: "Two minutes, still counts",
    prompt: "One line: something good, or what's next.",
    fields: [{ key: "line", label: "One line", placeholder: "Something good, or what's next…", required: true, isBody: true }],
    why: "On the busiest days, a short check-in keeps the habit going.",
    hidden: true,
  },
  advocate_reply: {
    id: "advocate_reply",
    title: "Advocate's reply",
    blurb: "Answer your inner critic, from your side",
    prompt: "Write down one thing your inner critic said to you recently, word for word. Then answer it the way your best coach or most loyal friend would: honest, specific, on your side.",
    fields: [
      { key: "critic", label: "What the critic said, word for word", placeholder: "You always…", required: true },
      { key: "advocate", label: "What your advocate says back", placeholder: "That's not the whole story. Here's what's true…", long: true, required: true, isBody: true },
    ],
    why: "The critic's lines usually go unchallenged. Writing a reply gives the other side a voice, and the reply gets easier to hear with practice.",
  },
  use_name: {
    id: "use_name",
    title: "Use your name",
    blurb: "Coach yourself in the third person",
    prompt: "Think of something hard coming up, or something that went badly. Talk yourself through it using your own name, the way a coach on your side would.",
    fields: [
      { key: "situation", label: "The hard thing", placeholder: "The meeting tomorrow, the call I dropped…", required: true },
      { key: "talk", label: "Talk yourself through it, by name", placeholder: "{name}, you've handled harder than this…", long: true, required: true, isBody: true },
    ],
    subjectKey: "situation",
    why: "Using your own name gives you a little distance, as if advising a friend. Studies of distanced self-talk (Kross et al., 2014) found it eased stress and helped people perform under pressure.",
  },
  evidence_file: {
    id: "evidence_file",
    title: "Evidence file",
    blurb: "Facts against the critic",
    prompt: "What is the critic telling you that you can't do? Write down three times you've already done something like it.",
    fields: [
      { key: "claim", label: "The critic says I can't…", placeholder: "…lead this, finish this, be good at this", required: true },
      { key: "evidence", label: "Three times you already did something like it", placeholder: "1.\n2.\n3.", long: true, required: true, isBody: true },
    ],
    subjectKey: "claim",
    why: "Belief built on your own track record holds better than pep talk. This keeps a file you can come back to.",
  },
  self_friend: {
    id: "self_friend",
    title: "Treat yourself like a friend",
    blurb: "High standards, no self-attack",
    prompt: "Name a recent setback or mistake. If a friend you respect had made it, what would you say to them? Now say it to yourself.",
    fields: [
      { key: "setback", label: "The setback", placeholder: "I missed…, I said…, I blew…", required: true },
      { key: "friend", label: "What you'd tell a friend, said to yourself", placeholder: "Anyone carrying what you're carrying could slip here. What matters next is…", long: true, required: true, isBody: true },
    ],
    subjectKey: "setback",
    why: "Self-compassion research (Kristin Neff) suggests kindness after a setback doesn't lower your standards. People who practise it tend to try again sooner.",
  },
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
      { key: "value", label: "Which of your values did this win express?", kind: "value" },
    ],
    subjectKey: "win",
    why: "The win stays exactly as big. You just see what's underneath it, and what it was for.",
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
  play: {
    id: "play",
    title: "Play, not progress",
    blurb: "Doing something for its own sake",
    prompt: "What are you doing today that you could do for its own sake, with no destination? What would change if you treated it as play?",
    fields: [
      { key: "what", label: "The thing", placeholder: "A walk, a draft, a conversation, the dishes…", required: true },
      { key: "play", label: "What would it be to do it just for the doing?", placeholder: "If there were no result to reach, I'd…", long: true, required: true, isBody: true },
    ],
    subjectKey: "what",
    why: "Ambition aims at results. Play reminds you that the days you're living in aren't only a route to them.",
  },
  control: {
    id: "control",
    title: "What's yours to steer",
    blurb: "Separate the steerable from the rest",
    prompt: "Name something weighing on you. What part of it is yours to steer, and what part isn't? Then name the one move that's yours.",
    fields: [
      { key: "weight", label: "What's weighing on you", placeholder: "A deadline, a person, a result…", required: true },
      { key: "steer", label: "What's yours, what isn't, and the one move that is", placeholder: "Mine: … Not mine: … My move: …", long: true, required: true, isBody: true },
    ],
    subjectKey: "weight",
    why: "Effort goes further when it's aimed at the part you can actually move, and the rest can get a little lighter.",
  },
  lived_value: {
    id: "lived_value",
    title: "Lived in front of you",
    blurb: "Someone who showed you one of your values",
    needsValues: true,
    showValues: true,
    prompt: "Who lived one of your values in front of you today?",
    fields: [
      { key: "who", label: "Who was it?", placeholder: "A colleague, a stranger, your kid…", required: true },
      { key: "value", label: "Which value?", kind: "value" },
      { key: "what", label: "What did they do?", placeholder: "I watched them…", long: true, required: true, isBody: true },
    ],
    subjectKey: "who",
    why: "Values are easier to see in other people than in yourself. Noticing them out in the world keeps them from becoming slogans.",
  },
  easier_self: {
    id: "easier_self",
    title: "Easier to be yourself",
    blurb: "What made room for you today",
    needsValues: true,
    prompt: "What made it easier to be yourself today?",
    fields: [
      { key: "what", label: "What made it easier?", placeholder: "A person, a quiet hour, a decision I'd already made…", long: true, required: true, isBody: true },
    ],
    why: "Living your values is partly character and partly conditions. Thanking the conditions tells you what to protect.",
  },
  held_value: {
    id: "held_value",
    title: "Held when it was hard",
    blurb: "What you have because you didn't fold",
    needsValues: true,
    showValues: true,
    prompt: "What do you have now because you held to a value when it was hard?",
    fields: [
      { key: "value", label: "Which value did you hold?", kind: "value", required: true },
      { key: "have", label: "What do you have because of it?", placeholder: "Because I didn't take the shortcut, I now have…", long: true, required: true, isBody: true },
    ],
    subjectKey: "value",
    why: "Holding a value usually costs something up front. This is the receipt: what it bought you later.",
  },
  values_conflict: {
    id: "values_conflict",
    title: "Values in conflict",
    blurb: "Two values pulling against each other",
    needsValues: true,
    showValues: true,
    prompt: "Name two of your values that are pulling against each other right now. What does each one ask of you this week? Then find one move that honors both.",
    fields: [
      { key: "a", label: "One value", kind: "value", required: true },
      { key: "b", label: "The other", kind: "value", required: true },
      { key: "asks", label: "What each one asks of you this week", placeholder: "Growth wants the late nights on the launch. Family wants me home by six…", long: true, required: true },
      { key: "move", label: "One move that honors both", placeholder: "Launch work 6–8am, home by six, phone off at dinner…", long: true, required: true, isBody: true },
    ],
    subjectKey: "move",
    why: "The hard choices are rarely good against bad. Naming both values usually turns an either/or into a schedule.",
  },
  drift_check: {
    id: "drift_check",
    title: "Monthly drift check",
    blurb: "Where your time went, and where you said it would",
    needsValues: true,
    showValues: true,
    prompt: "Where did your time go this month? Where did you say it would go? No score, just a look.",
    fields: [
      { key: "went", label: "Where your time actually went", placeholder: "Mostly the launch, some travel, less family than I'd like…", long: true, required: true, isBody: true },
      { key: "said", label: "Where you said it would go", placeholder: "Family, the book, my health…", long: true },
      { key: "return", label: "One small way to come back, if you want one", placeholder: "Sunday mornings go back to the kids." },
    ],
    why: "Drift is normal. The practice isn't a perfect month, it's noticing and returning.",
  },
  values_not_outcomes: {
    id: "values_not_outcomes",
    title: "Values, not outcomes",
    blurb: "The result didn't land. What held?",
    needsValues: true,
    prompt: "The result didn't land. Which value did you keep anyway?",
    fields: [
      { key: "result", label: "What didn't land", placeholder: "The pitch, the race, the conversation…", required: true },
      { key: "value", label: "Which value did you keep anyway?", kind: "value", required: true },
      { key: "how", label: "How you kept it", placeholder: "I prepared honestly, I didn't cut corners, I told the truth about the numbers…", long: true, required: true, isBody: true },
    ],
    subjectKey: "result",
    why: "Results depend on things you don't control. Values don't, so they're the part of a bad day you get to keep.",
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

export const PRACTICE_ORDER: PracticeId[] = ["past_self", "mental_subtraction", "win_thank", "grind", "invisible_chain", "enough_line", "counted_days", "play", "control", "one_move", "future_pull", "whose_hunger", "advocate_reply", "use_name", "evidence_file", "self_friend", "lived_value", "easier_self", "held_value", "values_conflict", "drift_check", "values_not_outcomes"];

export function availablePractices(opts: { countedDays: boolean; hasEnough: boolean; hasValues?: boolean }) {
  return PRACTICE_ORDER.filter((id) => {
    const p = PRACTICES[id];
    if (p.needsValues && !opts.hasValues) return false;
    if (p.optIn === "countedDays" && !opts.countedDays) return false;
    if (p.showEnough && !opts.hasEnough) return false;
    return true;
  });
}

export const SUGGESTED_TAGS = ["people", "work", "health", "home", "craft", "money", "family", "body", "nature", "luck"];

export function checkBackDate(from: string, months: number) {
  return addMonths(from, months);
}
