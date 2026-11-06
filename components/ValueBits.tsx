"use client";
import Link from "next/link";
import { useState } from "react";
import type { Checkin, Value } from "@/lib/types";
import { saveProfile, setDayValues } from "@/lib/store";
import { suggestsDistress } from "@/lib/safety";

/** A row of value chips. Tapping the chosen one again clears it. */
export function ValueChips({ values, value, onChange, label, extra }: {
  values: Value[];
  value?: string;
  onChange: (id: string | undefined) => void;
  label: string;
  extra?: { id: string; name: string }[];
}) {
  const items = [...values.map((v) => ({ id: v.id, name: v.name })), ...(extra ?? [])];
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {items.map((v) => (
        <button key={v.id} type="button" role="radio" aria-checked={value === v.id} onClick={() => onChange(value === v.id ? undefined : v.id)}
          className={`min-h-[44px] rounded-full border px-4 text-[15px] transition-colors duration-calm ${value === v.id ? "border-deep bg-deep text-on-deep" : "border-line hover:border-muted"}`}>
          {v.name}
        </button>
      ))}
    </div>
  );
}

/**
 * "One moment today you lived Presence." Optional, one line. A blank day shows nothing and is never marked missed.
 * Used on the logged screen (today), at close in the evening, and the next morning for yesterday.
 */
export function EvidenceCard({ checkin, values, when }: { checkin: Checkin; values: Value[]; when: "today" | "yesterday" }) {
  const [text, setText] = useState(checkin.evidence ?? "");
  const [picked, setPicked] = useState<string | undefined>(checkin.floorValueId);
  const [kept, setKept] = useState(false);
  const carried = values.find((v) => v.id === picked);
  const day = when === "today" ? "today" : "yesterday";
  const save = () => {
    if (text.trim() === (checkin.evidence ?? "")) return;
    void setDayValues(checkin.id, { evidence: text });
    setKept(true);
  };
  const heavy = kept && suggestsDistress([text]);
  return (
    <section aria-labelledby={`ev-${checkin.id}`} className="space-y-3 rounded-2xl border border-line p-5">
      <p id={`ev-${checkin.id}`} className="text-sm text-muted">
        {carried ? <>{when === "today" ? "Today you carried" : "Yesterday you carried"} <span className="text-ink">{carried.name}</span></> : `A value, ${day}`}
      </p>
      {!checkin.floorValueId && (
        <ValueChips values={values} value={picked} label="Which value" onChange={(id) => { setPicked(id); if (id) void setDayValues(checkin.id, { floorValueId: id }); }} />
      )}
      <label htmlFor={`ev-in-${checkin.id}`} className="block font-serif text-lg leading-relaxed">
        One moment {day} you lived {carried ? carried.name : "one of your values"}.
      </label>
      {carried?.definition && <p className="-mt-2 text-sm text-muted">{carried.definition}</p>}
      <input id={`ev-in-${checkin.id}`} className="field serif" value={text} maxLength={280} placeholder="Even a small one counts…"
        onChange={(e) => { setText(e.target.value); setKept(false); }} onBlur={save}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
      <p className="text-sm text-muted" aria-live="polite">{kept ? "Kept." : "Optional. Skipping is fine."}</p>
      {heavy && (
        <p role="note" className="rounded-xl border border-brass p-3 text-[15px]">That sounded heavy. Ballast isn't a therapist and can't be there the way a person can. If this is more than a rough patch, please reach out to someone you trust, or a crisis line. In the US you can call or text 988.</p>
      )}
    </section>
  );
}

/** The calm, skippable invitation for people who haven't set values. Never blocks the ritual. */
export function ValuesInvite() {
  return (
    <aside aria-labelledby="vi-h" className="rounded-2xl border border-line bg-surface p-5">
      <h2 id="vi-h" className="font-serif text-xl">Goals move. Values hold.</h2>
      <p className="mt-2 text-[15px] text-muted">Your values are the ballast. Your goals are the sails. Choosing yours takes about three minutes, and the ritual works the same either way.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link href="/values" className="btn">Choose my values</Link>
        <button className="btn-quiet rounded-full" onClick={() => void saveProfile({ valuesInviteDismissed: true })}>Not now</button>
      </div>
    </aside>
  );
}
