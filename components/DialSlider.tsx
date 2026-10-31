"use client";
import { useId } from "react";

/** `ghost` marks the last check-in's value under the track, so you see it without the slider starting there. */
export default function DialSlider({ label, hint, low, high, value, onChange, ghost }: { label: string; hint: string; low: string; high: string; value: number; onChange: (n: number) => void; ghost?: number }) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="font-serif text-2xl">
          {label}
        </label>
        <output htmlFor={id} className="font-serif text-3xl tabular-nums">
          {value}
        </output>
      </div>
      <p className="mt-1 text-[15px] text-muted">{hint}{ghost != null && <span className="sr-only"> Last check-in: {ghost}.</span>}</p>
      <input id={id} type="range" min={1} max={10} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={`${value} out of 10`} className="mt-2" />
      {ghost != null && (
        <div className="relative h-4" aria-hidden>
          <span className="absolute -translate-x-1/2 text-[11px] leading-none text-muted" style={{ left: `calc(${((ghost - 1) / 9) * 100}% + ${(0.5 - (ghost - 1) / 9) * 24}px)` }}>▲ last time</span>
        </div>
      )}
      <div className="flex justify-between text-xs text-muted" aria-hidden>
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
