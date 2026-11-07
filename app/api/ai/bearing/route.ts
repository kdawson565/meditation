import { z } from "zod";
import { aiFailure, AIError, capSentences, grounded, identify, namesAThinker, onlyRetrieved, recordUsage, renderCards, usageSince } from "@/lib/ai-server";
import { cleanValues, parseBody, QuadrantIn, ValueIn, valuesBlock } from "@/lib/ai-shared";
import { retrieve } from "@/lib/library";
import type { PracticeId } from "@/lib/types";

const In = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  floor: ValueIn.optional(),
  values: z.array(ValueIn).max(10).default([]),
  quadrant: QuadrantIn,
  recentPractices: z.array(z.string()).max(30).default([]),
  recentlyShown: z.array(z.string()).max(30).default([]),
});
const Out = z.object({ text: z.string(), card_id: z.string() });

const RULES = `Task: today's Bearing. Two sentences, 20 to 45 words in all.
- Tie the value they carry today, in their own terms (use their definition if they gave one), to the idea of exactly ONE card.
- First sentence: their value, today. Second sentence: the card's idea as something small to notice or try today.
- If they carry no value today, tie how the day feels (the quadrant) to one card instead.
- Do not repeat the card's title. Do not ask a question. Return the id of the one card you used as card_id.`;

/** One Bearing a day: two sentences tying today's Floor value to one Library card. */
export async function POST(req: Request) {
  const id = await identify(req);
  if ("blocked" in id) return id.blocked;
  const b = await parseBody(req, In);
  if (b instanceof Response) return b;
  try {
    if ((await usageSince(id.who, "bearing", 24)).count >= 3) return Response.json({ error: "daily_cap" }, { status: 429 });
    const values = cleanValues(b.values);
    const floor = b.floor ? cleanValues([b.floor])[0] : undefined;
    const cards = retrieve({ value: floor?.name, otherValues: values.map((v) => v.name), quadrant: b.quadrant, recentPractices: b.recentPractices as PracticeId[], recentlyShown: b.recentlyShown, seed: b.date });
    const user = `${renderCards(cards)}\n\n<person>\n${valuesBlock(values, floor)}\n${b.quadrant ? `Today's dials put them in: ${b.quadrant}` : ""}\n</person>`;
    const out = await grounded({ feature: "bearing", rules: RULES, schema: Out, maxTokens: 400, messages: [{ role: "user", content: user }] });
    const cardIds = onlyRetrieved([out.card_id], cards);
    const text = capSentences(out.text, 2);
    if (!cardIds.length) throw new AIError("ungrounded", `card id not retrieved: ${out.card_id}`);
    const named = namesAThinker(text);
    if (named) throw new AIError("ungrounded", `named ${named}`);
    await recordUsage(id.who, "bearing");
    return Response.json({ text, cardIds });
  } catch (e) {
    return aiFailure(e, "bearing");
  }
}
