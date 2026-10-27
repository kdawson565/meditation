"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";

/** undefined = still loading, null = none */
export function useProfile() {
  return useLiveQuery(async () => (await db.profile.get("me")) ?? null, []);
}
export function useCheckins() {
  return useLiveQuery(() => db.checkins.orderBy("localDate").toArray(), []);
}
export function useEntries() {
  return useLiveQuery(async () => (await db.entries.orderBy("localDate").toArray()).filter((e) => !e.deletedAt), []);
}
