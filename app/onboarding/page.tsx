"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useProfile } from "@/lib/hooks";
import Link from "next/link";
import { saveProfile, emptyEnough } from "@/lib/store";
import { loadSample } from "@/lib/seed";
import LensPicker from "@/components/LensPicker";
import { cloudConfigured } from "@/lib/supabase";
import type { EnoughLine } from "@/lib/types";

const ENOUGH_FIELDS: { key: keyof EnoughLine; label: string; ph: string }[] = [
  { key: "money", label: "Money", ph: "e.g. six months of runway and no debt on the house" },
  { key: "health", label: "Health", ph: "e.g. I can run five miles and sleep seven hours" },
  { key: "relationships", label: "Relationships", ph: "e.g. dinner together five nights a week" },
  { key: "time", label: "Time", ph: "e.g. one unscheduled morning a week" },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [enough, setEnough] = useState<EnoughLine>(emptyEnough);
  const [time, setTime] = useState("08:00");
  const [counted, setCounted] = useState(false);
  const [notify, setNotify] = useState(false);
  const [ai, setAi] = useState(false);
  const [lenses, setLenses] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const existing = useProfile();
  // Signing in on a new device can bring a profile down from the cloud while this screen is open.
  useEffect(() => { if (existing && !busy) router.replace("/today"); }, [existing, busy, router]);

  const finish = async () => {
    setBusy(true);
    await saveProfile({ name: name.trim(), enough, ritualTime: time, countedDays: counted, notify, aiConsent: ai, lenses });
    router.replace("/today");
  };

  const Next = ({ onClick, disabled, label = "Continue" }: { onClick: () => void; disabled?: boolean; label?: string }) => (
    <button className="btn mt-8" onClick={onClick} disabled={disabled}>{label}</button>
  );

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-5 py-12">
      <div className="fade-in" key={step}>
        {step === 0 && (
          <>
            <p className="text-sm uppercase tracking-[0.2em] text-muted">Ballast</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight">Feel full, and stay hungry.</h1>
            <p className="mt-5 font-serif text-xl leading-relaxed text-muted">
              Gratitude isn't the opposite of ambition. It's ballast. The steadier you are, the more sail you can carry. A few quiet minutes a day, and nothing here will ever tell you to want less.
            </p>
            <Next onClick={() => setStep(1)} label="Begin" />
            <div className="mt-8 space-y-2 text-[15px]">
              {cloudConfigured && <p><Link href="/login" className="text-brass-ink underline underline-offset-4">Sign in to sync across devices</Link></p>}
              <p>
                <button className="text-brass-ink underline underline-offset-4" onClick={async () => { setBusy(true); await loadSample(); router.replace("/map"); }}>
                  Just looking? Explore with sample data
                </button>
              </p>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="font-serif text-3xl">What should we call you?</h1>
            <input className="field serif mt-6" value={name} onChange={(e) => setName(e.target.value)} placeholder="First name" autoComplete="given-name" aria-label="Your name" />
            <Next onClick={() => setStep(2)} />
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="font-serif text-3xl">Where is your Enough Line?</h1>
            <p className="mt-3 text-muted">Concretely, what would “enough” look like? It isn't a ceiling. You can keep climbing. It's just a line you can check against. All four are optional.</p>
            <div className="mt-6 space-y-5">
              {ENOUGH_FIELDS.map((f) => (
                <div key={f.key}>
                  <label htmlFor={`e-${f.key}`} className="mb-2 block text-[15px]">{f.label}</label>
                  <textarea id={`e-${f.key}`} rows={2} className="field serif" placeholder={f.ph} value={enough[f.key]} onChange={(e) => setEnough({ ...enough, [f.key]: e.target.value })} />
                </div>
              ))}
            </div>
            <Next onClick={() => setStep(3)} />
          </>
        )}
        {step === 3 && (
          <>
            <h1 className="font-serif text-3xl">Eleven voices, all in the room</h1>
            <p className="mt-3 text-muted">Ballast weaves short ideas from all of these thinkers into your practice, always in its own words and never as a quotation. Anyone you'd like to hear from more often? Tap as many as you like. Optional, and you can change it any time.</p>
            <div className="mt-6"><LensPicker value={lenses} onChange={setLenses} /></div>
            <Next onClick={() => setStep(4)} label="Continue" />
          </>
        )}
        {step === 4 && (
          <>
            <h1 className="font-serif text-3xl">When would you like to practice?</h1>
            <p className="mt-3 text-muted">Whenever suits you. Morning tends to work best, but there's no wrong answer.</p>
            <label htmlFor="rt" className="sr-only">Ritual time</label>
            <input id="rt" type="time" className="field mt-6 !w-auto" value={time} onChange={(e) => setTime(e.target.value)} />
            <Next onClick={() => setStep(5)} />
          </>
        )}
        {step === 5 && (
          <>
            <h1 className="font-serif text-3xl">A few gentle choices</h1>
            <div className="mt-6 space-y-4">
              <Toggle label="Counted Days prompts" help="Occasional, warm perspective prompts about time with the people you love. Off by default." on={counted} set={setCounted} />
              <Toggle label="Daily reminder" help="One quiet nudge at your ritual time, only if you haven't checked in. You'll finish turning it on in Settings after signing in." on={notify} set={setNotify} />
              <Toggle label="Allow AI features" help="Lets a weekly reflection and thank-you drafts be written by Claude from your own words. Called server-side only, and only when you ask. Off by default." on={ai} set={setAi} />
            </div>
            <Next onClick={finish} disabled={busy} label={busy ? "Setting sail…" : "Start"} />
          </>
        )}
      </div>
    </main>
  );
}

function Toggle({ label, help, on, set }: { label: string; help: string; on: boolean; set: (b: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => set(!on)} className="flex w-full items-start justify-between gap-4 rounded-2xl border border-line bg-surface p-4 text-left">
      <span>
        <span className="block font-medium">{label}</span>
        <span className="mt-1 block text-[15px] text-muted">{help}</span>
      </span>
      <span aria-hidden className={`mt-1 flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-calm ${on ? "bg-deep" : "bg-line"}`}>
        <span className={`h-5 w-5 rounded-full bg-paper transition-transform duration-calm ${on ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}
