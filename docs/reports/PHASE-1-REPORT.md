# Implementation report — Phase 0 & Phase 1 (2026-10-28)

## Summary
Empire Atlas now runs end to end: a new researcher can open the homepage, sign in, reach the command center, read
the sourced Sam Zell dossier, follow citations to evidence and sources, explore the timeline, save notes, bookmark
claims, open the reconstructed Equity Office sale, and find all of that work again after signing back in. The
founding account (Researcher 001, Platform Owner) is created only through an operator-controlled procedure.

## Files created (all new; the repository was empty)
- Config: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`,
  `vitest.config.ts`, `playwright.config.ts`, `.gitignore`, `.env.example`
- Docs: `CLAUDE.md`, `README.md`, `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`,
  `docs/ROADMAP.md`, `docs/RESEARCH_STANDARDS.md`, `docs/reports/PHASE-1-REPORT.md`
- Database: `src/db/migrations/0001_foundation.sql` (29 tables, 11 enums), `0002_row_level_security.sql`,
  `src/db/schema.ts`, `src/db/client.ts`, `src/db/migrate.ts`, `src/db/seed/{index,types,zell,roadmap}.ts`
- Auth & authorisation: `src/lib/auth/{password,tokens,roles,service,current-user}.ts`, `src/proxy.ts`
- Data access: `src/lib/data/{research,workspace,admin}.ts`; validation `src/lib/validation/index.ts`;
  helpers `src/lib/format.ts`, `src/lib/modules.ts`
- Finance: `src/finance/{core,underwriting,index}.ts`
- Actions: `src/app/actions/{auth,workspace,admin}.ts`
- UI: `src/app/layout.tsx`, `globals.css`, `not-found.tsx`, `icon.svg`; `src/components/{ui,site,app,research,workspace,lab}/*`
- Routes: 10 public pages, 17 authenticated pages (incl. 3 admin)
- Scripts: `scripts/{_env,migrate,seed,reset,create-user,grant-role,e2e-server}.ts`
- Tests: `tests/unit/{finance-core,finance-underwriting,auth,workspace-authorization,research-seed}.test.ts`,
  `tests/unit/helpers/db.ts`, `tests/e2e/founding-milestone.spec.ts`

## Functional features
- Original visual identity (Obsidian Navy / Antique Gold palette, Fraunces + Inter, grain texture, editorial
  headings, reading mode, reduced-motion respected, responsive shell with mobile menu).
- Public site: Home (live counts), Explore (published + queued roadmap + institutions), Investigations,
  How It Works (module status registry), Deal Archaeology, Capital Lab, Simulations (honest "planned" state),
  Methodology, Membership (no prices), Sign In, Sign Up.
- Authentication: scrypt passwords, hashed-token sessions, HMAC-signed httpOnly cookies, sign-out revocation,
  suspended-account blocking, user-enumeration-safe errors, same-origin redirect validation.
- Command Center derived from stored records: activity stats, recommended next investigation, featured
  investor/transaction, evidence status, notes, bookmarks, weekly ritual (today highlighted), recent activity,
  modelling summary, platform status.
- Sam Zell dossier: 12 analytical divisions with inline numbered evidence chips, 32 claims, 29 sources,
  15 timeline events, 2 quotations, evidence confidence counts, institutions and relationships with badges,
  wealth-figure definitions, notes, dossier bookmark, reading mode.
- Deal Archaeology: Equity Office sale record with sources & uses (documented / estimate / unknown lines,
  proportional bar excluding unknowns), participants, rights acquired, operating strategy, subsequent events,
  verified outcome, open questions, transaction timeline, evidence, notes.
- Evidence viewer: claim records with sources, locators, excerpts, conflicting-source flags, review history,
  researcher notes; source library grouped by type; source pages listing supported claims.
- Historical Timeline across published subjects; Capital Network relationships table with type filter.
- Research Library: notes (create, edit, delete, tags, search, links to claim/investor/transaction), bookmarks.
- Capital Architecture Lab: Acquisition Underwriter and Debt Structuring Lab (URL-state inputs, formulas shown,
  warnings for DSCR < 1.20x and cap-rate compression).
- Administration: Research CMS (stats, content status, audit log), Claims Verification queue (status change with
  logged review), User Management (role changes with owner/administrator rules, suspend/reactivate).
- Operator tooling: migrate, seed (idempotent, review-preserving), reset (local only), create-user, grant-role.

## Tests executed
| Suite | Result |
|---|---|
| `pnpm typecheck` | pass |
| `pnpm lint` | pass (0 errors, 0 warnings) |
| `pnpm test` (Vitest) | 40 passed, 0 failed — 5 files |
| `pnpm build` | pass (Turbopack; all routes dynamic) |
| `pnpm test:e2e` (Playwright, desktop + mobile) | 14 passed, 0 failed |

Unit coverage: NOI/cap rate, annuity payment (textbook value), full and balloon amortisation (closed-form check,
balloon 847,761.26 computed in Python), interest-only schedules, DSCR/debt yield/LTV/LTC, NPV/IRR (known
solution 8.8963%), equity multiple, capital stack summary; underwriting derived from schedules and levered cash
flows; password hashing; cookie signing/tampering; sign-up defaults to Student; duplicate/weak-password rejection;
session issue/resolve/revoke; role assignment rules; cross-user note/bookmark isolation; seed integrity
(every claim sourced, every citation resolvable, idempotent, primary-status claims cite primary-type sources,
documented/estimate/unknown lines distinct).

Browser coverage: homepage; anonymous redirect; wrong-password handling; the full founding loop including
return after sign-out; Student denied from admin; owner records a claim review visible in the audit log; lab
warnings and the balloon figure; mobile navigation.

## Pending work (next phases)
See `docs/ROADMAP.md`. Immediate next: Phase 2 (Capital Stack Builder UI, saved models, remaining five lab tools,
the Zell-inspired fictional distressed multifamily case, hypothetical models attached to transactions).
Research follow-ups: editor re-verification of excerpts against originals (sec.gov and several outlets were not
reachable from the build environment); 1970s Zell property record pass; Blackstone acquisition-financing syndicate.

## Required configuration
- `ATLAS_SESSION_SECRET` (required in production, ≥ 32 chars).
- `ATLAS_FOUNDER_EMAIL`, `ATLAS_FOUNDER_PASSWORD`, `ATLAS_FOUNDER_NAME` for the seed to create Researcher 001
  (or use `pnpm atlas:create-user` / `pnpm atlas:grant-role`).
- Optional `DATABASE_URL` for Postgres/Supabase. Optional `ATLAS_SIGNUP_MODE=closed`.
- Not configured and not required: ANTHROPIC_API_KEY, Supabase keys, payments.

## How to start
```bash
pnpm install && cp .env.example .env.local   # fill the values above
pnpm db:seed && pnpm dev                     # http://localhost:3000
```

## Next phase to implement
Phase 2 — Deal Archaeology & Capital Lab (see ROADMAP).
