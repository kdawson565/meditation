"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useProfile } from "@/lib/hooks";
import { saveProfile } from "@/lib/store";
import { db, wipeLocal } from "@/lib/db";
import { download, exportJSON, exportMarkdown } from "@/lib/export";
import { loadSample } from "@/lib/seed";
import { cloudConfigured, supabase } from "@/lib/supabase";
import { syncNow } from "@/lib/sync";
import LensPicker from "@/components/LensPicker";
import { disablePush, enablePush, refreshPushTime } from "@/lib/push";
import type { EnoughLine } from "@/lib/types";

const ENOUGH: { key: keyof EnoughLine; label: string }[] = [
  { key: "money", label: "Money" },
  { key: "health", label: "Health" },
  { key: "relationships", label: "Relationships" },
  { key: "time", label: "Time" },
];

export default function SettingsPage() {
  const profile = useProfile();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase()?.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
  }, []);

  if (!profile) return <div aria-busy="true" />;

  const stamp = new Date().toISOString().slice(0, 10);
  const Switch = ({ label, on, set }: { label: string; on: boolean; set: (b: boolean) => void }) => (
    <button role="switch" aria-checked={on} onClick={() => set(!on)} className="flex min-h-[48px] w-full items-center justify-between text-left">
      <span>{label}</span>
      <span aria-hidden className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors duration-calm ${on ? "bg-deep" : "bg-line"}`}>
        <span className={`h-5 w-5 rounded-full bg-paper transition-transform duration-calm ${on ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );

  async function deleteEverything() {
    setBusy(true);
    await disablePush().catch(() => {});
    const sb = supabase();
    if (sb) {
      const { data } = await sb.auth.getSession();
      if (data.session) {
        const res = await fetch("/api/account", { method: "DELETE", headers: { Authorization: `Bearer ${data.session.access_token}` } });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setStatus(`Couldn't delete your cloud account: ${j.error ?? res.status}. Your local data was kept.`);
          setBusy(false);
          return;
        }
        await sb.auth.signOut();
      }
    }
    await wipeLocal();
    try { localStorage.removeItem("ballast-theme"); } catch {}
    router.replace("/onboarding");
  }

  return (
    <div className="fade-in space-y-10">
      <h1 className="font-serif text-3xl">Settings</h1>

      <section className="space-y-4" aria-labelledby="s-you">
        <h2 id="s-you" className="font-serif text-xl">You</h2>
        <div>
          <label htmlFor="name" className="mb-2 block text-[15px]">Name</label>
          <input id="name" className="field" defaultValue={profile.name} onBlur={(e) => e.target.value !== profile.name && void saveProfile({ name: e.target.value.trim() })} />
        </div>
        <div>
          <label htmlFor="time" className="mb-2 block text-[15px]">Preferred ritual time</label>
          <input id="time" type="time" className="field !w-auto" defaultValue={profile.ritualTime} onBlur={(e) => { if (e.target.value !== profile.ritualTime) { void saveProfile({ ritualTime: e.target.value }); if (profile.notify) void refreshPushTime(e.target.value, profile.timezone); } }} />
        </div>
        <div>
          <p className="mb-2 text-[15px]">Appearance</p>
          <div className="flex gap-2" role="group" aria-label="Theme">
            {(["system", "light", "dark"] as const).map((t) => (
              <button key={t} aria-pressed={profile.theme === t} onClick={() => void saveProfile({ theme: t })} className={`min-h-[44px] rounded-full border px-4 text-sm capitalize transition-colors duration-calm ${profile.theme === t ? "border-deep bg-deep text-on-deep" : "border-line text-muted"}`}>{t}</button>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="s-enough" className="space-y-4">
        <h2 id="s-enough" className="font-serif text-xl">Your Enough Line</h2>
        {ENOUGH.map((f) => (
          <div key={f.key}>
            <label htmlFor={`en-${f.key}`} className="mb-2 block text-[15px]">{f.label}</label>
            <textarea id={`en-${f.key}`} rows={2} className="field serif" defaultValue={profile.enough[f.key]} onBlur={(e) => e.target.value !== profile.enough[f.key] && void saveProfile({ enough: { ...profile.enough, [f.key]: e.target.value.trim() } })} />
          </div>
        ))}
      </section>

      <section aria-labelledby="s-lens" className="space-y-3">
        <h2 id="s-lens" className="font-serif text-xl">Your lenses</h2>
        <p className="text-[15px] text-muted">Thinkers whose ideas get woven into your practice, in Ballast's own words. Some lenses unlock extra practices.</p>
        <LensPicker value={profile.lenses ?? []} onChange={(ids) => void saveProfile({ lenses: ids })} />
      </section>

      <section aria-labelledby="s-pref" className="divide-y divide-line">
        <h2 id="s-pref" className="mb-2 font-serif text-xl">Preferences</h2>
        <Switch label="Counted Days prompts" on={profile.countedDays} set={(b) => void saveProfile({ countedDays: b })} />
        <Switch label="Daily reminder" on={profile.notify} set={async (b) => {
          if (!b) { await disablePush(); await saveProfile({ notify: false }); setStatus("Reminder off."); return; }
          const r = await enablePush(profile.ritualTime, profile.timezone);
          if (r.ok) { await saveProfile({ notify: true }); setStatus(`Reminder on. We'll nudge you quietly around ${profile.ritualTime}, only if you haven't checked in.`); }
          else setStatus(r.reason);
        }} />
        <Switch label="Allow AI features (reflection, thank-you drafts, practice picks)" on={profile.aiConsent} set={(b) => void saveProfile({ aiConsent: b })} />
      </section>

      <section aria-labelledby="s-sync" className="space-y-3">
        <h2 id="s-sync" className="font-serif text-xl">Sync</h2>
        {!cloudConfigured ? (
          <p className="text-[15px] text-muted">Cloud sync isn't configured, so everything lives only in this browser. See the README to add Supabase.</p>
        ) : email ? (
          <>
            <p className="text-[15px] text-muted">Signed in as {email}.</p>
            <div className="flex gap-3">
              <button className="btn btn-ghost" onClick={async () => setStatus((await syncNow()).message)}>Sync now</button>
              <button className="btn btn-ghost" onClick={async () => { await supabase()?.auth.signOut(); setEmail(null); }}>Sign out</button>
            </div>
          </>
        ) : (
          <Link href="/login" className="btn btn-ghost">Sign in to sync</Link>
        )}
        <p aria-live="polite" className="text-[15px] text-muted">{status}</p>
      </section>

      <section aria-labelledby="s-data" className="space-y-3">
        <h2 id="s-data" className="font-serif text-xl">Your data</h2>
        <p className="text-[15px] text-muted">Journals are intimate. Take everything with you any time.</p>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-ghost" onClick={async () => download(`ballast-${stamp}.json`, await exportJSON(), "application/json")}>Export JSON</button>
          <button className="btn btn-ghost" onClick={async () => download(`ballast-${stamp}.md`, await exportMarkdown(), "text/markdown")}>Export Markdown</button>
        </div>
        <button className="btn-quiet -ml-3 rounded-full text-sm" onClick={async () => { await loadSample(profile.name || "Sam"); setStatus("Sample data loaded. It replaced your check-ins and entries."); }}>Load sample data (replaces entries)</button>
      </section>

      <section aria-labelledby="s-del" className="rounded-2xl border border-line p-5">
        <h2 id="s-del" className="font-serif text-xl">Delete everything</h2>
        <p className="mt-2 text-[15px] text-muted">Removes all entries, check-ins and your profile from this device{cloudConfigured ? " and, if you're signed in, deletes your cloud account and all its data" : ""}. This can't be undone. Consider exporting first.</p>
        {!open ? (
          <button className="btn btn-ghost mt-4" onClick={() => setOpen(true)}>Delete my data…</button>
        ) : (
          <div className="mt-4 space-y-3">
            <label htmlFor="confirm" className="block text-[15px]">Type DELETE to confirm</label>
            <input id="confirm" className="field" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
            <div className="flex gap-3">
              <button className="btn" disabled={confirmText !== "DELETE" || busy} onClick={deleteEverything}>{busy ? "Deleting…" : "Delete everything"}</button>
              <button className="btn-quiet rounded-full" onClick={() => { setOpen(false); setConfirmText(""); }}>Cancel</button>
            </div>
          </div>
        )}
      </section>
      <p className="text-center text-xs text-muted">Ballast · {db.name}</p>
    </div>
  );
}
