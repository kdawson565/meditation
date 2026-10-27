import { callClaude, clip, guard, SAFETY } from "@/lib/ai-server";

interface InDay { date: string; drive: number; peace: number; peaceAfter?: number; driveAfter?: number }
interface InEntry { date: string; practice: string; body: string; tags: string[]; sail?: string; floor?: string }

export async function POST(req: Request) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const raw = await req.text();
  if (raw.length > 80_000) return Response.json({ error: "too_large" }, { status: 413 });
  let b: { days?: InDay[]; entries?: InEntry[]; lenses?: { name: string; ideas: string[] }[] };
  try { b = JSON.parse(raw); } catch { return Response.json({ error: "bad_request" }, { status: 400 }); }

  const days = (b.days ?? []).slice(0, 14).map((d) => `${clip(d.date, 10)}: Drive ${Number(d.drive) | 0}, Peace ${Number(d.peace) | 0}${d.peaceAfter ? `, Peace after practice ${Number(d.peaceAfter) | 0}` : ""}${d.driveAfter ? `, Drive after practice ${Number(d.driveAfter) | 0}` : ""}`);
  const entries = (b.entries ?? []).slice(0, 30).map((e) =>
    `[${clip(e.date, 10)} · ${clip(e.practice, 40)}${e.tags?.length ? ` · tags: ${e.tags.slice(0, 8).map((t) => clip(t, 30)).join(", ")}` : ""}]\n${clip(e.body, 900)}${e.sail ? `\nSail: ${clip(e.sail, 200)}` : ""}${e.floor ? `\nFloor: ${clip(e.floor, 200)}` : ""}`);
  if (!days.length && !entries.length) return Response.json({ error: "empty" }, { status: 400 });

  const lenses = (b.lenses ?? []).slice(0, 3).map((l) => ({ name: clip(l.name, 40), ideas: (l.ideas ?? []).slice(0, 5).map((i) => clip(i, 300)) }));
  const lensRule = lenses.length ? `\n- The person reads their practice through these thinkers: ${lenses.map((l) => l.name).join(", ")}. In the single closing suggestion only, you may frame the idea in the spirit of ONE of them, drawing on the paraphrased ideas supplied below. Say "in the spirit of <name>". Never put words in quotation marks as if the thinker said them, and never invent a quote or a fact about them.` : "";
  const system = `You write the Sunday reflection for Ballast, a gratitude app for ambitious people who want to feel full while still hungry. The app tracks two daily dials, Drive (hungry, focused, in motion) and Peace (settled, present, "enough"), plus short gratitude entries.
Write a short reflection on THIS person's week.
Rules:
- Under 180 words. Plain paragraphs, no headings, no bullet points, no markdown.
- Be specific: quote or paraphrase their actual entries and numbers. Name 1 or 2 real patterns (e.g. which kinds of entries sat alongside higher Peace, what Peace did on days Drive was high, which tags recur).
- Say which practice seemed to go with a steadier or higher Peace, and hedge honestly ("tended to", "this week"): a single week can't prove cause.
- End with exactly one concrete, small suggestion for next week.
- Warm but never flattering. No therapist-speak, no "it's okay to feel", no coaching or hustle language. Never tell them to want less.
- If the data is thin, say so briefly instead of inventing patterns.${lensRule}
${SAFETY}`;
  const user = `Dials this week:\n${days.join("\n") || "(none)"}\n\nEntries:\n${entries.join("\n\n") || "(none)"}${lenses.length ? `\n\nLens ideas (paraphrases):\n${lenses.map((l) => `${l.name}:\n- ${l.ideas.join("\n- ")}`).join("\n")}` : ""}`;
  try {
    const body = await callClaude(system, user, 600);
    return Response.json({ body });
  } catch (e) {
    console.error("[ai] upstream failure:", e instanceof Error ? e.message : e);
    return Response.json({ error: "upstream" }, { status: 502 });
  }
}
