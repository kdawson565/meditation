"use client";

/** Two or three views of one screen. Calm pill tabs. */
export default function Segmented<K extends string>({ items, value, onChange, label }: { items: readonly (readonly [K, string])[]; value: K; onChange: (k: K) => void; label: string }) {
  return (
    <div className="inline-flex rounded-full border border-line p-1" role="tablist" aria-label={label}>
      {items.map(([k, text]) => (
        <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)}
          className={`min-h-[40px] rounded-full px-4 text-sm transition-colors duration-calm ${value === k ? "bg-deep text-on-deep" : "text-muted hover:text-ink"}`}>
          {text}
        </button>
      ))}
    </div>
  );
}
