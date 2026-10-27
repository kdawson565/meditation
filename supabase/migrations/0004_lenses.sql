-- Ballast: philosophical lenses and the two lens-unlocked practices.
alter table public.profiles add column lenses text[] not null default '{}';
alter table public.entries drop constraint if exists entries_practice_check;
alter table public.entries add constraint entries_practice_check check (practice in
  ('past_self','mental_subtraction','win_thank','grind','invisible_chain','unsent_thanks','enough_line','counted_days','play','control'));
