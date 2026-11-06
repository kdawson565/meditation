"use client";
import { useState } from "react";
import { exampleFor, MAX_VALUES, MIN_VALUES, VALUE_DECK } from "@/lib/values";

export interface ChosenValue { name: string; definition: string; custom: boolean }

/**
 * Two short stages: tap 3–5 values, then say what each looks like on a good day.
 * Definitions are encouraged but each can be left blank, to keep the whole thing under three minutes.
 */
export default function ValuesSetup({ initial = [], onDone, onBack, doneLabel = "Save my values", busy }: {
  initial?: ChosenValue[];
  onDone: (values: ChosenValue[]) => void;
  onBack?: () => void;
  doneLabel?: string;
  busy?: boolean;
}) {
  const [stage, setStage] = useState<"pick" | "define">("pick");
  const [chosen, setChosen] = useState<ChosenValue[]>(initial);
  const [custom, setCustom] = useState("");
  const deckNames = new Set(VALUE_DECK.map((v) => v.name.toLowerCase()));
  const extra = chosen.filter((c) => !deckNames.has(c.name.toLowerCase()));
  const isOn = (name: string) => chosen.some((c) => c.name.toLowerCase() === name.toLowerCase());
  const full = chosen.length >= MAX_VALUES;

  const toggle = (name: string, isCustom = false) => {
    if (isOn(name)) setChosen(chosen.filter((c) => c.name.toLowerCase() !== name.toLowerCase()));
    else if (!full) setChosen([...chosen, { name, definition: "", custom: isCustom }]);
  };
  const addCustom = () => {
    const name = custom.trim().replace(/\s+/g, " ").slice(0, 40);
    if (!name || isOn(name) || full) return;
    setChosen([...chosen, { name, definition: "", custom: !deckNames.has(name.toLowerCase()) }]);
    setCustom("");
  };

  if (stage === "pick") {
    return (
      <div>
        <h1 className="font-serif text-3xl">Goals move. Values hold.</h1>
        <p className="mt-3 text-muted">Your values are the ballast. Your goals are the sails. Choose the {MIN_VALUES} to {MAX_VALUES} that you most want to live by. Not the ones you think you should.</p>
        <p className="mt-5 text-sm text-muted" aria-live="polite">{chosen.length} chosen{chosen.length < MIN_VALUES ? `, ${MIN_VALUES - chosen.length} more to go` : full ? ", that's the most" : ""}</p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Values">
          {[...VALUE_DECK.map((v) => ({ name: v.name, custom: false })), ...extra.map((c) => ({ name: c.name, custom: true }))].map((v) => {
            const on = isOn(v.name);
            return (
              <button key={v.name} type="button" aria-pressed={on} disabled={!on && full} onClick={() => toggle(v.name, v.custom)}
                className={`min-h-[44px] rounded-full border px-4 text-[15px] transition-colors duration-calm disabled:opacity-40 ${on ? "border-deep bg-deep text-on-deep" : "border-line hover:border-muted"}`}>
                {v.name}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex gap-2">
          <label htmlFor="custom-value" className="sr-only">Add your own value</label>
          <input id="custom-value" className="field" value={custom} placeholder="Add your own" disabled={full} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }} />
          <button type="button" className="btn btn-ghost shrink-0" onClick={addCustom} disabled={!custom.trim() || full}>Add</button>
        </div>
        <div className="mt-8 flex items-center gap-3">
          <button className="btn" disabled={chosen.length < MIN_VALUES} onClick={() => setStage("define")}>Continue</button>
          {onBack && <button className="btn-quiet rounded-full" onClick={onBack}>Not now</button>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-3xl">In your own words</h1>
      <p className="mt-3 text-muted">One line each: on a good day, what does this look like? This is what you'll see when you carry it. Leave any blank and add it later.</p>
      <div className="mt-6 space-y-5">
        {chosen.map((c, i) => (
          <div key={c.name}>
            <label htmlFor={`def-${i}`} className="mb-2 block text-[15px]"><span className="font-medium">{c.name}</span>: on a good day, this looks like…</label>
            <input id={`def-${i}`} className="field serif" value={c.definition} placeholder={exampleFor(c.name)} maxLength={200}
              onChange={(e) => setChosen(chosen.map((x, j) => (j === i ? { ...x, definition: e.target.value } : x)))} />
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-center gap-3">
        <button className="btn" disabled={busy} onClick={() => onDone(chosen.map((c) => ({ ...c, definition: c.definition.trim() })))}>{busy ? "Saving…" : doneLabel}</button>
        <button className="btn-quiet rounded-full" onClick={() => setStage("pick")}>Back</button>
      </div>
    </div>
  );
}
