-- Ballast: values. "Goals move. Values hold."
-- Additive only: a new table plus nullable columns. Nothing existing is changed or dropped.
create table if not exists public.user_values (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  definition text not null default '',
  position smallint not null default 0,
  core boolean not null default true,
  custom boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists user_values_user_updated on public.user_values (user_id, updated_at);
alter table public.user_values enable row level security;
drop policy if exists "own values" on public.user_values;
create policy "own values" on public.user_values for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- The day's Floor value and evidence line. No foreign key: rows sync in any order, and values are never hard-deleted.
alter table public.checkins add column if not exists floor_value_id uuid;
alter table public.checkins add column if not exists evidence text;
-- Which value a Sail serves: a value id, or 'unsure'.
alter table public.entries add column if not exists sail_value text;
alter table public.profiles add column if not exists values_invite_dismissed boolean not null default false;
