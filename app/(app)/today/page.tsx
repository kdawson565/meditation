"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { db } from "@/lib/db";
import { useCheckins, useEntries, useProfile, useValues } from "@/lib/hooks";
import { addDays, addMonths, daysInMonth, formatLong, greeting, todayStr } from "@/lib/dates";
import { PRACTICES, availablePractices } from "@/lib/practices";
import { midlines } from "@/lib/quadrant";
import { suggestPractice } from "@/lib/selection";
import { pickResurfacing, type Resurfacing } from "@/lib/resurface";
import { saveCheckin, saveEntry, setAfter, setDayValues, setSailAdvocate, setSailResult } from "@/lib/store";
import { coreValues, unsureSails } from "@/lib/values";
import { EvidenceCard, ValueChips, ValuesInvite } from "@/components/ValueBits";
import type { Checkin, Entry, PracticeId, SailResult, Value } from "@/lib/types";
import BreathGate from "@/components/BreathGate";
import DialSlider from "@/components/DialSlider";
import TagInput from "@/components/TagInput";
import TideLine from "@/components/TideLine";
import ResurfacedCard from "@/components/ResurfacedCard";
import Nudges from "@/components/Nudges";
import LensIdea from "@/components/LensIdea";
import { callAI } from "@/lib/ai-client";
import { practiceInsights } from "@/lib/insights";
import { suggestsDistress } from "@/lib/safety";

type Step = "dials" | "breath" | "practice" | "intention" | "short" | "close";

export default function TodayPage() {
  const profile = useProfile();
  const checkins = useCheckins();
  const entries = useEntries();
  const allValues = useValues();
  const values = useMemo(() => coreValues(allValues), [allValues]);
  const today = todayStr();

  const [step, setStep] = useState<Step>("dials");
  const [adding, setAdding] = useState(false);
  const [drive, setDrive] = useState<number | null>(null);
  const [peace, setPeace] = useState<number | null>(null);
  const [voice, setVoice] = useState<number>(5);
  const [distress, setDistress] = useState(false);
  const [practice, setPractice] = useState<PracticeId | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [checkBack, setCheckBack] = useState(1);
  const [sail, setSail] = useState("");
  const [floor, setFloor] = useState("");
  const [floorValueId, setFloorValueId] = useState<string | undefined>();
  const [sailValue, setSailValue] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [resurfaced, setResurfaced] = useState<Resurfacing | null>(null);
  const [checkinId, setCheckinId] = useState<string | undefined>();
  const [peaceAfter, setPeaceAfterState] = useState<number | null>(null);
  const [aiPick, setAiPick] = useState<{ practice: PracticeId; reason: string } | null>(null);
  const [driveAfter, setDriveAfterState] = useState<number | null>(null);
  const [sailAnswer, setSailAnswer] = useState<SailResult | null>(null);

  const stepRef = useRef<Step>("dials");
  stepRef.current = step;
  const typedRef = useRef(false);
  typedRef.current = Object.values(fields).some((v) => v.trim()) || practice !== null;
  const todayCheckin = checkins?.find((c) => c.localDate === today);
  const todayEntries = useMemo(() => entries?.filter((e) => e.localDate === today) ?? [], [entries, today]);
  const mid = useMemo(() => midlines(checkins ?? []), [checkins]);

  // Start neutral so yesterday's numbers don't anchor today's. Yesterday shows as a marker instead.
  const lastCheckin = useMemo(() => [...(checkins ?? [])].reverse().find((c) => c.localDate < today), [checkins, today]);
  useEffect(() => {
    if (!checkins || drive !== null) return;
    setDrive(todayCheckin?.drive ?? 5);
    setPeace(todayCheckin?.peace ?? 5);
    setVoice(todayCheckin?.voice ?? 5);
    setFloorValueId(todayCheckin?.floorValueId);
  }, [checkins, todayCheckin, drive]);

  // Yesterday's value, asked about once in the morning if no evidence line was written. Snapshot so it doesn't vanish mid-typing.
  const [yesterday, setYesterday] = useState<Checkin | null>(null);
  useEffect(() => {
    if (yesterday || !checkins) return;
    const y = checkins.find((c) => c.localDate === addDays(today, -1));
    if (y?.floorValueId && !y.evidence) setYesterday(y);
  }, [checkins, today, yesterday]);

  // The most recent unanswered Sail from the last few days, asked about once at the next check-in.
  const openSail: Entry | undefined = useMemo(
    () => [...(entries ?? [])].filter((e) => e.sail && !e.deletedAt && e.localDate < today && e.localDate >= addDays(today, -3)).sort((a, b) => (a.localDate < b.localDate ? 1 : -1)).find((e) => !e.sailResult),
    [entries, today],
  );
  const [sailEntry, setSailEntry] = useState<Entry | null>(null);
  useEffect(() => { if (openSail && !sailEntry) setSailEntry(openSail); }, [openSail, sailEntry]);

  // A setback: the latest Sail from the last few days didn't land. "Values, not outcomes" fits that morning.
  const setback = useMemo(() => {
    const last = [...(entries ?? [])].filter((e) => e.sail && !e.deletedAt && e.localDate < today && e.localDate >= addDays(today, -3)).sort((a, b) => (a.localDate < b.localDate ? 1 : -1))[0];
    return last?.sailResult === "not";
  }, [entries, today]);

  const suggestion = useMemo(
    () => (drive != null && peace != null && entries ? suggestPractice({ drive, peace, voice, today, entries, mid, unsureSails: unsureSails(entries, addDays(today, -14)), setback, hasValues: values.length > 0, countedDays: profile?.countedDays, hasEnough: Object.values(profile?.enough ?? {}).some(Boolean) }) : null),
    [drive, peace, voice, entries, today, mid, profile, setback, values],
  );
  const base = aiPick ?? suggestion;
  const activePractice = practice ?? base?.practice ?? "past_self";
  const p = PRACTICES[activePractice];

  const monthPrefix = today.slice(0, 7);
  const daysPracticed = useMemo(() => new Set((checkins ?? []).filter((c) => c.localDate.startsWith(monthPrefix)).map((c) => c.localDate)).size, [checkins, monthPrefix]);

  if (!profile || !checkins || !entries || !allValues || drive == null || peace == null) return <div aria-busy="true" />;
  const invite = values.length === 0 && !profile.valuesInviteDismissed ? <ValuesInvite /> : null;
  const carried = values.find((v) => v.id === floorValueId);
  const sailValueOn = !!sail.trim() && values.length > 0;

  const tideLabel = daysPracticed === 0 ? "The tide is out. No pressure." : `${daysPracticed} ${daysPracticed === 1 ? "day" : "days"} practiced this month`;
  const tide = <TideLine level={daysPracticed / daysInMonth(today)} label={tideLabel} />;

  const shownFields = p.fields.filter((f) => f.kind !== "value" || values.length > 0);
  const requiredOk = shownFields.every((f) => !f.required || (fields[f.key] ?? "").trim());

  const beginPractice = () => {
    setPractice(null);
    setFields({});
    setTags([]);
    setSail("");
    setFloor("");
    setSailValue(undefined);
    setChoosing(false);
  };

  async function finishShort() {
    setSaving(true);
    const c = await saveCheckin(today, drive!, peace!, voice);
    if (floorValueId !== c.floorValueId) await setDayValues(c.id, { floorValueId });
    const line = (fields.line ?? "").trim();
    await saveEntry({ localDate: today, practice: "short_day", prompt: PRACTICES.short_day.prompt, fields: { line }, body: line, tags: [], sail: sail.trim() || undefined, checkinId: c.id });
    setResurfaced(null);
    setCheckinId(c.id);
    setPractice("short_day");
    setSaving(false);
    setStep("close");
  }

  async function finish(skipIntention = false) {
    setSaving(true);
    const c = todayCheckin && !adding ? todayCheckin : await saveCheckin(today, drive!, peace!, voice);
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
      floor: skipIntention || values.length ? undefined : floor.trim() || undefined,
      sailValue: skipIntention || !sail.trim() ? undefined : sailValue,
      checkinId: c.id,
      resurfaceOn: p.checkBack ? addMonths(today, p.checkBack[checkBack].months) : undefined,
    });
    if (!skipIntention && values.length && floorValueId !== c.floorValueId) await setDayValues(c.id, { floorValueId });
    setDistress(suggestsDistress([...Object.values(clean), sail, floor]));
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
          <p className="mt-2 text-muted">Drive {todayCheckin?.drive} · Peace {todayCheckin?.peace}{todayCheckin?.voice != null && ` · Voice ${todayCheckin.voice}`}. That's enough for today, though you're welcome to add more.</p>
        </div>
        {tide}
        {todayCheckin && values.length > 0 && <EvidenceCard key={todayCheckin.id} checkin={todayCheckin} values={values} when="today" />}
        {invite}
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
        {distress && (
          <aside role="note" className="rounded-2xl border border-brass bg-surface p-5">
            <p className="font-serif text-lg leading-relaxed">Some of what you wrote sounded heavy. Ballast isn't a therapist and can't be there the way a person can. If this is more than a rough patch, please reach out to someone you trust, or a crisis line. In the US you can call or text 988.</p>
          </aside>
        )}
        {checkinId && values.length > 0 && new Date().getHours() >= 17 && <CloseEvidence checkinId={checkinId} checkins={checkins} values={values} />}
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
        {invite}
        <Nudges />
        {sailEntry && <SailCheck entry={sailEntry} today={today} answer={sailAnswer} carried={values.length ? allValues.find((v) => v.id === checkins.find((c) => c.localDate === sailEntry.localDate)?.floorValueId) : undefined} onAnswer={(r) => { setSailAnswer(r); void setSailResult(sailEntry.id, r); }} onAdvocate={(t) => void setSailAdvocate(sailEntry.id, t)} />}
        {yesterday && values.length > 0 && <EvidenceCard key={yesterday.id} checkin={yesterday} values={values} when="yesterday" />}
        <DialSlider label="Drive" hint="How hungry, focused and in motion do you feel?" low="Idle" high="Charging" value={drive} onChange={setDrive} ghost={todayCheckin ? undefined : lastCheckin?.drive} />
        <DialSlider label="Peace" hint="How settled, present and “enough” do you feel?" low="Restless" high="Settled" value={peace} onChange={setPeace} ghost={todayCheckin ? undefined : lastCheckin?.peace} />
        <DialSlider label="Voice" hint="How have you been talking to yourself: more critic, or more advocate?" low="Critic" high="Advocate" value={voice} onChange={setVoice} ghost={todayCheckin ? undefined : lastCheckin?.voice} />
        <p className="text-sm text-muted">These measure how today feels, not how well you're doing. There's no right answer, only an honest one.</p>
        <button className="btn w-full sm:w-auto" onClick={async () => {
          await saveCheckin(today, drive, peace, voice);
          setStep("breath");
          // Ask Claude while the breath gate runs; if it doesn't answer in time, the rule-based pick stands.
          if (profile.aiConsent) {
            const avail = availablePractices({ countedDays: profile.countedDays, hasEnough: Object.values(profile.enough).some(Boolean), hasValues: values.length > 0 });
            void callAI<{ practice: PracticeId; reason: string }>("/api/ai/next-practice", {
              drive, peace, voice, setback,
              days: checkins.slice(-14).map((c) => ({ date: c.localDate, drive: c.drive, peace: c.peace, voice: c.voice, peaceAfter: c.peaceAfter, driveAfter: c.driveAfter })),
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
        <button className="btn-quiet block rounded-full text-[15px]" onClick={() => { setFields({}); setSail(""); setStep("short"); }}>
          Short on time? Do the 2-minute version
        </button>
      </div>
    );
  }

  // ───── short day: dials + one line, no breath or full practice
  if (step === "short") {
    return (
      <div className="fade-in space-y-7">
        <div>
          <h1 className="font-serif text-3xl">Short day</h1>
          <p className="mt-2 text-muted">Drive {drive} · Peace {peace} · Voice {voice}. One line is enough. It still counts.</p>
        </div>
        <div>
          <label htmlFor="f-line" className="mb-2 block text-[15px]">{PRACTICES.short_day.prompt}</label>
          <input id="f-line" className="field serif" value={fields.line ?? ""} onChange={(e) => setFields({ line: e.target.value })} placeholder={PRACTICES.short_day.fields[0].placeholder} />
        </div>
        <div>
          <label htmlFor="sail" className="mb-2 block text-[15px]">Sail: what I'm reaching for today <span className="text-muted">(optional)</span></label>
          <input id="sail" className="field serif" value={sail} onChange={(e) => setSail(e.target.value)} placeholder="Today I'm going for…" />
        </div>
        {values.length > 0 && <FloorValue values={values} value={floorValueId} onChange={setFloorValueId} carried={carried} />}
        <div className="flex items-center gap-3">
          <button className="btn" onClick={() => void finishShort()} disabled={saving || !(fields.line ?? "").trim()}>{saving ? "Saving…" : "Close today"}</button>
          <button className="btn-quiet rounded-full" onClick={() => setStep("dials")}>Back</button>
        </div>
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
              {availablePractices({ countedDays: profile.countedDays, hasEnough: Object.values(profile.enough).some(Boolean), hasValues: values.length > 0 }).map((id) => (
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

        {p.showValues && values.length > 0 && (
          <ul className="space-y-1 rounded-2xl border border-line bg-surface p-4 text-[15px] leading-relaxed" aria-label="Your values">
            {values.map((v) => (
              <li key={v.id}><span className="font-medium">{v.name}</span>{v.definition && <span className="font-serif text-muted">: {v.definition}</span>}</li>
            ))}
          </ul>
        )}

        {shownFields.map((f) => f.kind === "value" ? (
          <div key={p.id + f.key}>
            <p id={`f-${f.key}`} className="mb-2 text-[15px]">{f.label} {!f.required && <span className="text-muted">(optional)</span>}</p>
            <ValueChips values={[]} extra={values.map((v) => ({ id: v.name, name: v.name }))} value={fields[f.key] || undefined} label={f.label} onChange={(name) => setFields({ ...fields, [f.key]: name ?? "" })} />
          </div>
        ) : (
          <div key={p.id + f.key}>
            <label htmlFor={`f-${f.key}`} className="mb-2 block text-[15px]">
              {f.label} {!f.required && <span className="text-muted">(optional)</span>}
            </label>
            {f.long ? (
              <textarea id={`f-${f.key}`} rows={6} className="field serif" placeholder={f.placeholder?.replace("{name}", profile.name || "You")} value={fields[f.key] ?? ""} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })} />
            ) : (
              <input id={`f-${f.key}`} className="field serif" placeholder={f.placeholder?.replace("{name}", profile.name || "You")} value={fields[f.key] ?? ""} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })} />
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
        <p className="mt-2 text-muted">{values.length ? "Your values are the ballast. Your goals are the sails. Both optional." : "One line for what you're reaching for, and one for what stays true either way. Both optional."}</p>
      </div>
      {values.length > 0 && <FloorValue values={values} value={floorValueId} onChange={setFloorValueId} carried={carried} />}
      <div>
        <label htmlFor="sail" className="mb-2 block text-[15px]">Sail: what I'm reaching for today</label>
        <input id="sail" className="field serif" value={sail} onChange={(e) => setSail(e.target.value)} placeholder="Today I'm going for…" />
      </div>
      {sailValueOn && (
        <div>
          <p id="sail-value" className="mb-2 text-[15px]">Which value does this serve?</p>
          <ValueChips values={values} value={sailValue} onChange={setSailValue} label="Which value does this Sail serve" extra={[{ id: "unsure", name: "Not sure" }]} />
          {sailValue === "unsure" && (
            <p className="mt-2 text-sm text-muted">
              That's fine. Not every goal has to justify itself.
              {unsureSails(entries, addDays(today, -14)) >= 1 && " If it keeps coming up, “Whose hunger is this?” can help sort your own ambitions from borrowed ones."}
            </p>
          )}
        </div>
      )}
      {values.length === 0 && (
        <div>
          <label htmlFor="floor" className="mb-2 block text-[15px]">Floor: what stays true even if today goes badly</label>
          <input id="floor" className="field serif" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Whatever happens, I still have…" />
        </div>
      )}
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

const SAIL_CHOICES: [SailResult, string][] = [["filled", "Filled"], ["partly", "Partly"], ["not", "Not this time"]];

/** Closes the loop on the last Sail. On a miss, the Floor written that day comes back, so a miss lands softly. */
function SailCheck({ entry, today, answer, carried, onAnswer, onAdvocate }: { entry: Entry; today: string; answer: SailResult | null; carried?: Value; onAnswer: (r: SailResult) => void; onAdvocate: (text: string) => void }) {
  const [advocate, setAdvocate] = useState(entry.sailAdvocate ?? "");
  const [kept, setKept] = useState(false);
  const when = entry.localDate === addDays(today, -1) ? "Yesterday's Sail" : "Your last Sail";
  return (
    <section aria-labelledby="sail-check" className="space-y-3 rounded-2xl border border-line p-5">
      <p id="sail-check" className="text-sm text-muted">{when}</p>
      <p className="font-serif text-lg leading-relaxed">{entry.sail}</p>
      <div role="radiogroup" aria-labelledby="sail-check" className="flex flex-wrap gap-2">
        {SAIL_CHOICES.map(([r, label]) => (
          <button key={r} role="radio" aria-checked={answer === r} onClick={() => onAnswer(r)} className={`min-h-[44px] rounded-full border px-4 text-sm transition-colors duration-calm ${answer === r ? "border-deep bg-deep text-on-deep" : "border-line hover:border-muted"}`}>
            {label}
          </button>
        ))}
      </div>
      {answer === "filled" && <p className="text-[15px] text-muted">Noted. That's momentum.</p>}
      {answer && answer !== "filled" && (
        <p className="text-[15px] text-muted">
          {entry.floor ? <>Your Floor held either way: <span className="font-serif text-ink">{entry.floor}</span></>
            : carried ? <>The result moves. The value holds. You still carried <span className="font-serif text-ink">{carried.name}</span>{carried.definition ? <>: {carried.definition}</> : "."}</>
            : "Noted. A Sail is a direction, not a verdict."}
        </p>
      )}
      {answer && answer !== "filled" && (
        <div>
          <label htmlFor="sail-advocate" className="mb-2 block text-[15px]">What would your advocate say? <span className="text-muted">(optional)</span></label>
          <input id="sail-advocate" className="field serif" value={advocate} placeholder="You moved it forward. Here's what's next…"
            onChange={(e) => { setAdvocate(e.target.value); setKept(false); }}
            onBlur={() => { if (advocate.trim() !== (entry.sailAdvocate ?? "")) { onAdvocate(advocate.trim()); setKept(true); } }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
          {kept && <p className="mt-1 text-sm text-muted" aria-live="polite">Kept.</p>}
        </div>
      )}
    </section>
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

/** "Today I carry: Presence", with their own definition beneath. */
function FloorValue({ values, value, onChange, carried }: { values: Value[]; value?: string; onChange: (id: string | undefined) => void; carried?: Value }) {
  return (
    <div>
      <p className="mb-2 text-[15px]">Floor: today I carry{carried ? <span className="font-medium"> {carried.name}</span> : "…"}</p>
      <ValueChips values={values} value={value} onChange={onChange} label="Today I carry" />
      {carried?.definition && <p className="mt-2 font-serif text-[17px] leading-relaxed text-muted">{carried.definition}</p>}
    </div>
  );
}

/** At close in the evening, the evidence line is right there. Reads the fresh check-in so the Floor value is current. */
function CloseEvidence({ checkinId, checkins, values }: { checkinId: string; checkins: Checkin[]; values: Value[] }) {
  const c = checkins.find((x) => x.id === checkinId);
  if (!c) return null;
  return <EvidenceCard key={c.id + (c.floorValueId ?? "")} checkin={c} values={values} when="today" />;
}
