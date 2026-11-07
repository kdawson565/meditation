-- Ballast: Library cards a person saved. Additive only.
-- The card itself lives in the app (content/library); this row only says "saved", keyed by the card's text id.
create table if not exists public.saved_cards (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  saved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);
create index if not exists saved_cards_user_updated on public.saved_cards (user_id, updated_at);
alter table public.saved_cards enable row level security;
drop policy if exists "own saved cards" on public.saved_cards;
create policy "own saved cards" on public.saved_cards for all using (user_id = auth.uid()) with check (user_id = auth.uid());
