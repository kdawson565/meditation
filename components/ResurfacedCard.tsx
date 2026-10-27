"use client";
import { PRACTICES } from "@/lib/practices";
import { formatFull } from "@/lib/dates";
import type { Resurfacing } from "@/lib/resurface";

export default function ResurfacedCard({ r }: { r: Resurfacing }) {
  return (
    <aside className="fade-in rounded-2xl border border-line bg-surface p-5" aria-label="From your past entries">
      <p className="text-sm text-muted">{r.lead}</p>
      {r.kind === "entry" ? (
        <>
          <p className="mt-3 font-serif text-xl leading-relaxed">“{r.entry.body}”</p>
          <p className="mt-3 text-sm text-muted">
            {PRACTICES[r.entry.practice].title} · {formatFull(r.entry.localDate)}
          </p>
        </>
      ) : (
        <>
          <ul className="mt-3 space-y-2 font-serif text-lg leading-relaxed">
            {r.enough.money && <li>Money: {r.enough.money}</li>}
            {r.enough.health && <li>Health: {r.enough.health}</li>}
            {r.enough.relationships && <li>Relationships: {r.enough.relationships}</li>}
            {r.enough.time && <li>Time: {r.enough.time}</li>}
          </ul>
          <p className="mt-4 text-[15px] text-muted">Are you already past this line in any area?</p>
        </>
      )}
    </aside>
  );
}
