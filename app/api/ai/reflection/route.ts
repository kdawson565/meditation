import { z } from "zod";
import { aiFailure, AIError, capWords, clip, grounded, identify, namesAThinker, onlyRetrieved, renderCards } from "@/lib/ai-server";
import { cleanPractices, cleanValues, parseBody, practicesBlock, QuadrantIn, valuesBlock } from "@/lib/ai-shared";
import { retrieve } from "@/lib/library";
import type { PracticeId } from "@/lib/types";

const In = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.array(z.object({ date: z.string(), drive: z.number(), peace: z.number(), voice: z.number().nullish(), peaceAfter: z.number().nullish(), driveAfter: z.number().nullish(), carried: z.string().nullish(), evidence: z.string().nullish() })).max(14).default([]),
  entries: z.array(z.object({ date: z.string(), practice: z.string(), body: z.string(), tags: z.array(z.string()).default([]), sail: z.string().nullish(), floor: z.string().nullish(), advocate: z.string().nullish(), sailValue: z.string().nullish() })).max(30).default([]),
  values: z.array(z.object({ name: z.string(), definition: z.string().optional() })).max(10).default([]),
  valueCounts: z.array(z.object({ name: z.string(), thisWeek: z.number(), prior3Weeks: z.number() })).max(10).default([]),
  quadrant: QuadrantIn,
  available: z.array(z.string()).max(40).default([]),
});
const Out = z.object({ body: z.string(), card_ids: z.array(z.string()), practice_id: z.string() });

const RULES = `Task: the Sunday reflection on THIS person's week.
- Aim for 130 to 160 words. Never more than 200. Plain paragraphs, no headings, no lists.
- Be specific: echo their actual entries, evidence lines and numbers. Name 1 or 2 real patterns across the dials, values and evidence lines (what Peace did on days Drive was high, which value showed up in their "Lived it" lines, which went quiet using the counts, how Voice moved).
- Ground the reflection in 1 or 2 of the cards: weave a card's idea in, in your own plain words, and return those ids in card_ids.
- End with exactly one small suggestion for next week, built around one practice from <practices>. Return its id as practice_id.
- If they have values: never shame a quiet value or call anything missed; at most, invite them back to it gently. Never judge a goal, including Sails marked "Not sure".
- If the week is thin, say so briefly instead of inventing patterns.`;

export async function POST(req: Request) {
  const id = await identify(req);
  if ("blocked" in id) return id.blocked;
  const b = await parseBody(req, In, 80_000);
  if (b instanceof Response) return b;
  if (!b.days.length && !b.entries.length) return Response.json({ error: "empty" }, { status: 400 });
  try {
    const values = cleanValues(b.values);
    const available = cleanPractices(b.available);
    if (!available.length) return Response.json({ error: "bad_request" }, { status: 400 });
    const topValue = [...b.valueCounts].sort((x, y) => y.thisWeek - x.thisWeek)[0];
    const cards = retrieve({ value: topValue?.thisWeek ? topValue.name : undefined, otherValues: values.map((v) => v.name), quadrant: b.quadrant, recentPractices: b.entries.map((e) => e.practice) as PracticeId[], seed: b.weekStart });

    const days = b.days.map((d) => `${clip(d.date, 10)}: Drive ${d.drive | 0}, Peace ${d.peace | 0}${d.voice ? `, Voice ${d.voice | 0}` : ""}${d.peaceAfter ? `, Peace after practice ${d.peaceAfter | 0}` : ""}${d.driveAfter ? `, Drive after practice ${d.driveAfter | 0}` : ""}${d.carried ? `. Carried: ${clip(d.carried, 40)}` : ""}${d.evidence ? `. Lived it: "${clip(d.evidence, 280)}"` : ""}`);
    const entries = b.entries.map((e) => `[${clip(e.date, 10)} · ${clip(e.practice, 40)}${e.tags.length ? ` · tags: ${e.tags.slice(0, 8).map((t) => clip(t, 30)).join(", ")}` : ""}]\n${clip(e.body, 900)}${e.sail ? `\nSail: ${clip(e.sail, 200)}` : ""}${e.floor ? `\nFloor: ${clip(e.floor, 200)}` : ""}${e.advocate ? `\nAdvocate: ${clip(e.advocate, 300)}` : ""}${e.sailValue ? `\nSail serves: ${clip(e.sailValue, 40)}` : ""}`);
    const counts = b.valueCounts.slice(0, 5).map((c) => `${clip(c.name, 40)}: ${c.thisWeek | 0} this week; about ${((c.prior3Weeks | 0) / 3).toFixed(1)} a week over the three weeks before`);
    const user = `${renderCards(cards)}\n\n${practicesBlock(available)}\n\n<person>\n${valuesBlock(values)}${counts.length ? `\n\nEvidence lines per value:\n${counts.join("\n")}` : ""}\n\nDials this week:\n${days.join("\n") || "(none)"}\n\nEntries:\n${entries.join("\n\n") || "(none)"}\n</person>`;

    const out = await grounded({ feature: "reflection", rules: RULES, schema: Out, maxTokens: 900, messages: [{ role: "user", content: user }] });
    const body = capWords(out.body, 200);
    const named = namesAThinker(body);
    if (named) throw new AIError("ungrounded", `named ${named}`);
    const practiceId = available.includes(out.practice_id as PracticeId) ? (out.practice_id as PracticeId) : undefined;
    return Response.json({ body, cardIds: onlyRetrieved(out.card_ids, cards).slice(0, 2), practiceId });
  } catch (e) {
    return aiFailure(e, "reflection");
  }
}
