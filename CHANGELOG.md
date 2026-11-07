# Changelog

## Unreleased: redesign, Tide calendar, Library, grounded AI (2026-11-06)

Built in five phases. Nothing here is deployed yet; migrations `0009` and `0010` must be applied when it ships.

### Design system and shell (Phase 1)
- New type: Newsreader for headlines, values and card titles; Inter for UI. Bundled by `next/font`, so it works offline.
- Dark mode matched to the spec (surface `#13213A`, muted `#A3A9B3`, sea green `#8FBDB3`). Light mode already matched.
- New tokens: `--sea-dot` (sea green deep enough for a dot on paper), quadrant colors, and print colors.
- Type scale reset to 34 / 26 / 21 / 18 serif and 16 / 15 / 13 sans.
- The **horizon line**: a thin brass line with one tick, used on Today (the tick follows the time of day), as the Tide's tide line, and as the Map's Drive axis.
- Shared pieces: `card`, `card-quiet`, `chip`, `eyebrow`, a bottom `Sheet`, `Segmented` tabs.
- **Four tabs:** Today · Tide · Map · Library. Values, Reflection, Archive, What moves you, Ledger, Thanks and Settings moved behind a **You** icon, top right. `/more` redirects to `/you`.
- **Today** is one calm card: the value you carry today with your definition, the three dials, the practice they suggest, and Begin. You choose the value up front, so the Sail step no longer asks for it. The logged view is a summary card, with the Sail and the evening line below it.
- The tide rises gently at the end of the ritual.
- Sample data is now about 120 days, with a rough stretch and a return.

### Tide calendar and Progress (Phase 2)
- Month calendar with swipe and arrows. Dot color *and* shape show each day's quadrant; a brass ring marks a day you noted living a value. Unpracticed days are plain, never marked missed.
- Tap a day: a sheet with its dials, quadrant, value carried and evidence line, Sail and result, entries, and a link to the archive.
- Days practiced shown as a number, never a streak. A values panel shows each value's moment count and most recent moment in your own words. Drive and Peace by week.
- **Seasons:** every 90 days from your first check-in, a plain-language data review plus three of your own lines. Seasons with no check-ins aren't listed.
- **Monthly Tide Report** (`/tide/report?m=YYYY-MM`): the month's map path, the calendar, average dials, Sails filled and values lived, on one printed page. Your own words appear only if you tick the box.
- Sample data no longer creates two lone old check-ins, which had pushed the first season a year back.

### Library (Phase 3)
- Principle cards as Markdown in `content/library/`, with a checker that blocks the build on any rule break (`npm run library`).
- 10 DRAFT placeholder cards, to show the format.
- Library tab: For today, browse by value (yours first, the rest behind "More values"), by theme, and Saved.
- Card page: values, the kind of day it helps, the body, a question to carry, "Start the practice", Save, and an influences line saying the ideas are in Ballast's own words, with no quotation and no endorsement.
- Saved cards sync (migration `0009`), are included in both exports, and are deleted with your data.
- Retrieval in `lib/library.ts`: simple tag scoring, shared by the Library and the AI.

### Grounded AI (Phase 4)
- Consent: AI is off until you turn it on, after a screen listing exactly what each feature sends (Settings and onboarding).
- **Bearing:** two sentences a day tying your value to one card, with the card as a tappable source.
- **Weekly reflection:** rebuilt on 1–2 cards with sources and one suggested practice. It no longer sends Lens ideas.
- **Ask Ballast:** a bounded conversation of 5 questions, 3 a day, with one card, one question and one practice per answer, and a calm close.
- **Season review:** about 300 words from your own evidence lines when a season ends.
- Grounding enforced in code:
  - the server picks the cards;
  - cards go to the model without thinker names;
  - answers naming a thinker are dropped;
  - only card ids the model was given are shown;
  - distress skips the model and shows the 988 line;
  - refusals fall back to the on-device version.
- Switched from raw `fetch` to the official Anthropic SDK (`@anthropic-ai/sdk` 1.6) with structured JSON output via `zod`. Model stays `claude-sonnet-5-5`.
- Prompt caching on the rules and the conversation so far.
- Durable daily caps in Supabase `ai_usage` (migration `0010`).
- AI outputs sync, export and delete like everything else (migration `0010`).
- Thank-you drafts: no longer pad short notes with invented details or add a note to you.

### Docs (Phase 5)
- README rewritten for the current app, plus this changelog, [COPY-REVIEW.md](COPY-REVIEW.md), and WIRING updated for migrations `0009`–`0010`.

## Earlier

- **2026-11-06** Values, Phases 1–3: "Grow without losing your peace", value practices, Win → Thank → Value, the reflection with value patterns (`7213045`, `33812a5`, `8f196e8`).
- Brand: Level line logo, app icons, favicon, wordmark (`176661f`).
- Voice, the third pillar: inner critic to inner advocate (`ed66817`).
