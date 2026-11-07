"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCheckins, useEntries, useValues } from "@/lib/hooks";
import { coreValues } from "@/lib/values";
import GrowthPeace from "@/components/GrowthPeace";
import { addDays, formatLong, todayStr } from "@/lib/dates";
import { midlines, quadrantOf, QUADRANT_INFO, type Quadrant } from "@/lib/quadrant";
import type { Checkin } from "@/lib/types";
import QuadrantMap from "@/components/QuadrantMap";
import Segmented from "@/components/Segmented";

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export default function MapPage() {
  const checkins = useCheckins();
  const entries = useEntries();
  const allValues = useValues();
  const [sel, setSel] = useState<Checkin | null>(null);
  const [view, setView] = useState<"map" | "growth">("map");
  const today = todayStr();

  const data = useMemo(() => {
    if (!checkins || !entries) return null;
    const mid = midlines(checkins);
    const since = addDays(today, -29);
    const days = checkins.filter((c) => c.localDate >= since);
    const counts: Record<Quadrant, number> = { grind: 0, harbor: 0, fog: 0, ballast: 0 };
    days.forEach((c) => counts[quadrantOf(c.drive, c.peace, mid)]++);
    const wk = (from: number, to: number) => checkins.filter((c) => c.localDate >= addDays(today, from) && c.localDate <= addDays(today, to));
    const thisW = wk(-6, 0);
    const prevW = wk(-13, -7);
    const byDate = new Map(checkins.map((c) => [c.localDate, c]));
    const lifts: Record<string, number[]> = {};
    for (const e of entries) {
      const c = byDate.get(e.localDate);
      if (c?.peaceAfter) (lifts[e.practice] ??= []).push(c.peaceAfter - c.peace);
    }
    return { mid, days, counts, thisW, prevW, lifts };
  }, [checkins, entries, today]);

  if (!data || !allValues) return <div aria-busy="true" />;
  const hasValues = coreValues(allValues).length > 0;
  const { mid, days, counts, thisW, prevW } = data;

  if (days.length === 0) {
    return (
      <div className="fade-in">
        <h1 className="font-serif text-3xl">Map</h1>
        <p className="mt-3 text-muted">Your dot will appear here after your first check-in. Over time you'll see where you've been, without any pressure to be anywhere in particular.</p>
        <Link href="/today" className="btn mt-6">Start today</Link>
      </div>
    );
  }

  const delta = (key: "drive" | "peace") => {
    const a = avg(thisW.map((c) => c[key]));
    const b = avg(prevW.map((c) => c[key]));
    if (a == null) return null;
    return { now: a, diff: b == null ? null : a - b };
  };
  const dD = delta("drive");
  const dP = delta("peace");
  const total = days.length;
  const shown = sel ?? days[days.length - 1];
  const q = quadrantOf(shown.drive, shown.peace, mid);

  return (
    <div className="fade-in space-y-10">
      <header>
        <h1 className="font-serif text-3xl">Map</h1>
        <div className="mt-4"><Segmented label="Map views" value={view} onChange={setView} items={[["map", "The last 30 days"], ["growth", "Growth + Peace"]] as const} /></div>
        {view === "map" && <p className="mt-3 text-muted">Older days fade. Tap a dot to see that day.</p>}
      </header>

      {view === "growth" ? <GrowthPeace checkins={checkins!} entries={entries!} hasValues={hasValues} today={today} /> : <>
      <section aria-label="Quadrant map">
        <QuadrantMap days={days} mid={mid} selected={shown.id} onSelect={setSel} valuesLayer={hasValues} />
        {hasValues ? (
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Legend">
            <li className="flex items-center gap-1.5"><svg width="10" height="10" aria-hidden><circle cx="5" cy="5" r="4" fill="rgb(var(--ink))" opacity="0.7" /></svg>Lived a value</li>
            <li className="flex items-center gap-1.5"><svg width="10" height="10" aria-hidden><circle cx="5" cy="5" r="3.5" fill="none" stroke="rgb(var(--ink))" strokeWidth="1.5" opacity="0.7" /></svg>Other days</li>
            <li className="flex items-center gap-1.5"><svg width="14" height="14" aria-hidden><circle cx="7" cy="7" r="6" fill="none" stroke="rgb(var(--sea-dot))" strokeWidth="1.25" /></svg>Voice 7 or higher</li>
          </ul>
        ) : (
          <p className="mt-2 text-xs text-muted">A ring around a dot means your Voice was 7 or higher that day: you were on your own side.</p>
        )}
        <p className="mt-1 text-xs text-muted">{mid.personal ? "The brass horizon is your own typical Drive; the dotted line, your typical Peace." : "The brass horizon and dotted line sit at 5.5 until you have two weeks of check-ins."}</p>
        <div className="card mt-4" aria-live="polite">
          <p className="text-sm text-muted">{formatLong(shown.localDate)}</p>
          <p className="mt-1 font-serif text-xl">
            Drive {shown.drive} · Peace {shown.peace}{shown.peaceAfter ? ` → ${shown.peaceAfter}` : ""}{shown.voice != null ? ` · Voice ${shown.voice}` : ""}
          </p>
          <p className="text-[15px] text-muted">{QUADRANT_INFO[q].name}: {QUADRANT_INFO[q].line}</p>
          {q === "ballast" && hasValues && <p className="text-sm text-muted">Your values are the ballast. Ballast days are when you feel it: settled and hungry at once.</p>}
          {shown.floorValueId && <p className="mt-2 text-[15px]">Carried {allValues.find((v) => v.id === shown.floorValueId)?.name ?? "a value"}{shown.evidence ? <>: <span className="font-serif">{shown.evidence}</span></> : "."}</p>}
          <Link href={`/archive?date=${shown.localDate}`} className="mt-2 inline-block text-[15px] text-brass-ink underline underline-offset-4">Read that day's entries</Link>
        </div>
        <details className="mt-3 text-[15px]">
          <summary className="min-h-[44px] cursor-pointer py-2 text-muted">All days as a list (select a day to read it above)</summary>
          <ul className="mt-2 divide-y divide-line">
            {[...days].reverse().map((c) => (
              <li key={c.id}>
                <button type="button" aria-current={shown.id === c.id ? "true" : undefined} onClick={() => setSel(c)} className="min-h-[44px] w-full py-2 text-left hover:text-brass-ink">
                  {formatLong(c.localDate)}: Drive {c.drive}, Peace {c.peace}
                </button>
              </li>
            ))}
          </ul>
        </details>
      </section>

      <section aria-label="This week" className="grid grid-cols-2 gap-3">
        {([["Drive", dD], ["Peace", dP]] as const).map(([name, d]) => (
          <div key={name} className="card-quiet !p-4">
            <p className="text-sm text-muted">{name}, last 7 days</p>
            <p className="mt-1 font-serif text-3xl tabular-nums">{d ? d.now.toFixed(1) : "–"}</p>
            {d?.diff != null && Math.abs(d.diff) >= 0.2 && <p className="text-sm text-muted">{d.diff > 0 ? "up" : "down"} {Math.abs(d.diff).toFixed(1)} from the week before</p>}
            {d?.diff != null && Math.abs(d.diff) < 0.2 && <p className="text-sm text-muted">about the same as the week before</p>}
          </div>
        ))}
      </section>

      <section aria-label="Where you've spent time">
        <h2 className="font-serif text-xl">Where your days have landed</h2>
        <ul className="mt-4 space-y-3">
          {(Object.keys(QUADRANT_INFO) as Quadrant[]).map((k) => (
            <li key={k}>
              <div className="flex justify-between text-[15px]"><span>{QUADRANT_INFO[k].name}</span><span className="tabular-nums text-muted">{counts[k]} {counts[k] === 1 ? "day" : "days"}</span></div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-sea-dot" style={{ width: `${(counts[k] / total) * 100}%`, transition: "width 800ms cubic-bezier(0.22,0.61,0.36,1)" }} /></div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Insights">
        <h2 className="font-serif text-xl">What tends to settle you</h2>
        <p className="mt-1 text-[15px] text-muted">Before and after, by practice, using the days you rated again at close.</p>
        <Link href="/insights" className="mt-3 inline-block text-[15px] text-brass-ink underline underline-offset-4">See what moves you</Link>
      </section>
      </>}
    </div>
  );
}
