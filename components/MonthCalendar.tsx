"use client";
import { useRef } from "react";
import type { Checkin } from "@/lib/types";
import type { Quadrant } from "@/lib/quadrant";
import { formatLong } from "@/lib/dates";
import { monthGrid } from "@/lib/tide";
import { livedValue } from "@/lib/values";
import { QUADRANT_INFO } from "@/lib/quadrant";
import DayDot from "./DayDot";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

/** A month of days. Swipe left/right (or use the arrows above) to move between months. Pass no onSelect for a static print version. */
export default function MonthCalendar({ month, byDate, quadrants, today, onSelect, onSwipe }: {
  month: string;
  byDate: Map<string, Checkin>;
  quadrants: Map<string, Quadrant>;
  today: string;
  onSelect?: (date: string) => void;
  onSwipe?: (dir: -1 | 1) => void;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const cells = monthGrid(month);
  return (
    <div
      onTouchStart={(e) => { start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
      onTouchEnd={(e) => {
        const s = start.current; start.current = null;
        if (!s || !onSwipe) return;
        const dx = e.changedTouches[0].clientX - s.x;
        const dy = e.changedTouches[0].clientY - s.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) onSwipe(dx < 0 ? 1 : -1);
      }}
    >
      <div className="grid grid-cols-7 text-center text-xs text-muted" aria-hidden>
        {WEEKDAYS.map((d, i) => <span key={i} className="py-1">{d}</span>)}
      </div>
      <ul className="grid grid-cols-7" key={month} aria-label="Days">
        {cells.map((date, i) => {
          if (!date) return <li key={`b${i}`} aria-hidden />;
          const c = byDate.get(date);
          const q = quadrants.get(date);
          const future = date > today;
          const isToday = date === today;
          const label = `${formatLong(date)}${c && q ? `: ${QUADRANT_INFO[q].name}${livedValue(c) ? ", lived a value" : ""}` : future ? "" : ", no check-in"}`;
          const inner = (
            <>
              <span className={`text-xs tabular-nums ${isToday ? "font-semibold text-ink underline decoration-brass decoration-2 underline-offset-4" : "text-muted"}`}>{Number(date.slice(8))}</span>
              <span className="flex h-7 w-7 items-center justify-center">{c && q && <DayDot q={q} ring={livedValue(c)} />}</span>
            </>
          );
          return (
            <li key={date} className="flex justify-center">
              {onSelect && !future ? (
                <button type="button" aria-label={label} onClick={() => onSelect(date)} className="flex min-h-[52px] w-full flex-col items-center justify-start gap-0.5 rounded-xl pt-1 transition-colors duration-calm hover:bg-surface">
                  {inner}
                </button>
              ) : (
                <div aria-label={label} className="flex min-h-[52px] w-full flex-col items-center justify-start gap-0.5 pt-1 print:min-h-[40px] print:pt-0">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
