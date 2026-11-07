import type { Checkin, Entry, Value } from "./types";
import { addDays, daysBetween, daysInMonth, formatShort, parseDate } from "./dates";
import { midlines, quadrantOf, QUADRANT_INFO, type Quadrant } from "./quadrant";
import { livedValue } from "./values";

/** Quadrant per day, using the same dividing lines as the Map (your own medians after two weeks). */
export function quadrantsByDate(checkins: Checkin[]) {
  const mid = midlines(checkins);
  return new Map(checkins.map((c) => [c.localDate, quadrantOf(c.drive, c.peace, mid)] as const));
}

export const monthOf = (date: string) => date.slice(0, 7);
export const shiftMonth = (month: string, n: number) => {
  const d = parseDate(`${month}-01`);
  d.setMonth(d.getMonth() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
export const monthName = (month: string, withYear = false) =>
  parseDate(`${month}-01`).toLocaleDateString(undefined, withYear ? { month: "long", year: "numeric" } : { month: "long" });

/** Monday-first grid: leading blanks (null), then each date of the month. */
export function monthGrid(month: string): (string | null)[] {
  const first = `${month}-01`;
  const lead = (parseDate(first).getDay() + 6) % 7;
  const n = daysInMonth(first);
  return [...Array(lead).fill(null), ...Array.from({ length: n }, (_, i) => addDays(first, i))];
}

export const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** For each core value: how many days it was lived (an evidence line), and the most recent moment in their words. */
export function valueMoments(values: Value[], checkins: Checkin[]) {
  return values.map((v) => {
    const lived = checkins.filter((c) => c.floorValueId === v.id && livedValue(c));
    const last = lived[lived.length - 1];
    return { value: v, count: lived.length, carried: checkins.filter((c) => c.floorValueId === v.id).length, last: last ? { date: last.localDate, text: last.evidence!.trim() } : undefined };
  });
}

export interface MonthSummary {
  month: string;
  days: Checkin[];
  practiced: number;
  of: number;
  drive: number | null;
  peace: number | null;
  voice: number | null;
  counts: Record<Quadrant, number>;
  values: { name: string; lived: number }[];
  sails: { filled: number; checked: number };
  evidence: { date: string; value?: string; text: string }[];
}

export function summarizeMonth(month: string, checkins: Checkin[], entries: Entry[], allValues: Value[], today: string): MonthSummary {
  const days = checkins.filter((c) => monthOf(c.localDate) === month);
  const q = quadrantsByDate(checkins);
  const counts: Record<Quadrant, number> = { ballast: 0, grind: 0, harbor: 0, fog: 0 };
  days.forEach((c) => counts[q.get(c.localDate)!]++);
  const lived = days.filter(livedValue);
  const byValue = new Map<string, number>();
  lived.forEach((c) => { const n = allValues.find((v) => v.id === c.floorValueId)?.name; if (n) byValue.set(n, (byValue.get(n) ?? 0) + 1); });
  const sails = entries.filter((e) => monthOf(e.localDate) === month && e.sail && e.sailResult);
  const isCurrent = month === monthOf(today);
  return {
    month, days, practiced: new Set(days.map((c) => c.localDate)).size,
    of: isCurrent ? Number(today.slice(8, 10)) : daysInMonth(`${month}-01`),
    drive: avg(days.map((c) => c.drive)), peace: avg(days.map((c) => c.peace)), voice: avg(days.filter((c) => c.voice != null).map((c) => c.voice!)),
    counts,
    values: [...byValue.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, lived: n })),
    sails: { filled: sails.filter((e) => e.sailResult === "filled").length, checked: sails.length },
    evidence: lived.map((c) => ({ date: c.localDate, value: allValues.find((v) => v.id === c.floorValueId)?.name, text: c.evidence!.trim() })),
  };
}

// ── Seasons: every 90 days from your first check-in ──
export const SEASON_DAYS = 90;

export interface Season { n: number; start: string; end: string; complete: boolean; dayOf: number }

export function seasons(checkins: Checkin[], today: string): Season[] {
  if (!checkins.length) return [];
  const first = checkins[0].localDate;
  const count = Math.floor(daysBetween(first, today) / SEASON_DAYS) + 1;
  return Array.from({ length: count }, (_, i) => {
    const start = addDays(first, i * SEASON_DAYS);
    const end = addDays(start, SEASON_DAYS - 1);
    return { n: i + 1, start, end, complete: end < today, dayOf: Math.min(SEASON_DAYS, daysBetween(start, today) + 1) };
  });
}

/**
 * The season review without AI: plain sentences from the numbers, and a few of their own evidence lines.
 * No judgement, no "missed": only what was there.
 */
export function seasonReview(s: Season, checkins: Checkin[], entries: Entry[], allValues: Value[]) {
  const days = checkins.filter((c) => c.localDate >= s.start && c.localDate <= s.end);
  if (days.length === 0) return { lines: ["No check-ins this season. The next one is simply another place to begin."], quotes: [] as { date: string; text: string; value?: string }[], carried: [] as { name: string; days: number; lived: number }[], evidence: [] as { date: string; text: string; value?: string }[], topQuadrant: undefined as Quadrant | undefined, practices: [] as string[] };
  const q = quadrantsByDate(checkins);
  const f = (n: number | null) => (n == null ? "–" : n.toFixed(1));
  const early = days.filter((c) => c.localDate < addDays(s.start, 30));
  const late = days.filter((c) => c.localDate > addDays(s.end, -30));
  const counts: Record<Quadrant, number> = { ballast: 0, grind: 0, harbor: 0, fog: 0 };
  days.forEach((c) => counts[q.get(c.localDate)!]++);
  const top = (Object.keys(counts) as Quadrant[]).sort((a, b) => counts[b] - counts[a])[0];
  const carried = new Map<string, { days: number; lived: number }>();
  days.forEach((c) => {
    const n = allValues.find((v) => v.id === c.floorValueId)?.name;
    if (!n) return;
    const x = carried.get(n) ?? { days: 0, lived: 0 };
    x.days++; if (livedValue(c)) x.lived++;
    carried.set(n, x);
  });
  const sails = entries.filter((e) => e.localDate >= s.start && e.localDate <= s.end && e.sail && e.sailResult);
  const lines: string[] = [];
  lines.push(`You checked in on ${days.length} of ${s.complete ? SEASON_DAYS : s.dayOf} days.`);
  if (early.length >= 5 && late.length >= 5 && s.complete) {
    const dp = avg(late.map((c) => c.peace))! - avg(early.map((c) => c.peace))!;
    const dd = avg(late.map((c) => c.drive))! - avg(early.map((c) => c.drive))!;
    const move = (d: number, name: string, a: number | null, b: number | null) => Math.abs(d) < 0.4 ? `${name} held near ${f(b)}` : `${name} went from ${f(a)} in the first month to ${f(b)} in the last`;
    lines.push(`${move(dp, "Peace", avg(early.map((c) => c.peace)), avg(late.map((c) => c.peace)))}, and ${move(dd, "Drive", avg(early.map((c) => c.drive)), avg(late.map((c) => c.drive)))}.`);
  } else {
    lines.push(`Drive averaged ${f(avg(days.map((c) => c.drive)))} and Peace ${f(avg(days.map((c) => c.peace)))}.`);
  }
  lines.push(`Most days landed in ${top === "ballast" ? "Ballast" : QUADRANT_INFO[top].name.replace(/^The /, "the ")}: ${QUADRANT_INFO[top].line.toLowerCase()}.`);
  const topValues = [...carried.entries()].sort((a, b) => b[1].days - a[1].days).slice(0, 2);
  if (topValues.length) {
    const [n, x] = topValues[0];
    lines.push(`You carried ${n} most often (${x.days} ${x.days === 1 ? "day" : "days"}) and noted ${x.lived} ${x.lived === 1 ? "moment" : "moments"} you lived it${topValues[1] ? `; ${topValues[1][0]} came next` : ""}.`);
  }
  if (sails.length) lines.push(`${sails.filter((e) => e.sailResult === "filled").length} of the ${sails.length} Sails you checked back on filled.`);
  // a few of their own lines, spread across the season
  const lived = days.filter(livedValue);
  const pick = lived.length <= 3 ? lived : [lived[0], lived[Math.floor(lived.length / 2)], lived[lived.length - 1]];
  const quotes = pick.map((c) => ({ date: c.localDate, text: c.evidence!.trim(), value: allValues.find((v) => v.id === c.floorValueId)?.name }));
  const evidence = lived.map((c) => ({ date: c.localDate, text: c.evidence!.trim(), value: allValues.find((v) => v.id === c.floorValueId)?.name }));
  const practices = entries.filter((e) => e.localDate >= s.start && e.localDate <= s.end).map((e) => e.practice as string);
  return { lines, quotes, carried: [...carried.entries()].map(([name, x]) => ({ name, ...x })), evidence, topQuadrant: top, practices };
}

export const rangeLabel = (a: string, b: string) => `${formatShort(a)} – ${formatShort(b)}`;
