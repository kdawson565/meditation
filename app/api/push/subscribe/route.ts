import { adminClient, pushConfigured, userFromRequest } from "@/lib/push-server";

export async function POST(req: Request) {
  if (!pushConfigured()) return Response.json({ error: "not_configured" }, { status: 501 });
  const user = await userFromRequest(req);
  if (!user) return Response.json({ error: "sign_in_required" }, { status: 401 });
  const b = await req.json().catch(() => null);
  const endpoint = b?.subscription?.endpoint;
  const p256dh = b?.subscription?.keys?.p256dh;
  const auth = b?.subscription?.keys?.auth;
  if (typeof endpoint !== "string" || typeof p256dh !== "string" || typeof auth !== "string" || !/^https:\/\//.test(endpoint)) return Response.json({ error: "bad_request" }, { status: 400 });
  const ritual = typeof b.ritualTime === "string" && /^\d{2}:\d{2}$/.test(b.ritualTime) ? b.ritualTime : "08:00";
  let tz = "UTC";
  try { if (typeof b.timezone === "string") { new Intl.DateTimeFormat("en", { timeZone: b.timezone }); tz = b.timezone; } } catch {}
  const { error } = await adminClient()!.from("push_subscriptions").upsert({ endpoint, user_id: user.id, p256dh, auth, ritual_time: ritual, tz }, { onConflict: "endpoint" });
  if (error) return Response.json({ error: "db" }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!pushConfigured()) return Response.json({ error: "not_configured" }, { status: 501 });
  const user = await userFromRequest(req);
  if (!user) return Response.json({ error: "sign_in_required" }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (typeof b?.endpoint !== "string") return Response.json({ error: "bad_request" }, { status: 400 });
  await adminClient()!.from("push_subscriptions").delete().eq("endpoint", b.endpoint).eq("user_id", user.id);
  return Response.json({ ok: true });
}
