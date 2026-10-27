import type { Entry, EnoughLine, Resurfaced } from "./types";
import { addDays, daysBetween } from "./dates";

export type Resurfacing =
  | { kind: "entry"; entry: Entry; lead: string }
  | { kind: "enough"; enough: EnoughLine; lead: string };

/** Pick one past thing to show at close. Priority: due check-backs → low-Peace Past-Self → this day last year → an older entry → the Enough Line. */
export function pickResurfacing(opts: {
  entries: Entry[];
  shown: Resurfaced[];
  today: string;
  peace: number;
  enough: EnoughLine;
  excludeId?: string;
}): Resurfacing | null {
  const { shown, today, peace, enough, excludeId } = opts;
  const entries = opts.entries.filter((e) => !e.deletedAt && e.id !== excludeId);
  const shownIds = new Set(shown.map((s) => s.entryId));
  const recentlyShown = (id: string) => shown.some((s) => s.entryId === id && daysBetween(s.shownOn, today) < 30);

  const due = entries
    .filter((e) => e.resurfaceOn && e.resurfaceOn <= today && !shownIds.has(e.id))
    .sort((a, b) => (a.resurfaceOn! < b.resurfaceOn! ? -1 : 1))[0];
  if (due) {
    const ago = daysBetween(due.localDate, today);
    return { kind: "entry", entry: due, lead: `You asked us to bring this back. ${humanAgo(ago)}, you wrote:` };
  }

  if (peace <= 4) {
    const pool = entries.filter((e) => e.practice === "past_self" && !recentlyShown(e.id));
    if (pool.length) {
      const e = pool[Math.floor(Math.random() * pool.length)];
      return { kind: "entry", entry: e, lead: "Peace is low today. This is something you once noticed you already had:" };
    }
  }

  for (const back of [365, 180, 90]) {
    const target = addDays(today, -back);
    const near = entries.find((e) => Math.abs(daysBetween(e.localDate, target)) <= 3 && !recentlyShown(e.id));
    if (near) {
      const lead = back === 365 ? "On this day last year you wrote:" : `About ${humanAgo(back).toLowerCase()} you wrote:`;
      return { kind: "entry", entry: near, lead };
    }
  }

  const old = entries.filter((e) => daysBetween(e.localDate, today) >= 7 && !recentlyShown(e.id));
  if (old.length) {
    const e = old[Math.floor(Math.random() * old.length)];
    return { kind: "entry", entry: e, lead: `${humanAgo(daysBetween(e.localDate, today))}, you wrote:` };
  }

  if (enough.money || enough.health || enough.relationships || enough.time) {
    return { kind: "enough", enough, lead: "Your Enough Line, as you wrote it." };
  }
  return null;
}

export function humanAgo(days: number) {
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  if (days < 700) return `${Math.round(days / 30)} months ago`;
  return `${Math.round(days / 365)} years ago`;
}
