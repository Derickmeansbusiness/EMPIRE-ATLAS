# EMPIRE ATLAS

**The Anatomy of Great Fortunes.** A real estate wealth intelligence, historical deal research, financial modelling
and strategic simulation platform. *Study the empires. Decode the capital. Engineer the future.*

## Quick start

```bash
pnpm install
cp .env.example .env.local
# edit .env.local: set ATLAS_SESSION_SECRET (>= 32 chars) and ATLAS_FOUNDER_EMAIL / ATLAS_FOUNDER_PASSWORD / ATLAS_FOUNDER_NAME
pnpm db:seed          # migrates the embedded database, seeds research, creates Researcher 001 (Platform Owner)
pnpm dev              # http://localhost:3000 → sign in with the founder credentials
```

No Docker, no external database and no API keys are needed for local development: the app runs on an embedded
Postgres (PGlite) stored in `./.data/pglite`. Point `DATABASE_URL` at Postgres or Supabase to use a shared database;
the same SQL migrations apply.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Development server / production build / production server |
| `pnpm typecheck` / `pnpm lint` | TypeScript strict check / ESLint |
| `pnpm test` | Vitest unit tests (finance formulas, auth, authorisation scoping, seed integrity) |
| `pnpm test:e2e` | Playwright acceptance flow on desktop and mobile against an isolated seeded instance |
| `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:reset` | Apply migrations / idempotent seed / delete the embedded local DB |
| `pnpm atlas:create-user` / `pnpm atlas:grant-role` | Operator-only account creation and role grants |

## Documentation

- `CLAUDE.md` — mission, architecture principles, conventions, commands, financial and research rules, security, status.
- `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/ROADMAP.md`, `docs/RESEARCH_STANDARDS.md`
- `docs/reports/PHASE-1-REPORT.md` — what was built, what was tested, what is pending.

## Status

Phase 0 and Phase 1 are implemented and tested. One dossier (Sam Zell) and one reconstructed transaction (the 2007
sale of Equity Office to Blackstone affiliates) are published; fifteen subjects are queued. Live tools: Acquisition
Underwriter and Debt Schedule. Simulator, committee, synthesis, doctrine, AI historian and memberships are planned
and clearly labelled as such inside the product.
