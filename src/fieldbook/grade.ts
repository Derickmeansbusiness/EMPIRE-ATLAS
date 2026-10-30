/**
 * Transparent, rules-based grading for underwriting challenges. Every point carries a stated reason.
 * Dimensions (100 points): calculation accuracy 30, anomaly identification 20, due-diligence questions 15,
 * justification of adjustments 15, risk recognition 10, investment judgment 10.
 * Free-text scoring is keyword-based and says so; it checks that a basis and the right topics were stated,
 * not the quality of prose.
 */
import { metricsFor, summarize, withAmounts } from "./statement";
import { solve } from "./solution";
import type { ChallengeCase } from "./challenges/types";

export type Recommendation = "acquire" | "negotiate" | "investigate" | "reject";
export interface ChallengeAnswers {
  amounts: Record<string, number>;              // student's normalised amount per statement line
  basis: Record<string, string>;                // student's stated basis per adjusted line
  reportedNoi: number | null; capRatePct: number | null; dscr: number | null; debtYieldPct: number | null; maxPrice: number | null;
  anomalies: string[]; questions: string; largestDriver: string; dscrPasses: "yes" | "no" | "";
  recommendation: Recommendation | ""; rationale: string;
}
export interface ScoreLine { dimension: string; label: string; earned: number; max: number; detail: string }
export interface ChallengeResult { total: number; max: number; lines: ScoreLine[]; byDimension: Record<string, { earned: number; max: number }>; studentNoi: number; topicsCovered: string[] }

const near = (s: number | null, e: number, relTol: number): "full" | "half" | "none" => {
  if (s == null || !Number.isFinite(s)) return "none";
  const err = Math.abs(s - e) / Math.max(Math.abs(e), 1e-9);
  return err <= relTol ? "full" : err <= relTol * 3 ? "half" : "none";
};
const round2 = (n: number) => Math.round(n * 100) / 100;

export function gradeChallenge(c: ChallengeCase, a: ChallengeAnswers): ChallengeResult {
  const sol = solve(c); const lines: ScoreLine[] = [];
  const add = (dimension: string, label: string, earned: number, max: number, detail: string) => lines.push({ dimension, label, earned: round2(earned), max, detail });
  const studentLines = withAmounts(c.lines, a.amounts); const studentSummary = summarize(studentLines, c.property.units);
  const studentNoi = studentSummary.noi;
  const own = metricsFor(studentNoi, c.askingPrice, c.debt, c.marketCapRate);

  // 1. Calculation accuracy (30): six figures at 5 points. Full credit for matching the instructor; half credit for
  //    a figure that is correct given the student's own normalised NOI (carry-forward), so one early slip is not charged six times.
  const calc = (label: string, student: number | null, expected: number, ownExpected: number, relTol: number, fmt: (n: number) => string) => {
    const vsSolution = near(student, expected, relTol); const vsOwn = near(student, ownExpected, relTol);
    if (vsSolution === "full") add("Calculation accuracy", label, 5, 5, `Matches the model solution (${fmt(expected)}).`);
    else if (vsOwn === "full") add("Calculation accuracy", label, 2.5, 5, `Consistent with your own NOI, but the model solution is ${fmt(expected)}. Carry-forward credit.`);
    else if (vsSolution === "half") add("Calculation accuracy", label, 2.5, 5, `Close to the model solution (${fmt(expected)}).`);
    else add("Calculation accuracy", label, 0, 5, `Model solution: ${fmt(expected)}.`);
  };
  const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`; const pctf = (n: number) => `${(n * 100).toFixed(2)}%`;
  calc("Reported NOI (before reserves)", a.reportedNoi, sol.reported.noiBeforeReserves, sol.reported.noiBeforeReserves, 0.005, usd);
  const nn = near(studentNoi, sol.normalized.noi, 0.01);
  add("Calculation accuracy", "Normalised NOI after reserves (from your table)", nn === "full" ? 5 : near(studentNoi, sol.normalized.noi, 0.04) !== "none" ? 2.5 : 0, 5, nn === "full" ? `Within 1% of the model solution (${usd(sol.normalized.noi)}); yours is ${usd(studentNoi)}.` : `Model solution ${usd(sol.normalized.noi)}; yours is ${usd(studentNoi)}.`);
  calc("Cap rate on the asking price (normalised NOI)", a.capRatePct == null ? null : a.capRatePct / 100, sol.normalizedMetrics.capRate, own.capRate, 0.015, pctf);
  calc("DSCR (normalised NOI)", a.dscr, sol.normalizedMetrics.dscr, own.dscr, 0.015, (n) => `${n.toFixed(2)}x`);
  calc("Debt yield (normalised NOI)", a.debtYieldPct == null ? null : a.debtYieldPct / 100, sol.normalizedMetrics.debtYield, own.debtYield, 0.015, pctf);
  calc("Value at the market cap rate", a.maxPrice, sol.normalizedMetrics.impliedValue, own.impliedValue, 0.02, usd);

  // 2. Anomaly identification (20)
  const expected = c.anomalies.filter((x) => x.expected); const decoys = c.anomalies.filter((x) => !x.expected);
  const picked = new Set(a.anomalies);
  const hits = expected.filter((x) => picked.has(x.id)); const falsePos = decoys.filter((x) => picked.has(x.id));
  const anomalyPts = Math.max(0, (20 * (hits.length - 0.5 * falsePos.length)) / expected.length);
  add("Anomaly identification", `Found ${hits.length} of ${expected.length} real anomalies, ${falsePos.length} unsupported`, anomalyPts, 20, falsePos.length ? `Each unsupported flag costs half a hit: ${falsePos.map((f) => f.label).join("; ")}.` : "No unsupported flags.");

  // 3. Due-diligence questions (15)
  const qText = a.questions.toLowerCase(); const covered = c.topics.filter((t) => new RegExp(t.pattern, "i").test(qText));
  add("Due-diligence questions", `Covered ${covered.length} of ${c.topics.length} diligence topics`, (15 * covered.length) / c.topics.length, 15, covered.length < c.topics.length ? `Missing: ${c.topics.filter((t) => !covered.includes(t)).map((t) => t.label).join("; ")}. Keyword match, so name the topic in your question.` : "All topics covered.");

  // 4. Justification of adjustments (15): 2.5 per rule. Needs an amount inside the accepted range and a stated basis naming evidence.
  for (const r of c.adjustmentRules) {
    const v = a.amounts[r.lineKey]; const inRange = v != null && (r.min == null || v >= r.min) && (r.max == null || v <= r.max);
    const basis = (a.basis[r.lineKey] ?? "").trim(); const hasBasis = basis.length >= 20 && new RegExp(r.basisPattern, "i").test(basis);
    const earned = inRange && hasBasis ? 2.5 : inRange ? 1.25 : 0;
    add("Justification of adjustments", r.label, earned, 2.5, inRange ? (hasBasis ? "Amount in range with a stated evidence-based reason." : "Amount in range, but no stated evidence-based reason (20+ characters naming the source).") : `Amount outside the reasonable range. ${r.expectation}`);
  }

  // 5. Risk recognition (10)
  const drv = a.largestDriver === sol.largestDriver.lineKey;
  add("Risk recognition", "Largest single NOI adjustment", drv ? 5 : 0, 5, drv ? `Correct: ${sol.largestDriver.label} (${usd(Math.abs(sol.largestDriver.noiEffect))}).` : `The largest was ${sol.largestDriver.label} (${usd(Math.abs(sol.largestDriver.noiEffect))}).`);
  const dsOk = (a.dscrPasses === "yes") === sol.normalizedMetrics.passesDscr && a.dscrPasses !== "";
  add("Risk recognition", `Does the loan meet the lender’s ${c.debt.minDscr.toFixed(2)}x DSCR minimum?`, dsOk ? 5 : 0, 5, `On normalised NOI, DSCR is ${sol.normalizedMetrics.dscr.toFixed(2)}x: it ${sol.normalizedMetrics.passesDscr ? "passes" : "does not pass"}.`);

  // 6. Investment judgment (10)
  const rec = a.recommendation; const recPts = rec === "negotiate" || rec === "investigate" ? 7 : rec === "reject" ? 4 : 0;
  const reasoned = a.rationale.trim().length >= 80 && /noi|price|dscr|debt|cap rate|reserve|vacan/i.test(a.rationale);
  add("Investment judgment", "Recommendation", recPts, 7, rec === "acquire" ? "Acquiring at the asking price is not supported once NOI is normalised: it fails the lender’s DSCR and debt-yield tests." : rec === "reject" ? "Rejecting is defensible, but the issues are priceable and investigable; negotiating or investigating further is stronger." : rec ? "Negotiate or investigate further are the strongest responses." : "No recommendation chosen.");
  add("Investment judgment", "Rationale", rec === "acquire" || !rec ? 0 : reasoned ? 3 : 0, 3, reasoned ? "Rationale cites the numbers." : "Write 80+ characters that cite NOI, price, DSCR or another figure.");

  const byDimension: ChallengeResult["byDimension"] = {};
  for (const l of lines) { const d = (byDimension[l.dimension] ??= { earned: 0, max: 0 }); d.earned = round2(d.earned + l.earned); d.max += l.max; }
  const total = round2(lines.reduce((s, l) => s + l.earned, 0)); const max = lines.reduce((s, l) => s + l.max, 0);
  return { total, max, lines, byDimension, studentNoi, topicsCovered: covered.map((t) => t.id) };
}

export const emptyAnswers = (c: ChallengeCase): ChallengeAnswers => ({
  amounts: Object.fromEntries(c.lines.map((l) => [l.key, l.amount])), basis: {}, reportedNoi: null, capRatePct: null, dscr: null, debtYieldPct: null, maxPrice: null,
  anomalies: [], questions: "", largestDriver: "", dscrPasses: "", recommendation: "", rationale: "",
});
