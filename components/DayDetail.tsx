"use client";
import Link from "next/link";
import type { Checkin, Entry, Value } from "@/lib/types";
import type { Quadrant } from "@/lib/quadrant";
import { QUADRANT_INFO } from "@/lib/quadrant";
import { PRACTICES } from "@/lib/practices";
import DayDot from "./DayDot";

const RESULT = { filled: "Filled", partly: "Partly filled", not: "Not this time" } as const;

/** One day, in full: dials, the value carried and the moment it was lived, the Sail, and what was written. */
export default function DayDetail({ date, checkin, q, entries, values }: { date: string; checkin?: Checkin; q?: Quadrant; entries: Entry[]; values: Value[] }) {
  if (!checkin && !entries.length) return <p className="text-[15px] text-muted">No check-in this day. That's fine; the next one is simply another place to begin.</p>;
  const carried = values.find((v) => v.id === checkin?.floorValueId);
  const sails = entries.filter((e) => e.sail);
  return (
    <div className="space-y-5">
      {checkin && (
        <div className="card space-y-4">
          {q && <p className="flex items-center gap-2 text-[15px]"><DayDot q={q} ring={!!checkin.evidence?.trim()} size={24} />{QUADRANT_INFO[q].name}: <span className="text-muted">{QUADRANT_INFO[q].line.toLowerCase()}</span></p>}
          <dl className="grid grid-cols-3 gap-3">
            {([["Drive", checkin.drive, checkin.driveAfter], ["Peace", checkin.peace, checkin.peaceAfter], ["Voice", checkin.voice, undefined]] as const).filter(([, v]) => v != null).map(([k, v, after]) => (
              <div key={k}><dt className="text-sm text-muted">{k}</dt><dd className="font-serif text-2xl tabular-nums">{v}{after && after !== v ? <span className="text-lg text-muted"> → {after}</span> : null}</dd></div>
            ))}
          </dl>
          {carried && (
            <div className="border-t border-line pt-4">
              <p className="text-sm text-muted">Carried</p>
              <p className="font-serif text-xl">{carried.name}</p>
              {checkin.evidence?.trim() ? <p className="mt-1 font-serif text-lg">“{checkin.evidence.trim()}”</p> : <p className="mt-1 text-sm text-muted">No moment noted. Carrying it counts.</p>}
            </div>
          )}
        </div>
      )}
      {sails.map((e) => {
        const serves = values.find((v) => v.id === e.sailValue);
        return (
          <div key={`s${e.id}`} className="card-quiet">
            <p className="text-sm text-muted">Sail{e.sailResult ? ` · ${RESULT[e.sailResult]}` : ""}</p>
            <p className="mt-1 font-serif text-lg">{e.sail}</p>
            {serves && <p className="mt-1 text-sm text-muted">Serves {serves.name}</p>}
          </div>
        );
      })}
      {entries.map((e) => (
        <div key={e.id}>
          <p className="text-sm text-muted">{PRACTICES[e.practice].title}</p>
          <p className="mt-1 whitespace-pre-line font-serif text-lg">{e.body}</p>
        </div>
      ))}
      <Link href={`/archive?date=${date}`} className="inline-block text-[15px] text-brass-ink underline underline-offset-4">Open in the archive</Link>
    </div>
  );
}
