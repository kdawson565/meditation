-- Ballast: the value practices (Phase 2 of the values work).
alter table public.entries drop constraint if exists entries_practice_check;
alter table public.entries add constraint entries_practice_check check (practice in
  ('past_self','mental_subtraction','win_thank','grind','invisible_chain','unsent_thanks','enough_line','counted_days','play','control',
   'one_move','future_pull','whose_hunger','short_day','advocate_reply','use_name','evidence_file','self_friend',
   'lived_value','easier_self','held_value','values_conflict','drift_check','values_not_outcomes'));
