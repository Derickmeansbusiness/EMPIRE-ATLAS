# Architecture

## Stack (versions pinned in package.json, checked against the npm registry on 2026-10-28)

- Next.js 16.4 (App Router, Turbopack, `proxy.ts`), React 19.3, TypeScript 5.9 strict.
- Tailwind CSS 4.3 via `@tailwindcss/postcss`; design tokens in `src/app/globals.css` (`@theme`).
- Drizzle ORM 0.45 with two drivers: `@electric-sql/pglite` (embedded Postgres, WASM) and `postgres` (postgres.js).
- Zod 4 for validation. Lucide icons. Motion is installed for Phase 2+ animated diagrams (CSS keyframes cover Phase 1).
- Vitest 5 for unit tests, Playwright 1.64 for browser tests.
- Vercel-compatible: all routes are dynamic server-rendered; no Node-only APIs in client code.

## Runtime topology

```
Browser ──> Next.js server (RSC + server actions)
               ├─ src/proxy.ts (edge): path header, early redirect for private routes
               ├─ src/lib/auth/current-user.ts: cookie → session → user (per-request cache)
               ├─ src/lib/data/*: typed queries (Drizzle) + portable raw SQL (queryRows)
               └─ src/db/client.ts: PGlite (DATABASE_URL empty) | postgres.js (DATABASE_URL set)
                                     └─ runs src/db/migrations/*.sql on first connection
```

### Why PGlite + Postgres rather than Supabase-only
The build environment has no Docker and no provisioned Supabase project for this product. PGlite runs real
Postgres SQL, so the same migrations and RLS policies are exercised locally and in tests, and a Supabase (or any
Postgres) deployment needs only `DATABASE_URL`. Supabase Auth and Storage adapters are planned (see ROADMAP) but
Phase 1 ships first-party credential auth so the milestone works end to end without external credentials.

## Authentication & authorisation

- Credentials: scrypt hashes (`src/lib/auth/password.ts`).
- Sessions: `sessions` table with hashed tokens; cookie carries `token.hmac` (`src/lib/auth/tokens.ts`).
- Roles → capabilities map (`src/lib/auth/roles.ts`). Pages call `requireUser()` / `requireCapability()`.
- Admin routes additionally gated by `src/app/(app)/admin/layout.tsx`.
- Role changes: `canAssignRole(actor, target)`; owner may grant anything; administrators only below themselves.
- RLS on private tables (migration 0002) with an `auth.uid()` shim for non-Supabase Postgres.

## Data separation

| Concern | Where |
|---|---|
| Global published research | investors / institutions / transactions / claims / sources … with `publish_status = 'published'` |
| Unpublished administrative research | same tables, `draft` / `in_review`; visible only with `research:read_drafts` |
| Private user work | research_notes, bookmarks, research_collections, financial_models, research_progress, principles, doctrines (all `user_id`-scoped) |
| Historical verified data | claims + claim_sources + verification_status; capital_stack_items with `data_status` |
| Hypothetical assumptions | financial_models (`is_hypothetical = true`), lab inputs in URL; never written to historical tables |
| Simulation results | simulation tables (Phase 4) |

## Financial engine

`src/finance/core.ts` (NOI, cap rate, payments, schedules, DSCR, debt yield, LTV/LTC, NPV, IRR, multiples, capital
stack summary) and `src/finance/underwriting.ts` (annual acquisition model). Conventions are documented in
CLAUDE.md and shown in the UI. Tests: `tests/unit/finance-*.test.ts`.

## Testing strategy

- Unit: formulas (independently computed expectations), auth service, per-user authorisation scoping, seed
  integrity (every claim sourced, every citation resolvable, idempotency, status/source-type consistency, data
  status separation).
- Browser: the acceptance flow on desktop and mobile against an isolated seeded instance (`scripts/e2e-server.ts`).

## Decisions log

- ADR-001 Embedded Postgres for dev/test, Postgres/Supabase for deploy (above).
- ADR-002 First-party auth in Phase 1; Supabase Auth adapter later behind the same `service.ts` interface.
- ADR-003 Content in version-controlled seed files until the Research CMS editor ships; the admin UI edits
  verification status (reviewable, audited) but not prose.
- ADR-004 Lab inputs are URL state in Phase 1 (shareable, no DB writes); saved models arrive with Phase 2.
- ADR-005 Next 16 `proxy.ts` is used for UX redirects only; authorisation remains server-side.
