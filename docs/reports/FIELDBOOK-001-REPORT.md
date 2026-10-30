# The Investor’s Fieldbook, report 001: audit and first end-to-end workflow

## 1. Audit of the existing architecture (before any change)
- **Stack and layering** matched CLAUDE.md: Next.js 16 App Router, server actions with `requireUser` and Zod, Drizzle over PGlite or Postgres, SQL migrations as the source of truth, `queryRows` for raw SQL. Migrations stood at 0006.
- **Reusable:** `research_notes` and `createNote` (private library), `research_progress` (activity feed), the finance library (`buildLoanSchedule`, `debtServiceCoverage`, `debtYield`, `capRate`), the Capital Lab underwriter (inputs live in the URL), the UI primitives, the doctrine export pattern (escaped HTML with a CSP header), and the e2e harness.
- **Gaps that shaped the design:** no file storage existed; the server-action body limit is 1 MB (uploads go through a route handler instead); the global `Permissions-Policy` header denied geolocation; there was no notion of a user-owned entity that also has platform-owned rows (solved with `user_id NULL` plus read-all, write-owner RLS policies).
- **Not touched:** dossiers, claims, the evidence engine, the lab, the simulator, the committee and auth. Changes outside the new module are limited to: the nav group, the module registry, activity labels, the seed entry point, the edge proxy prefix list, and one security header (below).

## 2. Delivered: the 13-step workflow, with all functions working
1. Open the Fieldbook (`/fieldbook`).
2. Read the sourced analysis of Cardone, *How to Create Wealth Investing in Real Estate*, p. 39: ten dimensions, five evidence classes, personal claims marked first-person and uncorroborated, zero verified supporting facts recorded.
3. Open the activity explorer to see which skill each activity might build, what the passage does not say, and the exercise that practises it (six exercises).
4. Launch the Linden Court challenge (fictional, 64 units).
5. Normalise an editable statement table (live subtotals), calculate NOI, cap rate, DSCR, debt yield and value, flag anomalies, write diligence questions, recommend.
6. Answers are saved as an attempt.
7. Transparent assessment: 100 points over six dimensions, every line with a reason, side-by-side with the model solution, anomaly explanations, topic coverage, improvement across attempts.
8. Open the linked fictional property.
9. Structured walk: 17 categories, 70 items for multifamily, touch-sized ratings, progress, draft saving.
10. Findings with location, component, severity (six levels), confidence, condition, impact, specialist, cost range with a required source, follow-up status, resolution; private photos; follow-up tasks; edit history.
11. Reconciliation: seller figures, observations, verified items, investigation list, three underwriting cases, implications, NOI bridge, risk map, cross-checks.
12. Property Intelligence Report generated from the frozen snapshot (Markdown and escaped, printable HTML).
13. Saved to the private Research Library; owner-only access verified.

Also built: seven inspection templates (multifamily, single-family rental, industrial, retail, office, hospitality, mixed-use), each with all 17 categories; the Capital Lab hand-off with base-case inputs; private passages with short excerpts.

## 3. Tests executed
| Check | Result |
| --- | --- |
| `pnpm typecheck` | clean |
| `pnpm lint` | clean |
| `pnpm vitest run` | 146 passed (30 new): statement arithmetic, grading, reconciliation, report escaping, templates, data layer, authorisation, image validation, revisions, constraints |
| `pnpm build` | succeeds |
| Playwright, desktop and mobile | 50 passed (10 new, five scenarios on each) |

Independent verification: the Linden Court figures (reported NOI 492,980; normalised NOI after reserves 389,889.60; debt service 344,016.43; DSCR 1.1333; debt yield 8.821%; value 5,377,787.59; lender-limited loan 4,007,510.99) were computed in Python from closed-form formulas, not from this code.

Browser scenarios: the full workflow above; checklist drafts surviving a lost connection and syncing on return; location tagged only after a tap and permission, then removable; no sideways scroll and 44 px touch targets on a phone; uploads refusing a missing consent tick, a non-image, an oversize file, someone else’s inspection and a cross-site origin; owner-only access for the report, its export and the photo.

Bugs the tests caught in my own work, now fixed: an upload origin check that compared against Next’s internal URL (rejected genuine uploads); a redirect built from that same URL (dropped the session cookie); React’s automatic form reset wiping dropdown choices after a validation error (a finding would have been saved as “Other / Minor maintenance”); a mobile layout overflow on the challenge page.

## 4. Configuration requirements
None new. The Fieldbook needs no API key and no extra service. AI-assisted passage analysis and simulated broker conversations are not built, so no key is read for them.

## 5. Decisions you should know about
- **Passage text.** You described the passage but did not supply its text, and I did not reproduce it from memory. The platform stores no excerpt for it; the analysis works from your description and says so on the page. Each user can add their own short excerpt privately. Publication date and edition are left unknown.
- **Geolocation.** The app’s global header was `geolocation=()`, which blocked the optional location tag. It is now `geolocation=(self)`. Camera and microphone remain denied (photos use the file picker, which opens the phone’s camera app).
- **Photo storage.** Images are held in the database as base64 text, capped at 3 MB, so they work on PGlite and Postgres with no extra service. That costs about a third more space than raw bytes and is not suited to large volumes. Moving to object storage later only touches `addMedia` and `getMedia`.
- **Illustrative conventions.** The 4% management fee, $650/unit repairs, $250/unit reserves, 7.25% training cap rate, 1.16% tax rate, 2% closing costs and the lender minimums are training conventions, stated beside every result. They are not market data.
- **Keyword scoring.** Diligence-question and justification scoring is keyword based. It checks that evidence and topics were named, not how well they were written, and the results page says so.

## 6. Pending and known limitations
- Challenge cases 2–20 (one of twenty exists). Fifteen listed scenario types remain to be authored and verified.
- Broker and lender interview worksheets, saved contacts, term-sheet comparison, negotiation role-play and the virtual property walk (Phase E) are not started. The six-stage Practice Translator entries for brokers and lenders point at planned work or the existing Debt Structuring Lab, and say so.
- CSV/XLSX ingestion, rent rolls and unit records as stored entities, PDF extraction, persisted reconciliations, committee hand-off for Fieldbook deals.
- Creating your own properties, customising templates, voice notes, photo annotation.
- **Offline:** drafts of checklist ratings and notes survive a lost connection and send when it returns, while the page stays open. The page cannot be opened offline (no service worker), photos need a connection, and findings are saved online only. This is the extent of what is tested.
- The skill scorecard and the eight-stage deal workflow are not built; activity is recorded (`challenge.attempted`, `walk.completed`, `finding.recorded`, `report.saved`) so they can be derived later.
- AI-assisted passage analysis is not built. When added it must stay labelled as interpretation.
- Nothing here is professional due diligence. The pages, templates and reports say so, and the walk warns against entering restricted areas, roofs, panels and mechanical rooms.
