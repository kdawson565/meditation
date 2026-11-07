"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Checkin, Entry } from "@/lib/types";
import { addDays, formatShort, weekStartOf } from "@/lib/dates";
import { livedValue } from "@/lib/values";

const WEEKS = 12;
const W = 320;
const H = 180;
const L = 26; // left gutter for the 1–10 axis
const R = 44; // right gutter for direct labels
const T = 12;
const B = 22;
const DRIVE = "rgb(var(--chart-drive))";
const PEACE = "rgb(var(--chart-peace))";

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

interface Week { start: string; drive: number | null; peace: number | null; days: number; filled: number; sails: number }

/** Drive and Peace by week, Sails filled by week, and how Peace and Drive looked on value days vs. other days. */
export default function GrowthPeace({ checkins, entries, hasValues, today, only }: { checkins: Checkin[]; entries: Entry[]; hasValues: boolean; today: string; only?: "trend" }) {
  const weeks: Week[] = useMemo(() => {
    const first = addDays(weekStartOf(today), -7 * (WEEKS - 1));
    return Array.from({ length: WEEKS }, (_, i) => {
      const start = addDays(first, i * 7);
      const end = addDays(start, 6);
      const days = checkins.filter((c) => c.localDate >= start && c.localDate <= end);
      const sails = entries.filter((e) => e.sail && e.sailResult && e.localDate >= start && e.localDate <= end);
      return { start, drive: avg(days.map((c) => c.drive)), peace: avg(days.map((c) => c.peace)), days: days.length, filled: sails.filter((e) => e.sailResult === "filled").length, sails: sails.length };
    });
  }, [checkins, entries, today]);
  const [sel, setSel] = useState<number | null>(null);
  const shownIdx = sel ?? [...weeks.keys()].reverse().find((i) => weeks[i].days > 0) ?? WEEKS - 1;
  const shown = weeks[shownIdx];

  const x = (i: number) => L + (i / (WEEKS - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - 1) / 9) * (H - T - B);
  const path = (key: "drive" | "peace") => {
    let d = "";
    let pen = false;
    weeks.forEach((w, i) => {
      const v = w[key];
      if (v == null) { pen = false; return; }
      d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)} `;
      pen = true;
    });
    return d.trim();
  };
  const lastIdx = (key: "drive" | "peace") => [...weeks.keys()].reverse().find((i) => weeks[i][key] != null);
  const maxFilled = Math.max(1, ...weeks.map((w) => w.sails));

  // value days vs. other days, counted only from the first day a value was carried (earlier days can't be value days)
  const since = checkins.find((c) => c.floorValueId || c.evidence)?.localDate;
  const window_ = since ? checkins.filter((c) => c.localDate >= since) : [];
  const lived = window_.filter(livedValue);
  const other = window_.filter((c) => !livedValue(c));
  const ready = window_.length >= 14 && lived.length >= 5 && other.length >= 5;
  const f = (n: number | null) => (n == null ? "–" : n.toFixed(1));

  const hit = (i: number, label: string) => (
    <rect key={i} x={x(i) - (W - L - R) / (WEEKS - 1) / 2} y={0} width={(W - L - R) / (WEEKS - 1)} height={H} fill="transparent" style={{ cursor: "pointer" }}
      onClick={() => setSel(i)} onMouseEnter={() => setSel(i)} aria-hidden data-week={label} />
  );

  return (
    <div className="space-y-8">
      <section aria-labelledby="gp-trend">
        <h2 id="gp-trend" className="font-serif text-xl">Drive and Peace, by week</h2>
        <p className="mt-1 text-[15px] text-muted">Weekly averages, last 12 weeks. Growth shows up as Drive that holds while Peace rises.</p>
        <ul className="mt-3 flex gap-5 text-sm" aria-label="Legend">
          <li className="flex items-center gap-2"><span aria-hidden className="inline-block h-[2px] w-5 rounded" style={{ background: DRIVE }} />Drive</li>
          <li className="flex items-center gap-2"><span aria-hidden className="inline-block h-[2px] w-5 rounded" style={{ background: PEACE }} />Peace</li>
        </ul>
        <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label="Line chart of weekly average Drive and Peace on a 1 to 10 scale over the last 12 weeks. A table view follows.">
          {[1, 4, 7, 10].map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="rgb(var(--line))" strokeWidth="1" />
              <text x={L - 6} y={y(v) + 3.5} textAnchor="end" fontSize="10" fill="rgb(var(--muted))">{v}</text>
            </g>
          ))}
          <line x1={x(shownIdx)} x2={x(shownIdx)} y1={T} y2={H - B} stroke="rgb(var(--muted))" strokeOpacity="0.5" strokeDasharray="2 3" />
          {(["drive", "peace"] as const).map((k) => (
            <g key={k}>
              <path d={path(k)} fill="none" stroke={k === "drive" ? DRIVE : PEACE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {weeks.map((w, i) => w[k] != null && (
                <circle key={i} cx={x(i)} cy={y(w[k]!)} r={i === shownIdx ? 5 : 4} fill={k === "drive" ? DRIVE : PEACE} stroke="rgb(var(--paper))" strokeWidth="2" />
              ))}
              {lastIdx(k) != null && (
                <text x={x(lastIdx(k)!) + 9} y={y(weeks[lastIdx(k)!][k]!) + (k === "drive" ? -4 : 12)} fontSize="11" fill="rgb(var(--ink))">{k === "drive" ? "Drive" : "Peace"}</text>
              )}
            </g>
          ))}
          <text x={L} y={H - 6} fontSize="10" fill="rgb(var(--muted))">{formatShort(weeks[0].start)}</text>
          <text x={W - R} y={H - 6} textAnchor="end" fontSize="10" fill="rgb(var(--muted))">This week</text>
          {weeks.map((w, i) => hit(i, `Week of ${formatShort(w.start)}`))}
        </svg>
        <div className="mt-2 rounded-2xl border border-line bg-surface p-4" aria-live="polite">
          <p className="text-sm text-muted">Week of {formatShort(shown.start)}</p>
          <p className="mt-1 font-serif text-lg">
            {shown.days ? <>Drive {f(shown.drive)} · Peace {f(shown.peace)} <span className="font-sans text-sm text-muted">({shown.days} {shown.days === 1 ? "day" : "days"})</span></> : "No check-ins that week. That's fine."}
          </p>
          {shown.sails > 0 && <p className="text-[15px] text-muted">{shown.filled} of {shown.sails} Sails filled</p>}
        </div>
      </section>

      {only !== "trend" && <>
      <section aria-labelledby="gp-sails">
        <h2 id="gp-sails" className="font-serif text-xl">Sails filled, by week</h2>
        <p className="mt-1 text-[15px] text-muted">Your follow-through: the growth you can count. Only Sails you checked back on.</p>
        <svg viewBox={`0 0 ${W} 70`} className="mt-3 w-full" role="img" aria-label="Bar chart of Sails filled per week over the last 12 weeks. A table view follows.">
          <line x1={L} x2={W - R} y1={56} y2={56} stroke="rgb(var(--line))" />
          {weeks.map((w, i) => {
            const h = (w.filled / maxFilled) * 44;
            const bw = Math.min(14, (W - L - R) / WEEKS - 4);
            return (
              <g key={i} onClick={() => setSel(i)} onMouseEnter={() => setSel(i)} style={{ cursor: "pointer" }}>
                <rect x={x(i) - 10} y={0} width={20} height={70} fill="transparent" />
                {w.filled > 0 && <path d={`M${x(i) - bw / 2},56 v${-(h - 4)} q0,-4 4,-4 h${bw - 8} q4,0 4,4 v${h - 4} z`} fill="rgb(var(--ink))" opacity={i === shownIdx ? 0.85 : 0.45} />}
                {w.filled > 0 && i === shownIdx && <text x={x(i)} y={56 - h - 4} textAnchor="middle" fontSize="10" fill="rgb(var(--ink))">{w.filled}</text>}
              </g>
            );
          })}
        </svg>
        <details className="mt-2 text-[15px]">
          <summary className="min-h-[44px] cursor-pointer py-2 text-muted">As a table</summary>
          <table className="mt-2 w-full text-left text-sm tabular-nums">
            <thead className="text-muted"><tr><th className="py-1 font-normal">Week of</th><th className="font-normal">Drive</th><th className="font-normal">Peace</th><th className="font-normal">Sails filled</th></tr></thead>
            <tbody>
              {[...weeks].reverse().map((w) => (
                <tr key={w.start} className="border-t border-line"><td className="py-1">{formatShort(w.start)}</td><td>{f(w.drive)}</td><td>{f(w.peace)}</td><td>{w.sails ? `${w.filled} of ${w.sails}` : "–"}</td></tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <section aria-labelledby="gp-values" className="rounded-2xl border border-line p-5">
        <h2 id="gp-values" className="font-serif text-xl">When you lived a value</h2>
        {!hasValues ? (
          <p className="mt-2 text-[15px] text-muted">Once you've chosen your values and noted a few moments you lived them, this compares those days with the rest. <Link href="/values" className="text-brass-ink underline underline-offset-4">Choose your values</Link></p>
        ) : ready ? (
          <>
            <p className="mt-2 text-[15px]">
              On the {lived.length} days you lived a value, your Peace averaged {f(avg(lived.map((c) => c.peace)))} and Drive {f(avg(lived.map((c) => c.drive)))}. On the other {other.length} days, Peace averaged {f(avg(other.map((c) => c.peace)))} and Drive {f(avg(other.map((c) => c.drive)))}.
            </p>
            <p className="mt-1 text-sm text-muted">A pattern from your own days, not proof. It's easier to notice a value on a good day, so read it as a hint.</p>
          </>
        ) : (
          <p className="mt-2 text-[15px] text-muted">This shows up after two weeks of check-ins, with at least five days on each side. So far: {window_.length} {window_.length === 1 ? "day" : "days"} since you started carrying values, {lived.length} with a moment you lived one.</p>
        )}
      </section>
      </>}
    </div>
  );
}
