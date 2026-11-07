"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCheckins, useEntries, useValues } from "@/lib/hooks";
import { formatLong, formatShort, todayStr } from "@/lib/dates";
import { coreValues } from "@/lib/values";
import { monthName, monthOf, quadrantsByDate, rangeLabel, seasonReview, seasons, shiftMonth, summarizeMonth, valueMoments, SEASON_DAYS } from "@/lib/tide";
import HorizonLine from "@/components/HorizonLine";
import MonthCalendar from "@/components/MonthCalendar";
import { TideLegend } from "@/components/DayDot";
import Sheet from "@/components/Sheet";
import DayDetail from "@/components/DayDetail";
import GrowthPeace from "@/components/GrowthPeace";
import SeasonAI from "@/components/SeasonAI";
import { useProfile } from "@/lib/hooks";

export default function TidePage() {
  const checkins = useCheckins();
  const entries = useEntries();
  const allValues = useValues();
  const profile = useProfile();
  const today = todayStr();
  const [month, setMonth] = useState(monthOf(today));
  const [day, setDay] = useState<string | null>(null);

  const byDate = useMemo(() => new Map((checkins ?? []).map((c) => [c.localDate, c])), [checkins]);
  const quadrants = useMemo(() => quadrantsByDate(checkins ?? []), [checkins]);

  if (!checkins || !entries || !allValues || !profile) return <div aria-busy="true" />;
  const values = coreValues(allValues);
  const firstMonth = checkins.length ? monthOf(checkins[0].localDate) : monthOf(today);
  const sum = summarizeMonth(month, checkins, entries, allValues, today);
  const isCurrent = month === monthOf(today);
  const go = (dir: -1 | 1) => {
    const next = shiftMonth(month, dir);
    if (next < firstMonth || next > monthOf(today)) return;
    setMonth(next);
  };
  const title = monthName(month, month.slice(0, 4) !== today.slice(0, 4));
  const moments = valueMoments(values, checkins);
  const ss = seasons(checkins, today);

  return (
    <div className="fade-in space-y-10">
      <h1 className="font-serif text-3xl">Tide</h1>

      <section aria-labelledby="month-h" className="-mt-4">
        <div className="flex items-center justify-between">
          <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors duration-calm hover:text-ink disabled:opacity-30" onClick={() => go(-1)} disabled={month <= firstMonth} aria-label={`Previous month, ${monthName(shiftMonth(month, -1))}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <div className="text-center" aria-live="polite">
            <h2 id="month-h" className="font-serif text-2xl">{title}</h2>
            <p className="text-[15px] text-muted"><span className="tabular-nums text-ink">{sum.practiced}</span> {sum.practiced === 1 ? "day" : "days"} practiced{isCurrent ? " so far" : ""}</p>
          </div>
          <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors duration-calm hover:text-ink disabled:opacity-30" onClick={() => go(1)} disabled={isCurrent} aria-label={`Next month, ${monthName(shiftMonth(month, 1))}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        {/* the tide line: its tick sits at the share of the month's days practiced */}
        <HorizonLine key={month} className="mt-3" tick={sum.of ? sum.practiced / sum.of : 0} label={`Tide line: ${sum.practiced} of ${sum.of} days`} />
        <div className="fade-in mt-3" key={`cal-${month}`}>
          <MonthCalendar month={month} byDate={byDate} quadrants={quadrants} today={today} onSelect={setDay} onSwipe={go} />
        </div>
        <details className="mt-3">
          <summary className="min-h-[44px] cursor-pointer py-2 text-sm text-muted">What the dots mean</summary>
          <TideLegend className="mt-1" />
        </details>
        <Link href={`/tide/report?m=${month}`} className="mt-2 inline-block text-[15px] text-brass-ink underline underline-offset-4">{monthName(month)} Tide Report</Link>
      </section>

      <section aria-labelledby="values-h">
        <h2 id="values-h" className="font-serif text-xl">Your values</h2>
        {values.length === 0 ? (
          <p className="mt-2 text-[15px] text-muted">Once you choose your values, each one shows here with the moments you lived it, in your own words. <Link href="/values" className="text-brass-ink underline underline-offset-4">Choose your values</Link></p>
        ) : (
          <>
            <p className="mt-1 text-[15px] text-muted">Moments you noted living each value, all time.</p>
            <ul className="mt-4 space-y-3">
              {moments.map(({ value, count, carried, last }) => (
                <li key={value.id} className="card !p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-serif text-xl">{value.name}</p>
                    <p className="shrink-0 text-sm text-muted"><span className="font-serif text-lg tabular-nums text-ink">{count}</span> {count === 1 ? "moment" : "moments"}</p>
                  </div>
                  {last ? (
                    <p className="mt-2 font-serif text-lg">“{last.text}” <span className="font-sans text-sm text-muted">{formatShort(last.date)}</span></p>
                  ) : (
                    <p className="mt-2 text-sm text-muted">{carried ? `Carried ${carried} ${carried === 1 ? "day" : "days"}. A moment will show here when you note one.` : "Not carried yet. It's here when you want it."}</p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-label="Growth and Peace">
        <GrowthPeace checkins={checkins} entries={entries} hasValues={values.length > 0} today={today} only="trend" />
      </section>

      <section aria-labelledby="seasons-h">
        <h2 id="seasons-h" className="font-serif text-xl">Seasons</h2>
        <p className="mt-1 text-[15px] text-muted">Every {SEASON_DAYS} days from your first check-in, a look back at the whole stretch.</p>
        {ss.length === 0 ? <p className="mt-3 text-[15px] text-muted">Your first season begins with your first check-in.</p> : (
          <ul className="mt-4 space-y-3">
            {/* a season with no check-ins isn't listed: nothing is marked missed */}
            {[...ss].reverse().filter((s) => !s.complete || checkins.some((c) => c.localDate >= s.start && c.localDate <= s.end)).map((s) => {
              if (!s.complete) return (
                <li key={s.n} className="card-quiet !p-4">
                  <p className="eyebrow">Season {s.n} · now</p>
                  <p className="mt-1 text-[15px]">Day {s.dayOf} of {SEASON_DAYS}. Its review arrives after {formatLong(s.end).replace(/^[^,]+, /, "")}.</p>
                </li>
              );
              const r = seasonReview(s, checkins, entries, allValues);
              return (
                <li key={s.n} className="card">
                  <p className="eyebrow">Season {s.n} · {rangeLabel(s.start, s.end)}</p>
                  {profile.aiConsent && <div className="mt-3"><SeasonAI season={s} review={r} values={values.map((v) => ({ name: v.name, definition: v.definition }))} /></div>}
                  <details open={!profile.aiConsent} className={profile.aiConsent ? "mt-4 border-t border-line pt-3" : ""}>
                  {profile.aiConsent && <summary className="min-h-[44px] cursor-pointer py-2 text-sm text-muted">The numbers</summary>}
                  <div className="mt-2 space-y-1 text-[15px] leading-relaxed">{r.lines.map((l, i) => <p key={i}>{l}</p>)}</div>
                  {r.quotes.length > 0 && (
                    <div className="mt-4 border-t border-line pt-4">
                      <p className="text-sm text-muted">In your words</p>
                      <ul className="mt-2 space-y-2">{r.quotes.map((q) => <li key={q.date} className="font-serif text-lg">“{q.text}” <span className="font-sans text-sm text-muted">{q.value ? `${q.value}, ` : ""}{formatShort(q.date)}</span></li>)}</ul>
                    </div>
                  )}
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Sheet open={!!day} onClose={() => setDay(null)} title={day ? formatLong(day) : ""}>
        {day && <DayDetail date={day} checkin={byDate.get(day)} q={quadrants.get(day)} entries={entries.filter((e) => e.localDate === day)} values={allValues} />}
      </Sheet>
    </div>
  );
}
