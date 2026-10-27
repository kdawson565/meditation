import { db } from "./db";
import { PRACTICES } from "./practices";
import { formatFull } from "./dates";

export async function exportJSON() {
  const [profile, checkins, entries, ledger, audits, thanks, reflections] = await Promise.all([db.profile.get("me"), db.checkins.toArray(), db.entries.toArray(), db.ledger.toArray(), db.audits.toArray(), db.thanks.toArray(), db.reflections.toArray()]);
  const strip = <T extends { dirty?: unknown }>(x: T) => {
    const { dirty: _d, ...rest } = x;
    void _d;
    return rest;
  };
  return JSON.stringify(
    {
      app: "ballast",
      exportedAt: new Date().toISOString(),
      profile: profile ? strip(profile) : null,
      checkins: checkins.map(strip),
      entries: entries.filter((e) => !e.deletedAt).map(strip),
      ledger: ledger.filter((i) => !i.deletedAt).map(strip),
      audits: audits.map(strip),
      thanks: thanks.filter((t) => !t.deletedAt).map(strip),
      reflections: reflections.map(strip),
    },
    null,
    2,
  );
}

export async function exportMarkdown() {
  const [profile, checkins, entries, ledger, audits, thanks, reflections] = await Promise.all([db.profile.get("me"), db.checkins.toArray(), db.entries.toArray(), db.ledger.toArray(), db.audits.toArray(), db.thanks.toArray(), db.reflections.toArray()]);
  const byDate = new Map(checkins.map((c) => [c.localDate, c]));
  const live = entries.filter((e) => !e.deletedAt).sort((a, b) => (a.localDate < b.localDate ? 1 : a.localDate > b.localDate ? -1 : a.createdAt < b.createdAt ? 1 : -1));
  const out: string[] = ["# Ballast journal", ""];
  if (profile) {
    out.push(`Exported ${new Date().toLocaleDateString()} for ${profile.name || "you"}.`, "");
    const e = profile.enough;
    if (e.money || e.health || e.relationships || e.time) {
      out.push("## My Enough Line", "");
      if (e.money) out.push(`- **Money:** ${e.money}`);
      if (e.health) out.push(`- **Health:** ${e.health}`);
      if (e.relationships) out.push(`- **Relationships:** ${e.relationships}`);
      if (e.time) out.push(`- **Time:** ${e.time}`);
      out.push("");
    }
  }
  out.push("## Entries", "");
  for (const e of live) {
    const p = PRACTICES[e.practice];
    const c = byDate.get(e.localDate);
    out.push(`### ${formatFull(e.localDate)} · ${p.title}`);
    if (c) out.push(`*Drive ${c.drive} · Peace ${c.peace}${c.peaceAfter ? ` → Peace ${c.peaceAfter}` : ""}${c.driveAfter ? `, Drive ${c.driveAfter} after` : ""}*`);
    out.push("");
    for (const f of p.fields) if (e.fields[f.key]) out.push(`**${f.label}**`, "", e.fields[f.key], "");
    if (e.sail) out.push(`**Sail:** ${e.sail}`, "");
    if (e.floor) out.push(`**Floor:** ${e.floor}`, "");
    if (e.tags.length) out.push(`Tags: ${e.tags.map((t) => `#${t}`).join(" ")}`, "");
    if (e.resurfaceOn) out.push(`Check back: ${formatFull(e.resurfaceOn)}`, "");
  }
  const liveLedger = ledger.filter((i) => !i.deletedAt);
  if (liveLedger.length) {
    out.push("## Ledger", "");
    for (const w of liveLedger.filter((i) => i.kind === "want")) {
      out.push(`- **I want:** ${w.text}${w.arrivedOn ? ` (reached ${formatFull(w.arrivedOn)})` : ""}`);
      for (const a of liveLedger.filter((i) => i.wantId === w.id)) out.push(`  - I already have: ${a.text}`);
      for (const au of audits.filter((x) => x.wantId === w.id && x.answeredAt)) out.push(`  - Day ${au.days} audit: glow ${au.glow}/10${au.note ? `, "${au.note}"` : ""}`);
    }
    for (const a of liveLedger.filter((i) => i.kind === "asset" && !i.wantId)) out.push(`- **I already have:** ${a.text}`);
    out.push("");
  }
  const liveThanks = thanks.filter((t) => !t.deletedAt);
  if (liveThanks.length) {
    out.push("## Unsent Thanks", "");
    for (const t of liveThanks) out.push(`- **${t.person}** (${t.status}${t.sentAt ? ` ${formatFull(t.sentAt.slice(0, 10))}` : ""}): ${t.reason}`);
    out.push("");
  }
  if (reflections.length) {
    out.push("## Weekly reflections", "");
    for (const r of [...reflections].sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1))) out.push(`### Week of ${formatFull(r.weekStart)}`, "", r.body, "");
  }
  return out.join("\n");
}

export function download(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
