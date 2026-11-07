"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCheckins, useEntries, useProfile, useValues } from "@/lib/hooks";
import { addDays, todayStr, uid } from "@/lib/dates";
import { coreValues } from "@/lib/values";
import { quadrantsByDate } from "@/lib/tide";
import { availablePractices, PRACTICES } from "@/lib/practices";
import { aiReasonText, callAI } from "@/lib/ai-client";
import { saveAiOutput } from "@/lib/store";
import type { AskTurn, PracticeId } from "@/lib/types";
import HorizonLine from "@/components/HorizonLine";
import { SourceChips } from "@/components/CardBits";

const TURNS = 5;
interface Answer { answer: string; cardId: string | null; question: string | null; practiceId: PracticeId | null; offered: string[]; closing: boolean; turnsLeft: number; sessionsLeft?: number; support?: boolean }

/** Ask Ballast: five questions at most, each answered from one Library card and your own words, then a calm close. */
export default function AskPage() {
  const profile = useProfile();
  const checkins = useCheckins();
  const entries = useEntries();
  const allValues = useValues();
  const today = todayStr();
  const [sessionId] = useState(() => `s-${uid()}`);
  const [turns, setTurns] = useState<(AskTurn & { offered: string[] })[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [sessionsLeft, setSessionsLeft] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const ctx = useMemo(() => {
    if (!checkins || !entries || !allValues || !profile) return null;
    const values = coreValues(allValues);
    const todayC = checkins.find((c) => c.localDate === today);
    const floor = values.find((v) => v.id === todayC?.floorValueId);
    const name = (id?: string) => allValues.find((v) => v.id === id)?.name;
    const recent = checkins.filter((c) => c.localDate >= addDays(today, -6)).map((c) => ({ date: c.localDate, drive: c.drive, peace: c.peace, voice: c.voice, carried: name(c.floorValueId), evidence: c.evidence, sail: entries.find((e) => e.localDate === c.localDate && e.sail)?.sail }));
    return {
      person: { values: values.map((v) => ({ name: v.name, definition: v.definition })), floor: floor ? { name: floor.name, definition: floor.definition } : undefined, quadrant: todayC ? quadrantsByDate(checkins).get(today) : undefined, recent },
      recentPractices: entries.filter((e) => e.localDate >= addDays(today, -7)).map((e) => e.practice),
      available: availablePractices({ countedDays: profile.countedDays, hasEnough: Object.values(profile.enough).some(Boolean), hasValues: values.length > 0 }),
    };
  }, [checkins, entries, allValues, profile, today]);

  useEffect(() => {
    if (!profile?.aiConsent || sessionsLeft != null) return;
    void callAI<{ sessionsLeft: number }>("/api/ai/ask", { status: true, sessionId, person: { values: [] } }).then((r) => { if (r.ok) setSessionsLeft(r.data.sessionsLeft); });
  }, [profile, sessionId, sessionsLeft]);

  if (!profile || !ctx) return <div aria-busy="true" />;
  const done = turns.some((t) => t.closing) || turns.length >= TURNS;
  const capped = turns.length === 0 && sessionsLeft === 0;

  async function ask() {
    const question = q.trim();
    if (!question || busy) return;
    setBusy(true);
    setNote("");
    const r = await callAI<Answer>("/api/ai/ask", { sessionId, question, turns, ...ctx });
    setBusy(false);
    if (!r.ok) { setNote(r.reason === "daily_cap" ? "That's today's three conversations. The Library is still here, and tomorrow there are more." : aiReasonText(r.reason)); if (r.reason === "daily_cap") setSessionsLeft(0); return; }
    const a = r.data;
    const turn = { q: question, answer: a.answer, cardId: a.cardId ?? undefined, question: a.question ?? undefined, practiceId: a.practiceId ?? undefined, closing: a.closing, support: a.support, offered: a.offered };
    const next = [...turns, turn];
    setTurns(next);
    setQ("");
    if (a.sessionsLeft != null) setSessionsLeft(a.sessionsLeft);
    if (!a.support) await saveAiOutput({ id: `ask-${sessionId}`, kind: "ask", body: next.map((t) => t.answer).join("\n\n"), cardIds: [...new Set(next.flatMap((t) => (t.cardId ? [t.cardId] : [])))], data: { turns: next.map(({ offered: _o, ...t }) => t) } });
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
  }

  return (
    <div className="fade-in space-y-7">
      <Link href="/library" className="btn-quiet -ml-3 inline-flex items-center rounded-full">← Library</Link>
      <header>
        <h1 className="font-serif text-3xl">Ask Ballast</h1>
        <HorizonLine className="mt-4" tick={turns.length / TURNS} />
        <p className="mt-4 text-[15px] text-muted">A short conversation, not a chat. Up to five questions, each answered from one Library card and your own words. Three conversations a day.</p>
      </header>

      {!profile.aiConsent ? (
        <div className="card space-y-3">
          <p className="text-[15px]">Ask Ballast uses AI, which is off.</p>
          <Link href="/settings" className="btn">See what's sent, and turn it on</Link>
        </div>
      ) : (
        <>
          <ol className="space-y-6" aria-label="This conversation">
            {turns.map((t, i) => (
              <li key={i} className="space-y-3">
                <p className="text-[15px] text-muted"><span className="sr-only">You asked: </span>{t.q}</p>
                {t.support ? (
                  <p role="note" className="rounded-2xl border border-brass bg-surface p-5 font-serif text-lg">{t.answer}</p>
                ) : (
                  <div className="card space-y-4">
                    <p className="whitespace-pre-line font-serif text-lg">{t.answer}</p>
                    {t.question && (
                      <div className="border-t border-line pt-3">
                        <p className="text-sm text-muted">A question to carry</p>
                        <p className="font-serif text-lg">{t.question}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      {t.practiceId && PRACTICES[t.practiceId] && <Link href={`/today?practice=${t.practiceId}`} className="btn btn-ghost !min-h-[40px] !px-4 text-sm">Try: {PRACTICES[t.practiceId].title}</Link>}
                    </div>
                    {t.cardId && <SourceChips ids={[t.cardId]} />}
                  </div>
                )}
              </li>
            ))}
          </ol>
          <div ref={endRef} />

          {done ? (
            <section aria-label="Session closed" className="space-y-3 border-t border-line pt-6">
              <p className="font-serif text-xl">That's the conversation. The rest is yours to carry.</p>
              <Link href="/today" className="btn btn-ghost">Back to today</Link>
            </section>
          ) : capped ? (
            <p className="text-[15px] text-muted">That's today's three conversations. The Library is still here, and tomorrow there are more.</p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); void ask(); }} className="space-y-3">
              <label htmlFor="ask-q" className="block text-[15px]">{turns.length ? `Question ${turns.length + 1} of ${TURNS}` : "What's on your mind?"}</label>
              <textarea id="ask-q" rows={3} maxLength={600} className="field serif" value={q} onChange={(e) => setQ(e.target.value)} placeholder="I hit the goal and felt nothing…" />
              <div className="flex flex-wrap items-center gap-3">
                <button className="btn" disabled={busy || !q.trim()}>{busy ? "Thinking it over…" : "Ask"}</button>
                {sessionsLeft != null && turns.length === 0 && <p className="text-sm text-muted">{sessionsLeft} of 3 conversations left today</p>}
              </div>
              <p className="text-sm text-muted">Sends your question, your values and the last seven days of dials, evidence lines and Sails to Claude, with a few Library cards to draw on.</p>
            </form>
          )}
          {note && <p aria-live="polite" className="text-[15px] text-muted">{note}</p>}
        </>
      )}
    </div>
  );
}
