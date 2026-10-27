"use client";
import { useId } from "react";

export default function DialSlider({ label, hint, low, high, value, onChange }: { label: string; hint: string; low: string; high: string; value: number; onChange: (n: number) => void }) {
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
      <p className="mt-1 text-[15px] text-muted">{hint}</p>
      <input id={id} type="range" min={1} max={10} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={`${value} out of 10`} className="mt-2" />
      <div className="flex justify-between text-xs text-muted" aria-hidden>
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
