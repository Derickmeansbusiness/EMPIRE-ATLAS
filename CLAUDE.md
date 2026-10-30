# EMPIRE ATLAS — engineering guide for Claude Code and contributors

**Product:** EMPIRE ATLAS — The Anatomy of Great Fortunes.
**Category:** Real estate investment intelligence, historical deal research, financial modelling and strategic simulation.
**Philosophy:** Study the empires. Decode the capital. Engineer the future.

This is a standalone product. It must never depend on Base44, Real Estate Capital Architect or any other
application's database, auth, APIs or code.

## Mission

Investigate how historically significant investors and institutions accumulated, financed, controlled, scaled
and preserved real estate wealth, using evidence-first research, reconstructed transactions, a tested financial
engine and decision simulations. Build the real product, not the appearance of one.

## Architecture principles

- **Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4.** Server components by default; client
  components only for interactivity (forms with `useActionState`, active nav links).
- **Mutations are server actions** in `src/app/actions/*`. Every action re-derives the user from the session
  cookie (`requireUser` / `requireCapability`) and validates input with Zod (`src/lib/validation`).
- **Database:** Postgres SQL migrations in `src/db/migrations/*.sql` are the source of truth. `src/db/schema.ts`
  mirrors them for typed Drizzle queries. The client factory (`src/db/client.ts`) runs the same SQL on
  **PGlite** (embedded, zero-setup local dev and tests) or any **Postgres / Supabase** via `DATABASE_URL`.
  Use `queryRows()` for raw SQL so results are portable across both drivers.
- **Data access is layered:** `src/lib/data/research.ts` (published research, read-only),
  `src/lib/data/workspace.ts` (private user work, always scoped by `userId`), `src/lib/data/admin.ts`.
  Pages never query the DB directly for private data without going through these modules.
- **Finance is a pure library:** `src/finance/*`. No React, no IO, no rounding, input validation throws
  `FinanceInputError`. Every formula has unit tests with independently computed expected values.
- **Content is seeded from version-controlled files** (`src/db/seed/*`). Seeds are idempotent (keyed by slug)
  and preserve human review decisions on claims.
- **Honesty in the UI:** `src/lib/modules.ts` is the single registry of what is live / partial / planned. Never
  show a mock result or a dead-end link for an unbuilt feature.

## Directory map

```
src/app/(public)      public site: home, explore, investigations, how-it-works, deal-archaeology, capital-lab,
                      simulations, methodology, membership, sign-in, sign-up
src/app/(app)         authenticated app: fieldbook/*, command-center, dossiers, timeline, deals, evidence, network, institutions,
                      lab, simulator, committee, library, profile, roadmap, admin/*
src/app/actions       server actions (auth, workspace, admin)
src/components/ui     primitives + brand mark
src/components/site   public nav/footer/auth forms
src/components/app    app shell, nav links
src/components/research  evidence badges, claim rendering, claim card, timeline, sources & uses, review form
src/components/workspace note forms
src/components/lab    financial tools UI
src/components/network graph (React Flow, client) and schematic geo map
src/db                client, migrate, schema, migrations/, seed/
src/finance           core, underwriting, debt, credit, distressed, waterfall, stress
src/simulation        engine, scenarios/, committee evaluator
src/quiz              quiz types, grading, bank (numeric answers computed by the finance library)
src/program           24-week curriculum and task checks
src/ai                BM25 retrieval and the grounded historian
src/fieldbook         Investor's Fieldbook: statement math, challenge cases, grader, reconciliation, report, inspection templates, featured passage
src/lib/auth          password (scrypt), tokens (HMAC cookie), roles/capabilities, service, current-user
src/lib/data          research / workspace / admin / models / cases / network / simulations data access
src/lib/validation    zod schemas
src/proxy.ts          edge proxy: path header + early redirect for private routes
scripts/              migrate, seed, reset, create-user, grant-role, e2e-server
tests/unit            vitest (finance, auth, authorization, seed integrity)
tests/e2e             Playwright acceptance flow (desktop + mobile)
docs/                 PRODUCT_SPEC, ARCHITECTURE, DATA_MODEL, ROADMAP, RESEARCH_STANDARDS, reports/
```

## Commands

```bash
pnpm install
cp .env.example .env.local        # fill ATLAS_SESSION_SECRET and the ATLAS_FOUNDER_* values
pnpm db:migrate                   # apply SQL migrations (PGlite in ./.data/pglite unless DATABASE_URL is set)
pnpm db:seed                      # idempotent research seed + founder account (if ATLAS_FOUNDER_* set)
pnpm dev                          # http://localhost:3000
pnpm typecheck && pnpm lint
pnpm test                         # vitest unit tests
pnpm build && pnpm test:e2e       # Playwright (boots an isolated seeded instance on port 3100)
pnpm db:reset                     # deletes the embedded local database only (refuses when DATABASE_URL is set)
pnpm atlas:create-user --email … --name … --role … [--researcher-number N]   # password via ATLAS_NEW_USER_PASSWORD
pnpm atlas:grant-role --email … --role platform_owner --researcher-number 1
```

In CI images with a pre-installed Chromium, set `PLAYWRIGHT_CHROMIUM_PATH=/path/to/chrome` for `test:e2e`.

## Coding conventions

- Strict TypeScript, `noUncheckedIndexedAccess` on. No `any`. Prefer explicit return types on data functions.
- Money: JS numbers in dollars inside the finance library; `numeric` columns in the DB (strings in Drizzle).
  Format only at the edge with `src/lib/format.ts`.
- Dates: historical dates are `date` columns with a `date_precision` (day / month / year / circa / decade).
  Always render with `formatHistoricalDate(value, precision)`.
- Slugs are stable identifiers for content (investors, institutions, transactions, sources, claims). Never rename
  a published slug without a redirect.
- Accessibility: every interactive element has a label; forms use real `<label>`s; respect
  `prefers-reduced-motion`; colour is never the only signal (badges carry text).
- Keep public pages free of private data; keep private pages behind `requireUser`.

## Financial accuracy rules

1. Returns come from levered cash flows (equity out, cash flow after debt service in, net sale proceeds after
   loan payoff). Appreciation is not profit until a modelled sale.
2. Debt service comes from a real amortisation schedule, never a constant.
3. Every tool shows its formulas, conventions and warnings next to the result.
4. New formulas require a unit test whose expected value was computed independently (closed form, spreadsheet,
   Python) and a comment saying how.
5. User-entered inputs are hypothetical by definition and are never written into historical tables.

## Research evidence rules

1. Every factual statement in a dossier cites a claim (`[[claim:slug]]`); every claim links to at least one
   source with a locator or excerpt. The seed-integrity test enforces both.
2. Verification statuses: `verified_primary` (SEC/company filings, exchange notices, court records, catalogue
   records), `supported_secondary` (credible news, trade press, academic), `contested` (credible sources
   disagree; say how), `unverified` (single/weak source; never cite as fact), `hypothetical` (models only).
3. A claim is never auto-verified. Only Research Editor+ can change status, and every change is logged with
   reviewer, previous status and note (`verification_reviews`, `audit_events`).
4. Unknown figures stay unknown. Do not estimate to fill a table; use `data_status = 'unknown'`.
5. Do not describe an individual as the owner of assets held by an entity without evidence.
6. Store source metadata and short permitted excerpts only. No scraping of restricted sites, no whole works.
7. No net-worth figures without a source and an explanation of the measure used.

## Security requirements

- Sessions: random 256-bit token, SHA-256 hash stored, HMAC-signed httpOnly cookie, 30-day expiry, revocation on
  sign-out. `ATLAS_SESSION_SECRET` (≥ 32 chars) is mandatory in production.
- Passwords: scrypt (N=2^15, r=8, p=1), constant-time compare, min 10 chars, NFKC-normalised.
- Public sign-up always creates a `student`. Elevated roles come only from operator scripts or an owner /
  administrator in the admin UI, with `canAssignRole` checks and audit entries. Never make the first signup an owner.
- Server-side authorisation everywhere (`requireCapability`); the edge proxy is a UX shortcut, not the gate.
- Row Level Security is enabled on private tables (migration 0002) as defence in depth for direct-DB roles.
- Secrets live in environment variables; nothing secret is ever shipped to the client bundle.
- Redirect targets are validated (`safeReturnTo`): same-origin relative paths only.

## Current implementation status (2026-10-30)

Phases 0–5 are implemented and tested. See `docs/ROADMAP.md` and `docs/reports/PHASE-{1,2,3,4,5}-REPORT.md` for
exact scope, test results and pending work.
Live: public site, auth, command center, Sam Zell dossier (12 divisions, 32 claims, 29 sources, 15 timeline
events), Equity Office sale reconstruction with attached hypothetical models, evidence viewer with review
history, notes, bookmarks, roadmap of 15 queued subjects, all seven Capital Architecture Lab tools with saved and
versioned models, the fictional Meridian Court case, the Capital Network Explorer (graph, map, table, filters)
with institution pages, the Empire Simulator (two scenarios, sealed outcomes, scored debriefs), the Investment
Committee Chamber (rules-based evaluation and memo), admin (users, claims review, content status, audit).
Phase 5 adds synthesis, doctrine export, weekly ritual, the 24-week program, quizzes, competency, library folders and
reading lists, the AI historian, entitlements, organizations and analytics. Deferred: market comparison, live AI
verification, payments. Planned: everything listed as
"planned" in `src/lib/modules.ts`.

Simulation conventions: scenarios are TypeScript modules in `src/simulation/scenarios/` registered in
`src/simulation/index.ts`; `apply` functions must be pure; scores are fixed per option at authoring time; every
`historical.claims` and `evidence` entry must be a real claim slug (the unit test checks); pages render only
`playerView()` until the attempt is complete. Committee evaluation (`src/simulation/committee.ts`) is rules-based
and every point carries a finding string shown in the memo.

Network conventions: `loadNetworkGraph()` builds nodes/edges once; `filterGraph()` is pure and unit-tested;
`layoutGraph()` is deterministic (investors centre, institutions middle ring, transactions outer ring). Edges
without a claim must be `is_hypothetical = true` (database CHECK) and render dotted sky-blue.

Lab conventions: tool inputs live in the URL in UI units (percent as percent); `withSavedModel()` merges a saved
model's assumptions under URL params; `SaveModelPanel` posts the same UI-unit values so reloads are lossless.
Finance modules convert to decimals at the call boundary.

Phase 5 conventions: competency and program progress come from stored work, never from viewing time. The historian
answers only from retrieved evidence, strips citations it was not given, and makes no model call when retrieval is
empty. Entitlements never gate owners or administrators and are enforced only when `ATLAS_ENFORCE_ENTITLEMENTS` is set.
Doctrine exports escape all user text.

Fieldbook conventions (Expansion 002): everything under `src/fieldbook` is pure and unit-tested with independently computed
(Python) expected values; challenge cases are TypeScript modules in `src/fieldbook/challenges/` registered in its `index.ts`, and the
grader and pages are case-agnostic. Fictional properties, statements and walk evidence are labelled fictional everywhere and carry
no photographs. Cross-checks between a statement and a site raise questions and never assert wrongdoing or change assumptions.
Passages are first-person and uncorroborated unless a verified supporting fact is added; the platform stores no copyrighted passage
text, and users' excerpts are private. Photos are identified by magic bytes, capped at 3 MB, require a consent tick, and are served
only to their owner. Forms that can fail validation use `useManualAction` (no automatic form reset) and redirect on success.
Never claim offline support beyond what `tests/e2e/fieldbook.spec.ts` proves: drafts survive a lost connection while the page is open.
