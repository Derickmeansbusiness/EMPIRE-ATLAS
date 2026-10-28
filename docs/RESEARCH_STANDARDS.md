# Research Standards

## Claims
Every factual statement that a reader could dispute is a **claim** record. Dossier prose cites claims with
`[[claim:slug]]`; the renderer turns each into an evidence chip linking to `/evidence/claims/<slug>`. The seed
integrity test fails if a section cites a claim that does not exist or if a claim has no source link.

## Verification statuses
| Status | Use when |
|---|---|
| verified_primary | SEC or company filings, exchange notices, court records, annual reports, catalogue records, property records. |
| supported_secondary | Reputable news (wire services, major papers), trade press, academic work, industry associations. |
| contested | Credible sources disagree. The claim text states both positions and the working assumption. |
| unverified | A single, weak or tertiary source; self-attributed figures; anything not yet checked. Never cite as fact. |
| hypothetical | Modelled or fictional assumptions. Never appears in a historical claim. |

A status is never assigned automatically. Seeded statuses are set by the research author in the seed file; human
reviews (Research Editor and above) change them through the admin UI, and each change is logged with reviewer,
previous status and note. Reseeding never overwrites a reviewed status.

## Sources
Store: title, type, publisher, author, URL, document reference (CIK/accession, ISBN, docket), publication date,
access date, licensing note, reliability note. Store short excerpts and locators, never whole works. Prefer the
document itself (EDGAR, court filing, exchange memo) over reporting about it. Record tertiary references (encyclopaedias)
only to corroborate basics, and note that in `reliability_note`.

## Data statuses for figures
`documented` (stated in a filing/contract/court record), `interpretation` (analytical reading of documents),
`estimate` (credible reporting without documentary basis in our corpus), `unknown` (left blank), `hypothetical`
(user model). When a loan amount or rate cannot be verified it stays unknown; users may build an explicitly
hypothetical model on top.

## Writing rules
- Say "entities controlled by Zell" when the filing says so; do not say "Zell owned".
- Distinguish estimated net worth, enterprise value, asset value and equity value; do not quote celebrity
  net-worth figures.
- Historical success is not inevitable; write the failure divisions with the same rigour as the successes.
- Interpretation is labelled as such in the prose ("Interpretation:", "Analytical interpretation:").
- When the build environment cannot reach a source, record what was used (search index summaries) and flag the
  claim's `researcher_notes` for editor re-verification. The Zell dossier carries that flag at file level.

## Review workflow
1. Author drafts claims in the seed with provisional statuses.
2. Editor opens `/admin/claims?status=needs_review`, checks each source, records a review.
3. Contested and unverified items remain visible to readers with their labels; they are not hidden, because
   showing uncertainty is a product feature.
4. Publishing an investor requires all twelve divisions and no unresolved citation.

## Licensing
No scraping of restricted sites. No republication of copyrighted works. Archival imagery and photography only
when licensed or public domain; none is shipped in Phase 1.
