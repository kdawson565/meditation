"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCheckins, useEntries, useValues } from "@/lib/hooks";
import { formatShort, todayStr } from "@/lib/dates";
import { midlines } from "@/lib/quadrant";
import { monthName, monthOf, quadrantsByDate, summarizeMonth } from "@/lib/tide";
import QuadrantMap from "@/components/QuadrantMap";
import MonthCalendar from "@/components/MonthCalendar";
import HorizonLine from "@/components/HorizonLine";
import { TideLegend } from "@/components/DayDot";

/**
 * The Monthly Tide Report: one printable page. Map path, days practiced, values lived.
 * No entry text unless the person opts in (their evidence lines). Nothing leaves the device; printing or saving as PDF is up to them.
 */
function Report() {
  const params = useSearchParams();
  const today = todayStr();
  const m = params.get("m");
  const month = m && /^\d{4}-\d{2}$/.test(m) ? m : monthOf(today);
  const checkins = useCheckins();
  const entries = useEntries();
  const allValues = useValues();
  const [withWords, setWithWords] = useState(false);
  const byDate = useMemo(() => new Map((checkins ?? []).map((c) => [c.localDate, c])), [checkins]);
  const quadrants = useMemo(() => quadrantsByDate(checkins ?? []), [checkins]);
  if (!checkins || !entries || !allValues) return <div aria-busy="true" />;
  const s = summarizeMonth(month, checkins, entries, allValues, today);
  const f = (n: number | null) => (n == null ? "–" : n.toFixed(1));
  const title = monthName(month, true);

  return (
    <article className="fade-in space-y-8 print:space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/tide" className="btn-quiet -ml-3 rounded-full">← Tide</Link>
        <button className="btn" onClick={() => window.print()}>Print or save as PDF</button>
      </div>

      <header>
        <p className="eyebrow">Ballast · Tide Report</p>
        <h1 className="mt-2 font-serif text-3xl">{title}</h1>
        <HorizonLine className="mt-4 print:mt-2" tick={s.of ? s.practiced / s.of : 0} draw={false} />
        <p className="mt-3 font-serif text-xl print:mt-1"><span className="tabular-nums">{s.practiced}</span> {s.practiced === 1 ? "day" : "days"} practiced{month === monthOf(today) ? " so far" : ""}</p>
        <p className="text-sm text-muted">A number, not a streak.</p>
      </header>

      {s.practiced === 0 ? <p className="text-[15px] text-muted">No check-ins this month. The next one is simply another place to begin.</p> : <div className="space-y-8 print:grid print:grid-cols-2 print:items-start print:gap-4 print:space-y-0">
        <div className="space-y-8 print:space-y-4">
        <section aria-labelledby="r-path" className="card">
          <h2 id="r-path" className="font-serif text-xl">The month's path</h2>
          <p className="mt-1 text-sm text-muted">Each dot is a day, older days fainter. Peace runs left to right, Drive bottom to top.</p>
          <div className="mx-auto mt-3 max-w-sm print:max-w-[250px]">
            <QuadrantMap days={s.days} mid={midlines(checkins)} onSelect={() => {}} valuesLayer={allValues.some((v) => v.core)} />
          </div>
        </section>

        <section aria-labelledby="r-dials" className="card">
          <h2 id="r-dials" className="font-serif text-xl">The dials, on average</h2>
          <dl className="mt-3 grid grid-cols-3 gap-3">
            {([["Drive", s.drive], ["Peace", s.peace], ["Voice", s.voice]] as const).map(([k, v]) => <div key={k}><dt className="text-sm text-muted">{k}</dt><dd className="font-serif text-2xl tabular-nums">{f(v)}</dd></div>)}
          </dl>
          {s.sails.checked > 0 && <p className="mt-3 text-[15px]">{s.sails.filled} of {s.sails.checked} Sails filled.</p>}
        </section>
        </div>
        <div className="space-y-8 print:space-y-4">
        <section aria-labelledby="r-cal" className="card">
          <h2 id="r-cal" className="font-serif text-xl">Day by day</h2>
          <div className="mt-3"><MonthCalendar month={month} byDate={byDate} quadrants={quadrants} today={today} /></div>
          <TideLegend className="mt-3 print:grid-cols-2 print:gap-y-0 print:text-xs" />
        </section>


        <section aria-labelledby="r-values" className="card">
          <h2 id="r-values" className="font-serif text-xl">Values lived</h2>
          {s.values.length ? (
            <ul className="mt-3 space-y-1 text-[15px]">{s.values.map((v) => <li key={v.name} className="flex justify-between"><span className="font-serif text-lg">{v.name}</span><span className="tabular-nums text-muted">{v.lived} {v.lived === 1 ? "moment" : "moments"}</span></li>)}</ul>
          ) : <p className="mt-2 text-[15px] text-muted">No moments noted this month. Carrying a value counts on its own.</p>}
          {s.evidence.length > 0 && (
            <label className="mt-4 flex min-h-[44px] items-center gap-3 text-[15px] print:hidden">
              <input type="checkbox" className="h-5 w-5 accent-[rgb(var(--deep))]" checked={withWords} onChange={(e) => setWithWords(e.target.checked)} />
              Include my own words (the moments I noted)
            </label>
          )}
          {withWords && (
            <ul className="mt-3 space-y-2 border-t border-line pt-3">
              {s.evidence.map((e) => <li key={e.date} className="font-serif text-lg">“{e.text}” <span className="font-sans text-sm text-muted">{e.value ? `${e.value}, ` : ""}{formatShort(e.date)}</span></li>)}
            </ul>
          )}
        </section>
        </div>
      </div>}
      <p className="text-xs text-muted">Made on this device from your own check-ins. Grow without losing your peace.</p>
    </article>
  );
}

export default function TideReportPage() {
  return <Suspense fallback={<div aria-busy="true" />}><Report /></Suspense>;
}
