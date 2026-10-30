/**
 * Competency levels derived from completed exercises and verified skills. Time spent viewing content never counts.
 */
export type Level = "research_apprentice" | "deal_analyst" | "credit_architect" | "acquisition_strategist" | "capital_strategist" | "empire_architect";

export const LEVELS: Array<{ key: Level; label: string; requires: string[] }> = [
  { key: "research_apprentice", label: "Research Apprentice", requires: ["Create an account and begin."] },
  { key: "deal_analyst", label: "Deal Analyst", requires: ["Pass at least one quiz.", "Save at least one financial model.", "Write at least one research note."] },
  { key: "credit_architect", label: "Credit Architect", requires: ["Pass the evidence quiz and the capital calculations quiz.", "Save models in at least three different lab tools."] },
  { key: "acquisition_strategist", label: "Acquisition Strategist", requires: ["Complete a simulation scoring 55 or more.", "Submit to the investment committee with a score of 60 or more."] },
  { key: "capital_strategist", label: "Capital Strategist", requires: ["Score 70 or more in two different scenarios.", "Have a committee submission approved.", "Save at least three principles."] },
  { key: "empire_architect", label: "Empire Architect", requires: ["Pass every quiz.", "Complete all eight doctrine sections.", "Score 85 or more in a simulation.", "Complete at least twelve program weeks."] },
];

export interface CompetencyStats {
  quizzesPassed: string[]; allQuizSlugs: string[]; modelKinds: string[]; notes: number;
  simulationBest: Record<string, number>; committeeBest: { score: number; verdict: string } | null; committeeApproved: boolean;
  principles: number; doctrineFieldsFilled: number; programWeeksComplete: number;
}

export interface CompetencyResult { level: Level; label: string; index: number; next: { level: Level; label: string; missing: string[] } | null; achievements: Achievement[] }
export interface Achievement { key: string; label: string; description: string; earned: boolean }

function conditions(s: CompetencyStats): Record<Exclude<Level, "research_apprentice">, Array<[string, boolean]>> {
  const sims = Object.values(s.simulationBest);
  return {
    deal_analyst: [["Pass a quiz", s.quizzesPassed.length >= 1], ["Save a model", s.modelKinds.length >= 1], ["Write a note", s.notes >= 1]],
    credit_architect: [["Pass the evidence quiz", s.quizzesPassed.includes("reading-the-evidence")], ["Pass the capital calculations quiz", s.quizzesPassed.includes("capital-calculations")], ["Save models in three lab tools", new Set(s.modelKinds).size >= 3]],
    acquisition_strategist: [["Score 55+ in a simulation", sims.some((v) => v >= 55)], ["Committee score 60+", (s.committeeBest?.score ?? 0) >= 60]],
    capital_strategist: [["Score 70+ in two scenarios", sims.filter((v) => v >= 70).length >= 2], ["Committee approval", s.committeeApproved], ["Three principles", s.principles >= 3]],
    empire_architect: [["Pass every quiz", s.allQuizSlugs.length > 0 && s.allQuizSlugs.every((q) => s.quizzesPassed.includes(q))], ["Doctrine complete", s.doctrineFieldsFilled >= 8], ["Score 85+ in a simulation", sims.some((v) => v >= 85)], ["Twelve program weeks", s.programWeeksComplete >= 12]],
  };
}

export function computeCompetency(s: CompetencyStats): CompetencyResult {
  const c = conditions(s);
  let index = 0;
  for (let i = 1; i < LEVELS.length; i++) {
    const key = LEVELS[i]!.key as Exclude<Level, "research_apprentice">;
    if (c[key].every(([, ok]) => ok)) index = i; else break; // levels are sequential
  }
  const nextLevel = LEVELS[index + 1];
  const next = nextLevel ? { level: nextLevel.key, label: nextLevel.label, missing: c[nextLevel.key as Exclude<Level, "research_apprentice">].filter(([, ok]) => !ok).map(([l]) => l) } : null;
  return { level: LEVELS[index]!.key, label: LEVELS[index]!.label, index, next, achievements: achievements(s) };
}

export function achievements(s: CompetencyStats): Achievement[] {
  const sims = Object.values(s.simulationBest);
  return [
    { key: "first-quiz", label: "First quiz passed", description: "Pass any quiz.", earned: s.quizzesPassed.length >= 1 },
    { key: "evidence-reader", label: "Evidence reader", description: "Pass the evidence quiz.", earned: s.quizzesPassed.includes("reading-the-evidence") },
    { key: "numbers-person", label: "Numbers person", description: "Pass the capital calculations quiz.", earned: s.quizzesPassed.includes("capital-calculations") },
    { key: "first-model", label: "First model saved", description: "Save any lab model.", earned: s.modelKinds.length >= 1 },
    { key: "toolmaker", label: "Toolmaker", description: "Save models in three different lab tools.", earned: new Set(s.modelKinds).size >= 3 },
    { key: "sealed-decision", label: "Decided in the dark", description: "Complete a simulation.", earned: sims.length >= 1 },
    { key: "strong-judgment", label: "Strong judgment", description: "Score 85+ in a simulation.", earned: sims.some((v) => v >= 85) },
    { key: "committee-approved", label: "Committee approval", description: "Have a submission approved.", earned: s.committeeApproved },
    { key: "principled", label: "Principled", description: "Save three principles.", earned: s.principles >= 3 },
    { key: "doctrine", label: "Doctrine complete", description: "Fill all eight doctrine sections.", earned: s.doctrineFieldsFilled >= 8 },
    { key: "half-program", label: "Halfway", description: "Complete twelve program weeks.", earned: s.programWeeksComplete >= 12 },
  ];
}
