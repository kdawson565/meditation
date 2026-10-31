-- Ballast: closing the Sail loop, drive practices, and the short day.
alter table public.entries add column if not exists sail_result text check (sail_result in ('filled','partly','not'));
alter table public.entries drop constraint if exists entries_practice_check;
alter table public.entries add constraint entries_practice_check check (practice in
  ('past_self','mental_subtraction','win_thank','grind','invisible_chain','unsent_thanks','enough_line','counted_days','play','control','one_move','future_pull','whose_hunger','short_day'));
