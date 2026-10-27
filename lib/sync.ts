import { db } from "./db";
import { supabase } from "./supabase";
import type { Table } from "dexie";
import type { Audit, Checkin, Entry, LedgerItem, Profile, Reflection, Thank } from "./types";

/**
 * Local-first sync. Everything is written to IndexedDB first (so the ritual works offline),
 * rows are flagged dirty, and pushed to Supabase when signed in and online. Ids are client-generated,
 * so retries are idempotent (upsert). Conflict rule: newest updated_at wins.
 */

type SB = NonNullable<ReturnType<typeof supabase>>;
interface Mapper<T extends { id: string; updatedAt: string; dirty: 0 | 1 }> {
  name: string;
  table: Table<T, string>;
  toRow: (x: T, userId: string) => Record<string, unknown>;
  fromRow: (r: Record<string, any>) => T; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const phase2: Mapper<any>[] = [ // eslint-disable-line @typescript-eslint/no-explicit-any
  {
    name: "ledger_items", table: db.ledger,
    toRow: (x: LedgerItem, u) => ({ id: x.id, user_id: u, kind: x.kind, text: x.text, want_id: x.wantId ?? null, arrived_on: x.arrivedOn ?? null, created_at: x.createdAt, updated_at: x.updatedAt, deleted_at: x.deletedAt ?? null }),
    fromRow: (r): LedgerItem => ({ id: r.id, kind: r.kind, text: r.text, wantId: r.want_id ?? undefined, arrivedOn: r.arrived_on ?? undefined, createdAt: r.created_at, updatedAt: r.updated_at, deletedAt: r.deleted_at ?? undefined, dirty: 0 }),
  },
  {
    name: "audits", table: db.audits,
    toRow: (x: Audit, u) => ({ id: x.id, user_id: u, want_id: x.wantId, days: x.days, due_on: x.dueOn, glow: x.glow ?? null, note: x.note ?? null, answered_at: x.answeredAt ?? null, created_at: x.createdAt, updated_at: x.updatedAt }),
    fromRow: (r): Audit => ({ id: r.id, wantId: r.want_id, days: r.days, dueOn: r.due_on, glow: r.glow ?? undefined, note: r.note ?? undefined, answeredAt: r.answered_at ?? undefined, createdAt: r.created_at, updatedAt: r.updated_at, dirty: 0 }),
  },
  {
    name: "thanks", table: db.thanks,
    toRow: (x: Thank, u) => ({ id: x.id, user_id: u, person: x.person, reason: x.reason, status: x.status, draft: x.draft ?? null, sent_at: x.sentAt ?? null, created_at: x.createdAt, updated_at: x.updatedAt, deleted_at: x.deletedAt ?? null }),
    fromRow: (r): Thank => ({ id: r.id, person: r.person, reason: r.reason, status: r.status, draft: r.draft ?? undefined, sentAt: r.sent_at ?? undefined, createdAt: r.created_at, updatedAt: r.updated_at, deletedAt: r.deleted_at ?? undefined, dirty: 0 }),
  },
  {
    name: "reflections", table: db.reflections,
    toRow: (x: Reflection, u) => ({ id: x.id, user_id: u, week_start: x.weekStart, body: x.body, source: x.source, created_at: x.createdAt, updated_at: x.updatedAt }),
    fromRow: (r): Reflection => ({ id: r.id, weekStart: r.week_start, body: r.body, source: r.source, createdAt: r.created_at, updatedAt: r.updated_at, dirty: 0 }),
  },
];

async function pushMapped(sb: SB, userId: string, m: Mapper<any>) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const rows = await m.table.where("dirty").equals(1).toArray();
  if (!rows.length) return;
  const { error } = await sb.from(m.name).upsert(rows.map((r) => m.toRow(r, userId)), { onConflict: "id" });
  if (error) throw error;
  await m.table.bulkPut(rows.map((r) => ({ ...r, dirty: 0 as const })));
}

async function pullMapped(sb: SB, since: string, m: Mapper<any>) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { data, error } = await sb.from(m.name).select("*").gt("updated_at", since);
  if (error) throw error;
  for (const r of data ?? []) {
    const local = await m.table.get(r.id);
    if (local && local.updatedAt >= r.updated_at) continue;
    await m.table.put(m.fromRow(r));
  }
}

let running = false;

const toRow = {
  profile: (p: Profile, userId: string) => ({
    id: userId, name: p.name, ritual_time: p.ritualTime, enough: p.enough, counted_days: p.countedDays,
    notify: p.notify, ai_consent: p.aiConsent, theme: p.theme, timezone: p.timezone, updated_at: p.updatedAt,
  }),
  checkin: (c: Checkin, userId: string) => ({
    id: c.id, user_id: userId, local_date: c.localDate, drive: c.drive, peace: c.peace,
    peace_after: c.peaceAfter ?? null, drive_after: c.driveAfter ?? null, created_at: c.createdAt, updated_at: c.updatedAt,
  }),
  entry: (e: Entry, userId: string) => ({
    id: e.id, user_id: userId, local_date: e.localDate, practice: e.practice, prompt: e.prompt,
    fields: e.fields, body: e.body, tags: e.tags, sail: e.sail ?? null, floor: e.floor ?? null,
    checkin_id: e.checkinId ?? null, resurface_on: e.resurfaceOn ?? null, created_at: e.createdAt,
    updated_at: e.updatedAt, deleted_at: e.deletedAt ?? null,
  }),
};

export async function syncNow(): Promise<{ ok: boolean; message: string }> {
  const sb = supabase();
  if (!sb) return { ok: false, message: "Cloud sync isn't configured." };
  if (typeof navigator !== "undefined" && !navigator.onLine) return { ok: false, message: "Offline. Will sync later." };
  if (running) return { ok: true, message: "Already syncing." };
  running = true;
  try {
    const { data } = await sb.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return { ok: false, message: "Not signed in." };

    // push
    const [prof, cks, ens] = await Promise.all([
      db.profile.get("me"),
      db.checkins.where("dirty").equals(1).toArray(),
      db.entries.where("dirty").equals(1).toArray(),
    ]);
    if (prof && prof.dirty) {
      const { error } = await sb.from("profiles").upsert(toRow.profile(prof, userId));
      if (error) throw error;
      await db.profile.update("me", { dirty: 0 });
    }
    if (cks.length) {
      const { error } = await sb.from("checkins").upsert(cks.map((c) => toRow.checkin(c, userId)), { onConflict: "id" });
      if (error) throw error;
      await db.checkins.bulkPut(cks.map((c) => ({ ...c, dirty: 0 as const })));
    }
    if (ens.length) {
      const { error } = await sb.from("entries").upsert(ens.map((e) => toRow.entry(e, userId)), { onConflict: "id" });
      if (error) throw error;
      await db.entries.bulkPut(ens.map((e) => ({ ...e, dirty: 0 as const })));
    }

    for (const m of phase2) await pushMapped(sb, userId, m); // ledger before audits (foreign key)

    // pull
    const since = (await db.meta.get("lastPull"))?.value ?? "1970-01-01T00:00:00Z";
    const pulledAt = new Date().toISOString();
    const [rc, re, rp] = await Promise.all([
      sb.from("checkins").select("*").gt("updated_at", since),
      sb.from("entries").select("*").gt("updated_at", since),
      sb.from("profiles").select("*").eq("id", userId).maybeSingle(),
    ]);
    if (rc.error) throw rc.error;
    if (re.error) throw re.error;

    for (const r of rc.data ?? []) {
      const local = await db.checkins.get(r.id);
      if (local && local.updatedAt >= r.updated_at) continue;
      await db.checkins.put({
        id: r.id, localDate: r.local_date, drive: r.drive, peace: r.peace, peaceAfter: r.peace_after ?? undefined, driveAfter: r.drive_after ?? undefined,
        createdAt: r.created_at, updatedAt: r.updated_at, dirty: 0,
      });
    }
    for (const r of re.data ?? []) {
      const local = await db.entries.get(r.id);
      if (local && local.updatedAt >= r.updated_at) continue;
      await db.entries.put({
        id: r.id, localDate: r.local_date, practice: r.practice, prompt: r.prompt, fields: r.fields ?? {},
        body: r.body, tags: r.tags ?? [], sail: r.sail ?? undefined, floor: r.floor ?? undefined,
        checkinId: r.checkin_id ?? undefined, resurfaceOn: r.resurface_on ?? undefined,
        createdAt: r.created_at, updatedAt: r.updated_at, deletedAt: r.deleted_at ?? undefined, dirty: 0,
      });
    }
    for (const m of phase2) await pullMapped(sb, since, m);
    const remoteP = rp.data;
    const localP = await db.profile.get("me");
    if (remoteP && (!localP || localP.updatedAt < remoteP.updated_at)) {
      await db.profile.put({
        id: "me", name: remoteP.name, ritualTime: remoteP.ritual_time, enough: remoteP.enough,
        countedDays: remoteP.counted_days, notify: remoteP.notify, aiConsent: remoteP.ai_consent,
        theme: remoteP.theme, timezone: remoteP.timezone ?? "UTC", createdAt: remoteP.created_at, updatedAt: remoteP.updated_at, dirty: 0,
      });
    }
    await db.meta.put({ key: "lastPull", value: pulledAt });
    return { ok: true, message: "Synced." };
  } catch (e: unknown) {
    return { ok: false, message: e instanceof Error ? e.message : "Sync failed." };
  } finally {
    running = false;
  }
}

let timer: ReturnType<typeof setTimeout> | null = null;
export function scheduleSync() {
  if (typeof window === "undefined" || !supabase()) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), 1500);
}
