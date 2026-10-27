# Wiring checklist

Ballast runs fully local with none of this. Do these in order when you're ready to turn everything on. Each step says how to confirm it worked.

## 1. Supabase (accounts + sync) ✅ connected and tested (magic-link email + Google still open)
Project `ballast` (ref `gxaxjqhkvmgtezukgamm`, us-east-2) lives in the **LocatoCRE** org (Pro). Migrations 0001-0003 are applied, keys are in `.env.local`, and the redirect allow-list is `http://localhost:3111/**`. **Before deploying**, add your production URL + `/auth/callback` to Auth → URL Configuration, and swap Site URL.
Verified with throwaway users: push sync, pull on a fresh device, RLS isolation (another user reads nothing, can't insert as you, can't edit your rows), and full account deletion with cascade. Not verified: a real emailed magic link through the PKCE callback, and Google sign-in (needs Google OAuth credentials in Auth → Providers).

1. Create a project. SQL editor → run, in order: `supabase/migrations/0001_init.sql`, `0002_phase2.sql`, `0003_phase3.sql`.
2. Auth → Providers: enable Email (magic link) and Google. Auth → URL Configuration: add `http://localhost:3111/auth/callback` (and your production URL + `/auth/callback`).
3. `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. **Confirm:** restart dev, Settings → Sign in, get the link, then write an entry. Rows should appear in `checkins` and `entries` in the Supabase table editor, and a second browser signed in as the same user should show the same entries. Try Settings → Delete everything on a throwaway account and confirm the auth user and its rows are gone.

## 2. Claude (reflection, thank-you drafts, practice picks) ✅ done locally
The key is in `.env.local` (gitignored) and all three features were verified against the live API. Remaining: re-check after step 1, when these routes start requiring sign-in.

1. `.env.local`: `ANTHROPIC_API_KEY`. Restart.
2. Settings → switch on "Allow AI features".
3. **Confirm:** Weekly Reflection → "Write this week's reflection" says "Written by Claude". Thanks → "Help me draft it" gives a draft in your voice. Today → after the dials, the practice page says "Picked by Claude…". Judge the writing: reflections should be under ~180 words, specific, not flattering. Tell me what reads wrong and I'll tune the prompts in `app/api/ai/*/route.ts` and `lib/ai-server.ts`.

## 3. Push reminders (needs step 1)
1. `npx web-push generate-vapid-keys`. Put the public key in `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, the private in `VAPID_PRIVATE_KEY`, and set `VAPID_SUBJECT=mailto:you@yourdomain`.
2. Set `CRON_SECRET` to a long random string.
3. Deploy (Vercel reads `vercel.json` and calls `/api/cron/remind` every 15 minutes with the secret). Locally you can trigger it by hand:
   `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3111/api/cron/remind`
4. On a phone: install the PWA (iOS requires Add to Home Screen, iOS 16.4+), sign in, Settings → Daily reminder.
5. **Confirm:** set your ritual time to a few minutes from now, wait, and expect one quiet notification. Checking in first should suppress it. Tapping it opens Today.

## 4. Production build on a real device
`npm run build && npm run start`, open over HTTPS (or `localhost`), install it, switch to airplane mode, write an entry, reconnect, and confirm it syncs.
