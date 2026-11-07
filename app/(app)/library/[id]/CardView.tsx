"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useSavedCards, useValues } from "@/lib/hooks";
import { cardById, THEMES } from "@/lib/library";
import { PRACTICES } from "@/lib/practices";
import { setCardSaved } from "@/lib/store";
import { coreValues } from "@/lib/values";
import HorizonLine from "@/components/HorizonLine";
import { DraftMark, ValueTags } from "@/components/CardBits";

export default function CardView({ id }: { id: string }) {
  const card = cardById(id)!;
  const saved = useSavedCards();
  const allValues = useValues();
  const mine = useMemo(() => new Set(coreValues(allValues ?? []).map((v) => v.name.toLowerCase())), [allValues]);
  const isSaved = !!saved?.some((s) => s.id === id);
  const practice = PRACTICES[card.linked_practice_id];

  return (
    <article className="fade-in space-y-7">
      <Link href="/library" className="btn-quiet -ml-3 inline-flex items-center rounded-full">← Library</Link>
      <header>
        {card.status === "draft" && <DraftMark />}
        <h1 className="mt-3 font-serif text-3xl">{card.title}</h1>
        <HorizonLine className="mt-4" tick={0.38} />
        <div className="mt-3"><ValueTags values={card.values} mine={mine} /></div>
        <p className="mt-1 text-sm text-muted">Helps most {card.quadrants.map((q) => THEMES[q].name.toLowerCase()).join(", ")}.</p>
      </header>

      <div className="font-serif text-lg">{card.body.split(/\n\n+/).map((p, i) => <p key={i} className={i ? "mt-4" : undefined}>{p}</p>)}</div>

      <section aria-labelledby="q-h" className="card">
        <h2 id="q-h" className="text-sm text-muted">A question to carry</h2>
        <p className="mt-1 font-serif text-xl">{card.reflection_question}</p>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        {practice && !practice.hidden && <Link href={`/today?practice=${practice.id}`} className="btn">Start the practice: {practice.title}</Link>}
        <button type="button" className="btn btn-ghost" aria-pressed={isSaved} onClick={() => void setCardSaved(id, !isSaved)}>{isSaved ? "Saved" : "Save this card"}</button>
      </div>

      {card.influences.length > 0 && (
        <p className="border-t border-line pt-4 text-sm text-muted">
          Influences: {card.influences.join(", ")}. The ideas here are in Ballast's own words. Nothing is a quotation, and nothing implies their endorsement.
        </p>
      )}
    </article>
  );
}
