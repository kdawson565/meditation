import { callClaude, clip, guard, SAFETY } from "@/lib/ai-server";

interface InDay { date: string; drive: number; peace: number; voice?: number; peaceAfter?: number; driveAfter?: number; carried?: string; evidence?: string }
interface InEntry { date: string; practice: string; body: string; tags: string[]; sail?: string; floor?: string; advocate?: string; sailValue?: string }

export async function POST(req: Request) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const raw = await req.text();
  if (raw.length > 80_000) return Response.json({ error: "too_large" }, { status: 413 });
  let b: { days?: InDay[]; entries?: InEntry[]; lenses?: { name: string; ideas: string[] }[]; values?: { name: string; definition: string }[]; valueCounts?: { name: string; thisWeek: number; prior3Weeks: number }[] };
  try { b = JSON.parse(raw); } catch { return Response.json({ error: "bad_request" }, { status: 400 }); }

  const days = (b.days ?? []).slice(0, 14).map((d) => `${clip(d.date, 10)}: Drive ${Number(d.drive) | 0}, Peace ${Number(d.peace) | 0}${d.voice ? `, Voice ${Number(d.voice) | 0}` : ""}${d.peaceAfter ? `, Peace after practice ${Number(d.peaceAfter) | 0}` : ""}${d.driveAfter ? `, Drive after practice ${Number(d.driveAfter) | 0}` : ""}${d.carried ? `. Carried: ${clip(d.carried, 40)}` : ""}${d.evidence ? `. Lived it: "${clip(d.evidence, 280)}"` : ""}`);
  const entries = (b.entries ?? []).slice(0, 30).map((e) =>
    `[${clip(e.date, 10)} · ${clip(e.practice, 40)}${e.tags?.length ? ` · tags: ${e.tags.slice(0, 8).map((t) => clip(t, 30)).join(", ")}` : ""}]\n${clip(e.body, 900)}${e.sail ? `\nSail: ${clip(e.sail, 200)}` : ""}${e.floor ? `\nFloor: ${clip(e.floor, 200)}` : ""}${e.advocate ? `\nAdvocate: ${clip(e.advocate, 300)}` : ""}${e.sailValue ? `\nSail serves: ${clip(e.sailValue, 40)}` : ""}`);
  if (!days.length && !entries.length) return Response.json({ error: "empty" }, { status: 400 });
  const values = (b.values ?? []).slice(0, 5).map((v) => `${clip(v.name, 40)}${v.definition ? `: "${clip(v.definition, 200)}"` : ""}`);
  const counts = (b.valueCounts ?? []).slice(0, 5).map((c) => `${clip(c.name, 40)}: ${Number(c.thisWeek) | 0} this week; about ${((Number(c.prior3Weeks) | 0) / 3).toFixed(1)} a week over the three weeks before`);

  const lenses = (b.lenses ?? []).slice(0, 3).map((l) => ({ name: clip(l.name, 40), ideas: (l.ideas ?? []).slice(0, 5).map((i) => clip(i, 300)) }));
  const lensRule = lenses.length ? `\n- The person reads their practice through these thinkers: ${lenses.map((l) => l.name).join(", ")}. In the single closing suggestion only, you may frame the idea in the spirit of ONE of them, drawing on the paraphrased ideas supplied below. Say "in the spirit of <name>". Never put words in quotation marks as if the thinker said them, and never invent a quote or a fact about them.` : "";
  const system = `You write the Sunday reflection for Ballast, an app for ambitious people whose promise is "Grow without losing your peace." Goals move; values hold. The person's chosen values are the ballast, their goals (Sails) are the sails. The app tracks three daily dials, Drive (hungry, focused, in motion), Peace (settled, present, "enough") and Voice (1 = harsh inner critic, 10 = inner advocate), plus short entries.
Write a short reflection on THIS person's week.
Rules:
- Aim for 130 to 160 words. Never more than 200. Plain paragraphs, no headings, no bullet points, no markdown.
- Be specific: quote or paraphrase their actual entries and numbers. Name 1 or 2 real patterns (e.g. which kinds of entries sat alongside higher Peace, what Peace did on days Drive was high, which tags recur).
- Say which practice seemed to go with a steadier or higher Peace, and hedge honestly ("tended to", "this week"): a single week can't prove cause.
- End with exactly one concrete, small suggestion for next week.
- Warm but never flattering. No therapist-speak, no "it's okay to feel", no coaching or hustle language. Never tell them to want less.
- If there are Voice ratings, give their trend in one sentence and how Peace and Drive moved with them. You may echo one of their own advocate lines (entries from the Voice practices, or lines marked Advocate:). Never repeat anything self-critical back to them.
- If they have values: name which values showed up most in their "Lived it" lines this week, and which went quiet (use the counts). If Peace or Drive looked different on days they lived a value, say so in one hedged sentence. Never shame a quiet value or call anything missed, broken or failed. Treat drift as normal and returning as the practice; at most, invite them back to a quiet value gently. Never judge a goal, including Sails marked "Not sure".
- If the data is thin, say so briefly instead of inventing patterns.${lensRule}
${SAFETY}`;
  const user = `${values.length ? `Their values:\n${values.join("\n")}\n\nEvidence lines per value:\n${counts.join("\n")}\n\n` : ""}Dials this week:\n${days.join("\n") || "(none)"}\n\nEntries:\n${entries.join("\n\n") || "(none)"}${lenses.length ? `\n\nLens ideas (paraphrases):\n${lenses.map((l) => `${l.name}:\n- ${l.ideas.join("\n- ")}`).join("\n")}` : ""}`;
  try {
    const body = capWords(await callClaude(system, user, 600), 200);
    return Response.json({ body });
  } catch (e) {
    console.error("[ai] upstream failure:", e instanceof Error ? e.message : e);
    return Response.json({ error: "upstream" }, { status: 502 });
  }
}

/** Keeps the note under the word limit by ending at the last full sentence that fits. */
function capWords(text: string, max: number) {
  const words = text.trim().split(/\s+/);
  if (words.length <= max) return text.trim();
  const cut = words.slice(0, max).join(" ");
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".\n"), cut.endsWith(".") ? cut.length - 1 : -1);
  return end > 0 ? cut.slice(0, end + 1) : cut;
}
