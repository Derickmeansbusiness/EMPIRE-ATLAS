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

## Phase 2 — Deal Archaeology & Capital Lab — Live
All seven lab tools (Capital Stack Builder, Acquisition Underwriter, Debt Structuring Lab with fixed / IO / balloon /
floating / bridge / seller comparison, Private Credit Underwriting with a defined default scenario, Distressed
Acquisition Simulator with DPO / restructure / foreclosure paths, Equity Waterfall Studio with pref, catch-up and
IRR-hurdle tiers, Portfolio Stress Test). Saved, versioned, private models (`financial_models` + `model_versions`),
loadable by URL and attachable to a historical transaction with a permanent "hypothetical" label. The fictional
Meridian Court distressed multifamily case (`case_studies`) with lab presets. 17 new finance unit tests with
Python-verified expectations.

Deferred from Phase 2: a hypothetical capital-stack overlay rendered inside the historical sources-and-uses table
(today models are listed beside the record and opened in the lab).

## Phase 3 — Network intelligence — Live
Interactive React Flow graph on `relationships` (concentric deterministic layout, edge style by verification
status, node detail panel with every relationship and its evidence link); filters by investor, institution,
transaction, relationship type, evidence confidence, geography, asset class and year range; table view;
schematic geographic view (equirectangular projection over documented coordinates, explicitly not a basemap);
institution pages (`/institutions/[slug]`) with ego-network and claims; dossier and deal pages link into the
network and institution pages. Migration 0004 adds coordinates and geo labels.

Deferred from Phase 3: a basemap (needs a licensed tile source), asset-level pins (the `assets` table is still
empty; locations today are headquarters and transaction locations), and institutional dossiers with twelve divisions.

## Phase 4 — Empire Simulator & Investment Committee — Live
Pure scenario engine (`src/simulation/engine.ts`): stages with briefings and options, conditional stages,
deterministic state transitions, scoring on five dimensions fixed at authoring time, and a `playerView` that
exposes no consequences, feedback, scores or history before the final decision. Two scenarios: the 2006–07
office-portfolio sale (historical, four decisions, cited debrief) and the Meridian Court lender negotiation
(fictional). Attempts are stored and scored on completion; the debrief compares each choice with the documented
record and links the claims. Investment Committee Chamber: nine-section submission, optional attached underwriting
model, transparent rules-based evaluation on six dimensions (evidence quality, financial correctness, risk
identification, capital efficiency, downside resilience via the stress test, strategic consistency), verdict and
generated memo. Migration 0005.

Deferred: a scenario editor in the admin UI (scenarios are TypeScript modules); more scenarios (land acquisition
before expansion, subsidised housing finance, sale-leaseback design, portfolio refinancing, rate shock, build vs. debt vs. buy).

## Phase 5 — Complete research experience — Implemented
Strategy synthesis (principles tied to investor, transaction and claim, plus a strategy comparison page), an
eight-section investment doctrine with printable HTML and Markdown export, the weekly ritual with journal and
streaks, a 24-week program whose tasks complete from stored work, four quizzes (one numeric, graded against the
finance library), competency levels and achievements derived from completed work, library folders, reading lists
and notes export, an AI Investment Historian (BM25 retrieval over the approved corpus, citation validation,
explicit unconfigured state, daily limit), membership tiers with entitlements (enforcement off by default),
organizations and cohorts, and platform analytics. Migration 0006.

Deferred, on purpose:
- Market comparison module. No authorised, dated data source exists yet and the platform does not show unsourced figures.
- Live verification of the AI path. It is unit-tested against a mocked HTTP layer only; it has not run against a real key.
- Payments and tier pricing. Tiers exist and entitlements are tested, but enforcement stays off until pricing is decided.
- Rich-text note editing, PDF and .docx export (print-to-PDF works from the HTML export).
- Institution-to-institution comparison, which needs more than one published dossier.
- Supabase Auth/Storage adapters.

## Research roadmap (after Zell)
1. Stephen Ross 2. Donald Bren 3. Ray Kroc & Harry Sonneborn 4. Arnold Schwarzenegger 5. John Jacob Astor
6. Barry Sternlicht 7. Howard Marks 8. Jon Gray, then the remaining initial profiles and institutions. No filler:
a subject is published only when its twelve divisions are sourced.

## Known limitations (Phase 1)
- Sources were located via web search; several originals (sec.gov, news sites) could not be fetched from the
  build environment, so excerpts come from search summaries and are flagged for editor re-verification.
- Dossier prose and case studies are edited in seed files, not in the browser.
- No payments, no AI integration, no external market data, no production deployment configured.
