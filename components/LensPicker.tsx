"use client";
import { LENSES } from "@/lib/lenses";

/** Every thinker is already woven in. This only marks favorites, who come up more often. No limit. */
export default function LensPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <div>
      <p className="mb-3 text-sm text-muted" aria-live="polite">{value.length ? `${value.length} favorite${value.length === 1 ? "" : "s"}` : "No favorites. Everyone gets an equal turn."}</p>
      <ul className="grid gap-2">
        {LENSES.map((l) => {
          const on = value.includes(l.id);
          return (
            <li key={l.id}>
              <button type="button" aria-pressed={on} onClick={() => toggle(l.id)} className={`w-full rounded-2xl border p-4 text-left transition-colors duration-calm ${on ? "border-deep bg-surface" : "border-line hover:border-muted"}`}>
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-serif text-lg">{l.name}</span>
                  <span className="text-xs text-muted">{on ? "Favorite" : l.tradition}</span>
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
