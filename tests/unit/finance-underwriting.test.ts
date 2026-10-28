import { describe, expect, it } from "vitest";
import { underwriteAcquisition } from "@/finance/underwriting";
import { buildLoanSchedule, irr } from "@/finance/core";

describe("underwriteAcquisition", () => {
  const base = {
    purchasePrice: 10_000_000, closingCostRate: 0.02, initialCapex: 200_000, units: 100, monthlyRentPerUnit: 1_000,
    otherIncomeAnnual: 30_000, vacancyRate: 0.05, operatingExpensesAnnual: 480_000, rentGrowth: 0.03, expenseGrowth: 0.02,
    loanToValue: 0.65, annualRate: 0.065, amortizationYears: 30, interestOnlyYears: 0, holdingPeriodYears: 5, exitCapRate: 0.07, saleCostRate: 0.02,
  };

  it("derives uses, loan and equity", () => {
    const r = underwriteAcquisition(base);
    expect(r.totalUses).toBeCloseTo(10_400_000, 6);
    expect(r.loanAmount).toBeCloseTo(6_500_000, 6);
    expect(r.equityRequired).toBeCloseTo(3_900_000, 6);
    // Year 1: GPR 1.2M, other 30k, vacancy 60k → EGI 1.17M; opex 480k → NOI 690k
    expect(r.years[0]!.noi).toBeCloseTo(690_000, 6);
    expect(r.goingInCapRate).toBeCloseTo(0.069, 10);
  });

  it("debt service comes from the real amortization schedule", () => {
    const r = underwriteAcquisition(base);
    const sched = buildLoanSchedule({ principal: 6_500_000, annualRate: 0.065, amortizationYears: 30, termYears: 5 });
    expect(r.years[0]!.debtService).toBeCloseTo(sched.annualDebtService, 6);
    expect(r.years[4]!.loanBalanceEnd).toBeCloseTo(sched.balloonBalance, 6);
    expect(r.dscrYear1).toBeCloseTo(690_000 / sched.annualDebtService, 10);
  });

  it("returns are computed from levered cash flows including sale net of debt payoff", () => {
    const r = underwriteAcquisition(base);
    const last = r.years[4]!;
    const exitValue = last.noi / 0.07;
    const net = exitValue - exitValue * 0.02 - last.loanBalanceEnd;
    expect(r.exitValue).toBeCloseTo(exitValue, 6);
    expect(r.netSaleProceeds).toBeCloseTo(net, 6);
    expect(r.leveredCashFlows[0]).toBeCloseTo(-3_900_000, 6);
    expect(r.leveredCashFlows[5]).toBeCloseTo(last.cashFlowAfterDebt + net, 6);
    expect(r.leveredIrr).toBeCloseTo(irr(r.leveredCashFlows)!, 12);
    expect(r.leveredIrr).toBeGreaterThan(0);
    expect(r.equityMultiple).toBeGreaterThan(1);
  });

  it("warns when the exit cap rate assumes compression", () => {
    const r = underwriteAcquisition({ ...base, exitCapRate: 0.06 });
    expect(r.warnings.some((w) => w.includes("cap-rate compression"))).toBe(true);
  });

  it("warns on thin coverage", () => {
    const r = underwriteAcquisition({ ...base, loanToValue: 0.85, annualRate: 0.08 });
    expect(r.warnings.some((w) => w.includes("DSCR"))).toBe(true);
  });

  it("an all-cash purchase has no debt service and IRR equals the unlevered return", () => {
    const r = underwriteAcquisition({ ...base, loanToValue: 0 });
    expect(r.years.every((y) => y.debtService === 0)).toBe(true);
    expect(r.equityRequired).toBeCloseTo(10_400_000, 6);
  });
});
