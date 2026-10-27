import webpush from "web-push";
import { adminClient, pushConfigured } from "@/lib/push-server";

export const dynamic = "force-dynamic";

const LINES = [
  "A quiet few minutes, whenever you're ready.",
  "The tide is in. Come take a look.",
  "Two dials and one line. That's all today needs.",
  "Whenever you have a moment to feel what you already have.",
];

/** Local wall-clock parts for a time zone. */
function localParts(now: Date, tz: string) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

/** Runs every 15 minutes (see vercel.json). Sends one reminder per user per local day, within 15 minutes after their ritual time, and only if they haven't checked in yet. */
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!pushConfigured()) return Response.json({ error: "not_configured" }, { status: 501 });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);

  const admin = adminClient()!;
  const { data: subs, error } = await admin.from("push_subscriptions").select("*");
  if (error) return Response.json({ error: "db" }, { status: 500 });

  const now = new Date();
  let sent = 0;
  for (const s of subs ?? []) {
    let local;
    try { local = localParts(now, s.tz); } catch { continue; }
    const [h, m] = String(s.ritual_time).split(":").map(Number);
    const due = h * 60 + m;
    if (local.minutes < due || local.minutes >= due + 15) continue;
    if (s.last_sent_on === local.date) continue;
    const { count } = await admin.from("checkins").select("id", { count: "exact", head: true }).eq("user_id", s.user_id).eq("local_date", local.date);
    if (count) continue;
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ title: "Ballast", body: LINES[Math.floor(Math.random() * LINES.length)], url: "/today" }));
      await admin.from("push_subscriptions").update({ last_sent_on: local.date }).eq("endpoint", s.endpoint);
      sent++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
    }
  }
  return Response.json({ ok: true, sent });
}
