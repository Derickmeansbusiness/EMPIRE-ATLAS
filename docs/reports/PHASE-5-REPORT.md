# Phase 5 report: complete research experience

## What shipped
- Strategy synthesis: principles linked to an investor, transaction and sourced claim; six starter prompts tied to real claims; a comparison page.
- Investment doctrine: eight sections, printable HTML and Markdown export. All user text is HTML-escaped and the export route sends a CSP header.
- Weekly ritual: five days, journal per day, weekly streak (three or more days counts the week).
- Six-month program: 24 weeks. Tasks tied to stored work complete on their own; self-directed research tasks are marked by the user.
- Quizzes: four, pass mark 70%. The calculation quiz computes expected answers with the finance library.
- Competency: six levels and eleven achievements, derived from completed work only.
- Library: folders, reading lists, notes export to Markdown.
- AI Investment Historian: BM25 retrieval over published claims, divisions, transactions and cases. Citations are validated against what was retrieved. Without a key the page still searches the same evidence.
- Membership tiers and entitlements, organizations and cohorts, platform analytics. Migration 0006.

## Verification
| Check | Result |
| --- | --- |
| `pnpm typecheck` | clean |
| `pnpm lint` | clean |
| `pnpm vitest run` | 116 passed, 13 files |
| `pnpm build` | succeeds |
| Playwright, desktop and mobile | 40 passed |

Quiz values were computed independently in Python: 599.5505, 1.39956, 62.5, 847761.2636, 8.8963, 12,500,000, 469328.0768, 9.175.

## Not verified or not built
- The AI path has only run against a mocked fetch. No real API call has been made.
- Market comparison is not built: no authorised, dated source.
- No payments. Entitlement enforcement is off by default.
- The e2e suite does not click through organization creation or reading lists; those are covered by data-layer tests.
