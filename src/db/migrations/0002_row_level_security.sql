-- EMPIRE ATLAS — Migration 0002: Row Level Security for private user work.
--
-- The application server connects with an owner/service role and enforces authorization
-- in the data-access layer (every private query is scoped to the authenticated user).
-- These policies add database-level defense in depth for deployments where additional
-- roles (e.g. Supabase's `authenticated` role via PostgREST) may reach these tables.
--
-- On Supabase, `auth.uid()` exists. On plain Postgres / PGlite we define a stub that reads
-- the `atlas.user_id` session setting so the same policies compile everywhere.

create schema if not exists auth;

do $$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'auth' and p.proname = 'uid'
  ) then
    execute $fn$
      create function auth.uid() returns uuid
      language sql stable
      as $body$
        select nullif(current_setting('atlas.user_id', true), '')::uuid
      $body$;
    $fn$;
  end if;
end $$;

alter table research_collections enable row level security;
alter table research_notes enable row level security;
alter table bookmarks enable row level security;
alter table financial_models enable row level security;
alter table research_progress enable row level security;
alter table investment_principles enable row level security;
alter table investment_doctrines enable row level security;
alter table sessions enable row level security;

create policy research_collections_owner on research_collections for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy research_notes_owner on research_notes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy bookmarks_owner on bookmarks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy financial_models_owner on financial_models for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy research_progress_owner on research_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy investment_principles_owner on investment_principles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy investment_doctrines_owner on investment_doctrines for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy sessions_owner on sessions for select using (user_id = auth.uid());

-- Published research is world-readable; drafts are not exposed to non-owner roles.
alter table investors enable row level security;
alter table institutions enable row level security;
alter table transactions enable row level security;
alter table claims enable row level security;
alter table sources enable row level security;
alter table dossier_sections enable row level security;
alter table historical_events enable row level security;

create policy investors_published_read on investors for select using (publish_status = 'published');
create policy institutions_published_read on institutions for select using (publish_status = 'published');
create policy transactions_published_read on transactions for select using (publish_status = 'published');
create policy claims_published_read on claims for select using (publish_status = 'published');
create policy sources_read on sources for select using (true);
create policy dossier_sections_read on dossier_sections for select using (
  exists (select 1 from investors i where i.id = dossier_sections.investor_id and i.publish_status = 'published')
);
create policy historical_events_read on historical_events for select using (true);
