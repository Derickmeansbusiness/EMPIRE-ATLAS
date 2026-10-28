-- EMPIRE ATLAS — Migration 0005: simulation attempts and investment committee submissions (Phase 4)

create type attempt_status as enum ('in_progress', 'completed', 'abandoned');

create table simulation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  scenario_slug text not null,
  status attempt_status not null default 'in_progress',
  choices jsonb not null default '[]'::jsonb,
  score jsonb,
  final_state jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);
create index simulation_attempts_user_idx on simulation_attempts(user_id, updated_at desc);
alter table simulation_attempts enable row level security;
create policy simulation_attempts_owner on simulation_attempts for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create type committee_verdict as enum ('approved', 'approved_with_conditions', 'resubmit', 'declined');

create table investment_committee_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  thesis text not null,
  asset_details text not null default '',
  sources_and_uses text not null default '',
  assumptions_narrative text not null default '',
  capital_stack text not null default '',
  risks text not null default '',
  sensitivity text not null default '',
  exit_strategy text not null default '',
  recommendation text not null,
  model_id uuid references financial_models(id) on delete set null,
  model_snapshot jsonb,
  evaluation jsonb not null,
  memo_markdown text not null,
  score integer not null,
  verdict committee_verdict not null,
  created_at timestamptz not null default now()
);
create index icm_user_idx on investment_committee_submissions(user_id, created_at desc);
alter table investment_committee_submissions enable row level security;
create policy icm_owner on investment_committee_submissions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
