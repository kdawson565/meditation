"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { parseDate, todayStr, weekStartOf } from "@/lib/dates";

/** Quiet, dismissible-by-ignoring text prompts. No badges, no counts, no red dots. */
export default function Nudges() {
  const state = useLiveQuery(async () => {
    const thanks = (await db.thanks.toArray()).filter((t) => !t.deletedAt);
    const reflections = await db.reflections.toArray();
    const today = todayStr();
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const owed = thanks.filter((t) => t.status === "owed");
    const sentThisWeek = thanks.some((t) => t.status === "sent" && (t.sentAt ?? "") > weekAgo);
    const checkinsThisWeek = await db.checkins.where("localDate").aboveOrEqual(weekStartOf(today)).count();
    return {
      thank: owed.length > 0 && !sentThisWeek ? owed.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))[0].person : null,
      reflect: parseDate(today).getDay() === 0 && checkinsThisWeek > 0 && !reflections.some((r) => r.weekStart === weekStartOf(today)),
    };
  }, []);
  if (!state || (!state.thank && !state.reflect)) return null;
  return (
    <div className="space-y-2 text-[15px]">
      {state.reflect && (
        <p>It's Sunday. <Link href="/reflection" className="text-brass-ink underline underline-offset-4">Your weekly reflection is ready to write.</Link></p>
      )}
      {state.thank && (
        <p>{state.thank} is still owed a thank-you. <Link href="/thanks" className="text-brass-ink underline underline-offset-4">Send one this week?</Link></p>
      )}
    </div>
  );
}
