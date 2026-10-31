import type { Entry, PracticeId } from "./types";
import { availablePractices } from "./practices";
import { daysBetween } from "./dates";
import { quadrantOf } from "./quadrant";

export interface Suggestion {
  practice: PracticeId;
  reason: string;
}

/** Rule-based, transparent selection. (Phase 3 will let Claude weigh in; the reasons stay human-readable.) */
export function suggestPractice(opts: {
  drive: number;
  peace: number;
  today: string;
  entries: Entry[];
  mid: { drive: number; peace: number };
  countedDays?: boolean;
  hasEnough?: boolean;
}): Suggestion {
  const { drive, peace, today, entries, mid } = opts;
  const pool = availablePractices({ countedDays: !!opts.countedDays, hasEnough: !!opts.hasEnough });
  const q = quadrantOf(drive, peace, mid);

  const lastUsed = (p: PracticeId) => {
    const hit = entries.filter((e) => e.practice === p && !e.deletedAt).sort((a, b) => (a.localDate < b.localDate ? 1 : -1))[0];
    return hit ? daysBetween(hit.localDate, today) : 999;
  };

  // Occasional practices: surfaced when they're due, not every day.
  if (pool.includes("enough_line") && lastUsed("enough_line") >= 14 && q !== "fog")
    return { practice: "enough_line", reason: "It's been a couple of weeks since you looked at your Enough Line. Worth a check, hungry or not." };
  if (pool.includes("counted_days") && lastUsed("counted_days") >= 10 && peace >= 5)
    return { practice: "counted_days", reason: "You asked for these now and then. A gentle one, if the day has room." };

  if (pool.includes("control") && lastUsed("control") >= 6 && (q === "grind" || q === "fog"))
    return { practice: "control", reason: "Drive is up and Peace is down, which is often a sign of carrying things that aren't yours to move. This one sorts them." };
  if (pool.includes("play") && lastUsed("play") >= 6 && (q === "grind" || q === "ballast"))
    return { practice: "play", reason: "A reminder from your lens that today isn't only a route to results. Pick one thing to do for its own sake." };

  const preferences: Record<string, [PracticeId, string][]> = {
    grind: [
      ["mental_subtraction", "Drive is outrunning Peace today. Subtracting something is the quickest way to feel what you already have."],
      ["past_self", "Drive is outrunning Peace today. Looking back at what you once hoped for can steady things."],
    ],
    fog: [
      ["past_self", "Low on both today. This one is gentle and asks very little."],
      ["win_thank", "Low on both today. Naming one small thing that went right, and who helped, is enough."],
    ],
    harbor: [
      ["grind", "Peace is running ahead of Drive today. A good moment to look at a hard thing from the other side."],
      ["win_thank", "Peace is high. A good moment to name a recent win and what's underneath it."],
      ["invisible_chain", "Peace is high. A good moment to trace the people behind something ordinary."],
    ],
    ballast: [
      ["win_thank", "Settled and hungry. A good day to credit what's carrying you."],
      ["invisible_chain", "Settled and hungry. A good day to notice how many people your ordinary day rests on."],
      ["grind", "Settled and hungry. A good day to file today's struggle as something you'll be glad of."],
    ],
  };

  const ranked = preferences[q]
    .map(([p, reason]) => ({ p, reason, gap: lastUsed(p) }))
    .filter((x) => x.gap >= 2)
    .sort((a, b) => b.gap - a.gap);
  if (ranked.length) return { practice: ranked[0].p, reason: ranked[0].reason };

  const fallback = [...pool].sort((a, b) => lastUsed(b) - lastUsed(a))[0];
  return { practice: fallback, reason: "It's been a little while since you did this one." };
}
