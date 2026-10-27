import { db, now } from "./db";
import { addDays, addMonths, parseDate, todayStr, uid } from "./dates";
import { emptyEnough } from "./store";
import type { Audit, Checkin, Entry, LedgerItem, PracticeId, Reflection, Thank } from "./types";
import { PRACTICES } from "./practices";

// Deterministic pseudo-random so the sample map looks the same each time.
function rng(seed: number) {
  // mulberry32
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (n: number) => Math.min(10, Math.max(1, Math.round(n)));

interface Sample {
  practice: PracticeId;
  fields: Record<string, string>;
  tags: string[];
  sail?: string;
  floor?: string;
}

const SAMPLES: Sample[] = [
  { practice: "past_self", fields: { then: "At 24, sharing a one-bedroom and counting grocery money", now: "A house with a door I can close, and a table big enough that nobody has to eat standing up. I used to picture this as a someday. Today it's just where I made coffee." }, tags: ["home", "money"], sail: "Finish the pricing proposal before noon", floor: "My kids are healthy and the house is warm" },
  { practice: "mental_subtraction", fields: { thing: "The conversation with Dana that got me my first real job", without: "I'd still be refreshing job boards at midnight, probably bitter, probably convinced nobody gives people like me a shot. Almost everything I'm proud of runs back through one coffee she didn't have to take." }, tags: ["people", "work", "luck"], sail: "Ship the onboarding rewrite", floor: "I have people who answer when I call" },
  { practice: "win_thank", fields: { win: "Closed the biggest account of my career", thanks: "Marcus took the call at 6am three weeks in a row to rehearse with me. Priya covered the outage so I could prep. The customer took a chance because someone vouched for us years ago. I'd have lost this alone." }, tags: ["work", "people"], sail: "Follow up with the new account", floor: "A team that shows up for me" },
  { practice: "grind", fields: { hard: "Rebuilding the team after three people quit in one month", future: "I'm learning how to lead when it's not fun. Two years from now I think I'll have a team that I chose on purpose, and a spine I didn't have before." }, tags: ["work"], sail: "Two interviews, then lift", floor: "I've survived harder months than this" },
  { practice: "past_self", fields: { then: "At 19, lying awake wondering if I'd ever be good at anything", now: "A craft I can do with my eyes half shut. People ask me how I did it. I forget how long it was impossible." }, tags: ["craft"], sail: "Two hours of deep work", floor: "I know what I'm good at" },
  { practice: "mental_subtraction", fields: { thing: "My knee surgery going well", without: "I'd be a version of myself who watches runs from the car. Slower, heavier, a little afraid of stairs. The morning jog I take for granted is a door that almost stayed shut." }, tags: ["health", "body"], sail: "Run, then plan the week", floor: "My body works today" },
  { practice: "win_thank", fields: { win: "Hit the quarterly number with two days to spare", thanks: "The ops team stayed late without being asked. My wife took the school run all week. And a competitor's mistake handed us two deals. Pure luck, plus people." }, tags: ["work", "family", "luck"], sail: "Plan next quarter's bets", floor: "Home is steady" },
  { practice: "grind", fields: { hard: "The bank wants more paperwork and I'm slammed", future: "I'll have a clean financial base I built myself. Boring now. Freedom later." }, tags: ["money"], sail: "Clear the inbox by ten", floor: "Rent is paid, food is in the house" },
  { practice: "past_self", fields: { then: "At 30, before I started the company, wanting a 'real' team", now: "A team of eleven who argue with me and make it better. I used to dream of one great hire. I have a bench." }, tags: ["work", "people"], sail: "Hold the offsite agenda", floor: "I am not carrying this alone" },
  { practice: "mental_subtraction", fields: { thing: "My dad teaching me to fix things", without: "I'd be calling someone for every leaky tap and every dead outlet. More than that, I wouldn't have the quiet confidence that most problems come apart if you look at them slowly." }, tags: ["family", "craft"], sail: "Fix the gate", floor: "I was taught well" },
  { practice: "win_thank", fields: { win: "Gave the talk I was dreading, and it went well", thanks: "Elena sat through three bad run-throughs. The audience was generous. My mentor told me years ago to say yes before I felt ready." }, tags: ["people", "work"], sail: "Write up the talk", floor: "People rooting for me" },
  { practice: "invisible_chain", fields: { thing: "My morning coffee", chain: "A farmer I'll never meet picked it. Someone drove it to a port, someone else ran the ship, a roaster in town got up at four. A barista I only know by her laugh made it. None of them know I exist, and my morning rests on all of them." }, tags: ["people"], sail: "Clear the backlog", floor: "I'm held up by more people than I can count" },
  { practice: "enough_line", fields: { area: "Time", past: "I wrote that enough time means one unscheduled morning a week. I've had three of the last four. I'm past the line on time, and still short on money: another few months of runway to go." }, tags: ["money"], sail: "Hold the budget review", floor: "I already have most of what I said I'd need" },
  { practice: "grind", fields: { hard: "Training for the half marathon at 5am", future: "I'm becoming someone who does hard things on schedule. That compounds into everything else." }, tags: ["health", "body"], sail: "Long run, then deep work", floor: "A body that wants to move" },
];

const ENOUGH = {
  money: "Six months of runway, no debt on the house, and I can say yes to a good opportunity without checking my balance first.",
  health: "I can run five miles and sleep seven hours most nights.",
  relationships: "Dinner with my family at least five nights a week, and three friends I could call at 2am.",
  time: "One unscheduled morning a week, and I'm home before the kids' bedtime.",
};

export async function loadSample(name = "Sam") {
  const today = todayStr();
  const rand = rng(42);
  const checkins: Checkin[] = [];
  const entries: Entry[] = [];

  const DAYS = 52;
  let sampleIdx = 0;
  for (let i = DAYS; i >= 1; i--) {
    // skip some days: missing a day never matters
    if (rand() < 0.2) continue;
    const date = addDays(today, -i);
    const t = (DAYS - i) / DAYS; // 0 → 1, a slow drift toward Ballast
    const drive = clamp(7.6 + (rand() - 0.5) * 2.4 - t * 0.4 + (i % 9 === 0 ? -2.2 : 0));
    const peace = clamp(3.6 + t * 3.6 + (rand() - 0.5) * 2.6 + (i % 11 === 0 ? -1.8 : 0));
    const id = uid();
    const ts = new Date(`${date}T08:00:00`).toISOString();
    const afterBoost = rand() < 0.75 ? Math.round(rand() * 2) + (peace < 5 ? 1 : 0) : 0;
    checkins.push({ id, localDate: date, drive, peace, peaceAfter: afterBoost ? clamp(peace + afterBoost) : undefined, driveAfter: afterBoost ? clamp(drive + (rand() < 0.2 ? -1 : 0)) : undefined, createdAt: ts, updatedAt: ts, dirty: 0 });

    const s = SAMPLES[sampleIdx++ % SAMPLES.length];
    const p = PRACTICES[s.practice];
    const bodyKey = p.fields.find((f) => f.isBody)!.key;
    const resurfaceOn = s.practice === "grind" ? addMonths(date, [3, 6, 12][sampleIdx % 3]) : undefined;
    entries.push({
      id: uid(), localDate: date, practice: s.practice, prompt: p.prompt, fields: s.fields, body: s.fields[bodyKey],
      tags: s.tags, sail: s.sail, floor: s.floor, checkinId: id, resurfaceOn, createdAt: ts, updatedAt: ts, dirty: 0,
    });
  }

  // One entry from a year ago, so "On this day last year" has something to show.
  {
    const date = addDays(today, -365);
    const id = uid();
    const ts = new Date(`${date}T08:00:00`).toISOString();
    checkins.push({ id, localDate: date, drive: 8, peace: 3, createdAt: ts, updatedAt: ts, dirty: 0 });
    entries.push({
      id: uid(), localDate: date, practice: "past_self", prompt: PRACTICES.past_self.prompt,
      fields: { then: "At 26, wanting to feel like I belonged somewhere", now: "I have a few people who'd drop everything. I keep waiting to feel like I've arrived, and I keep forgetting that this is what arriving looks like." },
      body: "I have a few people who'd drop everything. I keep waiting to feel like I've arrived, and I keep forgetting that this is what arriving looks like.",
      tags: ["people"], checkinId: id, createdAt: ts, updatedAt: ts, dirty: 0,
    });
  }

  // One check-back that is due today, to show resurfacing.
  {
    const date = addMonths(today, -6);
    const id = uid();
    const ts = new Date(`${date}T08:00:00`).toISOString();
    checkins.push({ id, localDate: date, drive: 9, peace: 3, createdAt: ts, updatedAt: ts, dirty: 0 });
    entries.push({
      id: uid(), localDate: date, practice: "grind", prompt: PRACTICES.grind.prompt,
      fields: { hard: "Sleeping four hours a night while we launch", future: "I'll know I can carry a heavy season without losing myself in it. And I'll sleep like it's a luxury." },
      body: "I'll know I can carry a heavy season without losing myself in it. And I'll sleep like it's a luxury.",
      tags: ["work", "health"], checkinId: id, resurfaceOn: today, createdAt: ts, updatedAt: ts, dirty: 0,
    });
  }

  const ts0 = now();
  const mk = <T,>(x: T) => x;
  const wantA = uid(), wantB = uid(), wantC = uid();
  const ledger: LedgerItem[] = [
    mk<LedgerItem>({ id: wantA, kind: "want", text: "Raise the Series A", createdAt: ts0, updatedAt: ts0, dirty: 0 }),
    mk<LedgerItem>({ id: wantB, kind: "want", text: "A house with a yard", arrivedOn: addDays(today, -31), createdAt: new Date(Date.now() - 90 * 86400000).toISOString(), updatedAt: ts0, dirty: 0 }),
    mk<LedgerItem>({ id: wantC, kind: "want", text: "Run a sub-two-hour half marathon", createdAt: ts0, updatedAt: ts0, dirty: 0 }),
    { id: uid(), kind: "asset", text: "A team of eleven who argue with me and make it better", wantId: wantA, createdAt: ts0, updatedAt: ts0, dirty: 0 },
    { id: uid(), kind: "asset", text: "Two years of runway already, which most founders never get", wantId: wantA, createdAt: ts0, updatedAt: ts0, dirty: 0 },
    { id: uid(), kind: "asset", text: "A body that can run five miles at all", wantId: wantC, createdAt: ts0, updatedAt: ts0, dirty: 0 },
    { id: uid(), kind: "asset", text: "Dinner with my family five nights a week", createdAt: ts0, updatedAt: ts0, dirty: 0 },
  ];
  const audits: Audit[] = [
    { id: uid(), wantId: wantB, days: 30, dueOn: addDays(today, -1), createdAt: ts0, updatedAt: ts0, dirty: 0 },
    { id: uid(), wantId: wantB, days: 90, dueOn: addDays(today, 59), createdAt: ts0, updatedAt: ts0, dirty: 0 },
  ];
  const thanks: Thank[] = [
    { id: uid(), person: "Dana", reason: "She took a coffee with a nobody and it turned into my first real job. I never told her what it changed.", status: "owed", createdAt: new Date(Date.now() - 20 * 86400000).toISOString(), updatedAt: ts0, dirty: 0 },
    { id: uid(), person: "Coach Alvarez", reason: "He told me at sixteen I was allowed to be serious about something. I've been serious ever since.", status: "owed", createdAt: new Date(Date.now() - 9 * 86400000).toISOString(), updatedAt: ts0, dirty: 0 },
    { id: uid(), person: "Marcus", reason: "The 6am rehearsal calls before the big account.", status: "sent", sentAt: new Date(Date.now() - 12 * 86400000).toISOString(), createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), updatedAt: ts0, dirty: 0 },
  ];
  const reflections: Reflection[] = [
    { id: uid(), weekStart: addDays(today, -((parseDate(today).getDay() + 6) % 7) - 14), source: "local", createdAt: ts0, updatedAt: ts0, dirty: 0,
      body: "Peace was highest on the days you wrote about people (Dana, Marcus, the team) and lowest on days you wrote about the quarterly number, even though Drive was about the same either way. Mental Subtraction came with the biggest lift at close. A week is a small sample, so take it as a hint. For next week: try Invisible Chain once, and keep it about a person you'll never meet." },
  ];

  await db.transaction("rw", [db.profile, db.checkins, db.entries, db.resurfaced, db.ledger, db.audits, db.thanks, db.reflections], async () => {
    await db.ledger.clear(); await db.audits.clear(); await db.thanks.clear(); await db.reflections.clear();
    await db.ledger.bulkPut(ledger); await db.audits.bulkPut(audits); await db.thanks.bulkPut(thanks); await db.reflections.bulkPut(reflections);
    await db.checkins.clear();
    await db.entries.clear();
    await db.resurfaced.clear();
    await db.checkins.bulkPut(checkins);
    await db.entries.bulkPut(entries);
    const existing = await db.profile.get("me");
    await db.profile.put({
      id: "me", name: existing?.name || name, ritualTime: existing?.ritualTime || "07:30",
      enough: existing && Object.values(existing.enough).some(Boolean) ? existing.enough : { ...emptyEnough, ...ENOUGH },
      countedDays: false, notify: false, aiConsent: false, lenses: existing?.lenses?.length ? existing.lenses : ["watts", "marcus"], theme: existing?.theme ?? "system", timezone: existing?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      createdAt: existing?.createdAt ?? now(), updatedAt: now(), dirty: 1,
    });
  });
  void now;
}
