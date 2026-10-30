/** Instructor solution, derived from the case data and stated conventions. */
import { metricsFor, summarize, withAmounts, type Metrics, type StatementLine, type StatementSummary } from "./statement";
import type { ChallengeCase } from "./challenges/types";

export interface Adjustment { lineKey: string; label: string; reported: number; normalized: number; noiEffect: number; basis: string }
export interface Solution {
  reported: StatementSummary; reportedMetrics: Metrics;
  normalizedAmounts: Record<string, number>; normalizedLines: StatementLine[]; normalized: StatementSummary; normalizedMetrics: Metrics;
  adjustments: Adjustment[]; largestDriver: Adjustment; vacantAnnualRent: number; recurringRepairsReported: number; oneTimeCapex: number;
}

export function vacantAnnualRent(c: ChallengeCase): number { return c.rentRoll.reduce((a, r) => a + r.vacant * r.inPlaceRent * 12, 0); }

export function solve(c: ChallengeCase): Solution {
  const units = c.property.units; const rep = (k: string) => c.lines.find((l) => l.key === k)!.amount;
  const oneTimeCapex = c.records.filter((r) => /sealcoat|resurfac|replace/i.test(r.description) && r.amount >= 25_000).reduce((a, r) => a + r.amount, 0);
  const n: Record<string, number> = {};
  n.vacancy = vacantAnnualRent(c);
  n.creditLoss = Math.max(rep("creditLoss"), c.delinquency.over60);
  const egi = rep("gpr") - n.vacancy - rep("concessions") - n.creditLoss + rep("otherIncome");
  n.management = c.conventions.managementFeeRate * egi;
  n.repairs = c.conventions.repairsPerUnit * units;
  n.taxes = c.askingPrice * c.taxInfo.effectiveRate;
  n.reserves = c.conventions.reservesPerUnit * units;
  const normalizedLines = withAmounts(c.lines, n);
  const reportedSummary = summarize(c.lines, units); const normalized = summarize(normalizedLines, units);
  const effect = (key: string, sign: 1 | -1): number => sign * ((n[key] ?? rep(key)) - rep(key));
  const adjustments: Adjustment[] = [
    { lineKey: "vacancy", label: "Vacancy loss", reported: rep("vacancy"), normalized: n.vacancy!, noiEffect: effect("vacancy", -1), basis: "Annual in-place rent of the vacant units on the rent roll." },
    { lineKey: "creditLoss", label: "Credit loss", reported: rep("creditLoss"), normalized: n.creditLoss!, noiEffect: effect("creditLoss", -1), basis: "Larger of reported credit loss and the 60+ day delinquent balance." },
    { lineKey: "management", label: "Management fee", reported: rep("management"), normalized: n.management!, noiEffect: effect("management", -1), basis: `${(c.conventions.managementFeeRate * 100).toFixed(1)}% of normalised EGI (illustrative convention).` },
    { lineKey: "repairs", label: "Repairs and maintenance", reported: rep("repairs"), normalized: n.repairs!, noiEffect: effect("repairs", -1), basis: `Remove the $${oneTimeCapex.toLocaleString("en-US")} one-time pavement project; normalise recurring repairs to $${c.conventions.repairsPerUnit}/unit (illustrative).` },
    { lineKey: "taxes", label: "Real estate taxes", reported: rep("taxes"), normalized: n.taxes!, noiEffect: effect("taxes", -1), basis: "Asking price × effective rate (training assumption of reassessment at sale)." },
    { lineKey: "reserves", label: "Replacement reserves", reported: rep("reserves"), normalized: n.reserves!, noiEffect: effect("reserves", -1), basis: `$${c.conventions.reservesPerUnit}/unit/year (illustrative).` },
  ];
  const largestDriver = adjustments.reduce((a, b) => (Math.abs(b.noiEffect) > Math.abs(a.noiEffect) ? b : a));
  return {
    reported: reportedSummary, reportedMetrics: metricsFor(reportedSummary.noiBeforeReserves, c.askingPrice, c.debt, c.marketCapRate),
    normalizedAmounts: n, normalizedLines, normalized, normalizedMetrics: metricsFor(normalized.noi, c.askingPrice, c.debt, c.marketCapRate),
    adjustments, largestDriver, vacantAnnualRent: n.vacancy!, recurringRepairsReported: rep("repairs") - oneTimeCapex, oneTimeCapex,
  };
}
