// Reads /content/library/*.md, checks every card against the Library rules, and writes lib/library.generated.json.
// Runs before every build and dev start (npm run library). Exits non-zero on any rule break, so a bad card can't ship.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const dir = join(root, "content/library");
const deck = [...readFileSync(join(root, "lib/values.ts"), "utf8").matchAll(/\{ name: "([^"]+)", example:/g)].map((m) => m[1]);
const practiceUnion = readFileSync(join(root, "lib/types.ts"), "utf8").match(/export type PracticeId =([^;]+);/)[1];
const practices = [...practiceUnion.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
const QUADRANTS = ["ballast", "grind", "harbor", "fog"];

function parse(file, text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing frontmatter between --- lines`);
  const meta = {};
  for (const line of m[1].split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const i = line.indexOf(":");
    if (i < 0) throw new Error(`${file}: can't read line "${line}"`);
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).replace(/\s+#.*$/, "").trim();
    if (val.startsWith("[") && val.endsWith("]")) val = val.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
    meta[key] = val;
  }
  return { meta, body: m[2].trim() };
}

const errors = [];
const cards = [];
for (const file of readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md").sort()) {
  let parsed;
  try { parsed = parse(file, readFileSync(join(dir, file), "utf8")); } catch (e) { errors.push(e.message); continue; }
  const { meta, body } = parsed;
  const bad = (msg) => errors.push(`${file}: ${msg}`);
  for (const k of ["id", "title", "status", "values", "quadrants", "influences", "reflection_question", "linked_practice_id"]) if (meta[k] == null || meta[k] === "") bad(`missing "${k}"`);
  if (meta.id && `${meta.id}.md` !== file) bad(`id "${meta.id}" must match the file name`);
  if (meta.id && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(meta.id)) bad(`id must be lowercase-with-dashes`);
  if (!["draft", "published"].includes(meta.status)) bad(`status must be draft or published`);
  const arr = (k) => (Array.isArray(meta[k]) ? meta[k] : (bad(`"${k}" must be a list like [A, B]`), []));
  const values = arr("values"), quadrants = arr("quadrants"), influences = arr("influences");
  if (!values.length) bad(`needs at least one value`);
  for (const v of values) if (!deck.includes(v)) bad(`value "${v}" isn't in the value deck (lib/values.ts)`);
  if (!quadrants.length) bad(`needs at least one quadrant`);
  for (const q of quadrants) if (!QUADRANTS.includes(q)) bad(`quadrant "${q}" must be one of ${QUADRANTS.join(", ")}`);
  if (meta.linked_practice_id && !practices.includes(meta.linked_practice_id)) bad(`linked_practice_id "${meta.linked_practice_id}" isn't a practice`);
  const words = body.split(/\s+/).filter(Boolean).length;
  if (words < 80 || words > 150) bad(`body is ${words} words; it must be 80 to 150`);
  // Thinkers live in influences only. Naming them in the body risks a quote or an implied endorsement.
  for (const name of influences) {
    const last = name.split(" ").pop();
    if (new RegExp(`\\b${last}\\b`, "i").test(body)) bad(`body mentions "${name}". Keep thinkers in influences only, and the ideas in Ballast's own words`);
  }
  if (/\b(said|wrote|once noted|put it)\b[^.]{0,20}[“"]/i.test(body)) bad(`body looks like it quotes someone. Paraphrase in Ballast's own words`);
  if (/!/.test(body)) bad(`no exclamation points`);
  cards.push({ id: meta.id, title: meta.title, status: meta.status, values, quadrants, influences, reflection_question: meta.reflection_question, linked_practice_id: meta.linked_practice_id, body, words });
}

const ids = new Set();
for (const c of cards) { if (ids.has(c.id)) errors.push(`duplicate id ${c.id}`); ids.add(c.id); }

if (errors.length) {
  console.error(`Library: ${errors.length} problem${errors.length === 1 ? "" : "s"}\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
writeFileSync(join(root, "lib/library.generated.json"), JSON.stringify(cards, null, 2) + "\n");
console.log(`Library: ${cards.length} cards OK (${cards.filter((c) => c.status === "draft").length} draft) → lib/library.generated.json`);
