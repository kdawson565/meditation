"use client";
import { useEffect, useRef, useState } from "react";
import { useAiOutput } from "@/lib/hooks";
import { callAI } from "@/lib/ai-client";
import { saveAiOutput } from "@/lib/store";
import type { Season } from "@/lib/tide";
import type { Quadrant } from "@/lib/quadrant";
import { SourceChips } from "./CardBits";

interface Review { lines: string[]; carried: { name: string; days: number; lived: number }[]; evidence: { date: string; text: string; value?: string }[]; topQuadrant?: Quadrant; practices: string[] }

/**
 * The AI season review: written once when a season completes (AI on), kept, and shown above the numbers.
 * If the AI can't write it, the data summary below simply stands on its own.
 */
export default function SeasonAI({ season, review, values }: { season: Season; review: Review; values: { name: string; definition: string }[] }) {
  const id = `season-${season.n}`;
  const saved = useAiOutput(id);
  const asked = useRef(false);
  const [state, setState] = useState<"idle" | "writing" | "support" | "failed">("idle");

  useEffect(() => {
    if (saved !== null || asked.current) return; // undefined = still loading; an object = already written
    asked.current = true;
    setState("writing");
    void callAI<{ body?: string; cardIds?: string[]; support?: boolean }>("/api/ai/season", {
      season: { n: season.n, start: season.start, end: season.end },
      facts: review.lines, topQuadrant: review.topQuadrant, values, carried: review.carried,
      evidence: review.evidence.slice(-40).map((e) => ({ date: e.date, value: e.value, text: e.text })),
      practices: review.practices.slice(-40),
    }).then(async (r) => {
      if (r.ok && r.data.support) return setState("support");
      if (r.ok && r.data.body) { await saveAiOutput({ id, kind: "season", body: r.data.body, cardIds: r.data.cardIds ?? [] }); setState("idle"); }
      else setState("failed");
    });
  }, [saved, id, season, review, values]);

  if (saved) return (
    <div className="space-y-3">
      <div className="space-y-3 font-serif text-lg">{saved.body.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>
      <SourceChips ids={saved.cardIds} />
      <p className="text-xs text-muted">Written by Claude from your own words and numbers, and the Library cards shown.</p>
    </div>
  );
  if (state === "writing") return <p className="text-[15px] text-muted" aria-live="polite">Writing this season's review…</p>;
  if (state === "support") return <p role="note" className="rounded-xl border border-brass p-3 text-[15px]">Some of what you wrote this season sounded heavy. Ballast isn't a therapist and can't be there the way a person can. If it's more than a rough patch, please reach out to someone you trust, or a crisis line. In the US you can call or text 988.</p>;
  return null;
}
