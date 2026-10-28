# Implementation report — Phase 4: Empire Simulator & Investment Committee (2026-10-28)

## Summary
The simulator and the committee are live. A pure scenario engine runs decision sequences with sealed outcomes
and deterministic scoring; two scenarios ship, one historical and one fictional; attempts are stored and
debriefed against the documented record with claim citations. The Investment Committee Chamber evaluates a
nine-section submission with a transparent rules-based framework and returns a scored memo.

## Files created / modified
- `src/simulation/engine.ts` — scenario and stage types, `activeStages`, `nextStage`, `playerView` (no leakage),
  `scoreAttempt`, `debrief` (throws until complete).
- `src/simulation/scenarios/office-portfolio-2007.ts` — four stages (offer, competing bid, proceeds, 2008 shock),
  conditional on earlier choices; hypothetical $-billion state; debrief cites nine claims.
- `src/simulation/scenarios/meridian-court-negotiation.ts` — bid, carry financing, discounted payoff, contested
  foreclosure (conditional); fictional $-thousand state; debrief cites the Zell/Chilmark method.
- `src/simulation/committee.ts` — six-dimension evaluator with findings, verdict thresholds and memo builder;
  uses the underwriter and stress test on the attached model.
- `src/lib/data/simulations.ts`, `src/app/actions/simulations.ts`, validation schemas; migration `0005`.
- Pages: `simulator`, `simulator/[slug]/play/[attemptId]`, `simulator/[slug]/debrief/[attemptId]`, `committee`,
  `committee/new`, `committee/[id]`; `src/components/committee/submission-form.tsx`.
- Navigation, module registry, public Simulations page, command-center recommendations and counts.
- Tests: `tests/unit/simulation.test.ts` (11), `tests/e2e/simulator-committee.spec.ts` (2 × 2 devices).

## Functional features
- Player sees briefing, constraints, options and current position only; consequences appear after committing,
  scores and history only in the debrief. Decisions are final per attempt; "play again" starts a new attempt.
- Scoring: 0–10 per dimension per option, fixed at authoring; bands from Research Apprentice to Empire Architect.
  The documented Tribune choice scores low on purpose; historical success is not treated as inevitable.
- Debrief: per-stage "you chose" with feedback and scores, "documented history" with verification badges and
  claim links, the closest documented choice, the modelled position after each stage, an epilogue.
- Committee: evidence quality (cited claims, developed thesis, sourced assumptions), financial correctness (DSCR,
  debt yield, LTV, no cap-rate compression, defined IRR), risk identification (six categories), capital efficiency
  (multiple, cash-on-cash, reconciled sources and uses), downside resilience (stress-test breaches, combined
  downturn refinancing), strategic consistency (explicit exit, hold period matches model, recommendation matches
  metrics). Memo lists every finding and the open conditions.

## Tests executed
| Suite | Result |
|---|---|
| `pnpm typecheck`, `pnpm lint` | pass |
| `pnpm test` (Vitest) | 72 passed, 0 failed — 9 files |
| `pnpm build` | pass |
| `pnpm test:e2e` (Playwright, desktop + mobile) | 30 passed, 0 failed |

Key unit checks: player view contains none of "feedback", "consequence", "historical", "scores", "Blackstone",
"$55.50"; debrief throws before completion; documented path ≥ 85, leveraged path < 40; Meridian Court modelled
equity after the recommended path equals 13,332 (12,000 − 9,100 − 38×6 + 10,660); every scenario claim slug exists
in the seed; a complete modelled submission is approved, a thin one declined, and approving a deal that fails its
own coverage is flagged; attempts and submissions are invisible to other users.

## Pending work
- More scenarios and an admin scenario editor; quizzes and competency progression (Phase 5).
- Phase 5: synthesis, doctrine, ritual tracking, six-month program, AI historian, memberships.

## Required configuration
Unchanged. Migration 0005 applies automatically.

## Next phase to implement
Phase 5 — Complete research experience.
