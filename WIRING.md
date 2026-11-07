# Wiring checklist

Ballast runs fully local with none of this. Do these in order when you're ready to turn everything on. Each step says how to confirm it worked.

## 1. Supabase (accounts + sync) ✅ connected and tested (magic-link email + Google still open)
Project `ballast` (ref `gxaxjqhkvmgtezukgamm`, us-east-2) lives in the **LocatoCRE** org (Pro). Migrations 0001-0008 are applied; **0009 (saved cards) and 0010 (AI outputs, AI usage caps, sources on reflections) are written but not applied yet** — apply them when the redesign ships (`npx supabase db query --linked < supabase/migrations/0009_saved_cards.sql`, then `0010_grounded_ai.sql`, or paste each into the SQL editor). Keys are in `.env.local`. Site URL is https://app.iamballast.com; the redirect allow-list also has localhost:3111 and the old vercel.app address.
Verified with throwaway users: push sync, pull on a fresh device, RLS isolation (another user reads nothing, can't insert as you, can't edit your rows), and full account deletion with cascade. Not verified: a real emailed magic link through the PKCE callback, and Google sign-in (needs Google OAuth credentials in Auth → Providers).

1. Create a project. SQL editor → run, in order: `supabase/migrations/0001_init.sql`, `0002_phase2.sql`, `0003_phase3.sql`, `0004_lenses.sql`, `0005_drive.sql`, `0006_voice.sql`, `0007_values.sql`, `0008_value_practices.sql`, `0009_saved_cards.sql`, `0010_grounded_ai.sql`.
2. Auth → Providers: enable Email (magic link) and Google. Auth → URL Configuration: add `http://localhost:3111/auth/callback` (and your production URL + `/auth/callback`).
3. `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. **Confirm:** restart dev, Settings → Sign in, get the link, then write an entry. Rows should appear in `checkins` and `entries` in the Supabase table editor, and a second browser signed in as the same user should show the same entries. Try Settings → Delete everything on a throwaway account and confirm the auth user and its rows are gone.

## 2. Claude (Bearing, Ask Ballast, reflections, season reviews, practice picks, thank-you drafts) ✅ done locally
The key is in `.env.local` (gitignored) and every feature was verified against the live API in local mode (no sign-in). Remaining: re-check signed in, after migration 0010 is applied, because that's when the durable daily caps (`ai_usage`) kick in. The caps need `SUPABASE_SERVICE_ROLE_KEY` on the server (already set for account deletion).

1. `.env.local`: `ANTHROPIC_API_KEY`. Restart. On Vercel, set the same key in the project's environment variables.
2. Settings → **AI features** → read the explanation → **Turn on AI**.
3. **Confirm, signed in:**
   - Today → choose a value → Begin → finish. The close screen shows **Today's bearing** with a tappable source card.
   - Library → **Ask Ballast** → ask two questions. Each answer shows a source; "2 of 3 conversations left today" drops by one per new conversation; a sixth question in one conversation is refused. In Supabase, `ai_usage` has one row per answer and `ai_outputs` has an `ask-…` row.
   - You → Weekly reflection → write it. It shows sources and a "Next week, try" button.
   - Tide → a completed season shows an AI review above "The numbers".
   - Server logs show `[ai] <feature>: … cache read N` with N above zero on repeat Bearings and on Ask turns after the first.
4. Judge the writing against `COPY-REVIEW.md` §8. Tell me what reads wrong and I'll tune the prompts in `lib/ai-server.ts` and `app/api/ai/*/route.ts`.

## 3. Push reminders (needs step 1)
1. `npx web-push generate-vapid-keys`. Put the public key in `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, the private in `VAPID_PRIVATE_KEY`, and set `VAPID_SUBJECT=mailto:you@yourdomain`.
2. Set `CRON_SECRET` to a long random string.
3. Deploy (Vercel reads `vercel.json` and calls `/api/cron/remind` every 15 minutes with the secret). Locally you can trigger it by hand:
   `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3111/api/cron/remind`
4. On a phone: install the PWA (iOS requires Add to Home Screen, iOS 16.4+), sign in, Settings → Daily reminder.
5. **Confirm:** set your ritual time to a few minutes from now, wait, and expect one quiet notification. Checking in first should suppress it. Tapping it opens Today.

## 4. Production build on a real device
`npm run build && npm run start`, open over HTTPS (or `localhost`), install it, switch to airplane mode, write an entry, reconnect, and confirm it syncs.
