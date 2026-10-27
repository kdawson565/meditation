"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useCheckins, useEntries } from "@/lib/hooks";
import { formatFull, formatLong } from "@/lib/dates";
import { PRACTICES, PRACTICE_ORDER } from "@/lib/practices";
import { deleteEntry } from "@/lib/store";
import type { PracticeId } from "@/lib/types";

export default function ArchiveView() {
  const entries = useEntries();
  const checkins = useCheckins();
  const params = useSearchParams();
  const date = params.get("date");
  const [q, setQ] = useState("");
  const [practice, setPractice] = useState<PracticeId | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  const byDate = useMemo(() => new Map((checkins ?? []).map((c) => [c.localDate, c])), [checkins]);
  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    (entries ?? []).forEach((e) => e.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [entries]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (entries ?? [])
      .filter((e) => (!date || e.localDate === date) && (!practice || e.practice === practice) && (!tag || e.tags.includes(tag)))
      .filter((e) => !needle || [e.body, ...Object.values(e.fields), e.sail ?? "", e.floor ?? "", ...e.tags].join(" ").toLowerCase().includes(needle))
      .sort((a, b) => (a.localDate === b.localDate ? (a.createdAt < b.createdAt ? 1 : -1) : a.localDate < b.localDate ? 1 : -1));
  }, [entries, q, practice, tag, date]);

  if (!entries) return <div aria-busy="true" />;

  const chip = (on: boolean) => `min-h-[40px] rounded-full border px-3.5 text-sm transition-colors duration-calm ${on ? "border-deep bg-deep text-on-deep" : "border-line text-muted hover:text-ink"}`;

  return (
    <div className="fade-in space-y-6">
      <header>
        <h1 className="font-serif text-3xl">Archive</h1>
        <p className="mt-2 text-muted">{entries.length} {entries.length === 1 ? "entry" : "entries"}.</p>
      </header>

      {date && (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-[15px]">
          Showing {formatLong(date)}. <Link href="/archive" className="text-brass-ink underline underline-offset-4">Show everything</Link>
        </p>
      )}

      <div>
        <label htmlFor="search" className="sr-only">Search entries</label>
        <input id="search" type="search" className="field" placeholder="Search your entries" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by practice">
          <button aria-pressed={!practice} className={chip(!practice)} onClick={() => setPractice(null)}>All practices</button>
          {PRACTICE_ORDER.map((id) => (
            <button key={id} aria-pressed={practice === id} className={chip(practice === id)} onClick={() => setPractice(practice === id ? null : id)}>{PRACTICES[id].title}</button>
          ))}
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by tag">
            {allTags.map((t) => (
              <button key={t} aria-pressed={tag === t} className={chip(tag === t)} onClick={() => setTag(tag === t ? null : t)}>#{t}</button>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-muted" aria-live="polite">{list.length} {list.length === 1 ? "result" : "results"}</p>

      {list.length === 0 ? (
        <p className="py-8 text-center text-muted">{entries.length === 0 ? "Nothing here yet. Your first entry will live here." : "Nothing matches. Try fewer filters."}</p>
      ) : (
        <ul className="space-y-4">
          {list.map((e) => {
            const p = PRACTICES[e.practice];
            const c = byDate.get(e.localDate);
            const subject = p.subjectKey ? e.fields[p.subjectKey] : "";
            return (
              <li key={e.id} className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-baseline justify-between gap-3 text-sm text-muted">
                  <span>{p.title}</span>
                  <time dateTime={e.localDate}>{formatFull(e.localDate)}</time>
                </div>
                {subject && <p className="mt-3 text-[15px] font-medium">{subject}</p>}
                <p className="mt-2 whitespace-pre-wrap font-serif text-lg leading-relaxed">{e.body}</p>
                {(e.sail || e.floor) && (
                  <dl className="mt-4 space-y-1 text-[15px] text-muted">
                    {e.sail && <div><dt className="inline font-medium text-ink">Sail: </dt><dd className="inline">{e.sail}</dd></div>}
                    {e.floor && <div><dt className="inline font-medium text-ink">Floor: </dt><dd className="inline">{e.floor}</dd></div>}
                  </dl>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
                  {c && <span className="mr-1 tabular-nums">Drive {c.drive} · Peace {c.peace}</span>}
                  {e.tags.map((t) => <span key={t} className="rounded-full border border-line px-2.5 py-0.5">#{t}</span>)}
                  {e.resurfaceOn && <span>Check back {formatFull(e.resurfaceOn)}</span>}
                </div>
                <div className="mt-3 text-right">
                  {confirm === e.id ? (
                    <span className="text-sm">Delete this entry? <button className="underline underline-offset-4" onClick={() => { void deleteEntry(e.id); setConfirm(null); }}>Yes, delete</button> · <button className="underline underline-offset-4" onClick={() => setConfirm(null)}>Keep</button></span>
                  ) : (
                    <button className="text-sm text-muted underline underline-offset-4" onClick={() => setConfirm(e.id)}>Delete</button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
