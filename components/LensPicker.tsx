"use client";
import { LENSES, MAX_LENSES } from "@/lib/lenses";

export default function LensPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else if (value.length < MAX_LENSES) onChange([...value, id]);
  };
  return (
    <div>
      <p className="mb-3 text-sm text-muted" aria-live="polite">{value.length} of {MAX_LENSES} chosen</p>
      <ul className="grid gap-2">
        {LENSES.map((l) => {
          const on = value.includes(l.id);
          const full = !on && value.length >= MAX_LENSES;
          return (
            <li key={l.id}>
              <button type="button" aria-pressed={on} disabled={full} onClick={() => toggle(l.id)} className={`w-full rounded-2xl border p-4 text-left transition-colors duration-calm disabled:opacity-50 ${on ? "border-deep bg-surface" : "border-line hover:border-muted"}`}>
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-serif text-lg">{l.name}</span>
                  <span className="text-xs text-muted">{on ? "Chosen" : l.tradition}</span>
                </span>
                <span className="mt-1 block text-[15px] text-muted">{l.blurb}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
