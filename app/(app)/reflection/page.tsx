"use client";
import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useCheckins, useEntries, useProfile } from "@/lib/hooks";
import { addDays, formatFull, formatShort, parseDate, todayStr, weekStartOf } from "@/lib/dates";
import { saveReflection } from "@/lib/store";
import { aiReasonText, callAI } from "@/lib/ai-client";
import { localReflection } from "@/lib/reflect";
import { pickLenses } from "@/lib/lenses";
import { suggestsDistress } from "@/lib/safety";
import Link from "next/link";

export default function ReflectionPage() {
  const profile = useProfile();
  const checkins = useCheckins();
  const entries = useEntries();
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

  if (!profile || !week || !past) return <div aria-busy="true" />;
  const current = past.find((r) => r.weekStart === weekStart);
  const distress = suggestsDistress(week.entries.flatMap((e) => [e.body, ...Object.values(e.fields), e.sail ?? "", e.floor ?? ""]));

  async function generate() {
    setBusy(true);
    setNote("");
    let body = localReflection(week!.days, week!.entries, profile!.lenses);
    let source: "ai" | "local" = "local";
    if (profile!.aiConsent) {
      const r = await callAI<{ body: string }>("/api/ai/reflection", {
        days: week!.days.map((c) => ({ date: c.localDate, drive: c.drive, peace: c.peace, peaceAfter: c.peaceAfter, driveAfter: c.driveAfter })),
        lenses: pickLenses(profile!.lenses, 2, weekStart).map((l) => ({ name: l.name, ideas: l.ideas.slice(0, 5).map((i) => i.text) })),
        entries: week!.entries.map((e) => ({ date: e.localDate, practice: e.practice, body: e.body, tags: e.tags, sail: e.sail, floor: e.floor })),
      });
      if (r.ok) { body = r.data.body; source = "ai"; } else setNote(aiReasonText(r.reason));
    } else setNote("AI features are off, so this note was written on your device from your numbers. You can turn them on in Settings.");
    await saveReflection(weekStart, body, source);
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
          <p className="mt-4 text-sm text-muted">{current.source === "ai" ? "Written by Claude from your entries." : "Written on your device from your numbers."}</p>
        </article>
      ) : thin ? (
        <p className="text-muted">Not enough from this week to say much. Check in a few days and come back on Sunday.</p>
      ) : (
        <p className="text-muted">{week.days.length} {week.days.length === 1 ? "day" : "days"} and {week.entries.length} {week.entries.length === 1 ? "entry" : "entries"} are ready.</p>
      )}

      {profile.aiConsent && !thin && <p className="text-sm text-muted">Generating sends this week's entries and dials to Claude through this app's server. Nothing else leaves your device.</p>}
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
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
