import data from "./library.generated.json";
import type { PracticeId } from "./types";
import type { Quadrant } from "./quadrant";

/** A principle card from /content/library. Bundled at build time, so the Library works offline. */
export interface Card {
  id: string;
  title: string;
  status: "draft" | "published";
  values: string[];
  quadrants: Quadrant[];
  influences: string[];
  reflection_question: string;
  linked_practice_id: PracticeId;
  body: string;
  words: number;
}

export const CARDS = data as Card[];
const BY_ID = new Map(CARDS.map((c) => [c.id, c]));
export const cardById = (id: string) => BY_ID.get(id);

/** Themes are the quadrants, named for the kind of day a card helps with. */
export const THEMES: Record<Quadrant, { name: string; line: string }> = {
  grind: { name: "When you're grinding", line: "Hungry, but not settled" },
  fog: { name: "When it's foggy", line: "Low on both" },
  harbor: { name: "When it's calm", line: "Settled, a little still" },
  ballast: { name: "On Ballast days", line: "Settled and hungry" },
};

/** Every value that has at least one card, in order of first appearance. */
export const CARD_VALUES = [...new Set(CARDS.flatMap((c) => c.values))];

const STOP = new Set("a an and are as at be but by can do for from has have how i if in is it its me my no not of on or so that the this to was what when which who why will with you your".split(" "));
const words = (s: string) => new Set(s.toLowerCase().match(/[a-z']{3,}/g)?.filter((w) => !STOP.has(w)) ?? []);

function tiebreak(seed: string, id: string) {
  let h = 2166136261;
  for (const ch of seed + "|" + id) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967296;
}

export interface RetrievalInput {
  /** today's Floor value, by name (custom values won't match card tags; quadrant and practice still do) */
  value?: string;
  /** other core values, a weaker signal */
  otherValues?: string[];
  quadrant?: Quadrant;
  /** practices used in the last week */
  recentPractices?: PracticeId[];
  /** free text, e.g. an Ask Ballast question */
  query?: string;
  /** cards shown recently, nudged down for variety */
  recentlyShown?: string[];
  /** keeps the order stable for a day (pass the date) */
  seed: string;
}

/**
 * Simple tag scoring. Floor value +3, another core value +1, quadrant +2, a recently used linked practice +1,
 * each query word that appears in the card +1 (up to 3), shown in the last week −1.
 * Ties go to a card matching today's value, then a daily hash.
 */
export function scoreCard(c: Card, x: RetrievalInput) {
  let s = 0;
  const has = (v?: string) => !!v && c.values.some((cv) => cv.toLowerCase() === v.toLowerCase());
  if (has(x.value)) s += 3;
  if (x.otherValues?.some((v) => v !== x.value && has(v))) s += 1;
  if (x.quadrant && c.quadrants.includes(x.quadrant)) s += 2;
  if (x.recentPractices?.includes(c.linked_practice_id)) s += 1;
  if (x.query) {
    const q = words(x.query);
    const cw = words(`${c.title} ${c.body} ${c.reflection_question} ${c.values.join(" ")}`);
    s += Math.min(3, [...q].filter((w) => cw.has(w)).length);
  }
  if (x.recentlyShown?.includes(c.id)) s -= 1;
  return s;
}

export function rankCards(x: RetrievalInput, pool: Card[] = CARDS) {
  return pool
    .map((c) => ({ c, s: scoreCard(c, x), v: x.value && c.values.some((cv) => cv.toLowerCase() === x.value!.toLowerCase()) ? 1 : 0, t: tiebreak(x.seed, c.id) }))
    // on a tie, a card that speaks to today's value goes first
    .sort((a, b) => b.s - a.s || b.v - a.v || a.t - b.t);
}

/** 2 to 5 cards for one request: everything that scored, capped at `max`, topped up to `min` by rank. */
export function retrieve(x: RetrievalInput, { min = 2, max = 5 } = {}): Card[] {
  const ranked = rankCards(x);
  const hits = ranked.filter((r) => r.s > 0).slice(0, max);
  const out = hits.length >= min ? hits : ranked.slice(0, min);
  return out.map((r) => r.c);
}
