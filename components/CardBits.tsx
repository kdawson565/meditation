"use client";
import Link from "next/link";
import { cardById as CARD_LOOKUP, type Card } from "@/lib/library";

export function DraftMark() {
  return <span className="inline-flex items-center rounded-full border border-brass px-2 py-0.5 text-xs tracking-wider text-brass-ink">DRAFT</span>;
}

export function ValueTags({ values, mine }: { values: string[]; mine?: Set<string> }) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted" aria-label="Values">
      {values.map((v) => <li key={v} className={mine?.has(v.toLowerCase()) ? "text-ink" : undefined}>{v}</li>)}
    </ul>
  );
}

/** A card in a list: title, the opening of the body, its values. */
export function CardRow({ card, mine, saved }: { card: Card; mine?: Set<string>; saved?: boolean }) {
  const opening = card.body.split(/(?<=\.)\s/)[0];
  return (
    <li>
      <Link href={`/library/${card.id}`} className="card block !p-4 transition-colors duration-calm hover:border-muted">
        <div className="flex items-start justify-between gap-3">
          <p className="font-serif text-xl">{card.title}</p>
          <span className="flex shrink-0 items-center gap-2">
            {saved && <span className="text-xs text-muted">Saved</span>}
            {card.status === "draft" && <DraftMark />}
          </span>
        </div>
        <p className="mt-1 text-[15px] text-muted">{opening}</p>
        <div className="mt-2"><ValueTags values={card.values} mine={mine} /></div>
      </Link>
    </li>
  );
}

/** A tappable source: the Library card an AI answer drew on. */
export function SourceChips({ ids, label = "Source" }: { ids: string[]; label?: string }) {
  const cards = ids.map((id) => CARD_LOOKUP(id)).filter((c): c is Card => !!c);
  if (!cards.length) return null;
  return (
    <ul className="flex flex-wrap items-center gap-2 text-sm" aria-label={`${label}${cards.length > 1 ? "s" : ""}`}>
      <li className="text-muted">{label}{cards.length > 1 ? "s" : ""}:</li>
      {cards.map((c) => (
        <li key={c.id}>
          <Link href={`/library/${c.id}`} className="inline-flex min-h-[36px] items-center rounded-full border border-line px-3 text-brass-ink transition-colors duration-calm hover:border-brass">{c.title}</Link>
        </li>
      ))}
    </ul>
  );
}
