/**
 * Empire Strategy Simulator — pure scenario engine.
 *
 * A scenario is a sequence of stages. At each stage the player sees only the briefing and the options
 * (`PlayerStageView`); consequences, feedback and the documented historical outcome are revealed only in the
 * debrief after the final stage is committed. State transitions and scores are deterministic functions of the
 * chosen options; "events" are explicitly defined in the scenario, never random.
 */
export type ScoreDimension = "financial_reasoning" | "leverage_prudence" | "diligence" | "liquidity" | "risk_adjusted_return";
export const SCORE_DIMENSIONS: Array<{ key: ScoreDimension; label: string; description: string }> = [
  { key: "financial_reasoning", label: "Financial reasoning", description: "Did the choice follow from the numbers available at the time?" },
  { key: "leverage_prudence", label: "Leverage prudence", description: "Was debt matched to cash flow, maturity and the point in the cycle?" },
  { key: "diligence", label: "Diligence & process", description: "Did the player use the process available (competition, time, information) before committing?" },
  { key: "liquidity", label: "Liquidity preservation", description: "Was the ability to survive a shock protected?" },
  { key: "risk_adjusted_return", label: "Risk-adjusted return", description: "Return earned per unit of risk taken, judged on the information available." },
];

export interface SimState {
  /** All money figures are hypothetical and in the scenario's stated unit (e.g. $ millions). */
  equityValue: number; liquidity: number; debt: number; assetValue: number;
  flags: Record<string, boolean | number | string>;
  log: string[];
}

export interface SimOption {
  key: string;
  label: string;
  detail: string;
  /** Applied when chosen. Must be pure. */
  apply: (state: SimState) => SimState;
  /** 0–10 per dimension. Missing dimensions are not scored for this option. */
  scores: Partial<Record<ScoreDimension, number>>;
  /** Revealed only in the debrief. */
  feedback: string;
  /** Immediate consequence shown after the choice is committed (no future information). */
  consequence?: string;
}

export interface SimStage {
  key: string;
  title: string;
  when: string;                      // e.g. "November 2006"
  briefing: string;                  // information available at that moment (markdown-lite)
  constraints?: string[];
  options: SimOption[];
  /** Optional condition: stage is shown only when it returns true for the current state. */
  visibleWhen?: (state: SimState) => boolean;
  /** Documented history for the debrief, cited with claim slugs. */
  historical: { summary: string; claims: string[]; documentedChoiceKey?: string };
}

export interface SimScenario {
  slug: string;
  title: string;
  subtitle: string;
  kind: "historical" | "fictional";
  unit: string;                      // "$ millions" etc.
  setting: string;                   // historical setting (markdown-lite)
  objectives: string[];
  capitalSources: string[];
  investorSlug?: string;
  caseSlug?: string;
  disclaimer: string;
  initialState: () => SimState;
  stages: SimStage[];
  /** Final narrative for the debrief given the terminal state. */
  epilogue: (state: SimState) => string;
  /** Claims the whole scenario rests on, shown in the debrief header. */
  evidence: string[];
}

export interface PlayerStageView { key: string; title: string; when: string; briefing: string; constraints: string[]; options: Array<{ key: string; label: string; detail: string }>; index: number; total: number }

export interface AttemptRecord { choices: Array<{ stageKey: string; optionKey: string }> }

export interface StageResult { stage: SimStage; option: SimOption; stateAfter: SimState }
export interface ScoreCard { total: number; band: string; byDimension: Record<ScoreDimension, { score: number; max: number }>; }
export interface DebriefResult { results: StageResult[]; finalState: SimState; score: ScoreCard; epilogue: string }

/** Stages visible for a given sequence of choices (handles conditional stages). */
export function activeStages(scenario: SimScenario, attempt: AttemptRecord): { stages: SimStage[]; state: SimState; results: StageResult[] } {
  let state = scenario.initialState();
  const results: StageResult[] = [];
  const stages: SimStage[] = [];
  let choiceIdx = 0;
  for (const stage of scenario.stages) {
    if (stage.visibleWhen && !stage.visibleWhen(state)) continue;
    stages.push(stage);
    const choice = attempt.choices[choiceIdx];
    if (!choice) break;
    if (choice.stageKey !== stage.key) throw new Error(`Choice order mismatch: expected ${stage.key}, got ${choice.stageKey}`);
    const option = stage.options.find((o) => o.key === choice.optionKey);
    if (!option) throw new Error(`Unknown option ${choice.optionKey} for stage ${stage.key}`);
    state = option.apply(structuredClone(state));
    results.push({ stage, option, stateAfter: state });
    choiceIdx++;
  }
  return { stages, state, results };
}

export function nextStage(scenario: SimScenario, attempt: AttemptRecord): SimStage | null {
  const { stages, results } = activeStages(scenario, attempt);
  return stages[results.length] ?? null;
}

export function isComplete(scenario: SimScenario, attempt: AttemptRecord): boolean {
  return nextStage(scenario, attempt) === null;
}

/** What the player may see before deciding: no consequences, feedback, scores or history. */
export function playerView(scenario: SimScenario, attempt: AttemptRecord): PlayerStageView | null {
  const stage = nextStage(scenario, attempt);
  if (!stage) return null;
  const { results } = activeStages(scenario, attempt);
  const total = estimateTotalStages(scenario, attempt);
  return { key: stage.key, title: stage.title, when: stage.when, briefing: stage.briefing, constraints: stage.constraints ?? [], options: stage.options.map((o) => ({ key: o.key, label: o.label, detail: o.detail })), index: results.length + 1, total };
}

/** Visible stages so far plus later stages that would be visible given the current state (an estimate). */
function estimateTotalStages(scenario: SimScenario, attempt: AttemptRecord): number {
  const { stages, state } = activeStages(scenario, attempt);
  const last = stages[stages.length - 1];
  const lastIdx = last ? scenario.stages.indexOf(last) : -1;
  let count = stages.length;
  for (const s of scenario.stages.slice(lastIdx + 1)) if (!s.visibleWhen || s.visibleWhen(state)) count++;
  return count;
}

export function scoreAttempt(results: StageResult[]): ScoreCard {
  const byDimension = Object.fromEntries(SCORE_DIMENSIONS.map((d) => [d.key, { score: 0, max: 0 }])) as ScoreCard["byDimension"];
  for (const r of results) for (const [k, v] of Object.entries(r.option.scores) as Array<[ScoreDimension, number]>) { byDimension[k].score += v; byDimension[k].max += 10; }
  const totalMax = Object.values(byDimension).reduce((a, b) => a + b.max, 0);
  const totalScore = Object.values(byDimension).reduce((a, b) => a + b.score, 0);
  const total = totalMax === 0 ? 0 : Math.round((totalScore / totalMax) * 100);
  const band = total >= 85 ? "Empire Architect" : total >= 70 ? "Capital Strategist" : total >= 55 ? "Acquisition Strategist" : total >= 40 ? "Deal Analyst" : "Research Apprentice";
  return { total, band, byDimension };
}

export function debrief(scenario: SimScenario, attempt: AttemptRecord): DebriefResult {
  if (!isComplete(scenario, attempt)) throw new Error("Attempt is not complete; outcomes stay sealed.");
  const { results, state } = activeStages(scenario, attempt);
  return { results, finalState: state, score: scoreAttempt(results), epilogue: scenario.epilogue(state) };
}
