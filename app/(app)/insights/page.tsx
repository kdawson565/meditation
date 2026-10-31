"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useCheckins, useEntries } from "@/lib/hooks";
import { practiceInsights } from "@/lib/insights";
import { midlines } from "@/lib/quadrant";
import { PRACTICES } from "@/lib/practices";

const sign = (n: number) => (n >= 0 ? "+" : "−") + Math.abs(n).toFixed(1);

export default function InsightsPage() {
  const checkins = useCheckins();
  const entries = useEntries();
  const rows = useMemo(() => {
    if (!checkins || !entries) return null;
    return practiceInsights(checkins, entries, midlines(checkins).peace);
  }, [checkins, entries]);

  if (!rows) return <div aria-busy="true" />;
  const enough = rows.filter((r) => r.n >= 3);
  const few = rows.filter((r) => r.n < 3);
  const totalPairs = rows.reduce((s, r) => s + r.n, 0);
  const worstDrive = enough.filter((r) => r.driveShift != null && r.driveShift <= -0.5);
  const voiced = checkins!.filter((c) => c.voice != null);
  const kind = voiced.filter((c) => c.voice! >= 7);
  const harsh = voiced.filter((c) => c.voice! <= 6);
  const mean = (xs: number[]) => (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1);
  const answered = entries!.filter((e) => e.sailResult && !e.deletedAt && e.localDate >= new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const filled = answered.filter((e) => e.sailResult === "filled").length;
  const partly = answered.filter((e) => e.sailResult === "partly").length;

  return (
    <div className="fade-in space-y-8">
      <header>
        <h1 className="font-serif text-3xl">What moves you</h1>
        <p className="mt-2 text-muted">How Peace and Drive changed between check-in and close, by practice. The goal is more Peace without dulling your edge.</p>
      </header>

      <section aria-labelledby="s-voice" className="rounded-2xl border border-line p-5">
        <h2 id="s-voice" className="font-serif text-xl">Your inner voice</h2>
        {kind.length >= 3 && harsh.length >= 3 ? (
          <>
            <p className="mt-2 text-[15px]">
              On the {kind.length} days your Voice was 7 or higher, Peace averaged {mean(kind.map((c) => c.peace))} and Drive {mean(kind.map((c) => c.drive))}. On the {harsh.length} harder days, Peace averaged {mean(harsh.map((c) => c.peace))} and Drive {mean(harsh.map((c) => c.drive))}.
            </p>
            <p className="mt-1 text-sm text-muted">A pattern from your own days, not proof of cause. Still worth noticing which way it points.</p>
          </>
        ) : (
          <p className="mt-2 text-[15px] text-muted">Rate Voice for a few more days, some kinder and some harder, and this will show how your Peace and Drive move with it.</p>
        )}
      </section>

      {answered.length > 0 && (
        <section aria-labelledby="s-sail" className="rounded-2xl border border-line p-5">
          <h2 id="s-sail" className="font-serif text-xl">Your Sails, last 30 days</h2>
          <p className="mt-2 text-[15px]">
            {filled} filled, {partly} partly, {answered.length - filled - partly} not, out of {answered.length} you checked back on.
          </p>
          <p className="mt-1 text-sm text-muted">This is your follow-through, an honest Drive number. Misses are information, not a score.</p>
        </section>
      )}

      {totalPairs === 0 ? (
        <p className="text-muted">Nothing to compare yet. When you rate Peace and Drive again at the end of a ritual, the before and after will show up here.</p>
      ) : (
        <>
          <p className="rounded-xl border border-line bg-surface px-4 py-3 text-[15px]">
            Based on {totalPairs} {totalPairs === 1 ? "day" : "days"} with a before and after. Same-day ratings from one person can't prove cause, and your mood at close is partly just the ritual itself. Read these as hints.
          </p>

          {enough.length > 0 && (
            <ul className="space-y-4">
              {enough.map((r) => (
                <li key={r.practice} className="rounded-2xl border border-line bg-surface p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="font-serif text-xl">{PRACTICES[r.practice].title}</h2>
                    <span className="text-sm text-muted tabular-nums">{r.n} days</span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-sm text-muted">Peace</dt>
                      <dd className="font-serif text-3xl tabular-nums">{sign(r.peaceLift)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted">Drive</dt>
                      <dd className="font-serif text-3xl tabular-nums">{r.driveShift == null ? "–" : sign(r.driveShift)}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-[15px] text-muted">
                    {r.lowStart && r.highStart
                      ? `On days you started low on Peace: ${sign(r.lowStart.lift)} (${r.lowStart.n} days). On days you started high: ${sign(r.highStart.lift)} (${r.highStart.n} days).`
                      : r.lowStart
                        ? `On days you started low on Peace: ${sign(r.lowStart.lift)} (${r.lowStart.n} days).`
                        : "Not enough days at different starting points to split further."}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {worstDrive.length > 0 && (
            <p className="text-[15px]">
              {worstDrive.map((r) => PRACTICES[r.practice].title).join(" and ")} tended to come with a dip in Drive. That isn't bad, but it's worth knowing if you want to stay sharp for the day.
            </p>
          )}

          {few.length > 0 && (
            <p className="text-[15px] text-muted">
              Too few days to say anything yet: {few.map((r) => `${PRACTICES[r.practice].title} (${r.n})`).join(", ")}.
            </p>
          )}
        </>
      )}
      <Link href="/map" className="btn btn-ghost">Back to the map</Link>
    </div>
  );
}
