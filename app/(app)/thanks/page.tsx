"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useProfile } from "@/lib/hooks";
import { addThank, updateThank } from "@/lib/store";
import { aiReasonText, callAI } from "@/lib/ai-client";
import { formatFull } from "@/lib/dates";
import type { Thank } from "@/lib/types";

// Without AI we can't safely rewrite their words into second person, so we give an honest scaffold with their note beside it.
const localDraft = (person: string, reason: string) =>
  `${person},\n\nI've been meaning to say thank you, and I don't think I ever have properly.\n\n[Say it to ${person} directly. Your note to self: “${reason}”]\n\nThank you.`;

export default function ThanksPage() {
  const profile = useProfile();
  const thanks = useLiveQuery(async () => (await db.thanks.toArray()).filter((t) => !t.deletedAt), []);
  const [person, setPerson] = useState("");
  const [reason, setReason] = useState("");

  if (!thanks || !profile) return <div aria-busy="true" />;
  const owed = thanks.filter((t) => t.status === "owed").sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  const sent = thanks.filter((t) => t.status === "sent").sort((a, b) => ((a.sentAt ?? "") < (b.sentAt ?? "") ? 1 : -1));
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const sentThisWeek = sent.some((t) => (t.sentAt ?? "") > weekAgo);
  const pick = !sentThisWeek ? owed[0] : undefined;

  return (
    <div className="fade-in space-y-8">
      <header>
        <h1 className="font-serif text-3xl">Unsent Thanks</h1>
        <p className="mt-2 text-muted">People you owe a thank-you. Once a week, send one. We'll help you start, using your own words.</p>
        <p className="mt-3 text-[15px]"><span className="font-serif text-2xl tabular-nums">{sent.length}</span> <span className="text-muted">{sent.length === 1 ? "debt" : "debts"} paid</span></p>
      </header>

      {pick && (
        <aside className="rounded-2xl border border-line bg-surface p-5" aria-label="This week's thank-you">
          <p className="text-sm text-muted">This week's one</p>
          <p className="mt-1 font-serif text-xl">{pick.person} has been waiting the longest. Want to send them something today?</p>
        </aside>
      )}

      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (person.trim() && reason.trim()) { void addThank(person, reason); setPerson(""); setReason(""); } }}>
        <label htmlFor="who" className="block text-[15px]">Who do you owe a thank-you?</label>
        <input id="who" className="field serif" value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Name" />
        <label htmlFor="why" className="block text-[15px]">For what? In your own words.</label>
        <textarea id="why" rows={3} className="field serif" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="When I was starting out, you…" />
        <button className="btn" disabled={!person.trim() || !reason.trim()}>Add to the list</button>
      </form>

      <section aria-label="Owed">
        {owed.length === 0 ? (
          <p className="py-6 text-center text-muted">No one on the list right now. Nice. Add someone when they come to mind.</p>
        ) : (
          <ul className="space-y-4">{owed.map((t) => <OwedCard key={t.id} t={t} ai={profile.aiConsent} highlight={t.id === pick?.id} />)}</ul>
        )}
      </section>

      {sent.length > 0 && (
        <section aria-label="Paid">
          <h2 className="font-serif text-xl">Paid</h2>
          <ul className="mt-2 divide-y divide-line">
            {sent.map((t) => (
              <li key={t.id} className="py-3 text-[15px]"><span className="font-medium">{t.person}</span> <span className="text-muted">· {t.sentAt ? formatFull(t.sentAt.slice(0, 10)) : ""}</span></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function OwedCard({ t, ai, highlight }: { t: Thank; ai: boolean; highlight: boolean }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState(t.draft ?? "");
  const [open, setOpen] = useState(Boolean(t.draft));
  const [copied, setCopied] = useState(false);

  async function makeDraft() {
    setBusy(true);
    setNote("");
    setOpen(true);
    let text = localDraft(t.person, t.reason);
    if (ai) {
      const r = await callAI<{ draft: string }>("/api/ai/thank-draft", { person: t.person, reason: t.reason });
      if (r.ok) text = r.data.draft;
      else setNote(aiReasonText(r.reason));
    } else setNote("A starting scaffold with your own note beside it. Turn on AI features in Settings for a first draft in your voice.");
    setDraft(text);
    await updateThank(t.id, { draft: text });
    setBusy(false);
  }

  return (
    <li className={`rounded-2xl border bg-surface p-5 ${highlight ? "border-brass" : "border-line"}`}>
      <p className="font-serif text-xl">{t.person}</p>
      <p className="mt-1 font-serif text-[17px] leading-relaxed text-muted">{t.reason}</p>
      {open && (
        <div className="mt-4">
          <label htmlFor={`d-${t.id}`} className="mb-2 block text-sm text-muted">Your draft. Edit freely; it's yours.</label>
          <textarea id={`d-${t.id}`} rows={7} className="field serif" value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => draft !== t.draft && void updateThank(t.id, { draft })} />
          {note && <p className="mt-2 text-sm text-muted" aria-live="polite">{note}</p>}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button className="btn btn-ghost" onClick={makeDraft} disabled={busy}>{busy ? "Drafting…" : open ? "Redraft" : "Help me draft it"}</button>
        {open && (
          <button className="btn btn-ghost" onClick={async () => { await navigator.clipboard?.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{copied ? "Copied" : "Copy"}</button>
        )}
        <button className="btn" onClick={() => void updateThank(t.id, { status: "sent", sentAt: new Date().toISOString(), draft })}>I sent it</button>
      </div>
    </li>
  );
}
