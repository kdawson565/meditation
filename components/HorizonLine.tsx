/**
 * The signature element: a thin brass horizon with one soft tick.
 * Reused as the Today horizon, the calendar's tide line and the Map's axis (the Map draws its own in SVG with HORIZON_STROKE).
 * Decorative unless given a label.
 */
export const HORIZON_STROKE = "rgb(var(--brass))";

export default function HorizonLine({ tick = 0.5, label, className = "", draw = true }: { tick?: number; label?: string; className?: string; draw?: boolean }) {
  const x = Math.max(0, Math.min(1, tick)) * 100;
  return (
    <div className={`relative h-3 ${className}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <span className={`absolute inset-x-0 top-1/2 block h-px -translate-y-1/2 bg-brass ${draw ? "horizon-draw" : ""}`} />
      <span className="absolute top-1/2 block h-2 w-px -translate-y-1/2 bg-brass" style={{ left: `${x}%` }} />
    </div>
  );
}
