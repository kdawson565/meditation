# Ballast

**Grow without losing your peace.** A quiet daily practice for ambitious people. Goals move. Values hold: your values are the ballast, your goals are the sails.

**Phase 1:** onboarding, the daily ritual (two dials, breath gate, practice, Floor & Sail, close with resurfacing), Archive, the Drive/Peace Map with the tide line, export, deletion, installable offline PWA, optional Supabase sync.

**Thinkers:** all eleven (Alan Watts, Marcus Aurelius, Seneca, Epictetus, Thich Nhat Hanh, Lao Tzu, Zhuangzi, Epicurus, Thoreau, Viktor Frankl, Naval Ravikant) are always woven in. Short ideas from them appear under practice prompts and on the close screen, and the weekly reflection frames its suggestion in the spirit of two rotating voices. Users can mark any number of favorites, who come up three times as often. "Play, not progress" and "What's yours to steer" are open to everyone. All content is hand-written paraphrase in `lib/lenses.ts`, labelled as such, never quotation.

**Peace and drive:** yesterday's Sail is asked about once at the next check-in (filled / partly / not), and on a miss that day's Floor comes back. Insights shows your 30-day follow-through. Three drive practices (One honest move, Future pull, Whose hunger is this?) lead on calm-but-flat Harbor days. Dials start at 5 with a faint marker for your last check-in, so yesterday doesn't anchor today. A 2-minute short day (dials + one line) still counts.

**Voice, the third pillar:** a daily Voice dial (Critic to Advocate) sits under Drive and Peace. Low Voice leads with four practices: Advocate's reply, Use your name (distanced self-talk), Evidence file, and Treat yourself like a friend (self-compassion). A missed Sail asks what your advocate would say. The map rings days with Voice of 7 or higher, Insights compares Peace and Drive on kinder versus harsher days, and the weekly reflection mentions the trend and can echo an advocate line, never a critic line. Distress checks also cover what you write in a practice.

**Values (four layers: Values → Goals/Sails → Growth + Peace → Dials):** people choose 3–5 core values (30-value deck plus their own) and write what each looks like on a good day; definitions can be left blank. New users do it in onboarding; existing users get a skippable invitation on Today, and Settings → Your values edits them anytime (`/values`). With values set, the Floor becomes "Today I carry: <value>" with their definition, and each Sail can name the value it serves (or "Not sure"; two of those in two weeks makes "Whose hunger is this?" more likely). An optional evidence line ("One moment today you lived Presence") sits on the logged screen, at an evening close, and the next morning for yesterday; blank days show nothing. A miss on a Sail shows the value carried that day. The Map fills dots on days with an evidence line (hollow otherwise) and adds a Growth + Peace tab: weekly Drive/Peace, Sails filled per week, and Peace/Drive on value days vs. other days (counted from when values began, shown at 14+ days with 5+ on each side). Values never hard-delete (dropped ones become `core: false`), so history keeps its names. Stored on the device first (`values` table, `checkins.floorValueId/evidence`, `entries.sailValue`), synced via `0007_values.sql`, included in both exports. Six value practices appear once values are set: Lived in front of you, Easier to be yourself, Held when it was hard (value-aimed gratitude), Values in conflict, a Monthly drift check (first week of the month), and Values, not outcomes (suggested the morning after a missed Sail). Win → Thank ends with an optional "which value did this win express?". Practice fields with `kind: "value"` render as value chips and store the value's name (`0008_value_practices.sql`).

**Brand:** route 02 "Level line": sail with a sliver of mast (drive), level line (peace), brass weight below (voice). Geometry lives in `lib/brand.json`; `node scripts/make-icons.mjs` regenerates every icon and `public/brand/` (symbol SVG/PNGs, 1024 app icon). `components/Logo.tsx` renders the mark plus the Jost wordmark, optionally with "i am". Bump `VERSION` in `public/sw.js` whenever icons change.

**Phase 3:** push reminders, AI-assisted practice picks, before/after insights ("What moves you") with Drive-after tracking, and an automated accessibility audit.

**Phase 2:** the Ledger with Arrival Audit, Unsent Thanks with a draft helper, Weekly Reflection, and three more practices (Invisible Chain, Enough Line check, Counted Days, opt-in).

## Run it

```bash
cd ~/Desktop/ballast
npm install
npm run dev -- -p 3111      # http://localhost:3111
```

On the first screen choose **"Explore with sample data"** to get ~50 days of check-ins and 43 entries, so the Map and Archive are populated. (You can reload sample data any time from Settings.)

No keys are needed. Without Supabase env vars Ballast runs **local-first**: everything lives in this browser's IndexedDB.

### Try the PWA / offline mode

```bash
npm run build && npm run start -- -p 3111
```
Open it, visit Today/Map/Archive once, then go offline. The service worker only registers in production builds. Install from the browser menu ("Install app" / "Add to Home Screen").

### Turn on accounts + cloud sync (Supabase)

1. Create a Supabase project. In the SQL editor run `supabase/migrations/0001_init.sql` (tables + row-level security on every table).
2. Auth → Providers: enable Email (magic link) and Google. Add `http://localhost:3111/auth/callback` as a redirect URL.
3. Also run `supabase/migrations/0002_phase2.sql` (Ledger, audits, thanks, reflections, all with RLS).
4. `cp .env.example .env.local` and fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (server only, used by account deletion).

### Turn on the AI features (Claude)

Put `ANTHROPIC_API_KEY` in `.env.local` (server only; it never reaches the browser) and restart. Then switch on **Settings → Allow AI features**. The browser calls only this app's `/api/ai/*` routes. In cloud mode they require a signed-in user and are limited to 20 calls an hour. Only what you ask to be processed is sent: the week's entries and dials for a reflection, or one person's name and your note for a thank-you draft. Without a key, consent, or a connection, both features fall back to a plain on-device version and say so.

Writes always hit IndexedDB first (so the ritual works offline) and sync when signed in and online. IDs are client-generated, so retries are idempotent; newest `updated_at` wins.

## How it's organised

| Path | What |
|---|---|
| `lib/practices.ts` | Practice registry. Adding a practice = adding one object here |
| `lib/selection.ts` | Rule-based "which practice today" (transparent reasons) |
| `lib/resurface.ts` | What to bring back at close (due check-backs → low-Peace Past-Self → this day last year → older entry → Enough Line) |
| `lib/quadrant.ts` | Quadrants; dividing lines are 5.5 until 14 check-ins, then your own median |
| `lib/db.ts`, `store.ts`, `sync.ts` | IndexedDB (Dexie), writes, Supabase sync |
| `app/(app)/*` | Today, Map, Archive, Settings (+ Phase 2 placeholders) |
| `app/api/account` | Server-side account deletion |

A "day" rolls over at 4am local time.

## Wiring it up

Everything that needs a key or an account is listed, in order, with how to confirm each step, in [WIRING.md](WIRING.md).

## Accessibility

An axe-core audit (WCAG 2.0/2.1/2.2 A and AA rules plus best practices) ran on every screen at 375px in light mode, and on Today, Map, Ledger, Archive and Settings in dark mode, including each step of the ritual. It found one issue (the breath screen had no heading), which is fixed, and the map's day list is now keyboard-selectable. Automated checks cover roughly a third of WCAG; keyboard flow, screen-reader wording and reduced-motion have **not** been tested by a person with assistive tech.

## Known gaps / unverified

- The Claude routes (`/api/ai/*`) were exercised against the live API in local mode (reflection, thank-you draft, practice pick, and a distress-signal case), but not yet in cloud mode with sign-in required, and prompt tuning is still open.
- Push reminders: the subscribe flow, cron route and service-worker handlers are written, but no notification has ever been delivered (no VAPID keys, no deployment).
- Supabase is connected and sync, new-device pull, row-level security and account deletion were tested against the live project. **Not tested:** a real emailed magic link end to end, and Google sign-in.
- Offline mode and installability are built but not checked in a production build on a device.
- Insights compare same-day before/after ratings, so they show association, not cause.
- No automated tests; accessibility audit is automated-only (see above).
