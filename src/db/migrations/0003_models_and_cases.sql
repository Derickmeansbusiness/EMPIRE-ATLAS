-- EMPIRE ATLAS — Migration 0003: model versions and case studies (Phase 2)

create table model_versions (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references financial_models(id) on delete cascade,
  version integer not null,
  assumptions jsonb not null,
  outputs jsonb not null default '{}'::jsonb,
  note text,
  created_at timestamptz not null default now(),
  unique (model_id, version)
);
create index model_versions_model_idx on model_versions(model_id, version desc);

alter table financial_models enable row level security;
alter table model_versions enable row level security;
drop policy if exists financial_models_owner on financial_models;
create policy financial_models_owner on financial_models for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy model_versions_owner on model_versions for all using (
  exists (select 1 from financial_models m where m.id = model_versions.model_id and m.user_id = auth.uid())
);

create type case_kind as enum ('historical', 'fictional');

create table case_studies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  kind case_kind not null,
  investor_id uuid references investors(id) on delete set null,
  transaction_id uuid references transactions(id) on delete set null,
  subtitle text,
  summary text not null,
  body_markdown text not null,
  disclaimer text,
  model_presets jsonb not null default '{}'::jsonb,
  publish_status publish_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table case_studies enable row level security;
create policy case_studies_published_read on case_studies for select using (publish_status = 'published');

-- Notes and bookmarks may link to case studies.
alter type linked_object_kind add value if not exists 'case_study';
