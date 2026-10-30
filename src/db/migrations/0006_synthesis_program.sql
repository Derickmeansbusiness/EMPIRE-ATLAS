-- EMPIRE ATLAS — Migration 0006: Phase 5 (ritual, program, quizzes, collections, membership)

-- Membership tier on the account (entitlement enforcement is off by default; see src/lib/entitlements.ts)
alter table users add column membership_tier text not null default 'researcher'
  check (membership_tier in ('explorer', 'researcher', 'professional', 'institutional'));

-- Six-month program start
alter table profiles add column program_started_on date;

-- Collections: folders and reading lists
alter table research_collections add column kind text not null default 'folder' check (kind in ('folder', 'reading_list'));

create table collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references research_collections(id) on delete cascade,
  target_kind linked_object_kind not null,
  target_id uuid not null,
  note text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (collection_id, target_kind, target_id)
);
create index collection_items_collection_idx on collection_items(collection_id, position);
alter table collection_items enable row level security;
create policy collection_items_owner on collection_items for all using (
  exists (select 1 from research_collections c where c.id = collection_items.collection_id and c.user_id = auth.uid())
);

-- Weekly research ritual: one row per user, ISO week (Monday) and weekday 1..5
create table ritual_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  week_start date not null,
  day smallint not null check (day between 1 and 5),
  journal text not null default '',
  completed_at timestamptz not null default now(),
  unique (user_id, week_start, day)
);
create index ritual_entries_user_idx on ritual_entries(user_id, week_start desc);
alter table ritual_entries enable row level security;
create policy ritual_entries_owner on ritual_entries for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Six-month program: manual task completions (auto-detected tasks are derived from activity records)
create table program_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  week integer not null check (week between 1 and 24),
  task_key text not null,
  note text,
  completed_at timestamptz not null default now(),
  unique (user_id, week, task_key)
);
create index program_progress_user_idx on program_progress(user_id, week);
alter table program_progress enable row level security;
create policy program_progress_owner on program_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Quiz attempts (questions live in code; answers and scores are stored)
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  quiz_slug text not null,
  answers jsonb not null,
  score integer not null,
  max_score integer not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);
create index quiz_attempts_user_idx on quiz_attempts(user_id, quiz_slug, created_at desc);
alter table quiz_attempts enable row level security;
create policy quiz_attempts_owner on quiz_attempts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
