"use client";
import { useEffect, useState } from "react";

const BREATH_MS = 6500;

export default function BreathGate({ breaths, onDone }: { breaths: number; onDone: () => void }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= breaths) {
      const t = setTimeout(onDone, 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((x) => x + 1), BREATH_MS);
    return () => clearTimeout(t);
  }, [n, breaths, onDone]);

  return (
    <section aria-label="Breathing" className="fade-in flex min-h-[70dvh] flex-col items-center justify-center text-center">
      <h1 className="sr-only">Take a few slow breaths</h1>
      <div className="relative flex h-56 w-56 items-center justify-center" aria-hidden>
        <div className="breath-orb absolute inset-0 rounded-full bg-sea/40" />
        <div className="breath-orb absolute inset-6 rounded-full bg-sea/60" style={{ animationDelay: "120ms" }} />
      </div>
      <p className="mt-10 font-serif text-2xl" aria-live="polite">
        {n >= breaths ? "There you are." : n === 0 ? "Let your shoulders drop." : n === 1 ? "Slower, if you can." : "One more."}
      </p>
      <p className="mt-2 text-sm text-muted">{breaths > 1 ? `Breath ${Math.min(n + 1, breaths)} of ${breaths}` : "One slow breath"}</p>
      <button type="button" onClick={onDone} className="btn-quiet mt-8 rounded-full text-sm">
        Skip
      </button>
    </section>
  );
}
