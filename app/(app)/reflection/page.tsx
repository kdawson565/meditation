"use client";
import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useCheckins, useEntries, useProfile, useValues } from "@/lib/hooks";
import { coreValues, valueName } from "@/lib/values";
import { addDays, formatFull, formatShort, parseDate, todayStr, weekStartOf } from "@/lib/dates";
import { saveReflection } from "@/lib/store";
import { aiReasonText, callAI } from "@/lib/ai-client";
import { localReflection } from "@/lib/reflect";
import { availablePractices, PRACTICES } from "@/lib/practices";
import { quadrantsByDate } from "@/lib/tide";
import { SourceChips } from "@/components/CardBits";
import type { PracticeId } from "@/lib/types";
import { suggestsDistress } from "@/lib/safety";
import Link from "next/link";

export default function ReflectionPage() {
  const profile = useProfile();
  const checkins = useCheckins();
  const entries = useEntries();
  const allValues = useValues();
  const past = useLiveQuery(() => db.reflections.orderBy("weekStart").reverse().toArray(), []);
  const today = todayStr();
  const isSunday = parseDate(today).getDay() === 0;
  // On Sunday we reflect on the week ending today; on other days, on the week that just ended (Mon–Sun).
  const thisWeekStart = weekStartOf(today);
  const weekStart = isSunday ? thisWeekStart : addDays(thisWeekStart, -7);
  const weekEnd = addDays(weekStart, 6);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const week = useMemo(() => {
    if (!checkins || !entries) return null;
    return {
      days: checkins.filter((c) => c.localDate >= weekStart && c.localDate <= weekEnd),
      entries: entries.filter((e) => e.localDate >= weekStart && e.localDate <= weekEnd),
    };
  }, [checkins, entries, weekStart, weekEnd]);

  if (!profile || !week || !past || !allValues) return <div aria-busy="true" />;
  const values = coreValues(allValues);
  const vName = (id?: string) => (id === "unsure" ? "Not sure" : valueName(allValues, id));
  // Evidence-line counts per value: this week and the three weeks before, so the note can say what went quiet.
  const valueCounts = values.map((v) => {
    const lived = (from: string, to: string) => (checkins ?? []).filter((c) => c.floorValueId === v.id && c.evidence?.trim() && c.localDate >= from && c.localDate <= to).length;
    return { name: v.name, thisWeek: lived(weekStart, weekEnd), prior3Weeks: lived(addDays(weekStart, -21), addDays(weekStart, -1)) };
  });
  const current = past.find((r) => r.weekStart === weekStart);
  const distress = suggestsDistress([...week.entries.flatMap((e) => [e.body, ...Object.values(e.fields), e.sail ?? "", e.floor ?? "", e.sailAdvocate ?? ""]), ...week.days.map((c) => c.evidence ?? "")]);

  async function generate() {
    setBusy(true);
    setNote("");
    let body = localReflection(week!.days, week!.entries, profile!.lenses, allValues);
    let source: "ai" | "local" = "local";
    let extra: { cardIds?: string[]; practiceId?: PracticeId } = {};
    if (profile!.aiConsent) {
      // the quadrant most of this week's days landed in, for choosing cards
      const q = quadrantsByDate(checkins!);
      const tally = new Map<string, number>();
      week!.days.forEach((c) => { const k = q.get(c.localDate)!; tally.set(k, (tally.get(k) ?? 0) + 1); });
      const quadrant = [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      const r = await callAI<{ body: string; cardIds: string[]; practiceId?: PracticeId }>("/api/ai/reflection", {
        weekStart, quadrant,
        available: availablePractices({ countedDays: profile!.countedDays, hasEnough: Object.values(profile!.enough).some(Boolean), hasValues: values.length > 0 }),
        days: week!.days.map((c) => ({ date: c.localDate, drive: c.drive, peace: c.peace, voice: c.voice, peaceAfter: c.peaceAfter, driveAfter: c.driveAfter, carried: vName(c.floorValueId), evidence: c.evidence })),
        values: values.map((v) => ({ name: v.name, definition: v.definition })),
        valueCounts,
        entries: week!.entries.map((e) => ({ date: e.localDate, practice: e.practice, body: e.body, tags: e.tags, sail: e.sail, floor: e.floor, advocate: e.sailAdvocate, sailValue: vName(e.sailValue) })),
      });
      if (r.ok) { body = r.data.body; source = "ai"; extra = { cardIds: r.data.cardIds, practiceId: r.data.practiceId }; } else setNote(aiReasonText(r.reason));
    } else setNote("AI features are off, so this note was written on your device from your numbers. You can turn them on in Settings.");
    await saveReflection(weekStart, body, source, extra);
    setBusy(false);
  }

  const range = `${formatShort(weekStart)} – ${formatShort(weekEnd)}`;
  const thin = week.days.length + week.entries.length === 0;

  return (
    <div className="fade-in space-y-8">
      <header>
        <p className="text-sm text-muted">{isSunday ? "It's Sunday" : "Last week"} · {range}</p>
        <h1 className="mt-1 font-serif text-3xl">Weekly Reflection</h1>
        <p className="mt-2 text-muted">A short, specific note on what your week seems to be saying. Under 200 words, no pep talk.</p>
      </header>

      {distress && (
        <aside role="note" className="rounded-2xl border border-brass bg-surface p-5">
          <p className="font-serif text-lg leading-relaxed">Some of what you wrote this week sounded heavy. Ballast isn't a therapist and can't be there the way a person can. If any of it is more than a rough patch, please reach out to someone you trust, or a crisis line. In the US you can call or text 988.</p>
        </aside>
      )}

      {current ? (
        <article className="rounded-2xl border border-line bg-surface p-6">
          <p className="whitespace-pre-wrap font-serif text-xl leading-relaxed">{current.body}</p>
          {current.practiceId && PRACTICES[current.practiceId] && (
            <Link href={`/today?practice=${current.practiceId}`} className="btn btn-ghost mt-5">Next week, try: {PRACTICES[current.practiceId].title}</Link>
          )}
          {!!current.cardIds?.length && <div className="mt-4"><SourceChips ids={current.cardIds} /></div>}
          <p className="mt-4 text-sm text-muted">{current.source === "ai" ? "Written by Claude from your entries and the Library cards shown." : "Written on your device from your numbers."}</p>
        </article>
      ) : thin ? (
        <p className="text-muted">Not enough from this week to say much. Check in a few days and come back on Sunday.</p>
      ) : (
        <p className="text-muted">{week.days.length} {week.days.length === 1 ? "day" : "days"} and {week.entries.length} {week.entries.length === 1 ? "entry" : "entries"} are ready.</p>
      )}

      {profile.aiConsent && !thin && <p className="text-sm text-muted">Writing it sends this week's entries, dials, values and evidence lines to Claude through Ballast's server, along with a few Library cards to draw on. Nothing else leaves your device.</p>}
      {note && <p aria-live="polite" className="text-[15px] text-muted">{note}</p>}
      {!thin && (
        <button className="btn" onClick={generate} disabled={busy}>{busy ? "Writing…" : current ? "Write it again" : "Write this week's reflection"}</button>
      )}
      {!profile.aiConsent && <p className="text-[15px]"><Link href="/settings" className="text-brass-ink underline underline-offset-4">Turn on AI features</Link> <span className="text-muted">for a fuller, more specific note.</span></p>}

      {past.filter((r) => r.weekStart !== weekStart).length > 0 && (
        <section aria-label="Earlier weeks">
          <h2 className="font-serif text-xl">Earlier weeks</h2>
          <ul className="mt-3 space-y-3">
            {past.filter((r) => r.weekStart !== weekStart).map((r) => (
              <li key={r.id}>
                <details className="rounded-2xl border border-line p-4">
                  <summary className="cursor-pointer text-[15px]">Week of {formatFull(r.weekStart)}</summary>
                  <p className="mt-3 whitespace-pre-wrap font-serif text-lg leading-relaxed">{r.body}</p>
                  {!!r.cardIds?.length && <div className="mt-3"><SourceChips ids={r.cardIds} /></div>}
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
