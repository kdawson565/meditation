"use client";
import type { Checkin } from "@/lib/types";
import { QUADRANT_INFO } from "@/lib/quadrant";
import { HORIZON_STROKE } from "@/components/HorizonLine";

const S = 320;
const PAD = 26;
const IN = S - PAD * 2;

function hash(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return h;
}

export default function QuadrantMap({ days, mid, selected, onSelect, valuesLayer = false }: { days: Checkin[]; mid: { drive: number; peace: number }; selected?: string; onSelect: (c: Checkin) => void; valuesLayer?: boolean }) {
  const px = (peace: number, id: string) => PAD + ((peace - 1 + (((hash(id) & 255) / 255) - 0.5) * 0.5) / 9) * IN;
  const py = (drive: number, id: string) => PAD + (1 - (drive - 1 + ((((hash(id) >> 8) & 255) / 255) - 0.5) * 0.5) / 9) * IN;
  const mx = PAD + ((mid.peace - 1) / 9) * IN;
  const my = PAD + (1 - (mid.drive - 1) / 9) * IN;
  const pts = days.map((c) => ({ c, x: px(c.peace, c.id), y: py(c.drive, c.id) }));
  const n = pts.length;
  const label = (x: number, y: number, key: keyof typeof QUADRANT_INFO, anchor: "start" | "end") => (
    <text x={x} y={y} textAnchor={anchor} fontSize="11" fill="rgb(var(--muted))" letterSpacing="0.08em" style={{ textTransform: "uppercase" }}>
      {QUADRANT_INFO[key].name}
    </text>
  );
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="w-full" role="img" aria-label={`Map of your last 30 days. Peace runs left to right, Drive runs bottom to top. The top right is Ballast. A ring marks days your Voice was 7 or higher.${valuesLayer ? " Filled dots are days you noted a moment you lived a value; hollow dots are other days." : ""}`}>
      <rect x={mx} y={PAD} width={S - PAD - mx} height={my - PAD} fill="rgb(var(--sea))" opacity="0.14" />
      <rect x={PAD} y={PAD} width={S - PAD * 2} height={S - PAD * 2} fill="none" stroke="rgb(var(--line))" />
      <line x1={mx} x2={mx} y1={PAD} y2={S - PAD} stroke="rgb(var(--line))" strokeDasharray="3 4" />
      {/* the horizon: your typical Drive, drawn as the brass line with one soft tick at your typical Peace */}
      <line y1={my} y2={my} x1={PAD} x2={S - PAD} stroke={HORIZON_STROKE} strokeWidth="1" className="horizon-draw" />
      <line x1={mx} x2={mx} y1={my - 4} y2={my + 4} stroke={HORIZON_STROKE} strokeWidth="1" />
      {label(PAD + 8, PAD + 18, "grind", "start")}
      {label(S - PAD - 8, PAD + 18, "ballast", "end")}
      {label(PAD + 8, S - PAD - 10, "fog", "start")}
      {label(S - PAD - 8, S - PAD - 10, "harbor", "end")}
      <text x={S / 2} y={S - 6} textAnchor="middle" fontSize="10" fill="rgb(var(--muted))">Peace →</text>
      <text x="9" y={S / 2} textAnchor="middle" fontSize="10" fill="rgb(var(--muted))" transform={`rotate(-90 9 ${S / 2})`}>Drive →</text>
      <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="rgb(var(--brass))" strokeOpacity="0.28" strokeWidth="1" strokeLinejoin="round" />
      {pts.map(({ c, x, y }, i) => {
        const age = n <= 1 ? 1 : i / (n - 1);
        const last = i === n - 1;
        const sel = selected === c.id;
        return (
          <g key={c.id} style={{ cursor: "pointer" }} onClick={() => onSelect(c)}>
            <circle cx={x} cy={y} r={14} fill="transparent" />
            {c.voice != null && c.voice >= 7 && !last && !sel && <circle cx={x} cy={y} r={7} fill="none" stroke="rgb(var(--sea-dot))" strokeWidth="1.25" opacity={0.35 + age * 0.5} />}
            {(last || sel) && <circle cx={x} cy={y} r={last ? 11 : 9} fill="none" stroke="rgb(var(--brass))" strokeWidth="1.5" opacity={sel ? 1 : 0.6} />}
            {valuesLayer && !c.evidence?.trim() ? (
              // hollow: a day without a noted value moment. Never "missed", just open.
              <circle cx={x} cy={y} r={last ? 5.5 : 3.5} fill="rgb(var(--paper))" stroke={last ? "rgb(var(--brass))" : "rgb(var(--ink))"} strokeWidth="1.5" opacity={last ? 1 : 0.3 + age * 0.5} style={{ transition: "opacity 500ms" }} />
            ) : (
              <circle cx={x} cy={y} r={last ? 6 : 4} fill={last ? "rgb(var(--brass))" : "rgb(var(--ink))"} opacity={last ? 1 : (valuesLayer ? 0.3 : 0.12) + age * (valuesLayer ? 0.5 : 0.55)} style={{ transition: "opacity 500ms" }} />
            )}
          </g>
        );
      })}
    </svg>
  );
}
