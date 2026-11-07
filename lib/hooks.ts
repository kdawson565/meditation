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
export function useSavedCards() {
  return useLiveQuery(async () => (await db.savedCards.toArray()).filter((s) => !s.deletedAt).sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1)), []);
}
export function useAiOutput(id: string | null) {
  return useLiveQuery(async () => (id ? ((await db.aiOutputs.get(id)) ?? null) : null), [id]);
}
export function useAiOutputs(kind: "bearing" | "ask" | "season") {
  return useLiveQuery(async () => (await db.aiOutputs.where("kind").equals(kind).toArray()).filter((o) => !o.deletedAt).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)), [kind]);
}
export function useValues() {
  return useLiveQuery(() => db.values.orderBy("position").toArray(), []);
}
