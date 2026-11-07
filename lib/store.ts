import { db, now } from "./db";
import { scheduleSync } from "./sync";
import { uid } from "./dates";
import type { AiOutput, PracticeId, Audit, Checkin, Entry, EnoughLine, LedgerItem, Profile, Reflection, SailResult, Thank, Value } from "./types";
import { addDays, todayStr } from "./dates";

export const emptyEnough: EnoughLine = { money: "", health: "", relationships: "", time: "" };

export async function saveProfile(p: Partial<Profile>) {
  const existing = await db.profile.get("me");
  const t = now();
  const next: Profile = {
    id: "me",
    name: "",
    ritualTime: "08:00",
    enough: emptyEnough,
    countedDays: false,
    notify: false,
    aiConsent: false,
    theme: "system",
    lenses: [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    createdAt: existing?.createdAt ?? t,
    ...existing,
    ...p,
    updatedAt: t,
    dirty: 1,
  };
  await db.profile.put(next);
  scheduleSync();
  return next;
}

export async function saveCheckin(localDate: string, drive: number, peace: number, voice?: number): Promise<Checkin> {
  const t = now();
  const existing = await db.checkins.where("localDate").equals(localDate).first();
  const c: Checkin = existing
    ? { ...existing, drive, peace, voice: voice ?? existing.voice, updatedAt: t, dirty: 1 }
    : { id: uid(), localDate, drive, peace, voice, createdAt: t, updatedAt: t, dirty: 1 };
  await db.checkins.put(c);
  scheduleSync();
  return c;
}

export async function setAfter(checkinId: string, patch: { peaceAfter?: number; driveAfter?: number }) {
  await db.checkins.update(checkinId, { ...patch, updatedAt: now(), dirty: 1 });
  scheduleSync();
}

export async function saveEntry(e: Omit<Entry, "id" | "createdAt" | "updatedAt" | "dirty">): Promise<Entry> {
  const t = now();
  const entry: Entry = { ...e, id: uid(), createdAt: t, updatedAt: t, dirty: 1 };
  await db.entries.put(entry);
  scheduleSync();
  return entry;
}

export async function setSailResult(entryId: string, sailResult: SailResult) {
  await db.entries.update(entryId, { sailResult, updatedAt: now(), dirty: 1 });
  scheduleSync();
}

export async function setSailAdvocate(entryId: string, text: string) {
  await db.entries.update(entryId, { sailAdvocate: text || undefined, updatedAt: now(), dirty: 1 });
  scheduleSync();
}

export async function deleteEntry(id: string) {
  await db.entries.update(id, { deletedAt: now(), updatedAt: now(), dirty: 1 });
  scheduleSync();
}

// ───── Ledger
export async function addLedgerItem(kind: "want" | "asset", text: string, wantId?: string) {
  const t = now();
  const item: LedgerItem = { id: uid(), kind, text: text.trim(), wantId, createdAt: t, updatedAt: t, dirty: 1 };
  await db.ledger.put(item);
  scheduleSync();
  return item;
}

/** A want is reached: we never delete it. We record the day and schedule two Arrival Audits. */
export async function markWantArrived(id: string) {
  const t = now();
  const day = todayStr();
  await db.ledger.update(id, { arrivedOn: day, updatedAt: t, dirty: 1 });
  const audits: Audit[] = ([30, 90] as const).map((days) => ({ id: uid(), wantId: id, days, dueOn: addDays(day, days), createdAt: t, updatedAt: t, dirty: 1 }));
  await db.audits.bulkPut(audits);
  scheduleSync();
}

export async function answerAudit(id: string, glow: number, note: string) {
  const t = now();
  await db.audits.update(id, { glow, note: note.trim() || undefined, answeredAt: t, updatedAt: t, dirty: 1 });
  scheduleSync();
}

export async function removeLedgerItem(id: string) {
  // only assets and never-reached wants can be removed, and only by the person who wrote them (soft delete, so sync can propagate)
  await db.ledger.update(id, { deletedAt: now(), updatedAt: now(), dirty: 1 });
  scheduleSync();
}

// ───── Thanks
export async function addThank(person: string, reason: string) {
  const t = now();
  const th: Thank = { id: uid(), person: person.trim(), reason: reason.trim(), status: "owed", createdAt: t, updatedAt: t, dirty: 1 };
  await db.thanks.put(th);
  scheduleSync();
  return th;
}

export async function updateThank(id: string, patch: Partial<Thank>) {
  await db.thanks.update(id, { ...patch, updatedAt: now(), dirty: 1 });
  scheduleSync();
}

// ───── Reflections
export async function saveReflection(weekStart: string, body: string, source: "ai" | "local", extra: { cardIds?: string[]; practiceId?: PracticeId } = {}) {
  const t = now();
  const existing = await db.reflections.where("weekStart").equals(weekStart).first();
  const fields = { body, source, cardIds: extra.cardIds ?? [], practiceId: extra.practiceId };
  const r: Reflection = existing ? { ...existing, ...fields, updatedAt: t, dirty: 1 } : { id: uid(), weekStart, ...fields, createdAt: t, updatedAt: t, dirty: 1 };
  await db.reflections.put(r);
  scheduleSync();
  return r;
}

// ───── Values
/**
 * Saves the chosen values in order. Matching is by name, so re-choosing a value keeps its id (and its history).
 * Values not chosen are kept with core=false, never deleted, so past days can still name them.
 */
export async function saveValues(chosen: { name: string; definition: string; custom: boolean }[]) {
  const t = now();
  const all = await db.values.toArray();
  const byName = new Map(all.map((v) => [v.name.trim().toLowerCase(), v]));
  const keep = new Set<string>();
  const next: Value[] = chosen.map((c, i) => {
    const hit = byName.get(c.name.trim().toLowerCase());
    const v: Value = hit
      ? { ...hit, name: c.name.trim(), definition: c.definition.trim(), position: i, core: true, updatedAt: t, dirty: 1 }
      : { id: uid(), name: c.name.trim(), definition: c.definition.trim(), position: i, core: true, custom: c.custom, createdAt: t, updatedAt: t, dirty: 1 };
    keep.add(v.id);
    return v;
  });
  const dropped = all.filter((v) => v.core && !keep.has(v.id)).map((v) => ({ ...v, core: false, updatedAt: t, dirty: 1 as const }));
  await db.values.bulkPut([...next, ...dropped]);
  scheduleSync();
  return next;
}

export async function setValueDefinition(id: string, definition: string) {
  await db.values.update(id, { definition: definition.trim(), updatedAt: now(), dirty: 1 });
  scheduleSync();
}

/** The day's Floor value and evidence line live on the day's check-in. */
export async function setDayValues(checkinId: string, patch: { floorValueId?: string; evidence?: string }) {
  const clean: Partial<Checkin> = { ...patch };
  if (patch.evidence !== undefined) clean.evidence = patch.evidence.trim() || undefined;
  await db.checkins.update(checkinId, { ...clean, updatedAt: now(), dirty: 1 });
  scheduleSync();
}

/** Save or unsave a Library card. Unsaving keeps a tombstone so other devices learn about it. */
export async function setCardSaved(cardId: string, saved: boolean) {
  const t = now();
  const existing = await db.savedCards.get(cardId);
  if (saved) await db.savedCards.put({ id: cardId, savedAt: existing && !existing.deletedAt ? existing.savedAt : t, createdAt: existing?.createdAt ?? t, updatedAt: t, dirty: 1 });
  else if (existing) await db.savedCards.put({ ...existing, deletedAt: t, updatedAt: t, dirty: 1 });
  scheduleSync();
}

/** Keep something the AI wrote. Same id overwrites (an Ask session grows turn by turn). */
export async function saveAiOutput(o: Omit<AiOutput, "createdAt" | "updatedAt" | "dirty">) {
  const t = now();
  const existing = await db.aiOutputs.get(o.id);
  await db.aiOutputs.put({ ...o, createdAt: existing?.createdAt ?? t, updatedAt: t, dirty: 1 });
  scheduleSync();
}
