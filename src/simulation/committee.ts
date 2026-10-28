/**
 * Investment Committee evaluation — a transparent, rules-based framework. It is not an investment opinion;
 * every point awarded is explained so the student can see what the committee looked for.
 */
import { underwriteAcquisition, type UnderwritingAssumptions, type UnderwritingResult } from "@/finance/underwriting";
import { stressTest } from "@/finance/stress";

export interface CommitteeSubmission {
  title: string;
  thesis: string;
  assetDetails: string;
  sourcesAndUses: string;
  assumptionsNarrative: string;
  capitalStack: string;
  risks: string;
  sensitivity: string;
  exitStrategy: string;
  recommendation: "approve" | "approve_with_conditions" | "decline";
  model?: UnderwritingAssumptions | null;
  citedClaims: string[];   // claim slugs referenced in the thesis ([[claim:slug]])
}

export type CommitteeDimension = "evidence_quality" | "financial_correctness" | "risk_identification" | "capital_efficiency" | "downside_resilience" | "strategic_consistency";
export const COMMITTEE_DIMENSIONS: Array<{ key: CommitteeDimension; label: string }> = [
  { key: "evidence_quality", label: "Evidence quality" }, { key: "financial_correctness", label: "Financial correctness" }, { key: "risk_identification", label: "Risk identification" },
  { key: "capital_efficiency", label: "Capital efficiency" }, { key: "downside_resilience", label: "Downside resilience" }, { key: "strategic_consistency", label: "Strategic consistency" },
];

export interface DimensionResult { key: CommitteeDimension; score: number; max: 10; findings: string[] }
export interface CommitteeEvaluation { total: number; verdict: "approved" | "approved_with_conditions" | "declined" | "resubmit"; dimensions: DimensionResult[]; memo: string; modelResult: UnderwritingResult | null }

const RISK_KEYWORDS: Array<[string, RegExp]> = [
  ["interest-rate / refinancing", /refinanc|interest rate|rate risk|maturity|balloon/i], ["liquidity", /liquidity|reserve|cash buffer|carry/i], ["market / rent", /rent|occupancy|vacancy|absorption|supply/i],
  ["execution / capex", /renovation|capex|construction|contractor|execution/i], ["counterparty / legal", /lender|borrower|litigation|foreclosure|title|counterparty/i], ["insurance / tax", /insurance|property tax|tax reassess/i],
];

const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

export function evaluateSubmission(s: CommitteeSubmission): CommitteeEvaluation {
  const dims: DimensionResult[] = [];
  let modelResult: UnderwritingResult | null = null;
  try { modelResult = s.model ? underwriteAcquisition(s.model) : null; } catch { modelResult = null; }

  // 1. Evidence quality
  { const f: string[] = []; let sc = 0;
    if (s.citedClaims.length >= 3) { sc += 5; f.push(`${s.citedClaims.length} evidence claims cited in the thesis.`); } else if (s.citedClaims.length > 0) { sc += 3; f.push(`${s.citedClaims.length} claim(s) cited; three or more expected.`); } else f.push("No evidence claims cited ([[claim:slug]]).");
    if (words(s.thesis) >= 120) { sc += 3; f.push("Thesis is developed (120+ words)."); } else f.push("Thesis is thin; develop the argument.");
    if (/source|filing|record|data|comparable|comp\b/i.test(s.assumptionsNarrative)) { sc += 2; f.push("Assumptions reference their sources."); } else f.push("Assumptions do not say where the numbers come from.");
    dims.push({ key: "evidence_quality", score: Math.min(10, sc), max: 10, findings: f }); }

  // 2. Financial correctness
  { const f: string[] = []; let sc = 0;
    if (!modelResult) f.push("No underwriting model attached; the committee cannot verify the numbers.");
    else {
      sc += 2; f.push("Underwriting model attached and computes.");
      if (modelResult.dscrYear1 >= 1.2) { sc += 2; f.push(`DSCR ${modelResult.dscrYear1.toFixed(2)}x ≥ 1.20x.`); } else f.push(`DSCR ${modelResult.dscrYear1.toFixed(2)}x below 1.20x.`);
      if (modelResult.debtYieldYear1 >= 0.08) { sc += 2; f.push(`Debt yield ${(modelResult.debtYieldYear1 * 100).toFixed(1)}% ≥ 8%.`); } else f.push(`Debt yield ${(modelResult.debtYieldYear1 * 100).toFixed(1)}% below 8%.`);
      if (s.model!.loanToValue <= 0.75) { sc += 1; f.push(`LTV ${(s.model!.loanToValue * 100).toFixed(0)}% within 75%.`); } else f.push(`LTV ${(s.model!.loanToValue * 100).toFixed(0)}% above 75%.`);
      if (s.model!.exitCapRate >= modelResult.goingInCapRate) { sc += 2; f.push("Exit cap rate is not below the going-in cap rate (no compression assumed)."); } else f.push("Exit cap rate below going-in: returns depend on cap-rate compression.");
      if (modelResult.leveredIrr != null && modelResult.leveredIrr > 0) { sc += 1; f.push(`Levered IRR ${(modelResult.leveredIrr * 100).toFixed(1)}% is defined and positive.`); } else f.push("Levered IRR is undefined or negative.");
    }
    dims.push({ key: "financial_correctness", score: Math.min(10, sc), max: 10, findings: f }); }

  // 3. Risk identification
  { const f: string[] = []; const hits = RISK_KEYWORDS.filter(([, re]) => re.test(s.risks)).map(([k]) => k);
    let sc = Math.min(8, hits.length * 2);
    f.push(hits.length ? `Risk categories addressed: ${hits.join(", ")}.` : "Risks section does not address recognisable categories.");
    if (words(s.risks) >= 80) { sc += 2; f.push("Risks are discussed in depth."); } else f.push("Risks are listed briefly; explain mitigation.");
    dims.push({ key: "risk_identification", score: Math.min(10, sc), max: 10, findings: f }); }

  // 4. Capital efficiency
  { const f: string[] = []; let sc = 0;
    if (modelResult) {
      if (modelResult.equityMultiple >= 1.6) { sc += 4; f.push(`Equity multiple ${modelResult.equityMultiple.toFixed(2)}x.`); } else if (modelResult.equityMultiple >= 1.3) { sc += 2; f.push(`Equity multiple ${modelResult.equityMultiple.toFixed(2)}x is modest.`); } else f.push(`Equity multiple ${modelResult.equityMultiple.toFixed(2)}x is low.`);
      if (modelResult.cashOnCashYear1 >= 0.05) { sc += 3; f.push(`Year-1 cash-on-cash ${(modelResult.cashOnCashYear1 * 100).toFixed(1)}%.`); } else f.push(`Year-1 cash-on-cash ${(modelResult.cashOnCashYear1 * 100).toFixed(1)}% is thin.`);
    } else f.push("No model: capital efficiency cannot be measured.");
    if (/mezz|preferred|pref equity|seller|assumable|subordinat/i.test(s.capitalStack)) { sc += 1; f.push("Capital stack considers more than one layer."); }
    if (/sources.*uses|uses.*sources|closing cost|reserve/i.test(s.sourcesAndUses)) { sc += 2; f.push("Sources and uses are reconciled with costs and reserves."); } else f.push("Sources and uses do not show closing costs or reserves.");
    dims.push({ key: "capital_efficiency", score: Math.min(10, sc), max: 10, findings: f }); }

  // 5. Downside resilience
  { const f: string[] = []; let sc = 0;
    if (modelResult && s.model) {
      const rows = stressTest(s.model);
      const breaches = rows.filter((r) => r.scenario !== "Base case" && r.breached.length > 0).length;
      sc += Math.max(0, 7 - breaches);
      f.push(`${breaches} of ${rows.length - 1} stress scenarios breach a covenant or refinancing test.`);
      const combined = rows.find((r) => r.scenario === "Combined downturn");
      if (combined && combined.refinanceGap <= 0) { sc += 1; f.push("Combined downturn still refinances the maturing balance."); } else f.push("Combined downturn leaves a refinancing gap.");
    } else f.push("No model: downside cannot be stress-tested.");
    if (/sensitiv|stress|downside|scenario/i.test(s.sensitivity) && words(s.sensitivity) >= 40) { sc += 2; f.push("Sensitivity analysis is described."); } else f.push("Sensitivity analysis is missing or cursory.");
    dims.push({ key: "downside_resilience", score: Math.min(10, sc), max: 10, findings: f }); }

  // 6. Strategic consistency
  { const f: string[] = []; let sc = 0;
    if (/sale|refinanc|hold|recapitali|1031|exit/i.test(s.exitStrategy) && words(s.exitStrategy) >= 30) { sc += 4; f.push("Exit strategy is explicit."); } else f.push("Exit strategy is vague.");
    const holdMatch = s.exitStrategy.match(/(\d+)\s*-?\s*year/i);
    if (s.model && holdMatch && Number(holdMatch[1]) === s.model.holdingPeriodYears) { sc += 3; f.push(`Stated ${holdMatch[1]}-year hold matches the model.`); } else if (s.model && holdMatch) f.push(`Stated ${holdMatch[1]}-year hold differs from the model's ${s.model.holdingPeriodYears} years.`); else f.push("Hold period is not stated in years.");
    const rec = s.recommendation;
    const weak = modelResult ? (modelResult.dscrYear1 < 1.2 || (modelResult.leveredIrr ?? 0) <= 0) : false;
    if (rec === "decline" && weak) { sc += 3; f.push("Recommendation to decline is consistent with weak metrics."); } else if (rec !== "decline" && !weak) { sc += 3; f.push("Recommendation is consistent with the metrics."); } else if (rec === "approve" && weak) f.push("Approving a deal whose own model fails coverage is inconsistent."); else { sc += 1; f.push("Recommendation is cautious relative to the metrics."); }
    dims.push({ key: "strategic_consistency", score: Math.min(10, sc), max: 10, findings: f }); }

  const total = Math.round((dims.reduce((a, d) => a + d.score, 0) / (dims.length * 10)) * 100);
  const fin = dims.find((d) => d.key === "financial_correctness")!.score;
  const verdict: CommitteeEvaluation["verdict"] = total >= 75 && fin >= 6 ? "approved" : total >= 60 ? "approved_with_conditions" : total >= 40 ? "resubmit" : "declined";
  return { total, verdict, dimensions: dims, memo: buildMemo(s, dims, total, verdict, modelResult), modelResult };
}

function buildMemo(s: CommitteeSubmission, dims: DimensionResult[], total: number, verdict: CommitteeEvaluation["verdict"], m: UnderwritingResult | null): string {
  const lines: string[] = [];
  lines.push(`# Investment Committee Memo — ${s.title}`);
  lines.push("");
  lines.push(`**Committee verdict:** ${verdict.replace(/_/g, " ")} · **Score:** ${total}/100 · **Sponsor recommendation:** ${s.recommendation.replace(/_/g, " ")}`);
  lines.push("");
  lines.push("## Thesis (as submitted)");
  lines.push(s.thesis.trim());
  if (m) {
    lines.push("");
    lines.push("## Key metrics (from the attached model)");
    lines.push(`- Total uses ${Math.round(m.totalUses).toLocaleString("en-US")}; equity ${Math.round(m.equityRequired).toLocaleString("en-US")}; loan ${Math.round(m.loanAmount).toLocaleString("en-US")}`);
    lines.push(`- Going-in cap rate ${(m.goingInCapRate * 100).toFixed(2)}%; DSCR Y1 ${m.dscrYear1.toFixed(2)}x; debt yield ${(m.debtYieldYear1 * 100).toFixed(1)}%`);
    lines.push(`- Levered IRR ${m.leveredIrr == null ? "undefined" : (m.leveredIrr * 100).toFixed(1) + "%"}; equity multiple ${m.equityMultiple.toFixed(2)}x; cash-on-cash Y1 ${(m.cashOnCashYear1 * 100).toFixed(1)}%`);
  }
  lines.push("");
  lines.push("## Evaluation");
  for (const d of dims) {
    lines.push(`### ${COMMITTEE_DIMENSIONS.find((x) => x.key === d.key)!.label} — ${d.score}/10`);
    for (const f of d.findings) lines.push(`- ${f}`);
  }
  lines.push("");
  lines.push("## Conditions and questions for the sponsor");
  const conds = dims.flatMap((d) => d.findings.filter((f) => /below|missing|thin|vague|no model|not|cannot|differs|gap|inconsistent|do not|does not/i.test(f)).map((f) => `- ${f}`));
  lines.push(conds.length ? conds.join("\n") : "- None. The committee had no outstanding questions.");
  lines.push("");
  lines.push("_This memo is generated by a transparent rules-based framework for educational use. It is not investment advice._");
  return lines.join("\n");
}
