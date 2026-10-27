"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { addLedgerItem, answerAudit, markWantArrived, removeLedgerItem } from "@/lib/store";
import { formatFull, todayStr } from "@/lib/dates";
import type { Audit, LedgerItem } from "@/lib/types";

export default function LedgerPage() {
  const items = useLiveQuery(async () => (await db.ledger.toArray()).filter((i) => !i.deletedAt), []);
  const audits = useLiveQuery(() => db.audits.toArray(), []);
  const [want, setWant] = useState("");
  const [asset, setAsset] = useState("");
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [confirmArrive, setConfirmArrive] = useState<string | null>(null);
  const today = todayStr();

  if (!items || !audits) return <div aria-busy="true" />;

  const wants = items.filter((i) => i.kind === "want").sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const assets = items.filter((i) => i.kind === "asset");
  const wantIds = new Set(wants.map((w) => w.id));
  const loose = assets.filter((a) => !a.wantId || !wantIds.has(a.wantId));
  const open = wants.filter((w) => !w.arrivedOn);
  const arrived = wants.filter((w) => w.arrivedOn);
  const due = audits.filter((a) => !a.answeredAt && a.dueOn <= today);
  const answered = audits.filter((a) => a.answeredAt && a.days === 30 && a.glow);
  const avgGlow = answered.length >= 2 ? answered.reduce((s, a) => s + a.glow!, 0) / answered.length : null;

  const wantText = (id: string) => items.find((i) => i.id === id)?.text ?? "something you reached";

  const Row = ({ w }: { w: LedgerItem }) => {
    const mine = assets.filter((a) => a.wantId === w.id);
    return (
      <li className="grid grid-cols-2 gap-3 py-4">
        <div>
          <p className="font-serif text-[17px] leading-snug">{w.text}</p>
          {w.arrivedOn ? (
            <p className="mt-2 text-xs text-muted">Reached {formatFull(w.arrivedOn)}</p>
          ) : confirmArrive === w.id ? (
            <p className="mt-2 text-sm">
              Reached it?{" "}
              <button className="underline underline-offset-4" onClick={() => { void markWantArrived(w.id); setConfirmArrive(null); }}>Yes</button>{" · "}
              <button className="underline underline-offset-4" onClick={() => setConfirmArrive(null)}>Not yet</button>
            </p>
          ) : (
            <button className="mt-1 min-h-[44px] text-sm text-brass-ink underline underline-offset-4" onClick={() => setConfirmArrive(w.id)}>I got it</button>
          )}
          {w.arrivedOn && audits.filter((a) => a.wantId === w.id).sort((a, b) => a.days - b.days).map((a) => (
            <p key={a.id} className="mt-1 text-xs text-muted">
              Day {a.days}: {a.answeredAt ? `glow ${a.glow}/10${a.note ? `, “${a.note}”` : ""}` : a.dueOn <= today ? "check-in waiting" : `check-in ${formatFull(a.dueOn)}`}
            </p>
          ))}
        </div>
        <div>
          <ul className="space-y-2">
            {mine.map((a) => <AssetLine key={a.id} a={a} />)}
          </ul>
          {addingFor === w.id ? (
            <form className="mt-2" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) void addLedgerItem("asset", draft, w.id); setDraft(""); setAddingFor(null); }}>
              <label className="sr-only" htmlFor={`a-${w.id}`}>I already have…</label>
              <input id={`a-${w.id}`} autoFocus className="field !py-2 !text-[15px]" placeholder="I already have…" value={draft} onChange={(e) => setDraft(e.target.value)} />
              <button className="btn-quiet !min-h-[40px] text-sm" disabled={!draft.trim()}>Add</button>
            </form>
          ) : (
            <button className="mt-1 min-h-[44px] text-sm text-brass-ink underline underline-offset-4" onClick={() => { setAddingFor(w.id); setDraft(""); }}>
              {mine.length ? "Add another" : "I already have…"}
            </button>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="fade-in space-y-8">
      <header>
        <h1 className="font-serif text-3xl">The Ledger</h1>
        <p className="mt-2 text-muted">For every “I want…”, a counterweight: “I already have…”. Wants are never deleted or judged. They just get company.</p>
      </header>

      {due.length > 0 && (
        <section aria-label="Arrival Audit" className="space-y-3">
          {due.map((a) => <AuditCard key={a.id} a={a} text={wantText(a.wantId)} />)}
        </section>
      )}

      <section aria-label="Add" className="space-y-4">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (want.trim()) void addLedgerItem("want", want); setWant(""); }}>
          <label htmlFor="want" className="sr-only">I want…</label>
          <input id="want" className="field serif" placeholder="I want…" value={want} onChange={(e) => setWant(e.target.value)} />
          <button className="btn" disabled={!want.trim()}>Add</button>
        </form>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (asset.trim()) void addLedgerItem("asset", asset); setAsset(""); }}>
          <label htmlFor="asset" className="sr-only">I already have…</label>
          <input id="asset" className="field serif" placeholder="I already have…" value={asset} onChange={(e) => setAsset(e.target.value)} />
          <button className="btn btn-ghost" disabled={!asset.trim()}>Add</button>
        </form>
      </section>

      <section aria-label="Balance">
        <div className="grid grid-cols-2 gap-3 border-b border-line pb-2 text-xs uppercase tracking-[0.12em] text-muted">
          <h2>Wants · {open.length}</h2>
          <h2>Assets · {assets.length}</h2>
        </div>
        {wants.length + loose.length === 0 ? (
          <p className="py-8 text-center text-muted">Nothing here yet. Start with either column.</p>
        ) : (
          <ul className="divide-y divide-line">
            {open.map((w) => <Row key={w.id} w={w} />)}
            {loose.length > 0 && (
              <li className="grid grid-cols-2 gap-3 py-4">
                <p className="text-sm text-muted">Not tied to a want</p>
                <ul className="space-y-2">{loose.map((a) => <AssetLine key={a.id} a={a} />)}</ul>
              </li>
            )}
          </ul>
        )}
      </section>

      {arrived.length > 0 && (
        <section aria-label="Reached">
          <h2 className="font-serif text-xl">Reached</h2>
          {avgGlow != null && <p className="mt-1 text-[15px] text-muted">So far, things you reached felt about {avgGlow.toFixed(1)}/10 a month later. That's just your own data on how the finish line moves.</p>}
          <ul className="divide-y divide-line">{arrived.map((w) => <Row key={w.id} w={w} />)}</ul>
        </section>
      )}
    </div>
  );
}

function AssetLine({ a }: { a: LedgerItem }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <li className="font-serif text-[17px] leading-snug">
      {a.text}{" "}
      {confirm ? (
        <span className="font-sans text-xs">
          <button className="underline" onClick={() => void removeLedgerItem(a.id)}>Remove</button> · <button className="underline" onClick={() => setConfirm(false)}>Keep</button>
        </span>
      ) : (
        <button className="font-sans text-xs text-muted underline underline-offset-2" aria-label={`Remove: ${a.text}`} onClick={() => setConfirm(true)}>remove</button>
      )}
    </li>
  );
}

function AuditCard({ a, text }: { a: Audit; text: string }) {
  const [glow, setGlow] = useState<number | null>(null);
  const [note, setNote] = useState("");
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-sm text-muted">Arrival Audit · day {a.days}</p>
      <p className="mt-2 font-serif text-xl leading-snug">You reached “{text}”. How much of the glow is still there?</p>
      <div role="radiogroup" aria-label="Glow, from 1 to 10" className="mt-3 flex flex-wrap gap-2">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button key={n} role="radio" aria-checked={glow === n} onClick={() => setGlow(n)} className={`h-11 w-11 rounded-full border text-sm tabular-nums transition-colors duration-calm ${glow === n ? "border-deep bg-deep text-on-deep" : "border-line text-muted hover:text-ink"}`}>{n}</button>
        ))}
      </div>
      <label htmlFor={`n-${a.id}`} className="sr-only">Anything to add?</label>
      <input id={`n-${a.id}`} className="field serif mt-3" placeholder="What's it like now? (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="btn mt-3" disabled={glow == null} onClick={() => glow != null && void answerAudit(a.id, glow, note)}>Save</button>
    </div>
  );
}
