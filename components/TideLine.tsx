"use client";

/** The hull: a small vessel outline whose water line rises with the share of this month's days practiced. */
export default function TideLine({ level, label }: { level: number; label: string }) {
  const l = Math.max(0.04, Math.min(1, level));
  const y = 78 - l * 62; // water surface y inside the hull (78 = bottom, 16 = top)
  return (
    <figure className="m-0 flex items-center gap-4" aria-label={label}>
      <svg width="96" height="84" viewBox="0 0 120 100" role="img" aria-label={label} className="shrink-0">
        <defs>
          <clipPath id="hull">
            <path d="M10 28h100l-14 56a8 8 0 0 1-8 6H32a8 8 0 0 1-8-6z" />
          </clipPath>
        </defs>
        <g clipPath="url(#hull)">
          <g style={{ transform: `translateY(${y}px)`, transition: "transform 1200ms cubic-bezier(0.22,0.61,0.36,1)" }}>
            <g className="wave-b" style={{ opacity: 0.45 }}>
              <path d="M0 6 Q15 0 30 6 T60 6 T90 6 T120 6 T150 6 T180 6 T210 6 T240 6 V120 H0z" fill="rgb(var(--sea))" />
            </g>
            <g className="wave-a">
              <path d="M0 10 Q15 4 30 10 T60 10 T90 10 T120 10 T150 10 T180 10 T210 10 T240 10 V120 H0z" fill="rgb(var(--sea))" opacity="0.85" />
            </g>
          </g>
        </g>
        <path d="M10 28h100l-14 56a8 8 0 0 1-8 6H32a8 8 0 0 1-8-6z" fill="none" stroke="rgb(var(--ink))" strokeWidth="2" strokeLinejoin="round" />
        <path d="M60 28V6M60 6l22 18H60" fill="none" stroke="rgb(var(--brass))" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <figcaption className="text-[15px] leading-snug text-muted">{label}</figcaption>
    </figure>
  );
}
