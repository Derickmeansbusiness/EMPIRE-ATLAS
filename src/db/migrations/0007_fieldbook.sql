-- EMPIRE ATLAS — Migration 0007: The Investor's Fieldbook
-- Source passages and analyses, practice exercises, properties, field inspections, findings, private media,
-- underwriting challenge attempts and saved screening reports.
-- Platform rows (featured passages, fictional properties, editorial analyses) have user_id NULL and are readable by
-- everyone; user rows are private to their owner.

create table source_passages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  slug text unique,
  source_title text not null,
  author text not null,
  source_kind text not null default 'book' check (source_kind in ('book', 'interview', 'letter', 'lecture', 'article', 'filing', 'other')),
  published_label text,          -- as the user gave it (year, date); NULL = unknown
  edition text,
  location text,                 -- page, chapter, timestamp
  source_url text,
  excerpt text,                  -- short user-supplied quotation; NULL for platform records that carry none
  is_first_person boolean not null default true,
  investor_id uuid references investors(id) on delete set null,
  user_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(coalesce(excerpt, '')) <= 1500)
);
create index source_passages_user_idx on source_passages(user_id);

create table quote_analyses (
  id uuid primary key default gen_random_uuid(),
  passage_id uuid not null references source_passages(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  ai_assisted boolean not null default false,
  created_at timestamptz not null default now()
);
create index quote_analyses_passage_idx on quote_analyses(passage_id);

create table analysis_statements (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references quote_analyses(id) on delete cascade,
  dimension smallint not null check (dimension between 1 and 10),
  body text not null,
  evidence_class text not null check (evidence_class in ('direct_source_claim', 'verified_supporting_fact', 'analytical_interpretation', 'unsupported_conclusion', 'hypothetical_application')),
  position integer not null default 0
);
create index analysis_statements_analysis_idx on analysis_statements(analysis_id, dimension, position);

create table practice_exercises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  passage_id uuid references source_passages(id) on delete cascade,
  historical_behavior text not null,
  skill_key text not null,
  skill_label text not null,
  modern_exercise text not null,
  launch_href text,
  position integer not null default 0
);

create table properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  slug text not null unique,
  name text not null,
  asset_class text not null check (asset_class in ('multifamily', 'single_family_rental', 'industrial', 'retail', 'office', 'hospitality', 'mixed_use')),
  units integer,
  year_built integer,
  location_label text,
  is_fictional boolean not null default false,
  summary text,
  challenge_slug text,
  created_at timestamptz not null default now()
);

create table inspection_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  template_slug text not null,
  status text not null default 'draft' check (status in ('draft', 'completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  location jsonb,                -- only when the user taps "tag location" and the browser grants permission
  summary_note text,
  updated_at timestamptz not null default now()
);
create index inspection_sessions_user_idx on inspection_sessions(user_id, started_at desc);

create table inspection_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references inspection_sessions(id) on delete cascade,
  item_key text not null,
  rating text not null check (rating in ('good', 'fair', 'poor', 'not_observed')),
  note text,
  observed_at timestamptz not null default now(),
  unique (session_id, item_key)
);

create table findings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references inspection_sessions(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  item_key text,
  location_label text not null,
  component text not null,
  description text not null,
  condition text not null default 'unknown' check (condition in ('good', 'fair', 'poor', 'unknown')),
  severity text not null check (severity in ('information_only', 'minor_maintenance', 'material_repair', 'major_capital_replacement', 'potential_safety_issue', 'specialist_investigation_required')),
  confidence text not null default 'medium' check (confidence in ('low', 'medium', 'high')),
  financial_impact text,
  specialist_needed text,
  follow_up_status text not null default 'open' check (follow_up_status in ('open', 'in_progress', 'resolved', 'wont_fix')),
  cost_low numeric(14,2),
  cost_high numeric(14,2),
  cost_source text,
  resolution text,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cost_low is null or cost_low >= 0),
  check (cost_high is null or (cost_low is not null and cost_high >= cost_low)),
  check (cost_low is null or (cost_source is not null and char_length(cost_source) > 0))
);
create index findings_session_idx on findings(session_id);

-- Finding history: every edit appends the previous values so revised findings stay auditable.
create table finding_revisions (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid not null references findings(id) on delete cascade,
  snapshot jsonb not null,
  revised_at timestamptz not null default now()
);

create table inspection_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  session_id uuid not null references inspection_sessions(id) on delete cascade,
  finding_id uuid references findings(id) on delete set null,
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_size integer not null check (byte_size > 0 and byte_size <= 4000000),
  data_base64 text not null,
  caption text,
  created_at timestamptz not null default now()
);
create index inspection_media_session_idx on inspection_media(session_id);

create table follow_up_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  session_id uuid not null references inspection_sessions(id) on delete cascade,
  finding_id uuid references findings(id) on delete set null,
  title text not null,
  due_on date,
  status text not null default 'open' check (status in ('open', 'done')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  challenge_slug text not null,
  answers jsonb not null,
  result jsonb not null,
  score integer not null,
  max_score integer not null,
  created_at timestamptz not null default now()
);
create index challenge_attempts_user_idx on challenge_attempts(user_id, challenge_slug, created_at desc);

create table fieldbook_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  session_id uuid references inspection_sessions(id) on delete set null,
  attempt_id uuid references challenge_attempts(id) on delete set null,
  title text not null,
  snapshot jsonb not null,
  markdown text not null,
  note_id uuid references research_notes(id) on delete set null,
  created_at timestamptz not null default now()
);
create index fieldbook_reports_user_idx on fieldbook_reports(user_id, created_at desc);

-- Row level security (defence in depth; the application also scopes every query by user)
alter table source_passages enable row level security;
create policy source_passages_read on source_passages for select using (user_id is null or user_id = auth.uid());
create policy source_passages_write on source_passages for all using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table quote_analyses enable row level security;
create policy quote_analyses_read on quote_analyses for select using (user_id is null or user_id = auth.uid());
create policy quote_analyses_write on quote_analyses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table properties enable row level security;
create policy properties_read on properties for select using (user_id is null or user_id = auth.uid());
create policy properties_write on properties for all using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table inspection_sessions enable row level security;
create policy inspection_sessions_owner on inspection_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table findings enable row level security;
create policy findings_owner on findings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table inspection_media enable row level security;
create policy inspection_media_owner on inspection_media for all using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table follow_up_actions enable row level security;
create policy follow_up_actions_owner on follow_up_actions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table challenge_attempts enable row level security;
create policy challenge_attempts_owner on challenge_attempts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table fieldbook_reports enable row level security;
create policy fieldbook_reports_owner on fieldbook_reports for all using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table inspection_items enable row level security;
create policy inspection_items_owner on inspection_items for all using (
  exists (select 1 from inspection_sessions s where s.id = inspection_items.session_id and s.user_id = auth.uid())
);
alter table finding_revisions enable row level security;
create policy finding_revisions_owner on finding_revisions for all using (
  exists (select 1 from findings f where f.id = finding_revisions.finding_id and f.user_id = auth.uid())
);
