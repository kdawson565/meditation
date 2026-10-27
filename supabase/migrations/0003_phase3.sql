-- Ballast Phase 3: Drive-after, time zone, push subscriptions.
alter table public.checkins add column drive_after smallint check (drive_after between 1 and 10);
alter table public.profiles add column timezone text not null default 'UTC';

create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  ritual_time text not null default '08:00',
  tz text not null default 'UTC',
  last_sent_on date,
  created_at timestamptz not null default now()
);
create index push_user on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
-- Users can see and remove their own subscriptions; inserts and sends go through server routes with the service role.
create policy "own push select" on public.push_subscriptions for select using (user_id = auth.uid());
create policy "own push delete" on public.push_subscriptions for delete using (user_id = auth.uid());
