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
src/app/(app)         authenticated app: command-center, dossiers, timeline, deals, evidence, network, institutions,
                      lab, library, profile, roadmap, admin/*
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
src/lib/auth          password (scrypt), tokens (HMAC cookie), roles/capabilities, service, current-user
src/lib/data          research / workspace / admin / models / cases / network data access
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

## Current implementation status (2026-10-28)

Phases 0–3 are implemented and tested. See `docs/ROADMAP.md` and `docs/reports/PHASE-{1,2,3}-REPORT.md` for
exact scope, test results and pending work.
Live: public site, auth, command center, Sam Zell dossier (12 divisions, 32 claims, 29 sources, 15 timeline
events), Equity Office sale reconstruction with attached hypothetical models, evidence viewer with review
history, notes, bookmarks, roadmap of 15 queued subjects, all seven Capital Architecture Lab tools with saved and
versioned models, the fictional Meridian Court case, the Capital Network Explorer (graph, map, table, filters)
with institution pages, admin (users, claims review, content status, audit).
Next: Phase 4 (simulator and investment committee). Planned: everything listed as "planned" in `src/lib/modules.ts`.

Network conventions: `loadNetworkGraph()` builds nodes/edges once; `filterGraph()` is pure and unit-tested;
`layoutGraph()` is deterministic (investors centre, institutions middle ring, transactions outer ring). Edges
without a claim must be `is_hypothetical = true` (database CHECK) and render dotted sky-blue.

Lab conventions: tool inputs live in the URL in UI units (percent as percent); `withSavedModel()` merges a saved
model's assumptions under URL params; `SaveModelPanel` posts the same UI-unit values so reloads are lossless.
Finance modules convert to decimals at the call boundary.
