# EMPIRE ATLAS — Product Specification

Tagline: **The Anatomy of Great Fortunes.** Philosophy: *Study the empires. Decode the capital. Engineer the future.*

## 1. Vision

Empire Atlas investigates how historically significant investors, developers, financiers and dynasties
accumulated, financed, controlled, scaled and preserved real estate wealth. It replaces motivational biography
with forensic research: who supplied the capital, how transactions were structured, what risks were transferred,
and how wealth compounded across deals. Six capabilities share one evidence base:

1. Forensic Investment Research — dossiers.
2. Deal Archaeology — reconstructed transactions.
3. Capital Network Intelligence — evidence-linked relationship maps.
4. Financial Engineering — a tested modelling lab.
5. Historical Strategy Simulation — decision scenarios with sealed outcomes.
6. Strategic Knowledge Synthesis — principles and a personal investment doctrine.

## 2. Users and roles

| Role | Purpose |
|---|---|
| Platform Owner | Founder (Researcher 001); full access including user management. |
| Research Administrator | Manages users (below owner), content and verification. |
| Research Editor | Edits research, reviews claims. |
| Researcher | Full dossiers, notebooks, lab, simulations. |
| Student | Published research, notebooks, live lab tools (default for public sign-up). |
| Institutional Subscriber | Team member of an organisation (entitlements to follow). |

Researcher 001 is created only through an explicit operator procedure (`ATLAS_FOUNDER_*` env at seed time, or
`pnpm atlas:create-user` / `pnpm atlas:grant-role`). The first public signup is never elevated.

## 3. Modules

The authoritative live/partial/planned status is `src/lib/modules.ts`, surfaced at `/how-it-works` and `/roadmap`.

### A. Empire Command Center (live)
Welcome, recommended next investigation (derived from the user's recorded activity), activity stats, featured
investor and transaction, evidence status, notes and bookmarks, weekly ritual (today highlighted), recent activity,
modelling summary, platform status. All counts come from stored records.

### B. Empire Dossiers (live; 1 published, 15 queued)
Twelve analytical divisions per investor with inline claim citations rendered as evidence chips; biographical
timeline; asset-class exposure; transactions; documented institutions and relationships; quotations with sources
and status; evidence confidence counts; a note on wealth-figure definitions; research and reading modes; private
notes attached to the dossier; dossier bookmark.

### C. Deal Archaeology (live)
Transaction name, lead investor and counterparties, dates with precision, asset, market, headline value with data
status, summary, rights acquired, operating strategy, subsequent events, exit/status, verified outcome, open
questions, sources & uses with documented / estimate / unknown / hypothetical lines, transaction timeline, evidence
list, notes, and the user's attached hypothetical models (stored apart from the record).

### D. Capital Network Explorer (partial)
Relationships table with evidence badges and relationship-type filter; interactive graph (React Flow) and
geography/year/asset-class filters are Phase 3.

### E. Capital Architecture Lab (live)
Seven tools: Capital Stack Builder, Acquisition Underwriter, Debt Structuring Lab (fixed, IO, balloon, floating,
bridge, seller with side-by-side comparison), Private Credit Underwriting (performing economics plus a defined
default scenario), Distressed Acquisition Simulator (DPO, restructure, foreclosure-to-REO paths), Equity Waterfall
Studio (ROC, compounding pref, catch-up, IRR-hurdle tiers), Portfolio Stress Test (eight scenarios, each a full
re-underwriting with a refinancing-gap check). Inputs live in the URL; models are saved, versioned and private;
a model can be attached to a historical transaction and is always labelled hypothetical. The fictional Meridian
Court case links the Zell principles to lab presets.

### F. Empire Strategy Simulator (planned, Phase 4)
### G. Strategy Synthesis Engine & Doctrine (planned, Phase 5; tables exist)
### H. Research Workspace (live core: notes with links/tags/search, bookmarks; folders, rich text, reading lists, exports in Phase 5)
### I. AI Investment Historian (planned, Phase 5; explicit "not configured" state required)
### J. Investment Committee Chamber (planned, Phase 4)
### K. Weekly Research Ritual (surface live on the dashboard; tracking/reminders Phase 5)
### L. Six-Month Research Program (planned, Phase 5)

## 4. Evidence engine (foundational)

See `docs/RESEARCH_STANDARDS.md`. Claims, sources, claim-source links, verification reviews and audit events are
first-class tables; dossier prose cites claims; the UI exposes claim → source navigation and review history.

## 5. Information architecture

Public: Home, Explore the Empires, Featured Investigations, How It Works, Deal Archaeology, Capital Lab,
Simulations, Research Methodology, Membership, Sign In / Begin Research.

Authenticated: Command Center, Empire Dossiers, Historical Timeline, Deal Archaeology, Sources & Evidence, Capital
Network, Capital Architecture Lab, Research Library, Roadmap (later phases), Profile & Settings.

Administration: Research CMS (status + audit), Claims Verification, User Management. Later: institutional
profiles editor, transaction editor, financial scenario library, simulation editor, publishing workflow, analytics,
access controls.

## 6. Business model

Tiers Explorer / Researcher / Professional / Institutional are described without prices. Entitlement scaffolding
(roles, organisations, memberships) exists; payments are out of scope until credentials and commercial terms exist.

## 7. First milestone acceptance criteria (met — see Phase 1 report)

Researcher 001 can: open the homepage; sign in; enter the command center; open the Sam Zell dossier; read sourced
findings; explore the timeline; inspect evidence references; save a research note; bookmark a claim; open one
linked transaction; return later and see saved work. Verified by `tests/e2e/founding-milestone.spec.ts`.
