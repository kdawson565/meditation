import { callClaude, clip, guard, SAFETY } from "@/lib/ai-server";

export async function POST(req: Request) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const body = await req.json().catch(() => null);
  const person = clip(body?.person, 80);
  const reason = clip(body?.reason, 1200);
  if (!person || !reason) return Response.json({ error: "bad_request" }, { status: 400 });

  const system = `You help someone draft a short thank-you message to a person in their life, built from their OWN words.
Rules:
- Use the person's own phrasing and specifics from what they wrote. Do not invent facts, memories, or details they didn't give.
- 60 to 110 words. First person. Warm, plain, specific. No flattery, no clichés ("from the bottom of my heart"), no exclamation-mark pile-ups, no sign-off flourish.
- Start with the person's name. End with the thank-you itself, not an offer or a question.
- Output only the message text.
${SAFETY}`;
  try {
    const draft = await callClaude(system, `Recipient: ${person}\nWhat I want to thank them for, in my words:\n"""${reason}"""`, 400);
    return Response.json({ draft });
  } catch (e) {
    console.error("[ai] upstream failure:", e instanceof Error ? e.message : e);
    return Response.json({ error: "upstream" }, { status: 502 });
  }
}
