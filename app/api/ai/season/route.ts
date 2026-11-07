import { z } from "zod";
import { aiFailure, AIError, capWords, clip, grounded, identify, namesAThinker, onlyRetrieved, recordUsage, renderCards, usageSince } from "@/lib/ai-server";
import { cleanValues, parseBody, QuadrantIn, ValueIn, valuesBlock } from "@/lib/ai-shared";
import { retrieve } from "@/lib/library";
import { suggestsDistress } from "@/lib/safety";
import type { PracticeId } from "@/lib/types";

const In = z.object({
  season: z.object({ n: z.number().int().min(1).max(400), start: z.string(), end: z.string() }),
  facts: z.array(z.string()).max(12).default([]),
  topQuadrant: QuadrantIn,
  values: z.array(ValueIn).max(10).default([]),
  carried: z.array(z.object({ name: z.string(), days: z.number(), lived: z.number() })).max(10).default([]),
  evidence: z.array(z.object({ date: z.string(), value: z.string().nullish(), text: z.string() })).max(40).default([]),
  practices: z.array(z.string()).max(40).default([]),
});
const Out = z.object({ body: z.string(), card_ids: z.array(z.string()) });

const RULES = `Task: the season review, a look back at 90 days.
- About 300 words (260 to 320). Plain paragraphs, no headings, no lists.
- Write it mostly from the person's own words: quote or closely echo several of their "Lived it" lines (their own words may go in quotation marks), and name the values they kept returning to.
- Describe the arc of Drive and Peace using the facts given. Hedge honestly.
- At most one or two card ideas, woven in lightly, in plain words. Return those ids in card_ids.
- End with one sentence that looks toward the next season without setting goals for them or telling them to want less.`;

export async function POST(req: Request) {
  const id = await identify(req);
  if ("blocked" in id) return id.blocked;
  const b = await parseBody(req, In, 60_000);
  if (b instanceof Response) return b;
  try {
    if ((await usageSince(id.who, "season", 24)).count >= 3) return Response.json({ error: "daily_cap" }, { status: 429 });
    if (suggestsDistress(b.evidence.map((e) => e.text))) return Response.json({ support: true });
    const values = cleanValues(b.values);
    const top = [...b.carried].sort((x, y) => y.days - x.days)[0];
    const cards = retrieve({ value: top?.name, otherValues: values.map((v) => v.name), quadrant: b.topQuadrant, recentPractices: b.practices as PracticeId[], seed: `season-${b.season.n}` }, { min: 2, max: 3 });
    const user = `${renderCards(cards)}\n\n<person>\n${valuesBlock(values)}\n\nSeason ${b.season.n}: ${clip(b.season.start, 10)} to ${clip(b.season.end, 10)}\nFacts:\n${b.facts.map((f) => `- ${clip(f, 240)}`).join("\n")}\n${b.carried.length ? `Values carried (days carried, moments lived):\n${b.carried.map((c) => `- ${clip(c.name, 40)}: ${c.days | 0} days, ${c.lived | 0} moments`).join("\n")}` : ""}\n\nTheir "Lived it" lines:\n${b.evidence.map((e) => `${clip(e.date, 10)}${e.value ? ` (${clip(e.value, 40)})` : ""}: "${clip(e.text, 280)}"`).join("\n") || "(none)"}\n</person>`;
    const out = await grounded({ feature: "season", rules: RULES, schema: Out, maxTokens: 1400, messages: [{ role: "user", content: user }] });
    const body = capWords(out.body, 340);
    const named = namesAThinker(body);
    if (named) throw new AIError("ungrounded", `named ${named}`);
    await recordUsage(id.who, "season");
    return Response.json({ body, cardIds: onlyRetrieved(out.card_ids, cards).slice(0, 2) });
  } catch (e) {
    return aiFailure(e, "season");
  }
}
