import { supabase } from "./supabase";

export type AIResult<T> = { ok: true; data: T } | { ok: false; reason: "not_configured" | "sign_in_required" | "rate_limited" | "offline" | "error" };

/** Calls our own server routes (which hold the Anthropic key). Never talks to Anthropic from the browser. */
export async function callAI<T>(path: string, body: unknown): Promise<AIResult<T>> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { ok: false, reason: "offline" };
  const headers: Record<string, string> = { "content-type": "application/json" };
  const sb = supabase();
  if (sb) {
    const { data } = await sb.auth.getSession();
    if (data.session) headers.authorization = `Bearer ${data.session.access_token}`;
  }
  try {
    const res = await fetch(path, { method: "POST", headers, body: JSON.stringify(body) });
    if (res.ok) return { ok: true, data: (await res.json()) as T };
    const j = await res.json().catch(() => ({}));
    if (j.error === "not_configured" || j.error === "sign_in_required" || j.error === "rate_limited") return { ok: false, reason: j.error };
    return { ok: false, reason: "error" };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export function aiReasonText(r: Exclude<AIResult<unknown>, { ok: true }>["reason"]) {
  switch (r) {
    case "not_configured": return "AI isn't set up on this server (no Anthropic key), so this was made on your device.";
    case "sign_in_required": return "Sign in to use AI features. This was made on your device instead.";
    case "rate_limited": return "You've reached the hourly limit for AI. This was made on your device instead.";
    case "offline": return "You're offline, so this was made on your device.";
    default: return "The AI didn't respond, so this was made on your device.";
  }
}
