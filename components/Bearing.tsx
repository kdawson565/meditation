"use client";
import { useAiOutput } from "@/lib/hooks";
import { SourceChips } from "./CardBits";

/** Today's Bearing: two sentences tying the value you carry to one Library card. Only exists when AI is on. */
export default function Bearing({ today }: { today: string }) {
  const b = useAiOutput(`bearing-${today}`);
  if (!b) return null;
  return (
    <section aria-labelledby="bearing-h" className="fade-in space-y-3 border-l-2 border-brass pl-4">
      <h2 id="bearing-h" className="eyebrow">Today's bearing</h2>
      <p className="font-serif text-lg">{b.body}</p>
      <SourceChips ids={b.cardIds} />
    </section>
  );
}
