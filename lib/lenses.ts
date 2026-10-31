import type { PracticeId } from "./types";

/**
 * Lenses: a small, hand-written set of ideas from thinkers the user chooses to read their practice through.
 *
 * Every idea here is a PARAPHRASE in the app's own words, never a quotation. That keeps it honest (no
 * misquoting) and sidesteps copyright for living or recently-published authors. Show them as
 * "in the spirit of X", never as something X said word for word.
 */
export interface Idea {
  text: string;
  /** practices this idea speaks to; "any" works anywhere */
  practices: (PracticeId | "any")[];
}

export interface Lens {
  id: string;
  name: string;
  tradition: string;
  blurb: string;
  ideas: Idea[];
  /** practices that only appear when this lens is chosen */
  unlocks?: PracticeId[];
}

export const LENSES: Lens[] = [
  {
    id: "watts",
    name: "Alan Watts",
    tradition: "Zen & Taoism for the West",
    blurb: "Life as a dance, not a destination",
    unlocks: ["play"],
    ideas: [
      { text: "Nobody plays music to reach the final chord. If the point of life were the arrival, we'd have no reason to sing along the way.", practices: ["past_self", "grind", "win_thank"] },
      { text: "We keep treating the present as a stepping stone to a future that, once it arrives, becomes just another present we rush through.", practices: ["enough_line", "mental_subtraction", "past_self"] },
      { text: "Gripping at security tends to make us feel less secure, the way squeezing water makes it slip away.", practices: ["enough_line", "grind"] },
      { text: "Work can become play when it's done for the doing, not only for the result.", practices: ["play", "grind"] },
      { text: "You aren't something the world happened to produce and then left alone. You're something the whole of it is doing, the way a wave is something the ocean does.", practices: ["invisible_chain", "win_thank"] },
    ],
  },
  {
    id: "marcus",
    name: "Marcus Aurelius",
    tradition: "Stoicism",
    blurb: "An emperor's notes to himself on staying steady",
    ideas: [
      { text: "Much of what disturbs us is our judgment about an event, not the event. The judgment is the part you can still revise.", practices: ["grind", "mental_subtraction", "control"] },
      { text: "He imagined he might leave life right now, and let that decide what he did next. Not to frighten himself, but to sharpen what mattered.", practices: ["mental_subtraction", "counted_days"] },
      { text: "What stands in the way of the work can become the work. The obstacle is raw material.", practices: ["grind", "control"] },
      { text: "Nothing is made by one pair of hands. He compared people to feet, hands and eyelids: built to work together.", practices: ["invisible_chain", "win_thank"] },
      { text: "His Meditations opens with a list of people he owed, one by one, naming what each gave him. He began with gratitude before he began with advice.", practices: ["win_thank", "invisible_chain", "any"] },
    ],
  },
  {
    id: "seneca",
    name: "Seneca",
    tradition: "Stoicism",
    blurb: "A rich, busy man's letters on using time well",
    ideas: [
      { text: "We suffer more often in imagination than in reality. He suggested rehearsing loss in advance so it can't blindside you, and so you notice what you still have.", practices: ["mental_subtraction", "grind"] },
      { text: "Life is long enough if you spend it well. Most of the shortage is waste, not supply.", practices: ["enough_line", "counted_days", "play"] },
      { text: "He separated having much from craving more. The first can sit beside peace. The second never does.", practices: ["enough_line", "past_self"] },
      { text: "In his writing on giving and receiving favours, he treated gratitude as the first payment on a debt, one you can begin paying the moment you notice it.", practices: ["win_thank", "any"] },
      { text: "He ended each day by quietly reviewing it. What went well, what he'd do differently, no drama. Then he slept.", practices: ["any", "enough_line"] },
    ],
  },
  {
    id: "epictetus",
    name: "Epictetus",
    tradition: "Stoicism",
    blurb: "A former slave on what is and isn't yours to control",
    unlocks: ["control"],
    ideas: [
      { text: "Some things are up to us: our judgments, aims and choices. Others aren't: our bodies, reputations, and how things turn out. Peace comes from keeping the two lists straight.", practices: ["control", "grind", "enough_line"] },
      { text: "People are troubled less by things than by the views they take of them.", practices: ["grind", "control"] },
      { text: "He likened life to a game of dice or ball: the throw isn't yours to choose, but playing well whatever lands is. That isn't giving up. It's putting your effort where it counts.", practices: ["control", "win_thank", "grind"] },
      { text: "Treat what you love as on loan. It makes you tender with it instead of grasping.", practices: ["counted_days", "mental_subtraction"] },
    ],
  },
  {
    id: "thich",
    name: "Thich Nhat Hanh",
    tradition: "Zen Buddhism",
    blurb: "Peace as something you practise on ordinary days",
    unlocks: ["play"],
    ideas: [
      { text: "Look deeply at a sheet of paper and you'll find the cloud, the forest, the logger, the sun. He called this interbeing: nothing stands alone.", practices: ["invisible_chain", "win_thank"] },
      { text: "The present moment is the only place life can actually be touched, and the breath is the quickest way back to it.", practices: ["any", "play"] },
      { text: "Wash the dishes to wash the dishes, not as a hurdle before the real thing. The task is the real thing.", practices: ["play", "grind"] },
      { text: "He pointed out that the absence of a toothache is a kind of happiness we only notice when it's gone. Many conditions for happiness are already here.", practices: ["past_self", "mental_subtraction", "enough_line"] },
    ],
  },
  {
    id: "laozi",
    name: "Lao Tzu",
    tradition: "Taoism",
    blurb: "The way of water, emptiness and enough",
    unlocks: ["play"],
    ideas: [
      { text: "A journey of a thousand miles starts under your own feet. The next step is the only part you ever actually take.", practices: ["grind", "any"] },
      { text: "Knowing you have enough is its own kind of wealth. In the Tao Te Ching that isn't a reason to stop. It's a reason to be settled while you move.", practices: ["enough_line", "past_self"] },
      { text: "Water is the softest thing, yet it wears down stone. Strength can look like yielding.", practices: ["grind", "control"] },
      { text: "A bowl is useful because of the space inside it. What's absent is half of what makes a thing work.", practices: ["mental_subtraction", "play"] },
      { text: "When the work is done, step back. That's how it lasts, and how you stay light.", practices: ["win_thank"] },
    ],
  },
  {
    id: "zhuangzi",
    name: "Zhuangzi",
    tradition: "Taoism",
    blurb: "Playful, skilled, and slow to take itself seriously",
    unlocks: ["play"],
    ideas: [
      { text: "Cook Ding carved an ox so skilfully it seemed effortless. He followed the natural seams and let the knife do the work. Mastery, in the story, feels like flow.", practices: ["play", "win_thank", "grind"] },
      { text: "A gnarled tree survives because no carpenter wants it, and so it grows old and gives shade. Being useful isn't the only way to matter.", practices: ["enough_line", "play"] },
      { text: "He once dreamed he was a butterfly and woke unsure which he was. A reminder that the stories we tell about who we are are looser than they feel.", practices: ["mental_subtraction", "past_self"] },
    ],
  },
  {
    id: "epicurus",
    name: "Epicurus",
    tradition: "Epicureanism",
    blurb: "Friendship, simple pleasures, and remembering what you wanted",
    ideas: [
      { text: "Don't spoil what you have by craving what you don't. Remember that what you have now was once among the things you only hoped for.", practices: ["past_self", "enough_line"] },
      { text: "Of all that wisdom offers for a good life, he thought friendship was the greatest.", practices: ["win_thank", "invisible_chain", "any"] },
      { text: "Near the end of his life, in great pain, he wrote that the memory of old conversations still filled him with joy. Good moments keep paying you back.", practices: ["past_self", "win_thank", "counted_days"] },
      { text: "The desires that matter most (friends, freedom, time to think) are easy to meet. The endless ones are the ones to question, not the hunger itself.", practices: ["enough_line", "grind"] },
    ],
  },
  {
    id: "thoreau",
    name: "Henry David Thoreau",
    tradition: "Transcendentalism",
    blurb: "Deliberate living and the true price of things",
    ideas: [
      { text: "The real cost of a thing is the amount of life you trade for it. Worth asking before the next thing you chase.", practices: ["enough_line", "grind"] },
      { text: "He called a person rich in proportion to the things they can afford to leave alone.", practices: ["enough_line", "play"] },
      { text: "He went to the woods to live deliberately: to meet the essentials of life and not discover at the end that he hadn't lived.", practices: ["any", "counted_days", "play"] },
    ],
  },
  {
    id: "frankl",
    name: "Viktor Frankl",
    tradition: "Logotherapy",
    blurb: "Meaning as the engine, even under pressure",
    unlocks: ["control"],
    ideas: [
      { text: "He saw meaning arriving in three ways: through what we do, through whom and what we love, and through the stance we take toward suffering we can't avoid.", practices: ["grind", "win_thank", "counted_days"] },
      { text: "Success and happiness can't be chased directly. They tend to follow from giving yourself to something larger than yourself.", practices: ["win_thank", "enough_line", "grind"] },
      { text: "Even when almost everything is taken, he argued, we keep one freedom: choosing our attitude toward what happens.", practices: ["control", "grind"] },
    ],
  },
  {
    id: "naval",
    name: "Naval Ravikant",
    tradition: "Modern founder-philosopher",
    blurb: "Wanting well: few desires, long games",
    ideas: [
      { text: "He describes desire as a deal you make with yourself to be unhappy until you get the thing. So choose your desires on purpose, and carry only a few at a time.", practices: ["enough_line", "grind"] },
      { text: "He describes peace as happiness at rest. The aim isn't to stop moving, but to move from a settled place.", practices: ["any", "play"] },
      { text: "Play long-term games with long-term people. The best things compound slowly, and mostly through others.", practices: ["win_thank", "invisible_chain"] },
    ],
  },
];

export const lensById = (id: string) => LENSES.find((l) => l.id === id);

/** Every thinker is always in play. A favorite just comes up this many times as often. */
const FAVORITE_WEIGHT = 3;

/** FNV-1a with a final avalanche, so neighbouring dates land far apart in the pool. */
function hash(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return h >>> 0;
}

export interface PickedIdea {
  lens: Lens;
  idea: Idea;
}

/** Deterministic per day, so reopening the app shows the same idea. `offset` lets the close screen show a different one than the practice screen. */
export function pickIdea(favorites: string[] | undefined, practice: PracticeId | "any", seed: string, offset = 0): PickedIdea | null {
  const fav = new Set(favorites ?? []);
  const build = (tag: PracticeId | "any") => {
    const pool: PickedIdea[] = [];
    for (const lens of LENSES) for (const idea of lens.ideas) if (tag === "any" || idea.practices.includes(tag)) for (let k = 0; k < (fav.has(lens.id) ? FAVORITE_WEIGHT : 1); k++) pool.push({ lens, idea });
    return pool;
  };
  const pool = build(practice).length ? build(practice) : build("any");
  if (!pool.length) return null;
  return pool[(hash(seed + practice) + offset) % pool.length];
}

/** A rotating handful of thinkers (favorites weighted), without repeats. Used so the weekly reflection speaks in a couple of voices, not eleven. */
export function pickLenses(favorites: string[] | undefined, n: number, seed: string): Lens[] {
  const fav = new Set(favorites ?? []);
  const left = LENSES.flatMap((l) => Array(fav.has(l.id) ? FAVORITE_WEIGHT : 1).fill(l) as Lens[]);
  const out: Lens[] = [];
  let h = hash(seed);
  while (out.length < n && left.length) {
    const pick = left[h % left.length];
    out.push(pick);
    for (let i = left.length - 1; i >= 0; i--) if (left[i].id === pick.id) left.splice(i, 1);
    h = hash(String(h) + seed);
  }
  return out;
}
