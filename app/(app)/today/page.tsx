"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { db } from "@/lib/db";
import { useCheckins, useEntries, useProfile } from "@/lib/hooks";
import { addMonths, daysInMonth, formatLong, greeting, todayStr } from "@/lib/dates";
import { PRACTICES, availablePractices } from "@/lib/practices";
import { midlines } from "@/lib/quadrant";
import { suggestPractice } from "@/lib/selection";
import { pickResurfacing, type Resurfacing } from "@/lib/resurface";
import { saveCheckin, saveEntry, setAfter } from "@/lib/store";
import type { PracticeId } from "@/lib/types";
import BreathGate from "@/components/BreathGate";
import DialSlider from "@/components/DialSlider";
import TagInput from "@/components/TagInput";
import TideLine from "@/components/TideLine";
import ResurfacedCard from "@/components/ResurfacedCard";
import Nudges from "@/components/Nudges";
import LensIdea from "@/components/LensIdea";
import { callAI } from "@/lib/ai-client";
import { practiceInsights } from "@/lib/insights";

type Step = "dials" | "breath" | "practice" | "intention" | "close";

export default function TodayPage() {
  const profile = useProfile();
  const checkins = useCheckins();
  const entries = useEntries();
  const today = todayStr();

  const [step, setStep] = useState<Step>("dials");
  const [adding, setAdding] = useState(false);
  const [drive, setDrive] = useState<number | null>(null);
  const [peace, setPeace] = useState<number | null>(null);
  const [practice, setPractice] = useState<PracticeId | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [checkBack, setCheckBack] = useState(1);
  const [sail, setSail] = useState("");
  const [floor, setFloor] = useState("");
  const [saving, setSaving] = useState(false);
  const [resurfaced, setResurfaced] = useState<Resurfacing | null>(null);
  const [checkinId, setCheckinId] = useState<string | undefined>();
  const [peaceAfter, setPeaceAfterState] = useState<number | null>(null);
  const [aiPick, setAiPick] = useState<{ practice: PracticeId; reason: string } | null>(null);
  const [driveAfter, setDriveAfterState] = useState<number | null>(null);

  const stepRef = useRef<Step>("dials");
  stepRef.current = step;
  const typedRef = useRef(false);
  typedRef.current = Object.values(fields).some((v) => v.trim()) || practice !== null;
  const todayCheckin = checkins?.find((c) => c.localDate === today);
  const todayEntries = useMemo(() => entries?.filter((e) => e.localDate === today) ?? [], [entries, today]);
  const mid = useMemo(() => midlines(checkins ?? []), [checkins]);

  // defaults: yesterday's dials, so the slider starts near where you actually are
  useEffect(() => {
    if (!checkins || drive !== null) return;
    const last = checkins[checkins.length - 1];
    setDrive(todayCheckin?.drive ?? last?.drive ?? 6);
    setPeace(todayCheckin?.peace ?? last?.peace ?? 5);
  }, [checkins, todayCheckin, drive]);

  const suggestion = useMemo(
    () => (drive != null && peace != null && entries ? suggestPractice({ drive, peace, today, entries, mid, countedDays: profile?.countedDays, hasEnough: Object.values(profile?.enough ?? {}).some(Boolean) }) : null),
    [drive, peace, entries, today, mid, profile],
  );
  const base = aiPick ?? suggestion;
  const activePractice = practice ?? base?.practice ?? "past_self";
  const p = PRACTICES[activePractice];

  const monthPrefix = today.slice(0, 7);
  const daysPracticed = useMemo(() => new Set((checkins ?? []).filter((c) => c.localDate.startsWith(monthPrefix)).map((c) => c.localDate)).size, [checkins, monthPrefix]);

  if (!profile || !checkins || !entries || drive == null || peace == null) return <div aria-busy="true" />;

  const tideLabel = daysPracticed === 0 ? "The tide is out. No pressure." : `${daysPracticed} ${daysPracticed === 1 ? "day" : "days"} practiced this month`;
  const tide = <TideLine level={daysPracticed / daysInMonth(today)} label={tideLabel} />;

  const requiredOk = p.fields.every((f) => !f.required || (fields[f.key] ?? "").trim());

  const beginPractice = () => {
    setPractice(null);
    setFields({});
    setTags([]);
    setSail("");
    setFloor("");
    setChoosing(false);
  };

  async function finish(skipIntention = false) {
    setSaving(true);
    const c = todayCheckin && !adding ? todayCheckin : await saveCheckin(today, drive!, peace!);
    const bodyKey = p.fields.find((f) => f.isBody)!.key;
    const clean = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.trim()]));
    const entry = await saveEntry({
      localDate: today,
      practice: p.id,
      prompt: p.prompt,
      fields: clean,
      body: clean[bodyKey] ?? "",
      tags,
      sail: skipIntention ? undefined : sail.trim() || undefined,
      floor: skipIntention ? undefined : floor.trim() || undefined,
      checkinId: c.id,
      resurfaceOn: p.checkBack ? addMonths(today, p.checkBack[checkBack].months) : undefined,
    });
    const shown = await db.resurfaced.toArray();
    const r = pickResurfacing({ entries: await db.entries.toArray(), shown, today, peace: c.peace, enough: profile!.enough, excludeId: entry.id });
    if (r?.kind === "entry") await db.resurfaced.put({ entryId: r.entry.id, shownOn: today });
    setResurfaced(r);
    setCheckinId(c.id);
    setSaving(false);
    setStep("close");
  }

  // ───── already done today
  if (step === "dials" && todayEntries.length > 0 && !adding) {
    return (
      <div className="fade-in space-y-8">
        <Header name={profile.name} />
        <div>
          <h2 className="font-serif text-2xl">Today is logged.</h2>
          <p className="mt-2 text-muted">Drive {todayCheckin?.drive} · Peace {todayCheckin?.peace}. That's enough for today, though you're welcome to add more.</p>
        </div>
        {tide}
        <Nudges />
        <ul className="space-y-3">
          {todayEntries.map((e) => (
            <li key={e.id} className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-sm text-muted">{PRACTICES[e.practice].title}</p>
              <p className="mt-2 font-serif text-lg leading-relaxed">{e.body}</p>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-ghost" onClick={() => { beginPractice(); setAdding(true); setStep("practice"); }}>
            Add another practice
          </button>
          <Link href="/map" className="btn-quiet inline-flex items-center rounded-full">
            See the map
          </Link>
        </div>
      </div>
    );
  }

  // ───── close
  if (step === "close") {
    return (
      <div className="fade-in space-y-8">
        <div>
          <h1 className="font-serif text-3xl">Logged.</h1>
          <p className="mt-2 text-muted">The tide is a little higher. Nothing else is needed from you today.</p>
        </div>
        {tide}
        {resurfaced && <ResurfacedCard r={resurfaced} />}
        <LensIdea lenses={profile.lenses} practice={p.id} seed={today} offset={1} variant="card" />
        {checkinId && (
          <div className="space-y-5 rounded-2xl border border-line p-5">
            <p className="text-[15px]">If you like, rate them once more. This is how Ballast learns which practices settle you without dulling your edge.</p>
            {([["Peace", peaceAfter, setPeaceAfterState, "peaceAfter"], ["Drive", driveAfter, setDriveAfterState, "driveAfter"]] as const).map(([label, val, set, key]) => (
              <div key={label}>
                <p id={`after-${key}`} className="text-[15px]">{label} now</p>
                <div role="radiogroup" aria-labelledby={`after-${key}`} className="mt-2 flex flex-wrap gap-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button key={n} role="radio" aria-checked={val === n} onClick={() => { set(n); void setAfter(checkinId, { [key]: n }); }} className={`h-11 w-11 rounded-full border text-sm tabular-nums transition-colors duration-calm ${val === n ? "border-deep bg-deep text-on-deep" : "border-line text-muted hover:text-ink"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {(peaceAfter || driveAfter) && <p className="text-sm text-muted">Noted.</p>}
          </div>
        )}
        <div className="flex gap-3">
          <Link href="/map" className="btn">See the map</Link>
          <Link href="/archive" className="btn btn-ghost">Archive</Link>
        </div>
      </div>
    );
  }

  // ───── dials
  if (step === "dials") {
    return (
      <div className="fade-in space-y-8">
        <Header name={profile.name} />
        <Nudges />
        <DialSlider label="Drive" hint="How hungry, focused and in motion do you feel?" low="Idle" high="Charging" value={drive} onChange={setDrive} />
        <DialSlider label="Peace" hint="How settled, present and “enough” do you feel?" low="Restless" high="Settled" value={peace} onChange={setPeace} />
        <p className="text-sm text-muted">Be honest. Neither number is better or worse. They're just a bearing.</p>
        <button className="btn w-full sm:w-auto" onClick={async () => {
          await saveCheckin(today, drive, peace);
          setStep("breath");
          // Ask Claude while the breath gate runs; if it doesn't answer in time, the rule-based pick stands.
          if (profile.aiConsent) {
            const avail = availablePractices({ countedDays: profile.countedDays, hasEnough: Object.values(profile.enough).some(Boolean) });
            void callAI<{ practice: PracticeId; reason: string }>("/api/ai/next-practice", {
              drive, peace,
              days: checkins.slice(-14).map((c) => ({ date: c.localDate, drive: c.drive, peace: c.peace, peaceAfter: c.peaceAfter, driveAfter: c.driveAfter })),
              history: entries.slice(-14).map((e) => ({ date: e.localDate, practice: e.practice })),
              available: avail.map((id) => ({ id, title: PRACTICES[id].title, blurb: PRACTICES[id].blurb })),
              insights: practiceInsights(checkins, entries, mid.peace).map((r) => ({ practice: r.practice, n: r.n, peaceLift: Number(r.peaceLift.toFixed(1)), driveShift: r.driveShift == null ? null : Number(r.driveShift.toFixed(1)) })),
            }).then((r) => {
              // Never swap the practice under someone who has started writing or chosen their own.
              if (r.ok && avail.includes(r.data.practice) && !typedRef.current && (stepRef.current === "breath" || stepRef.current === "practice")) setAiPick(r.data);
            });
          }
        }}>
          Continue
        </button>
      </div>
    );
  }

  if (step === "breath") {
    const breaths = checkins.length < 3 ? 3 : 1;
    return <BreathGate breaths={breaths} onDone={() => setStep("practice")} />;
  }

  // ───── practice
  if (step === "practice") {
    return (
      <div className="fade-in space-y-7">
        <div>
          <p className="text-sm text-muted">{p.blurb}</p>
          <h1 className="mt-1 font-serif text-3xl">{p.title}</h1>
          <p className="mt-3 font-serif text-xl leading-relaxed">{p.prompt}</p>
          {base && !practice && <p className="mt-3 text-[15px] text-muted">{base.reason}{aiPick && <span className="mt-1 block text-xs">Picked by Claude from your recent dials and practice history. No journal text was sent.</span>}</p>}
          <div className="mt-4"><LensIdea lenses={profile.lenses} practice={p.id} seed={today} /></div>
          <button className="btn-quiet -ml-3 mt-1 rounded-full text-sm" onClick={() => setChoosing((c) => !c)} aria-expanded={choosing}>
            {choosing ? "Keep this one" : "Choose another"}
          </button>
          {choosing && (
            <ul className="mt-2 grid gap-2">
              {availablePractices({ countedDays: profile.countedDays, hasEnough: Object.values(profile.enough).some(Boolean) }).map((id) => (
                <li key={id}>
                  <button className={`w-full rounded-xl border px-4 py-3 text-left transition-colors duration-calm ${id === activePractice ? "border-deep" : "border-line hover:border-muted"}`} onClick={() => { setPractice(id); setFields({}); setChoosing(false); }}>
                    <span className="font-medium">{PRACTICES[id].title}</span>
                    <span className="block text-sm text-muted">{PRACTICES[id].blurb}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {p.showEnough && (
          <ul className="space-y-1 rounded-2xl border border-line bg-surface p-4 font-serif text-[17px] leading-relaxed">
            {(["money", "health", "relationships", "time"] as const).filter((k) => profile.enough[k]).map((k) => (
              <li key={k}><span className="font-sans text-sm capitalize text-muted">{k}: </span>{profile.enough[k]}</li>
            ))}
          </ul>
        )}

        {p.fields.map((f) => (
          <div key={p.id + f.key}>
            <label htmlFor={`f-${f.key}`} className="mb-2 block text-[15px]">
              {f.label} {!f.required && <span className="text-muted">(optional)</span>}
            </label>
            {f.long ? (
              <textarea id={`f-${f.key}`} rows={6} className="field serif" placeholder={f.placeholder} value={fields[f.key] ?? ""} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })} />
            ) : (
              <input id={`f-${f.key}`} className="field serif" placeholder={f.placeholder} value={fields[f.key] ?? ""} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })} />
            )}
          </div>
        ))}

        {p.checkBack && (
          <fieldset>
            <legend className="mb-2 text-[15px]">When should we bring this back to you?</legend>
            <div className="flex flex-wrap gap-2">
              {p.checkBack.map((c, i) => (
                <button key={c.label} type="button" aria-pressed={checkBack === i} onClick={() => setCheckBack(i)} className={`min-h-[44px] rounded-full border px-4 text-sm transition-colors duration-calm ${checkBack === i ? "border-deep bg-deep text-on-deep" : "border-line text-muted"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div>
          <p className="mb-2 text-[15px]">Tags <span className="text-muted">(optional)</span></p>
          <TagInput value={tags} onChange={setTags} />
        </div>

        <button className="btn w-full sm:w-auto" disabled={!requiredOk} onClick={() => setStep("intention")}>
          Continue
        </button>
      </div>
    );
  }

  // ───── intention: floor & sail
  return (
    <div className="fade-in space-y-7">
      <div>
        <h1 className="font-serif text-3xl">Floor & Sail</h1>
        <p className="mt-2 text-muted">One line for what you're reaching for, and one for what stays true either way. Both optional.</p>
      </div>
      <div>
        <label htmlFor="sail" className="mb-2 block text-[15px]">Sail: what I'm reaching for today</label>
        <input id="sail" className="field serif" value={sail} onChange={(e) => setSail(e.target.value)} placeholder="Today I'm going for…" />
      </div>
      <div>
        <label htmlFor="floor" className="mb-2 block text-[15px]">Floor: what stays true even if today goes badly</label>
        <input id="floor" className="field serif" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Whatever happens, I still have…" />
      </div>
      <div className="flex items-center gap-3">
        <button className="btn" onClick={() => finish()} disabled={saving}>
          {saving ? "Saving…" : "Close today"}
        </button>
        <button className="btn-quiet rounded-full" onClick={() => void finish(true)} disabled={saving}>
          Skip this
        </button>
      </div>
    </div>
  );
}

function Header({ name }: { name: string }) {
  return (
    <header>
      <p className="text-sm text-muted">{formatLong(todayStr())}</p>
      <h1 className="mt-1 font-serif text-3xl">
        {greeting()}
        {name ? `, ${name}` : ""}.
      </h1>
    </header>
  );
}
