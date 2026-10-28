-- EMPIRE ATLAS — Migration 0001: foundation schema
-- Postgres 15+ compatible. Runs on Supabase/Postgres and on the embedded PGlite engine.


-- ───────────────────────────── enums ─────────────────────────────
create type user_role as enum (
  'platform_owner', 'research_administrator', 'research_editor',
  'researcher', 'student', 'institutional_subscriber'
);
create type user_status as enum ('active', 'suspended', 'invited');
create type publish_status as enum ('draft', 'in_review', 'published', 'archived');
create type verification_status as enum (
  'verified_primary', 'supported_secondary', 'contested', 'unverified', 'hypothetical'
);
create type data_status as enum ('documented', 'interpretation', 'estimate', 'unknown', 'hypothetical');
create type source_type as enum (
  'sec_filing', 'company_filing', 'annual_report', 'archive', 'book', 'academic',
  'news', 'interview', 'press_release', 'court_record', 'property_record',
  'exchange_notice', 'trade_press', 'other'
);
create type party_kind as enum ('investor', 'institution');
create type network_node_kind as enum (
  'individual', 'company', 'bank', 'private_lender', 'investment_fund', 'government_agency',
  'real_estate_asset', 'transaction', 'partnership', 'ownership_entity', 'operating_company'
);
create type relationship_kind as enum (
  'invested_in', 'lent_to', 'borrowed_from', 'acquired', 'sold', 'owned', 'co_founded',
  'partnered_with', 'developed', 'managed', 'leased', 'guaranteed', 'advised'
);
create type linked_object_kind as enum ('investor', 'institution', 'transaction', 'claim', 'source', 'financial_model', 'historical_event');
create type date_precision as enum ('day', 'month', 'year', 'circa', 'decade');

-- ───────────────────────────── identity ─────────────────────────────
create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  email_normalized text not null unique,
  password_hash text,
  display_name text not null,
  role user_role not null default 'student',
  status user_status not null default 'active',
  researcher_number integer unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_sign_in_at timestamptz
);
create index users_role_idx on users(role);

create table profiles (
  user_id uuid primary key references users(id) on delete cascade,
  headline text,
  bio text,
  focus_markets text[] not null default '{}',
  competency_level text not null default 'research_apprentice',
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  user_agent text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
create index sessions_user_idx on sessions(user_id);
create index sessions_expires_idx on sessions(expires_at);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  kind text not null default 'institution',
  created_at timestamptz not null default now()
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  tier text not null default 'explorer',
  role_in_org text not null default 'member',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  unique (user_id, organization_id)
);

create table audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references users(id) on delete set null,
  action text not null,
  object_kind text,
  object_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip text,
  created_at timestamptz not null default now()
);
create index audit_events_actor_idx on audit_events(actor_user_id, created_at desc);

-- ───────────────────────────── research subjects ─────────────────────────────
create table investors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  full_name text not null,
  short_name text not null,
  born_year integer,
  died_year integer,
  nationality text,
  headline text,
  summary text,
  era_label text,
  primary_asset_classes text[] not null default '{}',
  publish_status publish_status not null default 'draft',
  research_status text not null default 'queued',
  roadmap_rank integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index investors_publish_idx on investors(publish_status);

create table institutions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind network_node_kind not null default 'company',
  founded_year integer,
  headquarters text,
  summary text,
  publish_status publish_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  asset_class text not null,
  market text,
  location text,
  description text,
  created_at timestamptz not null default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  lead_investor_id uuid references investors(id) on delete set null,
  announced_on date,
  closed_on date,
  date_precision date_precision not null default 'day',
  asset_description text,
  market text,
  location text,
  asset_class text,
  headline_value_usd numeric(18,2),
  headline_value_label text,
  headline_value_status data_status not null default 'unknown',
  summary text,
  rights_acquired text,
  operating_strategy text,
  subsequent_events text,
  exit_or_status text,
  verified_outcome text,
  open_questions text,
  publish_status publish_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index transactions_investor_idx on transactions(lead_investor_id);

create table transaction_participants (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions(id) on delete cascade,
  party_kind party_kind not null,
  investor_id uuid references investors(id) on delete cascade,
  institution_id uuid references institutions(id) on delete cascade,
  role text not null,
  note text,
  check ((party_kind = 'investor' and investor_id is not null) or (party_kind = 'institution' and institution_id is not null))
);
create index transaction_participants_tx_idx on transaction_participants(transaction_id);

create table ownership_interests (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) on delete cascade,
  asset_id uuid references assets(id) on delete cascade,
  holder_kind party_kind not null,
  investor_id uuid references investors(id) on delete cascade,
  institution_id uuid references institutions(id) on delete cascade,
  interest_description text not null,
  percentage numeric(6,3),
  data_status data_status not null default 'unknown',
  note text
);

-- Capital stack / sources & uses lines for a transaction.
create table capital_stack_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions(id) on delete cascade,
  side text not null check (side in ('source', 'use')),
  layer text not null,
  label text not null,
  amount_usd numeric(18,2),
  amount_label text,
  provider_institution_id uuid references institutions(id) on delete set null,
  data_status data_status not null default 'unknown',
  note text,
  sort_order integer not null default 0
);
create index capital_stack_tx_idx on capital_stack_items(transaction_id);

-- ───────────────────────────── evidence engine ─────────────────────────────
create table sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  source_type source_type not null,
  publisher text,
  author text,
  url text,
  document_reference text,
  published_on date,
  accessed_on date,
  licensing_note text,
  reliability_note text,
  created_at timestamptz not null default now()
);

create table claims (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  claim_text text not null,
  category text not null,
  investor_id uuid references investors(id) on delete set null,
  institution_id uuid references institutions(id) on delete set null,
  transaction_id uuid references transactions(id) on delete set null,
  event_date date,
  event_date_precision date_precision,
  verification_status verification_status not null default 'unverified',
  researcher_notes text,
  last_reviewed_at timestamptz,
  last_reviewed_by uuid references users(id) on delete set null,
  publish_status publish_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index claims_investor_idx on claims(investor_id);
create index claims_transaction_idx on claims(transaction_id);
create index claims_status_idx on claims(verification_status);

create table claim_sources (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  source_id uuid not null references sources(id) on delete cascade,
  excerpt text,
  locator text,
  supports boolean not null default true,
  unique (claim_id, source_id)
);
create index claim_sources_source_idx on claim_sources(source_id);

create table verification_reviews (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  reviewer_id uuid references users(id) on delete set null,
  from_status verification_status,
  to_status verification_status not null,
  note text,
  created_at timestamptz not null default now()
);
create index verification_reviews_claim_idx on verification_reviews(claim_id, created_at desc);

-- Dossier prose: one row per analytical division (1..12) per investor.
create table dossier_sections (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references investors(id) on delete cascade,
  division integer not null check (division between 1 and 12),
  title text not null,
  body_markdown text not null,
  evidence_confidence verification_status not null default 'unverified',
  updated_at timestamptz not null default now(),
  unique (investor_id, division)
);

create table historical_events (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid references investors(id) on delete cascade,
  institution_id uuid references institutions(id) on delete cascade,
  transaction_id uuid references transactions(id) on delete set null,
  claim_id uuid references claims(id) on delete set null,
  occurred_on date not null,
  date_precision date_precision not null default 'day',
  title text not null,
  description text,
  category text not null default 'milestone',
  sort_order integer not null default 0
);
create index historical_events_investor_idx on historical_events(investor_id, occurred_on);

create table quotations (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid references investors(id) on delete cascade,
  quote_text text not null,
  context text,
  source_id uuid references sources(id) on delete set null,
  locator text,
  verification_status verification_status not null default 'unverified'
);

create table relationships (
  id uuid primary key default gen_random_uuid(),
  from_kind network_node_kind not null,
  from_investor_id uuid references investors(id) on delete cascade,
  from_institution_id uuid references institutions(id) on delete cascade,
  to_kind network_node_kind not null,
  to_investor_id uuid references investors(id) on delete cascade,
  to_institution_id uuid references institutions(id) on delete cascade,
  to_transaction_id uuid references transactions(id) on delete cascade,
  to_asset_id uuid references assets(id) on delete cascade,
  relationship relationship_kind not null,
  start_year integer,
  end_year integer,
  description text,
  claim_id uuid references claims(id) on delete set null,
  is_hypothetical boolean not null default false,
  check (claim_id is not null or is_hypothetical = true)
);

-- ───────────────────────────── private user work ─────────────────────────────
create table research_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);
create index research_collections_user_idx on research_collections(user_id);

create table research_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  collection_id uuid references research_collections(id) on delete set null,
  title text not null,
  body text not null default '',
  tags text[] not null default '{}',
  linked_kind linked_object_kind,
  linked_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index research_notes_user_idx on research_notes(user_id, updated_at desc);
create index research_notes_link_idx on research_notes(linked_kind, linked_id);

create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  target_kind linked_object_kind not null,
  target_id uuid not null,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, target_kind, target_id)
);
create index bookmarks_user_idx on bookmarks(user_id, created_at desc);

create table financial_models (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  model_kind text not null,
  transaction_id uuid references transactions(id) on delete set null,
  is_hypothetical boolean not null default true,
  assumptions jsonb not null default '{}'::jsonb,
  outputs jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index financial_models_user_idx on financial_models(user_id, updated_at desc);

create table research_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  activity_kind text not null,
  object_kind linked_object_kind,
  object_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index research_progress_user_idx on research_progress(user_id, created_at desc);

create table investment_principles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  statement text not null,
  source_investor_id uuid references investors(id) on delete set null,
  supporting_transaction_id uuid references transactions(id) on delete set null,
  supporting_claim_id uuid references claims(id) on delete set null,
  relevant_risk text,
  modern_application text,
  personal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index investment_principles_user_idx on investment_principles(user_id);

create table investment_doctrines (
  user_id uuid primary key references users(id) on delete cascade,
  target_assets text,
  geographic_strategy text,
  acquisition_criteria text,
  financing_criteria text,
  risk_tolerance text,
  capital_partner_strategy text,
  committee_standards text,
  exit_strategies text,
  updated_at timestamptz not null default now()
);

-- Tracks applied migrations (managed by scripts/migrate).
create table if not exists atlas_migrations (
  name text primary key,
  applied_at timestamptz not null default now()
);
