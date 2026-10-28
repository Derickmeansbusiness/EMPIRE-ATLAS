# Implementation report — Phase 2: Deal Archaeology & Capital Lab (2026-10-28)

## Summary
The Capital Architecture Lab is complete: seven tools on the deterministic finance library, each with formulas and
warnings beside the result, saved and versioned private models that reload from a URL, attachment of hypothetical
models to a historical transaction without touching the record, and the first fictional modern case (Meridian
Court) that turns the Sam Zell principles into lab presets.

## Files created
- Finance: `src/finance/debt.ts` (fixed / IO / balloon / floating with cap, floor and payment recast / bridge /
  seller; borrower all-in cost), `src/finance/credit.ts` (lender economics, defined default scenario, recovery,
  severity, expected loss), `src/finance/distressed.ts` (DPO, restructure, foreclosure-to-REO paths, breakeven),
  `src/finance/waterfall.ts` (ROC, compounding pref, GP catch-up, IRR-hurdle tiers via hurdle capital accounts),
  `src/finance/stress.ts` (eight standard scenarios, refinancing-gap sizing).
- Database: `src/db/migrations/0003_models_and_cases.sql` (`model_versions`, `case_studies`, `case_kind`,
  `case_study` link kind, RLS); schema additions in `src/db/schema.ts`.
- Data & actions: `src/lib/data/models.ts`, `src/lib/data/cases.ts`, `src/app/actions/models.ts`,
  `src/lib/lab-params.ts`, validation `saveModelSchema`.
- UI: `src/components/lab/{param-form,shared}.tsx`; pages `lab/capital-stack`, `lab/credit`, `lab/distressed`,
  `lab/waterfall`, `lab/stress`, `lab/models`, `lab/models/[id]`, `lab/cases/[slug]`; refactored `lab/underwriter`,
  `lab/debt`, `lab` index; deal page shows attached models.
- Content: `src/db/seed/cases.ts` (Meridian Court, fictional, with disclaimer and presets).
- Tests: `tests/unit/finance-structures.test.ts` (15), `tests/unit/models.test.ts` (2), `tests/e2e/capital-lab.spec.ts` (4 × 2 devices).

## Functional features
- Capital Stack Builder: six layers with amount, rate, amortisation and IO; sources vs. uses, LTV, LTC, D/E,
  weighted cost, debt service per layer, combined and senior DSCR, funding gap.
- Debt Structuring Lab: one detailed structure plus a comparison table of six canonical alternatives at the same
  principal; annual schedule with the per-year rate for floating loans.
- Private Credit Underwriting: LTV, LTC, DSCR, debt yield, interest and fee income, performing IRR/MOIC, default
  scenario with exposure, recovery, loss, severity, default-case IRR, expected loss.
- Distressed Acquisition Simulator: discount to UPB, price-to-value, three complete monthly cash-flow paths with
  IRR, multiple, profit, duration, and foreclosure-path breakeven price.
- Equity Waterfall Studio: year-by-year tier table, LP/GP IRR and multiples, promote earned.
- Portfolio Stress Test: eight scenarios re-underwritten in full, with refinancing proceeds versus maturing
  balance and breach flags.
- Saved models: named, versioned, private; reload with `?model=`; version history page; attach to a transaction;
  listed on the deal page under a permanent "hypothetical" label.
- Meridian Court case: fictional entities and figures, mandatory disclaimer, principle mapping to the dossier,
  presets for four tools, notes.

## Tests executed
| Suite | Result |
|---|---|
| `pnpm typecheck`, `pnpm lint` | pass |
| `pnpm test` (Vitest) | 57 passed, 0 failed — 7 files |
| `pnpm build` | pass |
| `pnpm test:e2e` (Playwright, desktop + mobile) | 22 passed, 0 failed |

Independently computed expectations (Python, bisection IRR and closed-form annuities) used in the new tests:
bridge all-in cost 11.5814%; performing lender IRR 7.5824% and MOIC 1.3591; default exposure 6,363,171.58,
severity 27.709%, default IRR −5.727%; DPO path 74.785% / profit 194,000; foreclosure path 9.133% / profit 57,500;
waterfall LP 1,586,932.81 and GP 213,067.19 (LP IRR 12.0117%); two-tier LP 2,076,829.65 (LP IRR 18.2039%);
catch-up GP exactly 20% of profits.

## Pending work
- Phase 3 (network graph with React Flow and filters; geographic view).
- A hypothetical capital-stack overlay rendered inside the historical sources-and-uses table.
- Editor re-verification of Zell excerpts against originals (unchanged from Phase 1).

## Required configuration
Unchanged from Phase 1. No new secrets or services.

## How to start
```bash
pnpm install && cp .env.example .env.local   # set ATLAS_SESSION_SECRET and ATLAS_FOUNDER_*
pnpm db:seed && pnpm dev
```
Existing local databases pick up migration 0003 automatically on the next start or `pnpm db:migrate`.

## Next phase to implement
Phase 3 — Network intelligence.
