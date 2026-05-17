-- Tree growth cycles: mature → wait 1 month → plant new
alter table public.user_trees
  add column if not exists matured_at timestamptz,
  add column if not exists cycle_baseline_co2 numeric not null default 0,
  add column if not exists trees_completed integer not null default 0;
