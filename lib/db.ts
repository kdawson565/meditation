import Dexie, { type Table } from "dexie";
import type { AiOutput, Audit, Checkin, Entry, LedgerItem, Profile, Reflection, Resurfaced, SavedCard, Thank, Value } from "./types";

class BallastDB extends Dexie {
  profile!: Table<Profile, string>;
  checkins!: Table<Checkin, string>;
  entries!: Table<Entry, string>;
  resurfaced!: Table<Resurfaced, string>;
  ledger!: Table<LedgerItem, string>;
  audits!: Table<Audit, string>;
  thanks!: Table<Thank, string>;
  reflections!: Table<Reflection, string>;
  values!: Table<Value, string>;
  savedCards!: Table<SavedCard, string>;
  aiOutputs!: Table<AiOutput, string>;
  meta!: Table<{ key: string; value: string }, string>;

  constructor() {
    super("ballast");
    this.version(1).stores({
      profile: "id",
      checkins: "id, localDate, dirty",
      entries: "id, localDate, practice, resurfaceOn, dirty",
      resurfaced: "entryId",
      meta: "key",
    });
    this.version(2).stores({
      ledger: "id, kind, wantId, dirty",
      audits: "id, wantId, dueOn, dirty",
      thanks: "id, status, dirty",
      reflections: "id, weekStart, dirty",
    });
    // v3 adds values. Existing tables are untouched; new fields on checkins/entries are optional.
    this.version(3).stores({
      values: "id, position, dirty",
    });
    // v4: Library cards you saved
    this.version(4).stores({
      savedCards: "id, dirty",
    });
    // v5: what the AI wrote (Bearings, Ask Ballast sessions, season reviews)
    this.version(5).stores({
      aiOutputs: "id, kind, dirty",
    });
  }
}

export const db = new BallastDB();

export const now = () => new Date().toISOString();

export async function wipeLocal() {
  await Promise.all([db.profile.clear(), db.checkins.clear(), db.entries.clear(), db.resurfaced.clear(), db.meta.clear(), db.ledger.clear(), db.audits.clear(), db.thanks.clear(), db.reflections.clear(), db.values.clear(), db.savedCards.clear(), db.aiOutputs.clear()]);
}
