# Ballast

A quiet daily gratitude practice for people who want inner peace **and** high achievement. Gratitude isn't the opposite of ambition. It's ballast.

**Phase 1:** onboarding, the daily ritual (two dials, breath gate, practice, Floor & Sail, close with resurfacing), Archive, the Drive/Peace Map with the tide line, export, deletion, installable offline PWA, optional Supabase sync.

**Thinkers:** all eleven (Alan Watts, Marcus Aurelius, Seneca, Epictetus, Thich Nhat Hanh, Lao Tzu, Zhuangzi, Epicurus, Thoreau, Viktor Frankl, Naval Ravikant) are always woven in. Short ideas from them appear under practice prompts and on the close screen, and the weekly reflection frames its suggestion in the spirit of two rotating voices. Users can mark any number of favorites, who come up three times as often. "Play, not progress" and "What's yours to steer" are open to everyone. All content is hand-written paraphrase in `lib/lenses.ts`, labelled as such, never quotation.

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
