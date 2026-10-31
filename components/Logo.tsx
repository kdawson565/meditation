import { Jost } from "next/font/google";
import brand from "@/lib/brand.json";

const jost = Jost({ subsets: ["latin"], weight: ["400"], display: "swap" });

/** The Ballast mark: sail above, level line, weight below. Colours follow the theme; `brass` tints the weight. */
export function Symbol({ className = "h-8 w-8", brass = false }: { className?: string; brass?: boolean }) {
  return (
    <svg viewBox="10 4 80 79" className={className} aria-hidden fill="currentColor">
      <path d={brand.sail} />
      <path d={brand.line} />
      <path d={brand.bar} fill={brass ? "rgb(var(--brass))" : undefined} />
    </svg>
  );
}

/** Symbol + lowercase wordmark. `affirmation` adds the small "i am" above, from the domain iamballast.com. */
export default function Logo({ size = "md", affirmation = false }: { size?: "sm" | "md" | "lg"; affirmation?: boolean }) {
  const s = { sm: { mark: "h-6 w-6", word: "text-xl", track: "tracking-[0.14em]", gap: "gap-2.5" }, md: { mark: "h-8 w-8", word: "text-2xl", track: "tracking-[0.16em]", gap: "gap-3" }, lg: { mark: "h-12 w-12", word: "text-4xl", track: "tracking-[0.18em]", gap: "gap-4" } }[size];
  return (
    <span className={`inline-flex items-end ${s.gap} text-ink`} aria-label={affirmation ? "I am Ballast" : "Ballast"} role="img">
      <Symbol className={s.mark} brass />
      <span className={`${jost.className} ${s.word} leading-none`} aria-hidden>
        {affirmation && <span className={`mb-1 block text-[0.42em] ${s.track} text-muted`}>i am</span>}
        <span className={`block ${s.track}`}>ballast</span>
      </span>
    </span>
  );
}
