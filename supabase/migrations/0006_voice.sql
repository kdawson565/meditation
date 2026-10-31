-- Ballast: the third pillar, Voice (inner critic to inner advocate), and its practices.
alter table public.checkins add column if not exists voice smallint check (voice between 1 and 10);
alter table public.entries add column if not exists sail_advocate text;
alter table public.entries drop constraint if exists entries_practice_check;
alter table public.entries add constraint entries_practice_check check (practice in
  ('past_self','mental_subtraction','win_thank','grind','invisible_chain','unsent_thanks','enough_line','counted_days','play','control',
   'one_move','future_pull','whose_hunger','short_day','advocate_reply','use_name','evidence_file','self_friend'));
