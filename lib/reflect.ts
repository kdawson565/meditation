import type { Checkin, Entry } from "./types";
import { PRACTICES } from "./practices";

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** A plain, honest on-device reflection used when AI is off or unavailable. Numbers only, no spin. */
export function localReflection(days: Checkin[], entries: Entry[]): string {
  if (days.length === 0 && entries.length === 0) return "There isn't enough from this week to say much yet. A few days of dials and entries and there will be something here.";
  const d = avg(days.map((c) => c.drive));
  const p = avg(days.map((c) => c.peace));
  const parts: string[] = [];
  parts.push(`You checked in on ${days.length} ${days.length === 1 ? "day" : "days"} and wrote ${entries.length} ${entries.length === 1 ? "entry" : "entries"}.${d != null && p != null ? ` Drive averaged ${d.toFixed(1)} and Peace ${p.toFixed(1)}.` : ""}`);

  const byDate = new Map(days.map((c) => [c.localDate, c]));
  const high = days.filter((c) => c.drive >= 7);
  if (high.length >= 2) {
    const pHigh = avg(high.map((c) => c.peace))!;
    parts.push(`On the ${high.length} days Drive was 7 or above, Peace averaged ${pHigh.toFixed(1)}.`);
  }

  const tagPeace = new Map<string, number[]>();
  for (const e of entries) {
    const c = byDate.get(e.localDate);
    if (!c) continue;
    for (const t of e.tags) tagPeace.set(t, [...(tagPeace.get(t) ?? []), c.peace]);
  }
  const tags = [...tagPeace.entries()].filter(([, v]) => v.length >= 2).map(([t, v]) => [t, avg(v)!] as const).sort((a, b) => b[1] - a[1]);
  if (tags.length >= 2 && tags[0][1] - tags[tags.length - 1][1] >= 1) {
    parts.push(`Peace was highest on days you wrote about #${tags[0][0]} (${tags[0][1].toFixed(1)}) and lowest around #${tags[tags.length - 1][0]} (${tags[tags.length - 1][1].toFixed(1)}). A week is a small sample, so treat that as a hint.`);
  }

  const lifts = entries.map((e) => ({ e, c: byDate.get(e.localDate) })).filter((x) => x.c?.peaceAfter).map((x) => ({ k: x.e.practice, lift: x.c!.peaceAfter! - x.c!.peace }));
  if (lifts.length) {
    const best = lifts.sort((a, b) => b.lift - a.lift)[0];
    if (best.lift > 0) parts.push(`${PRACTICES[best.k].title} came with the biggest Peace lift at close (+${best.lift}).`);
  }
  const practiceCounts = new Map<string, number>();
  entries.forEach((e) => practiceCounts.set(e.practice, (practiceCounts.get(e.practice) ?? 0) + 1));
  const unused = Object.values(PRACTICES).find((x) => !practiceCounts.has(x.id) && !x.optIn && !x.showEnough);
  if (unused) parts.push(`One thing to try next week: ${unused.title}. You haven't used it lately.`);
  return parts.join(" ");
}
