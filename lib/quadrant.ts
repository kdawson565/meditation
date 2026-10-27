import type { Checkin } from "./types";

export type Quadrant = "grind" | "harbor" | "fog" | "ballast";

export const QUADRANT_INFO: Record<Quadrant, { name: string; line: string }> = {
  grind: { name: "The Grind", line: "Hungry, but not settled" },
  harbor: { name: "The Harbor", line: "Settled, a little still" },
  fog: { name: "The Fog", line: "Low on both" },
  ballast: { name: "Ballast", line: "Settled and hungry" },
};

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Midlines. With fewer than 14 check-ins we use 5.5; after that, the user's own median (kept within 4–7). */
export function midlines(all: Checkin[]) {
  if (all.length < 14) return { drive: 5.5, peace: 5.5, personal: false };
  const clamp = (n: number) => Math.min(7, Math.max(4, n));
  return { drive: clamp(median(all.map((c) => c.drive))), peace: clamp(median(all.map((c) => c.peace))), personal: true };
}

export function quadrantOf(drive: number, peace: number, mid: { drive: number; peace: number }): Quadrant {
  const hiD = drive > mid.drive;
  const hiP = peace > mid.peace;
  if (hiD && hiP) return "ballast";
  if (hiD) return "grind";
  if (hiP) return "harbor";
  return "fog";
}
