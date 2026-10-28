import { describe, expect, it } from "vitest";
import {
  annualizeRate, buildLoanSchedule, capRate, cashOnCash, debtServiceCoverage, debtYield, equityMultiple,
  FinanceInputError, irr, loanToCost, loanToValue, netOperatingIncome, npv, periodicPayment, summarizeCapitalStack, valueFromCapRate,
} from "@/finance/core";

/**
 * Expected values below were computed independently (closed-form formulas / spreadsheet), not by
 * running the functions under test.
 */
describe("income metrics", () => {
  it("computes NOI from GPR, vacancy and opex", () => {
    // GPR 1,200,000; other 30,000; vacancy 5% of GPR = 60,000; EGI = 1,170,000; opex 480,000 → NOI 690,000
    const r = netOperatingIncome({ grossPotentialRent: 1_200_000, otherIncome: 30_000, vacancyAndCreditLossRate: 0.05, operatingExpenses: 480_000 });
    expect(r.vacancyAndCreditLoss).toBeCloseTo(60_000, 6);
    expect(r.effectiveGrossIncome).toBeCloseTo(1_170_000, 6);
    expect(r.netOperatingIncome).toBeCloseTo(690_000, 6);
    expect(r.expenseRatio).toBeCloseTo(480_000 / 1_170_000, 10);
  });
  it("cap rate and value are inverses", () => {
    expect(capRate(690_000, 10_000_000)).toBeCloseTo(0.069, 12);
    expect(valueFromCapRate(690_000, 0.069)).toBeCloseTo(10_000_000, 6);
  });
  it("rejects invalid inputs", () => {
    expect(() => capRate(1, 0)).toThrow(FinanceInputError);
    expect(() => netOperatingIncome({ grossPotentialRent: -1, vacancyAndCreditLossRate: 0.05, operatingExpenses: 0 })).toThrow(FinanceInputError);
    expect(() => netOperatingIncome({ grossPotentialRent: 1, vacancyAndCreditLossRate: 1.5, operatingExpenses: 0 })).toThrow(FinanceInputError);
  });
});

describe("debt", () => {
  it("level payment matches the standard annuity formula (monthly, 30y, 6%)", () => {
    // $100,000 at 6%/12 over 360 periods → 599.5505251527570 (textbook value)
    expect(periodicPayment(100_000, 0.06 / 12, 360)).toBeCloseTo(599.5505251527570, 6);
  });
  it("zero-rate loan is straight-line", () => {
    expect(periodicPayment(120_000, 0, 120)).toBeCloseTo(1_000, 12);
  });
  it("fully amortizing schedule ends at zero and totals interest correctly", () => {
    const s = buildLoanSchedule({ principal: 100_000, annualRate: 0.06, amortizationYears: 30, termYears: 30 });
    expect(s.rows).toHaveLength(360);
    expect(s.balloonBalance).toBe(0);
    // total payments = 360 × 599.5505… = 215,838.19; total interest = 115,838.19
    expect(s.totalPayments).toBeCloseTo(215_838.189, 1);
    expect(s.totalInterest).toBeCloseTo(115_838.189, 1);
    expect(s.rows[0]!.interest).toBeCloseTo(500, 10);
    expect(s.rows[0]!.principal).toBeCloseTo(99.5505251527570, 6);
  });
  it("balloon loan reports remaining balance at maturity (10y term, 30y amortization)", () => {
    const s = buildLoanSchedule({ principal: 1_000_000, annualRate: 0.065, amortizationYears: 30, termYears: 10 });
    // Remaining balance after 120 of 360 payments at 6.5%: 847,761.26 (closed form: P·[(1+r)^n − (1+r)^k]/[(1+r)^n − 1], computed in Python)
    const r = 0.065 / 12; const n = 360; const k = 120;
    const expected = 1_000_000 * (Math.pow(1 + r, n) - Math.pow(1 + r, k)) / (Math.pow(1 + r, n) - 1);
    expect(s.balloonBalance).toBeCloseTo(expected, 4);
    expect(s.balloonBalance).toBeCloseTo(847_761.26, 1);
    expect(s.rows).toHaveLength(120);
  });
  it("interest-only period pays interest only, then amortizes", () => {
    const s = buildLoanSchedule({ principal: 500_000, annualRate: 0.072, amortizationYears: 25, termYears: 5, interestOnlyYears: 2 });
    expect(s.rows[0]!.payment).toBeCloseTo(3_000, 10); // 500,000 × 0.006
    expect(s.rows[0]!.principal).toBe(0);
    expect(s.rows[23]!.endingBalance).toBeCloseTo(500_000, 10);
    expect(s.rows[24]!.principal).toBeGreaterThan(0);
    expect(s.annualDebtService).toBeCloseTo(36_000, 8);
    expect(s.stabilizedAnnualDebtService).toBeCloseTo(periodicPayment(500_000, 0.006, 300) * 12, 8);
  });
  it("coverage, yield and leverage ratios", () => {
    expect(debtServiceCoverage(690_000, 500_000)).toBeCloseTo(1.38, 12);
    expect(debtYield(690_000, 6_500_000)).toBeCloseTo(0.10615384615, 8);
    expect(loanToValue(6_500_000, 10_000_000)).toBeCloseTo(0.65, 12);
    expect(loanToCost(6_500_000, 10_400_000)).toBeCloseTo(0.625, 12);
  });
});

describe("returns", () => {
  it("npv at 10% for a textbook stream", () => {
    // -1000, 300, 400, 500 at 10% → -1000 + 272.7273 + 330.5785 + 375.6574 = -21.0368
    expect(npv(0.10, [-1000, 300, 400, 500])).toBeCloseTo(-21.0368, 3);
  });
  it("irr matches a known solution", () => {
    // -1000, 300, 400, 500 → IRR ≈ 8.8963%
    const r = irr([-1000, 300, 400, 500]);
    expect(r).not.toBeNull();
    expect(r!).toBeCloseTo(0.088963, 5);
  });
  it("irr of a single doubling over one period is 100%", () => {
    expect(irr([-100, 200])!).toBeCloseTo(1.0, 8);
  });
  it("irr is null without a sign change", () => {
    expect(irr([100, 200, 300])).toBeNull();
    expect(irr([-100, -200])).toBeNull();
  });
  it("annualizes a monthly rate", () => {
    expect(annualizeRate(0.01, 12)).toBeCloseTo(0.12682503013, 8);
  });
  it("equity multiple and cash-on-cash", () => {
    expect(equityMultiple([-1000, 100, 100, 1300])).toBeCloseTo(1.5, 12);
    expect(cashOnCash(85_000, 1_000_000)).toBeCloseTo(0.085, 12);
  });
});

describe("capital stack", () => {
  it("summarizes sources, leverage and weighted cost", () => {
    const s = summarizeCapitalStack([
      { name: "Senior", kind: "senior_debt", amount: 6_500_000, annualRate: 0.065 },
      { name: "Mezz", kind: "mezzanine", amount: 1_000_000, annualRate: 0.12 },
      { name: "LP equity", kind: "common_equity", amount: 2_250_000, annualRate: 0.15 },
      { name: "Sponsor", kind: "sponsor_equity", amount: 250_000, annualRate: 0.15 },
    ], { totalUses: 10_400_000, value: 10_000_000 });
    expect(s.totalDebt).toBe(7_500_000);
    expect(s.totalEquity).toBe(2_500_000);
    expect(s.loanToValue).toBeCloseTo(0.75, 12);
    expect(s.loanToCost).toBeCloseTo(7_500_000 / 10_400_000, 12);
    expect(s.debtToEquity).toBeCloseTo(3, 12);
    // (6.5M×6.5% + 1M×12% + 2.5M×15%) / 10M = (422,500 + 120,000 + 375,000)/10,000,000 = 0.09175
    expect(s.weightedCostOfCapital).toBeCloseTo(0.09175, 10);
    expect(s.fundingGap).toBe(400_000);
  });
  it("weighted cost is null when a layer has no rate", () => {
    const s = summarizeCapitalStack([{ name: "Senior", kind: "senior_debt", amount: 1 }, { name: "Eq", kind: "common_equity", amount: 1, annualRate: 0.1 }], { totalUses: 2 });
    expect(s.weightedCostOfCapital).toBeNull();
  });
});
