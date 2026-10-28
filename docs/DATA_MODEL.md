# Data Model

Source of truth: `src/db/migrations/0001_foundation.sql` (schema) and `0002_row_level_security.sql` (RLS).
Typed mirror: `src/db/schema.ts`. Diagram below is logical; all primary keys are UUIDs unless noted.

## Identity & access
- **users** (email, email_normalized, password_hash, display_name, role, status, researcher_number, timestamps)
- **profiles** (user_id PK, headline, bio, focus_markets[], competency_level, preferences jsonb)
- **sessions** (user_id, token_hash unique, user_agent, expires_at, revoked_at)
- **organizations**, **memberships** (user ↔ organization, tier, role_in_org, dates)
- **audit_events** (bigint identity; actor_user_id, action, object_kind, object_id, metadata, ip)

## Research subjects
- **investors** (slug, names, born/died, headline, summary, era_label, primary_asset_classes[], publish_status, research_status, roadmap_rank)
- **institutions** (slug, name, kind: network_node_kind, founded_year, headquarters, summary, publish_status)
- **assets** (slug, name, asset_class, market, location)
- **transactions** (slug, name, lead_investor_id, announced_on, closed_on, date_precision, asset/market/location/class, headline_value_usd + label + data_status, summary, rights_acquired, operating_strategy, subsequent_events, exit_or_status, verified_outcome, open_questions, publish_status)
- **transaction_participants** (transaction_id, party_kind, investor_id | institution_id, role, note)
- **ownership_interests** (transaction/asset, holder, interest_description, percentage, data_status)
- **capital_stack_items** (transaction_id, side source|use, layer, label, amount_usd nullable, amount_label, provider_institution_id, data_status, note, sort_order)

## Evidence engine
- **sources** (slug, title, source_type, publisher, author, url, document_reference, published_on, accessed_on, licensing_note, reliability_note)
- **claims** (slug, claim_text, category, investor_id, institution_id, transaction_id, event_date + precision, verification_status, researcher_notes, last_reviewed_at/by, publish_status)
- **claim_sources** (claim_id, source_id unique pair, excerpt, locator, supports bool — `false` records a conflicting source)
- **verification_reviews** (claim_id, reviewer_id, from_status, to_status, note, created_at)
- **dossier_sections** (investor_id, division 1–12 unique, title, body_markdown with `[[claim:slug]]`, evidence_confidence)
- **historical_events** (investor_id | institution_id, transaction_id, claim_id, occurred_on + precision, title, description, category, sort_order)
- **quotations** (investor_id, quote_text, context, source_id, locator, verification_status)
- **relationships** (from/to typed by network_node_kind with FK columns per target kind, relationship kind, years, description, claim_id, is_hypothetical; CHECK: claim_id not null OR hypothetical)

## Private user work (RLS-protected, user_id-scoped)
- **research_collections**, **research_notes** (collection_id, title, body, tags[], linked_kind, linked_id)
- **bookmarks** (target_kind, target_id, note; unique per user/target)
- **financial_models** (name, model_kind, transaction_id, is_hypothetical default true, assumptions jsonb, outputs jsonb, version)
- **research_progress** (activity_kind, object_kind, object_id, metadata) — drives dashboard stats and recommendations
- **investment_principles** (title, statement, source_investor_id, supporting_transaction_id, supporting_claim_id, relevant_risk, modern_application, personal_notes)
- **investment_doctrines** (user_id PK; eight doctrine fields)

## Models & cases (migration 0003)
- **model_versions** (model_id, version unique per model, assumptions jsonb, outputs jsonb, note) — every save of a
  financial model appends a version; RLS through the parent model's owner.
- **case_studies** (slug, title, kind historical|fictional, investor_id, transaction_id, subtitle, summary,
  body_markdown, disclaimer, model_presets jsonb, publish_status). Fictional cases carry a mandatory disclaimer.
- `linked_object_kind` gained `case_study` so notes and bookmarks can attach to a case.

## Geography (migration 0004)
`investors`, `institutions` and `transactions` carry `latitude`, `longitude` and `geo_label` (headquarters or the
transaction's stated location). The schematic map draws only nodes with coordinates.

## Simulations & committee (migration 0005)
- **simulation_attempts** (user_id, scenario_slug, status in_progress|completed|abandoned, choices jsonb, score
  jsonb, final_state jsonb, timestamps). Scenarios themselves are code (`src/simulation/scenarios`), not rows.
- **investment_committee_submissions** (user_id, nine text sections, recommendation, model_id, model_snapshot,
  evaluation jsonb, memo_markdown, score, verdict).

## Planned tables (Phase 5; not yet migrated)
quizzes, quiz_results, market_data_series (with source + as_of), ritual/program progress.

## Enumerations
user_role, user_status, publish_status, verification_status (verified_primary | supported_secondary | contested |
unverified | hypothetical), data_status (documented | interpretation | estimate | unknown | hypothetical),
source_type, party_kind, network_node_kind (11 kinds), relationship_kind (13 kinds), linked_object_kind, date_precision.

## Indexes
Role, publish status, investor/transaction FKs on claims and events, user + updated_at on notes/models/progress,
session token hash and expiry, bookmark uniqueness, claim-source uniqueness.

## Separation guarantees
- Published vs. draft: `publish_status` on investors/institutions/transactions/claims; data-access functions take
  `includeDrafts` and only admin paths pass `true`.
- Historical vs. hypothetical: `data_status` / `verification_status = 'hypothetical'` / `financial_models.is_hypothetical`;
  lab inputs are never persisted to research tables.
- Private vs. global: all private tables carry `user_id` and RLS owner policies.
