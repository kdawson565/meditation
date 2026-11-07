"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCheckins, useEntries, useSavedCards, useValues } from "@/lib/hooks";
import { addDays, todayStr } from "@/lib/dates";
import { coreValues } from "@/lib/values";
import { quadrantsByDate } from "@/lib/tide";
import { CARD_VALUES, CARDS, cardById, retrieve, THEMES } from "@/lib/library";
import type { Quadrant } from "@/lib/quadrant";
import HorizonLine from "@/components/HorizonLine";
import Segmented from "@/components/Segmented";
import { CardRow } from "@/components/CardBits";

export default function LibraryPage() {
  const checkins = useCheckins();
  const entries = useEntries();
  const allValues = useValues();
  const saved = useSavedCards();
  const today = todayStr();
  const [view, setView] = useState<"value" | "theme" | "saved">("value");
  const [valueSel, setValueSel] = useState<string | null>(null);
  const [moreValues, setMoreValues] = useState(false);

  const ctx = useMemo(() => {
    if (!checkins || !entries || !allValues) return null;
    const values = coreValues(allValues);
    const latest = [...checkins].reverse().find((c) => c.localDate >= addDays(today, -2));
    const floor = allValues.find((v) => v.id === latest?.floorValueId)?.name;
    const quadrant = latest ? quadrantsByDate(checkins).get(latest.localDate) : undefined;
    const recentPractices = entries.filter((e) => e.localDate >= addDays(today, -7)).map((e) => e.practice);
    const forToday = retrieve({ value: floor, otherValues: values.map((v) => v.name), quadrant, recentPractices, seed: today }, { min: 2, max: 3 });
    return { values, mine: new Set(values.map((v) => v.name.toLowerCase())), forToday, floor, quadrant };
  }, [checkins, entries, allValues, today]);

  if (!ctx || !saved) return <div aria-busy="true" />;
  const savedIds = new Set(saved.map((s) => s.id));
  // the person's own values that have cards come first
  const valueChips = [...CARD_VALUES].sort((a, b) => Number(ctx.mine.has(b.toLowerCase())) - Number(ctx.mine.has(a.toLowerCase())));
  const sel = valueSel ?? valueChips.find((v) => ctx.mine.has(v.toLowerCase())) ?? null;
  // with values chosen, only yours show until you ask for the rest
  const ownChips = valueChips.filter((v) => ctx.mine.has(v.toLowerCase()));
  const shownChips = ownChips.length && !moreValues ? [...ownChips, ...(sel && !ownChips.includes(sel) ? [sel] : [])] : valueChips;
  const byValue = sel ? CARDS.filter((c) => c.values.includes(sel)) : CARDS;

  return (
    <div className="fade-in space-y-8">
      <header>
        <h1 className="font-serif text-3xl">Library</h1>
        <HorizonLine className="mt-4" tick={0.62} />
        <p className="mt-4 text-[15px] text-muted">Short principles in Ballast's own words. Read one, carry its question, or start its practice.</p>
      </header>

      <Link href="/library/ask" className="card-quiet flex items-center justify-between gap-4 transition-colors duration-calm hover:border-muted">
        <span>
          <span className="block font-serif text-xl">Ask Ballast</span>
          <span className="mt-1 block text-[15px] text-muted">A short conversation, answered from these cards and your own words.</span>
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden className="shrink-0 text-muted"><path d="M9 5l7 7-7 7" /></svg>
      </Link>

      <section aria-labelledby="ft-h">
        <h2 id="ft-h" className="eyebrow">For today</h2>
        <p className="mt-1 text-sm text-muted">
          {ctx.floor || ctx.quadrant ? `Chosen from ${[ctx.floor && `the value you're carrying (${ctx.floor})`, ctx.quadrant && "how today feels"].filter(Boolean).join(" and ")}.` : "Check in today and these will follow your value and how the day feels."}
        </p>
        <ul className="mt-3 space-y-3">{ctx.forToday.map((c) => <CardRow key={c.id} card={c} mine={ctx.mine} saved={savedIds.has(c.id)} />)}</ul>
      </section>

      <section aria-label="Browse">
        <Segmented label="Browse the Library" value={view} onChange={setView} items={[["value", "By value"], ["theme", "By theme"], ["saved", `Saved${saved.length ? ` (${saved.length})` : ""}`]] as const} />

        {view === "value" && (
          <div className="mt-5">
            <div role="radiogroup" aria-label="Value" className="flex flex-wrap gap-2">
              <button type="button" role="radio" aria-checked={sel === null} className="chip" onClick={() => setValueSel(null)}>All</button>
              {shownChips.map((v) => (
                <button key={v} type="button" role="radio" aria-checked={sel === v} className="chip" onClick={() => setValueSel(v)}>{v}</button>
              ))}
            </div>
            {ownChips.length > 0 && (
              <button type="button" className="btn-quiet -ml-3 mt-1 rounded-full text-sm" aria-expanded={moreValues} onClick={() => setMoreValues((m) => !m)}>
                {moreValues ? "Only my values" : `More values (${valueChips.length - ownChips.length})`}
              </button>
            )}
            <ul className="mt-4 space-y-3">{byValue.map((c) => <CardRow key={c.id} card={c} mine={ctx.mine} saved={savedIds.has(c.id)} />)}</ul>
          </div>
        )}

        {view === "theme" && (
          <div className="mt-5 space-y-8">
            {(Object.keys(THEMES) as Quadrant[]).map((q) => {
              const cards = CARDS.filter((c) => c.quadrants.includes(q));
              if (!cards.length) return null;
              return (
                <section key={q} aria-labelledby={`th-${q}`}>
                  <h3 id={`th-${q}`} className="font-serif text-xl">{THEMES[q].name}</h3>
                  <p className="text-sm text-muted">{THEMES[q].line}</p>
                  <ul className="mt-3 space-y-3">{cards.map((c) => <CardRow key={c.id} card={c} mine={ctx.mine} saved={savedIds.has(c.id)} />)}</ul>
                </section>
              );
            })}
          </div>
        )}

        {view === "saved" && (
          <div className="mt-5">
            {saved.length === 0 ? (
              <p className="text-[15px] text-muted">Nothing saved yet. Save a card to keep it close; it travels with your export and leaves with your data if you delete it.</p>
            ) : (
              <ul className="space-y-3">{saved.map((s) => cardById(s.id)).filter((c) => !!c).map((c) => <CardRow key={c!.id} card={c!} mine={ctx.mine} saved />)}</ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
