# Ballast

**Grow without losing your peace.** A quiet daily practice for ambitious people. Goals move. Values hold: your values are the ballast, your goals are the sails, Growth + Peace is the promise, and the Drive / Peace / Voice dials are the instruments.

Live at https://app.iamballast.com. What changed recently is in [CHANGELOG.md](CHANGELOG.md); copy waiting for your review is in [COPY-REVIEW.md](COPY-REVIEW.md); keys and accounts are in [WIRING.md](WIRING.md).

## Run it

```bash
cd ~/Desktop/ballast
npm install
npm run dev -- -p 3111      # http://localhost:3111
```

On the first screen choose **"Explore with sample data"**. You get about 120 days of check-ins (with a rough patch around week eight and a return), five values with evidence lines, and a completed 90-day season, so Today, Tide, Map and Library are all populated. Reload it any time from Settings.

No keys are needed. Without Supabase env vars Ballast runs **local-first**: everything lives in this browser's IndexedDB.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server. Checks the Library first. |
| `npm run library` | Checks every card in `content/library/` and rebuilds `lib/library.generated.json`. Fails with a list of problems if a card breaks a rule. |
| `npm run typecheck` | Library check, then TypeScript. |
| `npm run build` | Library check, then a production build. A bad card stops the build. |
| `npm run start -- -p 3111` | Serve the production build (the service worker and offline mode only work here). |

### Try the AI features locally

Put `ANTHROPIC_API_KEY` in `.env.local`. If `.env.local` also has the Supabase keys, the AI routes require a signed-in user. To test without signing in, run with the Supabase keys blanked (this is the `ballast-local-ai` entry in `~/Desktop/.claude/launch.json`, port 3112):

```bash
NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npm run dev -- -p 3112
```

Then Settings → **AI features** → read what's sent → **Turn on AI**. The server log prints one line per AI call with input, cache-write, cache-read and output tokens (`[ai] bearing: …`).

### Try the PWA / offline mode

```bash
npm run build && npm run start -- -p 3111
```
Visit each tab once, then go offline. Install from the browser menu ("Install app" / "Add to Home Screen"). Bump `VERSION` in `public/sw.js` whenever the app shell or icons change.

## The four tabs

- **Today** — one calm card: the value you carry today (with your own definition), the three dials, and the practice they suggest. Begin → a breath → the practice → your Sail. The Sail and the evening evidence line sit below the card once you're logged. With AI on, today's **Bearing** sits at the top. Arriving from a Library card (`/today?practice=<id>`) starts with that practice.
- **Tide** — a month calendar (swipe or arrows). Each practiced day is a dot whose color *and* shape name its quadrant (Ballast = full sea-green dot, Grind = top half, Harbor = right half, Fog = small gray dot); a brass ring means you noted living a value. Unpracticed days are plain. Tap a day for its dials, value, evidence line, Sail and entries. Below: days practiced (a number, never a streak), your values with their moment counts and most recent moment in your own words, Drive and Peace by week, and **Seasons** (every 90 days from your first check-in). Each month has a printable **Tide Report** (`/tide/report?m=YYYY-MM`) that fits on one page; your own words are included only if you tick the box.
- **Map** — the 30-day quadrant map, with the brass horizon as its Drive axis, plus the Growth + Peace tab.
- **Library** — principle cards in Ballast's own words. "For today" picks cards from your value, quadrant and recent practices. Browse by value or by theme (the kind of day it helps), save cards, read a card, start its practice. **Ask Ballast** lives here.

Everything else — Values, Weekly reflection, Archive, What moves you, Ledger, Thanks, Settings — is behind the **You** icon, top right. `/more` redirects there.

## The Library

One Markdown file per card in `content/library/`. The format and rules are in [content/library/README.md](content/library/README.md). `scripts/build-library.mjs` checks every card (required fields, id matches the file name, body 80–150 words, values from the 30-value deck, valid quadrants and practice id, no exclamation points, nothing that looks like a quotation, and no thinker named in the body) and writes `lib/library.generated.json`, which is bundled into the app so the Library works offline.

The 10 cards there now are **DRAFT placeholders** to show the format. Replace them with your own; set `status: published` to drop the DRAFT mark.

Retrieval (`lib/library.ts`) is a small tag-scoring function: today's value +3, another of your values +1, quadrant +2, a recently used linked practice +1, each matching word of an Ask question +1 (up to 3), shown in the last week −1. Ties go to a card matching today's value, then a stable daily order. No vector database.

## AI (Claude), grounded and off by default

AI stays off until the person turns it on, after a screen that lists exactly what each feature sends (`components/AiExplainer.tsx`). The Anthropic key lives only on the server. Features:

| Feature | Route | What it does |
|---|---|---|
| Bearing | `/api/ai/bearing` | Two sentences tying today's value to one card. Made once a day when you tap Begin. |
| Weekly reflection | `/api/ai/reflection` | Under 200 words, grounded in 1–2 cards, plus one suggested practice. |
| Ask Ballast | `/api/ai/ask` | At most one card, one reflection question and one practice per answer. 5 questions a conversation, 3 conversations a day, then a calm close. |
| Season review | `/api/ai/season` | ~300 words, mostly from your own evidence lines, when a 90-day season ends. |
| Practice pick, thank-you drafts | `/api/ai/next-practice`, `/api/ai/thank-draft` | As before. |

How the grounding is enforced (`lib/ai-server.ts`, `lib/ai-shared.ts`):
- The **server** retrieves the 2–5 cards for each request; the client can't choose them.
- Cards are sent **without their influences**, so the model never sees a thinker's name. Any answer that names a thinker (from the cards or the old Lenses) is dropped and the on-device version is used instead.
- Every card id the model returns is checked against the cards it was given; only those show as sources.
- The shared rules forbid outside quotes, sayings, studies and famous people, flattery, therapy language and diagnosis.
- Output is structured JSON (`zod` + the SDK's `zodOutputFormat`), capped by sentences or words. Ask answers lose any sentence that invites more chatting.
- Serious distress in an Ask question or a season's evidence lines skips the model and shows the 988 support line.
- A refusal or any failure falls back to the on-device version and says so.

Model: `claude-sonnet-5-5` with extended thinking off (`between_tools`); the grounded features run at low effort. The rules and each feature's instructions are cached system blocks, and the conversation so far is cached too, so repeat Bearings and every Ask turn read most of their input from cache. (Features can't share a cache: each one's JSON format is part of the prompt.)

Limits: 20 AI calls an hour per person (in memory), plus durable daily caps stored in Supabase `ai_usage` (Bearing 3/day, Ask 3 sessions/day × 5 turns, season 3/day). Locally, without Supabase, the daily caps are kept in memory.

What the AI writes is stored in `aiOutputs` (Bearings, Ask sessions, season reviews) and on `reflections` (with card ids and the suggested practice). It syncs, is included in both exports, and is deleted with your data. **There are no analytics** in Ballast; keep it that way.

## How it's organised

| Path | What |
|---|---|
| `app/globals.css`, `tailwind.config.ts` | Design tokens (light, dark, print), type scale, cards, chips, sheet |
| `components/HorizonLine.tsx` | The brass horizon: Today, the calendar's tide line, the Map's axis |
| `components/MonthCalendar.tsx`, `DayDot.tsx`, `DayDetail.tsx`, `Sheet.tsx` | Tide calendar, quadrant dots, the day sheet |
| `lib/tide.ts` | Month summaries, value moments, 90-day seasons and their data review |
| `content/library/`, `scripts/build-library.mjs`, `lib/library.ts` | Library cards, the checker, retrieval |
| `lib/ai-server.ts`, `lib/ai-shared.ts`, `app/api/ai/*` | Grounded AI (server only) |
| `lib/practices.ts` | Practice registry. Adding a practice = adding one object here |
| `lib/selection.ts` | Rule-based "which practice today" |
| `lib/resurface.ts` | What to bring back at close |
| `lib/quadrant.ts` | Quadrants; dividing lines are 5.5 until 14 check-ins, then your own median |
| `lib/db.ts`, `store.ts`, `sync.ts` | IndexedDB (Dexie, version 5), writes, Supabase sync |
| `lib/lenses.ts` | The older thinker Lenses (paraphrases). Due to be retired once the real Library exists |
| `supabase/migrations/` | `0001`–`0010`, all additive |

A "day" rolls over at 4am local time. Writes always hit IndexedDB first and sync when signed in and online; newest `updated_at` wins.

## Earlier features, in brief

- **Values:** 3–5 core values (30-value deck plus your own) with your own definitions; set in onboarding or at `/values`. Values never hard-delete (dropped ones become `core: false`). The Floor is the value you carry today; a Sail can name the value it serves (or "Not sure"). Six value practices appear once values are set.
- **Voice:** the third dial (Critic → Advocate) with four Voice practices; a missed Sail asks what your advocate would say.
- **Sails:** yesterday's Sail is asked about once (filled / partly / not); on a miss, the value you carried comes back.
- **Ledger** with the Arrival Audit, **Thanks** with drafts, **Weekly reflection**, **What moves you** (before/after by practice), push reminders, the 2-minute short day.
- **Brand:** "Level line" mark. Geometry in `lib/brand.json`; `npm run icons` regenerates every icon and `public/brand/`. `components/Logo.tsx` renders the mark and wordmark.
- **Marketing site:** copy changes for iamballast.com are in `MARKETING-COPY.md`.

## Design system

- **Colors:** navy `#16223A`, paper `#F6F1E7`, surface `#FCF9F2`, brass `#B08D57`, sea green `#78A89E`, muted `#5A6270`; dark: `#0B1626` / `#13213A` / `#E9E4D8` / `#A3A9B3` / `#C9A46A` / `#8FBDB3`. Brass and sea green fail text contrast on light paper (2.75:1 and 2.36:1), so in light mode they are only lines, rings and fills; brass-colored text uses `--brass-ink` `#7A5A28` (5.6:1), and dots use `--sea-dot` `#5E9488` (3:1 for shapes).
- **Quadrant dots:** `--q-ballast/grind/harbor` passed the colorblind validator in both modes; Fog is a deliberate gray, and every quadrant also has its own shape.
- **Type:** Newsreader (headlines, values, card titles, reading) and Inter (UI), bundled by `next/font`. Scale 34 / 26 / 21 / 18 serif; 16 / 15 / 13 sans.
- **Motion:** 300–600 ms ease-out fades, the horizon draws in once, the tide rises at the end of the ritual. All of it stops under `prefers-reduced-motion`.
- No shadows, gradients, confetti, badges, streaks, or red.

## Accessibility

axe-core (WCAG 2.0/2.1/2.2 A and AA) runs clean at 375px in light and dark on Today, Tide, the Tide Report, Map, Library, a card, Ask Ballast, Reflection, Settings and You. Calendar days are buttons with full spoken labels ("Thursday, October 1: The Harbor, lived a value"); every chart has a table or text alternative. Automated checks cover about a third of WCAG; nothing has been tested by a person using a screen reader.

## Known gaps / unverified

- **Database:** migrations `0009_saved_cards.sql` and `0010_grounded_ai.sql` are written but **not applied** to the live project yet. Until they are, saved cards and AI outputs stay on the device and the signed-in daily AI caps can't be stored.
- **AI in cloud mode:** every AI feature was tested against the live API in local mode (no sign-in). Not yet tested signed in, where the durable daily caps apply.
- **Push reminders, emailed magic link, Google sign-in:** not verified on a phone. See WIRING.md.
- The Library is 10 DRAFT placeholder cards. The old Lenses still show "in the spirit of" ideas on Today alongside the new cards.
- No automated tests.
