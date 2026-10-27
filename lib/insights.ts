import type { Checkin, Entry, PracticeId } from "./types";

export interface PracticeInsight {
  practice: PracticeId;
  n: number; // days with a before/after pair
  peaceLift: number;
  driveShift: number | null; // null if Drive after wasn't recorded often enough
  nDrive: number;
  lowStart?: { n: number; lift: number }; // Peace at or below the midline when you began
  highStart?: { n: number; lift: number };
}

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/**
 * Before/after per practice. A day's "after" rating belongs to the LAST practice you did that day.
 * Only days with both ratings count. Small samples are returned but flagged by n; the UI decides what to show.
 */
export function practiceInsights(checkins: Checkin[], entries: Entry[], peaceMid: number): PracticeInsight[] {
  const byDate = new Map(checkins.map((c) => [c.localDate, c]));
  const lastOfDay = new Map<string, Entry>();
  for (const e of entries) {
    const cur = lastOfDay.get(e.localDate);
    if (!cur || e.createdAt > cur.createdAt) lastOfDay.set(e.localDate, e);
  }
  const rows = new Map<PracticeId, { lift: number; dShift?: number; start: number }[]>();
  for (const [date, e] of lastOfDay) {
    const c = byDate.get(date);
    if (!c?.peaceAfter) continue;
    const list = rows.get(e.practice) ?? [];
    list.push({ lift: c.peaceAfter - c.peace, dShift: c.driveAfter ? c.driveAfter - c.drive : undefined, start: c.peace });
    rows.set(e.practice, list);
  }
  return [...rows.entries()].map(([practice, list]) => {
    const ds = list.filter((r) => r.dShift !== undefined).map((r) => r.dShift!);
    const low = list.filter((r) => r.start <= peaceMid);
    const high = list.filter((r) => r.start > peaceMid);
    return {
      practice,
      n: list.length,
      peaceLift: avg(list.map((r) => r.lift)),
      driveShift: ds.length >= 3 ? avg(ds) : null,
      nDrive: ds.length,
      lowStart: low.length >= 3 ? { n: low.length, lift: avg(low.map((r) => r.lift)) } : undefined,
      highStart: high.length >= 3 ? { n: high.length, lift: avg(high.map((r) => r.lift)) } : undefined,
    };
  }).sort((a, b) => b.peaceLift - a.peaceLift);
}
