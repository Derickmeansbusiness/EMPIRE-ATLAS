# Implementation report — Phase 3: Network intelligence (2026-10-28)

## Summary
The Capital Network Explorer is now an interactive, evidence-linked graph with filters, a node evidence panel,
a table view and a schematic geographic view. Institutions have their own pages, and dossiers, deals and the
graph link to each other so every node is one click from its evidence and its record.

## Files created / modified
- `src/lib/data/network.ts` — graph loader (published nodes only unless an editor), pure `filterGraph`,
  `filterOptions`, deterministic `layoutGraph`, `getInstitution`.
- `src/components/network/graph.tsx` (client, React Flow 12) — custom nodes by kind, edges styled by verification
  status, selection dims unrelated edges, detail panel with relationships and evidence links.
- `src/components/network/geo-map.tsx` — SVG equirectangular projection over a fixed continental-U.S. frame,
  clustered markers, legend, explicit "not a basemap" note, unlocated nodes reported rather than guessed.
- Pages: `src/app/(app)/network/page.tsx` (graph / map / table, nine filters), `src/app/(app)/institutions/[slug]/page.tsx`.
- Migration `0004_geography.sql`; schema and seed updates with headquarters coordinates for 19 institutions,
  the Zell record and the Equity Office transaction.
- Links: dossier sidebar → institution pages and the investor-filtered network; deal participants → institution pages.
- Tests: `tests/unit/network.test.ts` (4), `tests/e2e/network.spec.ts` (2 × 2 devices).
- Dependency: `@xyflow/react@12.12.0`.

## Functional features
- Graph: 14 evidence-linked edges across the Zell corpus; click any node for its relationships, each with a
  verification badge and an "evidence →" link; open the dossier, institution or transaction from the panel.
- Filters: investor, institution, transaction, relationship type, evidence confidence, geography, asset class,
  year from/to. Counts show filtered versus full graph.
- Map: documented locations only (Chicago, New York, Boston, Lisle); nodes outside the frame or without coordinates are listed, not drawn.
- Institution pages: ego-network with direction, claims attached to the institution, record metadata, connected nodes.

## Tests executed
| Suite | Result |
|---|---|
| `pnpm typecheck`, `pnpm lint` | pass |
| `pnpm test` (Vitest) | 61 passed, 0 failed — 8 files |
| `pnpm build` | pass |
| `pnpm test:e2e` (Playwright, desktop + mobile) | 26 passed, 0 failed |

## Pending work
- Basemap (needs a licensed tile or vector source) and asset-level pins once the `assets` table is populated.
- Institutional dossiers with twelve divisions (research roadmap).
- Phase 4: simulator and investment committee.

## Required configuration
Unchanged. Migration 0004 applies automatically on next start or `pnpm db:migrate`.

## Next phase to implement
Phase 4 — Empire Simulator & Investment Committee.
