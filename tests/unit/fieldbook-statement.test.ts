import { describe, expect, it } from "vitest";
import { lindenCourt as c } from "@/fieldbook/challenges/linden-court";
import { CHALLENGES } from "@/fieldbook/challenges";
import { solve } from "@/fieldbook/solution";
import { gradeChallenge, emptyAnswers, type ChallengeAnswers } from "@/fieldbook/grade";
import { summarize } from "@/fieldbook/statement";

// Expected values below were computed independently in Python (closed-form loan payment:
// P·r/(1−(1+r)^−n), r = 6.75%/12, n = 360, P = 65% × 6,800,000), not by calling this code.
describe("Linden Court statement arithmetic", () => {
  const sol = solve(c);
  it("reconciles the rent roll to reported gross potential rent exactly", () => {
    const fromRoll = c.rentRoll.reduce((a, r) => a + r.count * r.inPlaceRent * 12, 0);
    expect(fromRoll).toBe(871_680);
    expect(c.lines.find((l) => l.key === "gpr")!.amount).toBe(fromRoll);
    expect(c.rentRoll.reduce((a, r) => a + r.count, 0)).toBe(c.property.units);
  });
  it("computes the seller-reported figures", () => {
    expect(sol.reported.egi).toBe(862_980);
    expect(sol.reported.operatingExpenses).toBe(370_000);
    expect(sol.reported.noiBeforeReserves).toBe(492_980);
    expect(sol.reported.expenseRatio).toBeCloseTo(0.4287469003, 9);
    expect(sol.reportedMetrics.capRate).toBeCloseTo(0.0724970588, 9);
  });
  it("computes the normalised figures", () => {
    expect(sol.vacantAnnualRent).toBe(82_920);
    expect(sol.normalized.egi).toBe(809_760);
    expect(sol.normalizedAmounts.management).toBeCloseTo(32_390.4, 6);
    expect(sol.normalizedAmounts.taxes).toBeCloseTo(78_880, 6);
    expect(sol.normalized.operatingExpenses).toBeCloseTo(403_870.4, 6);
    expect(sol.normalized.noiBeforeReserves).toBeCloseTo(405_889.6, 6);
    expect(sol.normalized.noi).toBeCloseTo(389_889.6, 6);
  });
  it("computes debt metrics from a real amortisation schedule", () => {
    expect(sol.normalizedMetrics.loanAmount).toBe(4_420_000);
    expect(sol.normalizedMetrics.annualDebtService).toBeCloseTo(344_016.43042, 3);
    expect(sol.normalizedMetrics.dscr).toBeCloseTo(1.13334587, 7);
    expect(sol.reportedMetrics.dscr).toBeCloseTo(1.43301295, 7);
    expect(sol.normalizedMetrics.debtYield).toBeCloseTo(0.08821032, 7);
    expect(sol.normalizedMetrics.capRate).toBeCloseTo(0.05733671, 7);
    expect(sol.normalizedMetrics.impliedValue).toBeCloseTo(5_377_787.5862, 3);
    expect(sol.normalizedMetrics.maxLoanByDscr).toBeCloseTo(4_007_510.9899, 3);
    expect(sol.normalizedMetrics.maxLoanByDebtYield).toBeCloseTo(4_332_106.6667, 3);
    expect(sol.normalizedMetrics.passesDscr).toBe(false);
    expect(sol.normalizedMetrics.passesDebtYield).toBe(false);
    expect(sol.reportedMetrics.passesDscr).toBe(true);
  });
  it("identifies the largest NOI adjustment and does not subtract one-time capex from recurring NOI", () => {
    expect(sol.largestDriver.lineKey).toBe("vacancy");
    expect(sol.largestDriver.noiEffect).toBeCloseTo(-48_020, 6);
    expect(sol.oneTimeCapex).toBe(42_000);
    expect(sol.recurringRepairsReported).toBe(19_000);
    const repairs = sol.adjustments.find((a) => a.lineKey === "repairs")!;
    expect(repairs.noiEffect).toBeCloseTo(19_400, 6); // removing the one-time project helps NOI
    // adjustments reconcile reported → normalised NOI exactly
    const net = sol.adjustments.reduce((a, x) => a + x.noiEffect, 0);
    expect(sol.reported.noiBeforeReserves + net).toBeCloseTo(sol.normalized.noi, 6);
  });
  it("is internally consistent: records sum to reported repairs, the 12 listed anomalies include 7 real ones", () => {
    expect(c.records.reduce((a, r) => a + r.amount, 0)).toBe(c.lines.find((l) => l.key === "repairs")!.amount);
    expect(c.anomalies.filter((a) => a.expected)).toHaveLength(7);
    expect(c.anomalies.length).toBe(new Set(c.anomalies.map((a) => a.id)).size);
    expect(summarize(c.lines, 64).gpr).toBe(871_680);
  });
  it("registers unique challenge slugs", () => {
    expect(new Set(CHALLENGES.map((x) => x.slug)).size).toBe(CHALLENGES.length);
  });
});

function perfect(): ChallengeAnswers {
  const s = solve(c); const a = emptyAnswers(c);
  a.amounts = { ...a.amounts, ...s.normalizedAmounts };
  a.basis = { management: "Third-party manager at 4% of EGI replaces the unpaid family management.", repairs: "Removed the one-time sealcoat capex; normalised to $650 per unit.", taxes: "Reassessed at the asking price using the effective rate.", vacancy: "Six vacant units on the rent roll at in-place rents.", creditLoss: "Delinquency report shows $14,200 past 60 days; used the larger figure.", reserves: "$250 per unit replacement reserve per year." };
  a.reportedNoi = 492_980; a.capRatePct = 5.7337; a.dscr = 1.1333; a.debtYieldPct = 8.821; a.maxPrice = 5_377_788;
  a.anomalies = c.anomalies.filter((x) => x.expected).map((x) => x.id);
  a.questions = c.topics.map((t) => t.sample).join("\n");
  a.largestDriver = "vacancy"; a.dscrPasses = "no"; a.recommendation = "negotiate";
  a.rationale = "Normalised NOI of about $390,000 gives a 5.7% cap rate at the ask and fails the lender DSCR test, so the price must come down toward $5.4 million.";
  return a;
}

describe("challenge grading", () => {
  it("awards 100 for a complete correct submission", () => {
    const r = gradeChallenge(c, perfect());
    expect(r.max).toBe(100);
    expect(r.total).toBe(100);
    expect(Object.keys(r.byDimension)).toEqual(["Calculation accuracy", "Anomaly identification", "Due-diligence questions", "Justification of adjustments", "Risk recognition", "Investment judgment"]);
  });
  it("gives a blank submission nothing, and every line explains why", () => {
    const r = gradeChallenge(c, emptyAnswers(c));
    expect(r.total).toBeLessThan(5);
    expect(r.lines.every((l) => l.detail.length > 0)).toBe(true);
  });
  it("penalises unsupported anomaly flags and caps the dimension at zero", () => {
    const a = emptyAnswers(c); a.anomalies = ["payroll_excessive", "utilities_inefficient", "insurance_understated"];
    expect(gradeChallenge(c, a).byDimension["Anomaly identification"]!.earned).toBe(0);
    const b = emptyAnswers(c); b.anomalies = ["management_missing", "reserves_missing", "payroll_excessive"];
    expect(gradeChallenge(c, b).byDimension["Anomaly identification"]!.earned).toBeCloseTo((20 * (2 - 0.5)) / 7, 2);
  });
  it("gives carry-forward credit when a metric is right for the student’s own NOI", () => {
    const a = perfect(); a.amounts = { ...a.amounts, repairs: 61_000 }; // forgot to normalise repairs
    const s = summarize(c.lines.map((l) => ({ ...l, amount: a.amounts[l.key] ?? l.amount })), 64);
    const own = s.noi; expect(own).not.toBeCloseTo(389_889.6, 0);
    a.capRatePct = (own / c.askingPrice) * 100; // consistent with own NOI, not the solution
    const r = gradeChallenge(c, a);
    expect(r.lines.find((l) => l.label.startsWith("Cap rate"))!.earned).toBe(2.5);
  });
  it("does not reward acquiring at the ask, even with a long rationale", () => {
    const a = perfect(); a.recommendation = "acquire";
    const r = gradeChallenge(c, a);
    expect(r.byDimension["Investment judgment"]!.earned).toBe(0);
  });
  it("requires a stated evidence-based reason, not just a number in range", () => {
    const a = perfect(); a.basis = {};
    const r = gradeChallenge(c, a);
    expect(r.byDimension["Justification of adjustments"]!.earned).toBe(7.5);
  });
});
