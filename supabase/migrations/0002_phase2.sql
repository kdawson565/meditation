-- Ballast Phase 2: Ledger, Arrival Audit, Unsent Thanks, Weekly Reflection.
create table public.ledger_items (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('want','asset')),
  text text not null,
  want_id uuid references public.ledger_items(id) on delete set null,
  arrived_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create table public.audits (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  want_id uuid not null references public.ledger_items(id) on delete cascade,
  days smallint not null check (days in (30, 90)),
  due_on date not null,
  glow smallint check (glow between 1 and 10),
  note text,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.thanks (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  person text not null,
  reason text not null default '',
  status text not null default 'owed' check (status in ('owed','sent')),
  draft text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create table public.reflections (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  body text not null,
  source text not null default 'local' check (source in ('ai','local')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create index ledger_user_updated on public.ledger_items (user_id, updated_at);
create index audits_user_due on public.audits (user_id, due_on);
create index thanks_user_updated on public.thanks (user_id, updated_at);
create index reflections_user_updated on public.reflections (user_id, updated_at);

alter table public.ledger_items enable row level security;
alter table public.audits enable row level security;
alter table public.thanks enable row level security;
alter table public.reflections enable row level security;
create policy "own ledger" on public.ledger_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own audits" on public.audits for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own thanks" on public.thanks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own reflections" on public.reflections for all using (user_id = auth.uid()) with check (user_id = auth.uid());
