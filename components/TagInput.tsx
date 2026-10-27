"use client";
import { useState } from "react";
import { SUGGESTED_TAGS } from "@/lib/practices";

export default function TagInput({ value, onChange }: { value: string[]; onChange: (t: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const toggle = (t: string) => onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t]);
  const add = () => {
    const t = draft.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  };
  const all = Array.from(new Set([...SUGGESTED_TAGS, ...value]));
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Tags">
        {all.map((t) => {
          const on = value.includes(t);
          return (
            <button key={t} type="button" aria-pressed={on} onClick={() => toggle(t)} className={`min-h-[40px] rounded-full border px-3.5 text-sm transition-colors duration-calm ${on ? "border-deep bg-deep text-on-deep" : "border-line text-muted hover:text-ink"}`}>
              {t}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2">
        <input className="field !py-2" placeholder="Add your own tag" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} aria-label="Add a custom tag" />
        <button type="button" className="btn btn-ghost" onClick={add} disabled={!draft.trim()}>
          Add
        </button>
      </div>
    </div>
  );
}
