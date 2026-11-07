import { z } from "zod";
import { PRACTICES } from "./practices";
import type { PracticeId } from "./types";
import { clip } from "./ai-server";

// Request shapes shared by the grounded routes. Everything is clipped: the client is not trusted to keep sizes sane.
export const ValueIn = z.object({ name: z.string(), definition: z.string().optional().default("") });
export const QuadrantIn = z.enum(["ballast", "grind", "harbor", "fog"]).optional();

export const cleanValues = (vs: { name: string; definition?: string }[] | undefined) =>
  (vs ?? []).slice(0, 5).map((v) => ({ name: clip(v.name, 40), definition: clip(v.definition ?? "", 200) })).filter((v) => v.name);

export const valuesBlock = (vs: { name: string; definition: string }[], floor?: { name: string; definition: string }) =>
  `${vs.length ? `Their values (their own definitions):\n${vs.map((v) => `- ${v.name}${v.definition ? `: "${v.definition}"` : ""}`).join("\n")}` : "They haven't chosen values yet."}${floor ? `\nToday they carry: ${floor.name}${floor.definition ? ` ("${floor.definition}")` : ""}` : ""}`;

/** Practice ids the person can actually do, from the list the client offers. Unknown or hidden ids are dropped. */
export const cleanPractices = (ids: unknown) =>
  (Array.isArray(ids) ? ids : []).filter((id): id is PracticeId => typeof id === "string" && id in PRACTICES && !PRACTICES[id as PracticeId].hidden).slice(0, 30);

export const practicesBlock = (ids: PracticeId[]) => `<practices>\n${ids.map((id) => `${id}: ${PRACTICES[id].title}. ${PRACTICES[id].blurb}`).join("\n")}\n</practices>`;

export const parseBody = async <T extends z.ZodType>(req: Request, schema: T, maxBytes = 60_000): Promise<z.infer<T> | Response> => {
  const raw = await req.text();
  if (raw.length > maxBytes) return Response.json({ error: "too_large" }, { status: 413 });
  try {
    const r = schema.safeParse(JSON.parse(raw));
    return r.success ? r.data : Response.json({ error: "bad_request" }, { status: 400 });
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
};
