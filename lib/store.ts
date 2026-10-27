import { db, now } from "./db";
import { scheduleSync } from "./sync";
import { uid } from "./dates";
import type { Audit, Checkin, Entry, EnoughLine, LedgerItem, Profile, Reflection, Thank } from "./types";
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

export async function saveCheckin(localDate: string, drive: number, peace: number): Promise<Checkin> {
  const t = now();
  const existing = await db.checkins.where("localDate").equals(localDate).first();
  const c: Checkin = existing
    ? { ...existing, drive, peace, updatedAt: t, dirty: 1 }
    : { id: uid(), localDate, drive, peace, createdAt: t, updatedAt: t, dirty: 1 };
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
export async function saveReflection(weekStart: string, body: string, source: "ai" | "local") {
  const t = now();
  const existing = await db.reflections.where("weekStart").equals(weekStart).first();
  const r: Reflection = existing ? { ...existing, body, source, updatedAt: t, dirty: 1 } : { id: uid(), weekStart, body, source, createdAt: t, updatedAt: t, dirty: 1 };
  await db.reflections.put(r);
  scheduleSync();
  return r;
}
