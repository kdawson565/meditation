// A "day" rolls over at 4am local time, so a 1am entry belongs to the day that is ending.
const ROLLOVER_HOUR = 4;

export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function todayStr(now = new Date()) {
  const d = new Date(now);
  d.setHours(d.getHours() - ROLLOVER_HOUR);
  return toDateStr(d);
}

export function addDays(s: string, n: number) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

export function addMonths(s: string, n: number) {
  const d = parseDate(s);
  d.setMonth(d.getMonth() + n);
  return toDateStr(d);
}

export function daysBetween(a: string, b: string) {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);
}

export function formatLong(s: string) {
  return parseDate(s).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export function formatShort(s: string) {
  return parseDate(s).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatFull(s: string) {
  return parseDate(s).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function daysInMonth(s: string) {
  const d = parseDate(s);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function uid() {
  return crypto.randomUUID();
}

/** The Monday that starts the week containing `s`. */
export function weekStartOf(s: string) {
  const d = parseDate(s);
  const back = (d.getDay() + 6) % 7;
  return addDays(s, -back);
}
