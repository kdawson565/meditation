import { supabase } from "./supabase";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export type PushResult = { ok: true } | { ok: false; reason: string };

export const pushSupported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

function keyBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function token() {
  const { data } = (await supabase()?.auth.getSession()) ?? { data: { session: null } };
  return data.session?.access_token ?? null;
}

export async function enablePush(ritualTime: string, timezone: string): Promise<PushResult> {
  if (!pushSupported()) return { ok: false, reason: "This browser doesn't support push. On iPhone, add Ballast to your Home Screen first." };
  if (!PUBLIC_KEY) return { ok: false, reason: "Reminders aren't set up on this server yet." };
  const t = await token();
  if (!t) return { ok: false, reason: "Sign in first. Reminders are sent from the server, so they need an account." };
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: "Notifications are blocked for this site. You can allow them in your browser settings." };
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY) }));
  const res = await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${t}` }, body: JSON.stringify({ subscription: sub.toJSON(), ritualTime, timezone }) });
  if (!res.ok) return { ok: false, reason: res.status === 501 ? "Reminders aren't set up on this server yet." : "Couldn't save your reminder. Try again in a moment." };
  return { ok: true };
}

export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  const t = await token();
  if (t) await fetch("/api/push/subscribe", { method: "DELETE", headers: { "content-type": "application/json", authorization: `Bearer ${t}` }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
  await sub.unsubscribe();
}

/** Re-send the subscription when the ritual time changes, so the server fires at the new time. */
export async function refreshPushTime(ritualTime: string, timezone: string) {
  if (!pushSupported() || Notification.permission !== "granted") return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  const t = await token();
  if (!sub || !t) return;
  await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${t}` }, body: JSON.stringify({ subscription: sub.toJSON(), ritualTime, timezone }) }).catch(() => {});
}
