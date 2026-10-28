# Roadmap

Status key: **Live** (implemented and tested) · **Partial** · **Planned**. The in-app registry is `src/lib/modules.ts`.

## Phase 0 — Architecture & repository foundation — Live
Repository, specs, CLAUDE.md, env template, data model, migrations, scripts, test configuration.

## Phase 1 — Functional founding experience — Live
Visual identity; public homepage and pages; auth (sign-up as Student, sign-in, sign-out, sessions); researcher
dashboard; dossier explorer; Sam Zell dossier (12 divisions, 32 claims, 29 sources, 15 events, 2 quotations,
14 evidence-linked relationships); timeline; source & evidence viewer with review history; notes; bookmarks;
basic administration (users, claims review, content status, audit). Bonus from Phase 2 scope: Acquisition
Underwriter and Debt Schedule on the tested finance library; Equity Office transaction record with sources & uses.

## Phase 2 — Deal Archaeology & Capital Lab — Next
- Capital Stack Builder UI on `summarizeCapitalStack` (library done).
- Save / reload / version financial models (`financial_models` table exists).
- Attach hypothetical models to a transaction with explicit labelling.
- Debt Lab: floating-rate, bridge, seller financing comparisons.
- Private Credit Underwriting, Distressed Acquisition Simulator, Equity Waterfall Studio, Portfolio Stress Test.
- The Zell-inspired fictional distressed multifamily case (separate entities and labels).
- More finance unit tests (waterfalls, stress scenarios).

## Phase 3 — Network intelligence
React Flow graph on `relationships`; filters by investor, year, geography, asset class, relationship type,
institution, transaction, evidence confidence; node detail panels with linked evidence; geographic asset view.

## Phase 4 — Empire Simulator & Investment Committee
Scenario engine with sealed outcomes; decision tracking; financial consequences; scoring; historical comparison;
debrief; the Zell lender-negotiation exercise; committee submissions, evaluation framework, memo generation.

## Phase 5 — Complete research experience
Rich-text notes, folders, reading lists, exports; strategy synthesis and doctrine (exportable document);
weekly ritual tracking and reminders; six-month program; quizzes and competency progression; AI Investment
Historian with retrieval over the approved corpus (server-side key, explicit unconfigured state); membership
entitlements and institutional features; analytics; Supabase Auth/Storage adapters; market comparison module with
sourced, dated data.

## Research roadmap (after Zell)
1. Stephen Ross 2. Donald Bren 3. Ray Kroc & Harry Sonneborn 4. Arnold Schwarzenegger 5. John Jacob Astor
6. Barry Sternlicht 7. Howard Marks 8. Jon Gray, then the remaining initial profiles and institutions. No filler:
a subject is published only when its twelve divisions are sourced.

## Known limitations (Phase 1)
- Sources were located via web search; several originals (sec.gov, news sites) could not be fetched from the
  build environment, so excerpts come from search summaries and are flagged for editor re-verification.
- Dossier prose is edited in seed files, not in the browser.
- No payments, no AI integration, no external market data, no production deployment configured.
