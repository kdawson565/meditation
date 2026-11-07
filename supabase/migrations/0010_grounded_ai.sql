-- Ballast: grounded AI. Additive only.

-- What the AI wrote for you: daily Bearings, Ask Ballast sessions, season reviews. Synced, exported, deleted with your account.
-- Keyed by (user, id) where id is e.g. "bearing-2026-11-06", "season-2", "ask-<uuid>".
create table if not exists public.ai_outputs (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('bearing', 'ask', 'season')),
  body text not null default '',
  card_ids text[] not null default '{}',
  data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);
create index if not exists ai_outputs_user_updated on public.ai_outputs (user_id, updated_at);
alter table public.ai_outputs enable row level security;
drop policy if exists "own ai outputs" on public.ai_outputs;
create policy "own ai outputs" on public.ai_outputs for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- The weekly reflection now cites its cards and suggests one practice.
alter table public.reflections add column if not exists card_ids text[] not null default '{}';
alter table public.reflections add column if not exists practice_id text;

-- Counts for daily caps (Ask Ballast: 3 sessions a day, 5 turns each). Server only: RLS on, no policies,
-- so only the service role can read or write. No entry text is ever stored here.
create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  session_id text,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_user_feature_time on public.ai_usage (user_id, feature, created_at);
alter table public.ai_usage enable row level security;
