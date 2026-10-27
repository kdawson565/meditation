-- Ballast Phase 1 schema. Run with `supabase db push`, or paste into the SQL editor.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  ritual_time text not null default '08:00',
  enough jsonb not null default '{}'::jsonb,
  counted_days boolean not null default false,
  notify boolean not null default false,
  ai_consent boolean not null default false,
  theme text not null default 'system' check (theme in ('system','light','dark')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checkins (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  drive smallint not null check (drive between 1 and 10),
  peace smallint not null check (peace between 1 and 10),
  peace_after smallint check (peace_after between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, local_date)
);

create table public.entries (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  practice text not null check (practice in ('past_self','mental_subtraction','win_thank','grind','invisible_chain','unsent_thanks','enough_line','counted_days')),
  prompt text not null default '',
  fields jsonb not null default '{}'::jsonb,
  body text not null default '',
  tags text[] not null default '{}',
  sail text,
  floor text,
  checkin_id uuid references public.checkins(id) on delete set null,
  resurface_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  search tsvector generated always as (to_tsvector('english', coalesce(body,'') || ' ' || coalesce(sail,'') || ' ' || coalesce(floor,''))) stored
);

create index entries_user_date on public.entries (user_id, local_date desc);
create index entries_user_updated on public.entries (user_id, updated_at);
create index checkins_user_updated on public.checkins (user_id, updated_at);
create index entries_tags on public.entries using gin (tags);
create index entries_search on public.entries using gin (search);
create index entries_resurface on public.entries (user_id, resurface_on) where resurface_on is not null;

alter table public.profiles enable row level security;
alter table public.checkins enable row level security;
alter table public.entries enable row level security;

create policy "own profile" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own checkins" on public.checkins for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own entries" on public.entries for all using (user_id = auth.uid()) with check (user_id = auth.uid());
