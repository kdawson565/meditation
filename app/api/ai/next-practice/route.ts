import { callClaude, clip, guard } from "@/lib/ai-server";

interface Day { date: string; drive: number; peace: number; peaceAfter?: number; driveAfter?: number }

/** Picks today's practice from numbers and practice names only. No journal text is sent. */
export async function POST(req: Request) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const raw = await req.text();
  if (raw.length > 30_000) return Response.json({ error: "too_large" }, { status: 413 });
  let b: { drive?: number; peace?: number; days?: Day[]; history?: { date: string; practice: string }[]; available?: { id: string; title: string; blurb: string }[]; insights?: { practice: string; n: number; peaceLift: number; driveShift: number | null }[] };
  try { b = JSON.parse(raw); } catch { return Response.json({ error: "bad_request" }, { status: 400 }); }
  const available = (b.available ?? []).slice(0, 16).map((a) => ({ id: clip(a.id, 40), title: clip(a.title, 60), blurb: clip(a.blurb, 100) }));
  if (!available.length) return Response.json({ error: "bad_request" }, { status: 400 });

  const system = `You choose today's gratitude practice for someone using Ballast, an app for ambitious people who want to feel full while still hungry. They rate Drive (hungry, focused) and Peace (settled, "enough") daily. The goal is to raise Peace without lowering Drive. Never encourage wanting less.
Pick exactly ONE practice from the available list, using their dials, the recent trend, what they've practiced lately (avoid repeating the last two days; favour variety), and, if present, the before/after Peace and Drive changes per practice (treat small samples as weak hints).
Reply with ONLY a JSON object: {"practice":"<id from the list>","reason":"<one plain sentence, under 28 words, speaking to them as 'you', specific to their numbers or recent practice, no flattery, no therapy language>"}`;
  const user = JSON.stringify({
    todayDials: { drive: Number(b.drive) | 0, peace: Number(b.peace) | 0 },
    recentDays: (b.days ?? []).slice(-14),
    recentPractices: (b.history ?? []).slice(-14).map((h) => ({ date: clip(h.date, 10), practice: clip(h.practice, 40) })),
    beforeAfterByPractice: (b.insights ?? []).slice(0, 8),
    available,
  });
  try {
    const text = await callClaude(system, user, 200);
    const m = text.match(/\{[\s\S]*\}/);
    const parsed = m ? JSON.parse(m[0]) : null;
    const pick = available.find((a) => a.id === parsed?.practice);
    if (!pick || typeof parsed.reason !== "string") return Response.json({ error: "upstream" }, { status: 502 });
    return Response.json({ practice: pick.id, reason: clip(parsed.reason, 240) });
  } catch (e) {
    console.error("[ai] upstream failure:", e instanceof Error ? e.message : e);
    return Response.json({ error: "upstream" }, { status: 502 });
  }
}
