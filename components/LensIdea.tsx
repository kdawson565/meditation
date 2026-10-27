import { pickIdea } from "@/lib/lenses";
import type { PracticeId } from "@/lib/types";

/** A short idea from one of the user's chosen lenses. Always labelled as a paraphrase, never a quotation. */
export default function LensIdea({ lenses, practice, seed, offset = 0, variant = "inline" }: { lenses?: string[]; practice: PracticeId; seed: string; offset?: number; variant?: "inline" | "card" }) {
  const pick = pickIdea(lenses, practice, seed, offset);
  if (!pick) return null;
  const body = (
    <>
      <p className="font-serif text-[17px] leading-relaxed">{pick.idea.text}</p>
      <p className="mt-2 text-xs text-muted">In the spirit of {pick.lens.name}. A paraphrase, not a quotation.</p>
    </>
  );
  return variant === "card" ? (
    <aside className="fade-in rounded-2xl border border-line p-5" aria-label={`A thought in the spirit of ${pick.lens.name}`}>{body}</aside>
  ) : (
    <aside className="border-l-2 border-brass pl-4" aria-label={`A thought in the spirit of ${pick.lens.name}`}>{body}</aside>
  );
}
