import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { aiFailure, AIError, capWords, clip, grounded, identify, namesAThinker, onlyRetrieved, recordUsage, renderCards, usageSince } from "@/lib/ai-server";
import { cleanPractices, cleanValues, parseBody, practicesBlock, QuadrantIn, ValueIn, valuesBlock } from "@/lib/ai-shared";
import { cardById, retrieve, type Card } from "@/lib/library";
import { suggestsDistress } from "@/lib/safety";
import type { PracticeId } from "@/lib/types";

const SESSIONS_PER_DAY = 3;
const TURNS_PER_SESSION = 5;

const Turn = z.object({ q: z.string(), answer: z.string(), cardId: z.string().nullish(), question: z.string().nullish(), practiceId: z.string().nullish(), offered: z.array(z.string()).max(5).default([]) });
const In = z.object({
  status: z.boolean().optional(),
  sessionId: z.string().regex(/^[a-z0-9-]{8,64}$/),
  question: z.string().max(600).default(""),
  turns: z.array(Turn).max(TURNS_PER_SESSION).default([]),
  person: z.object({
    values: z.array(ValueIn).max(10).default([]),
    floor: ValueIn.optional(),
    quadrant: QuadrantIn,
    recent: z.array(z.object({ date: z.string(), drive: z.number(), peace: z.number(), voice: z.number().nullish(), carried: z.string().nullish(), evidence: z.string().nullish(), sail: z.string().nullish() })).max(7).default([]),
  }),
  recentPractices: z.array(z.string()).max(30).default([]),
  available: z.array(z.string()).max(40).default([]),
});
const Out = z.object({ answer: z.string(), card_id: z.string().nullable(), question: z.string().nullable(), practice_id: z.string().nullable() });

const RULES = `Task: Ask Ballast. A short, bounded conversation, not a chat.
- Answer the person's question in at most 90 words.
- Use at most ONE card, the one that fits best, and return its id as card_id (or null if none fits).
- Optionally return one reflection question (one sentence) as question, and one practice id from <practices> as practice_id, or null.
- Stay inside what Ballast is for: values, goals, drive, peace, the inner voice, gratitude, steadiness. For anything else (medical, legal, money, facts, code, other people's private lives), say in a sentence that it's outside what you can help with here, and give the closest Ballast angle or nothing.
- Never end with an invitation to keep talking ("let me know", "feel free", "anything else", "happy to help"). Never ask more than the one reflection question.
- When the message says it is the last turn: answer, then close calmly in one short sentence that sends them back to their day. No invitation to return.`;

const SUPPORT = "That sounds heavy, and it deserves more than a short answer from an app. Ballast isn't a therapist and can't be there the way a person can. Please reach out to someone you trust, or a crisis line. In the US you can call or text 988.";
const INVITES = /\b(let me know|feel free|anything else|happy to help|reach out (to me|again)|ask me)\b/i;

function personBlock(p: z.infer<typeof In>["person"]) {
  const values = cleanValues(p.values);
  const floor = p.floor ? cleanValues([p.floor])[0] : undefined;
  const recent = p.recent.map((d) => `${clip(d.date, 10)}: Drive ${d.drive | 0}, Peace ${d.peace | 0}${d.voice ? `, Voice ${d.voice | 0}` : ""}${d.carried ? `. Carried ${clip(d.carried, 40)}` : ""}${d.evidence ? `. Lived it: "${clip(d.evidence, 200)}"` : ""}${d.sail ? `. Sail: ${clip(d.sail, 160)}` : ""}`);
  return `<person>\n${valuesBlock(values, floor)}${p.quadrant ? `\nToday's dials put them in: ${p.quadrant}` : ""}${recent.length ? `\nRecent days:\n${recent.join("\n")}` : ""}\n</person>`;
}

/** Rebuilds a turn's user message exactly as it was first sent, so the cached prefix stays valid turn to turn. */
function userMessage(i: number, q: string, offered: Card[], head: string, last: boolean) {
  return `${i === 0 ? head : ""}${renderCards(offered)}\n\nTurn ${i + 1} of ${TURNS_PER_SESSION}${last ? " (the last turn: answer, then close calmly)" : ""}.\nQuestion: ${clip(q, 600)}`;
}

export async function POST(req: Request) {
  const id = await identify(req);
  if ("blocked" in id) return id.blocked;
  const b = await parseBody(req, In, 40_000);
  if (b instanceof Response) return b;
  try {
    const usage = await usageSince(id.who, "ask", 24);
    const isNew = !usage.sessions.includes(b.sessionId);
    const used = usage.bySession(b.sessionId);
    // status check: sessions you can still start today (this one counts once it has a turn), and turns left in this one
    if (b.status) return Response.json({ sessionsLeft: Math.max(0, SESSIONS_PER_DAY - usage.sessions.length), turnsLeft: TURNS_PER_SESSION - used });
    if (isNew && usage.sessions.length >= SESSIONS_PER_DAY) return Response.json({ error: "daily_cap" }, { status: 429 });
    if (used >= TURNS_PER_SESSION) return Response.json({ error: "session_done" }, { status: 429 });
    const question = b.question.trim();
    if (!question) return Response.json({ error: "bad_request" }, { status: 400 });

    // Serious distress: no model call, just the support line.
    if (suggestsDistress([question])) return Response.json({ answer: SUPPORT, support: true, cardId: null, question: null, practiceId: null, offered: [], closing: false, turnsLeft: TURNS_PER_SESSION - used });

    const available = cleanPractices(b.available);
    const turn = used; // 0-based index of this turn
    const last = turn === TURNS_PER_SESSION - 1;
    const head = `${practicesBlock(available)}\n\n${personBlock(b.person)}\n\n`;
    const prior = b.turns.slice(0, turn);
    const history: Anthropic.MessageParam[] = prior.flatMap((t, i) => [
      { role: "user" as const, content: userMessage(i, t.q, t.offered.map(cardById).filter((c): c is Card => !!c), head, false) },
      { role: "assistant" as const, content: JSON.stringify({ answer: t.answer, card_id: t.cardId ?? null, question: t.question ?? null, practice_id: t.practiceId ?? null }) },
    ]);
    const shown = prior.flatMap((t) => (t.cardId ? [t.cardId] : []));
    const floor = b.person.floor ? cleanValues([b.person.floor])[0] : undefined;
    const offered = retrieve({ query: question, value: floor?.name, otherValues: cleanValues(b.person.values).map((v) => v.name), quadrant: b.person.quadrant, recentPractices: b.recentPractices as PracticeId[], recentlyShown: shown, seed: `${b.sessionId}-${turn}` }, { min: 2, max: 4 });

    const out = await grounded({ feature: "ask", rules: RULES, schema: Out, maxTokens: 600, messages: [...history, { role: "user", content: userMessage(turn, question, offered, head, last) }] });
    // drop any sentence that invites more chatting, then keep it short
    let answer = (out.answer.match(/[^.!?]+[.!?]+\s*/g) ?? [out.answer]).filter((s) => !INVITES.test(s)).join("").trim() || out.answer.trim();
    answer = capWords(answer, 100);
    const named = namesAThinker(`${answer} ${out.question ?? ""}`);
    if (named) throw new AIError("ungrounded", `named ${named}`);
    const cardId = onlyRetrieved(out.card_id ? [out.card_id] : [], offered)[0] ?? null;
    const practiceId = out.practice_id && available.includes(out.practice_id as PracticeId) ? out.practice_id : null;
    await recordUsage(id.who, "ask", b.sessionId);
    return Response.json({
      answer, cardId, question: out.question?.trim() || null, practiceId,
      offered: offered.map((c) => c.id), closing: last, turnsLeft: TURNS_PER_SESSION - used - 1,
      sessionsLeft: Math.max(0, SESSIONS_PER_DAY - usage.sessions.length - (isNew ? 1 : 0)),
    });
  } catch (e) {
    return aiFailure(e, "ask");
  }
}
