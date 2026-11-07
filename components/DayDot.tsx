import type { Quadrant } from "@/lib/quadrant";

export const Q_COLOR: Record<Quadrant, string> = {
  ballast: "rgb(var(--q-ballast))",
  grind: "rgb(var(--q-grind))",
  harbor: "rgb(var(--q-harbor))",
  fog: "rgb(var(--q-fog))",
};

/**
 * One practiced day. Color AND shape name the quadrant, mirroring the Map (Drive is up, Peace is right):
 * Ballast = full dot, Grind = top half (Drive), Harbor = right half (Peace), Fog = a small dot.
 * A brass ring = a value lived that day. Unpracticed days get no dot at all.
 */
export default function DayDot({ q, ring, size = 28 }: { q: Quadrant; ring?: boolean; size?: number }) {
  const c = Q_COLOR[q];
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden>
      {ring && <circle cx="14" cy="14" r="12.25" fill="none" stroke="rgb(var(--brass))" strokeWidth="1.5" />}
      {q === "ballast" && <circle cx="14" cy="14" r="8" fill={c} />}
      {q === "grind" && <><circle cx="14" cy="14" r="7.25" fill="none" stroke={c} strokeWidth="1.5" /><path d="M6 14a8 8 0 0 1 16 0z" fill={c} /></>}
      {q === "harbor" && <><circle cx="14" cy="14" r="7.25" fill="none" stroke={c} strokeWidth="1.5" /><path d="M14 6a8 8 0 0 1 0 16z" fill={c} /></>}
      {q === "fog" && <circle cx="14" cy="14" r="4.5" fill={c} />}
    </svg>
  );
}

export function TideLegend({ className = "" }: { className?: string }) {
  const items: [Quadrant, string][] = [["ballast", "Ballast: settled and hungry"], ["grind", "Grind: hungry, not settled"], ["harbor", "Harbor: settled, a little still"], ["fog", "Fog: low on both"]];
  return (
    <ul className={`grid grid-cols-1 gap-x-4 gap-y-1 text-sm text-muted min-[400px]:grid-cols-2 ${className}`} aria-label="Legend">
      {items.map(([q, label]) => <li key={q} className="flex items-center gap-1.5"><DayDot q={q} size={22} />{label}</li>)}
      <li className="flex items-center gap-1.5"><svg width="22" height="22" viewBox="0 0 28 28" aria-hidden><circle cx="14" cy="14" r="12.25" fill="none" stroke="rgb(var(--brass))" strokeWidth="1.5" /></svg>Brass ring: you noted living a value</li>
      <li className="flex items-center gap-1.5"><span className="inline-block w-[22px] text-center text-xs">7</span>No dot: a day you didn't check in. Nothing is missed.</li>
    </ul>
  );
}
