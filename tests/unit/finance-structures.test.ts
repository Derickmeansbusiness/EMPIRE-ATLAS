import { describe, expect, it } from "vitest";
import { analyzeDebtStructure, compareDebtStructures } from "@/finance/debt";
import { underwriteCredit } from "@/finance/credit";
import { analyzeDistressedLoan } from "@/finance/distressed";
import { runWaterfall } from "@/finance/waterfall";
import { stressTest, applyShocks } from "@/finance/stress";
import { buildLoanSchedule, FinanceInputError } from "@/finance/core";
import type { UnderwritingAssumptions } from "@/finance/underwriting";

/** Expected values computed independently in Python (bisection IRR, closed-form annuities) — see docs/reports/PHASE-2-REPORT.md. */

describe("debt structures", () => {
  it("a floating loan with a constant index equals the fixed loan", () => {
    const fixed = buildLoanSchedule({ principal: 1_000_000, annualRate: 0.065, amortizationYears: 30, termYears: 5 });
    const floating = analyzeDebtStructure({ name: "f", kind: "floating", principal: 1_000_000, annualRate: 0.025, indexPathAnnual: [0.04], amortizationYears: 30, termYears: 5 });
    expect(floating.rows[0]!.payment).toBeCloseTo(fixed.rows[0]!.payment, 6);
    expect(floating.balloonBalance).toBeCloseTo(fixed.balloonBalance, 4);
  });
  it("floating rate respects cap and floor and recasts the payment", () => {
    const r = analyzeDebtStructure({ name: "f", kind: "floating", principal: 1_000_000, annualRate: 0.02, indexPathAnnual: [0.03, 0.08], rateCap: 0.085, rateFloor: 0.04, amortizationYears: 30, termYears: 2 });
    expect(r.rateByPeriod[0]).toBeCloseTo(0.05, 12);
    expect(r.rateByPeriod[12]).toBeCloseTo(0.085, 12); // 0.10 capped
    expect(r.rows[12]!.payment).toBeGreaterThan(r.rows[11]!.payment);
    expect(r.warnings.length).toBe(1); // balloon only; cap present
  });
  it("bridge loan all-in cost includes fees (11.5814% annual on 10% IO with 1%+1% fees)", () => {
    const r = analyzeDebtStructure({ name: "b", kind: "bridge", principal: 1_000_000, annualRate: 0.10, amortizationYears: 2, termYears: 2, originationFeeRate: 0.01, exitFeeRate: 0.01 });
    expect(r.totalInterest).toBeCloseTo(200_000, 4);
    expect(r.totalFees).toBeCloseTo(20_000, 6);
    expect(r.netProceedsAtClosing).toBe(990_000);
    expect(r.allInAnnualCost).toBeCloseTo(0.1158139, 5);
    expect(r.balloonBalance).toBeCloseTo(1_000_000, 4);
  });
  it("seller financing and amortizing are compared side by side", () => {
    const out = compareDebtStructures([
      { name: "Bank", kind: "amortizing", principal: 500_000, annualRate: 0.07, amortizationYears: 25, termYears: 25 },
      { name: "Seller", kind: "seller", principal: 500_000, annualRate: 0.05, amortizationYears: 30, termYears: 5, interestOnlyYears: 5 },
    ]);
    expect(out[0]!.balloonBalance).toBe(0);
    expect(out[1]!.balloonBalance).toBeCloseTo(500_000, 4);
    expect(out[1]!.firstPayment).toBeCloseTo(500_000 * 0.05 / 12, 8);
    expect(out[1]!.allInAnnualCost).toBeCloseTo(Math.pow(1 + 0.05 / 12, 12) - 1, 6);
  });
  it("rejects invalid structures", () => {
    expect(() => analyzeDebtStructure({ name: "x", kind: "floating", principal: 1, annualRate: 0.01, amortizationYears: 1, termYears: 1 })).toThrow(FinanceInputError);
  });
});

describe("private credit underwriting", () => {
  const base = { loanAmount: 6_500_000, collateralValue: 10_000_000, totalProjectCost: 10_400_000, borrowerNoi: 690_000, annualRate: 0.07, termYears: 5, amortizationYears: 30, interestOnlyYears: 0, originationFeeRate: 0.01, exitFeeRate: 0.005, defaultMonth: null, recoveryValue: 5_000_000, liquidationCostRate: 0.08, monthsToRecover: 6 };
  it("performing loan economics", () => {
    const r = underwriteCredit(base);
    expect(r.ltv).toBeCloseTo(0.65, 12);
    expect(r.ltc).toBeCloseTo(0.625, 12);
    expect(r.interestIncome).toBeCloseTo(2_213_233.07, 1);
    expect(r.feeIncome).toBeCloseTo(97_500, 6);
    expect(r.lenderIrrPerforming).toBeCloseTo(0.0758239, 5);
    expect(r.lenderMoicPerforming).toBeCloseTo(1.359088, 5);
    expect(r.defaultScenario).toBeNull();
  });
  it("default scenario: exposure, recovery, severity and IRR", () => {
    const r = underwriteCredit({ ...base, defaultMonth: 24, probabilityOfDefault: 0.1 });
    const d = r.defaultScenario!;
    expect(d.exposureAtDefault).toBeCloseTo(6_363_171.58, 1);
    expect(d.netRecovery).toBeCloseTo(4_600_000, 6);
    expect(d.lossAmount).toBeCloseTo(1_763_171.58, 1);
    expect(d.lossSeverity).toBeCloseTo(0.27709, 4);
    expect(d.lenderIrr).toBeCloseTo(-0.057268, 4);
    expect(r.expectedLoss).toBeCloseTo(176_317.16, 1);
  });
});

describe("distressed loan paths", () => {
  const i = { unpaidPrincipalBalance: 1_000_000, purchasePriceOfLoan: 600_000, noteRate: 0.06, propertyValueToday: 900_000, monthlyCarryCost: 1_000, dpoPercentOfUpb: 0.8, dpoMonth: 6, restructureRate: 0.06, restructureTermYears: 30, restructureStartMonth: 3, restructuredBalancePercent: 0.9, foreclosureMonths: 9, legalCosts: 40_000, reoRenovation: 60_000, reoHoldMonths: 3, reoSalePriceRatio: 0.9, saleCostRate: 0.05 };
  it("discounted payoff path (profit 194,000; 74.79% annualised)", () => {
    const r = analyzeDistressedLoan(i);
    expect(r.discountToUpb).toBeCloseTo(0.4, 12);
    const dpo = r.paths.find((p) => p.key === "dpo")!;
    expect(dpo.totalProfit).toBeCloseTo(194_000, 6);
    expect(dpo.irrAnnual).toBeCloseTo(0.747854, 4);
    expect(dpo.months).toBe(6);
  });
  it("foreclosure path (profit 57,500; 9.13% annualised) and restructure path produce defined returns", () => {
    const r = analyzeDistressedLoan(i);
    const f = r.paths.find((p) => p.key === "foreclosure")!;
    expect(f.totalProfit).toBeCloseTo(57_500, 6);
    expect(f.irrAnnual).toBeCloseTo(0.091328, 4);
    const re = r.paths.find((p) => p.key === "restructure")!;
    expect(re.irrAnnual).not.toBeNull();
    expect(re.months).toBe(3 + 360);
  });
});

describe("equity waterfall", () => {
  const cf = [-1_000_000, 0, 0, 0, 0, 1_800_000];
  it("return of capital, 8% compounding pref, 80/20 residual", () => {
    const r = runWaterfall({ lpEquity: 900_000, gpEquity: 100_000, preferredReturn: 0.08, tiers: [{ hurdleIrr: 0.08, lpShare: 0.8 }], cashFlows: cf });
    expect(r.years[4]!.preferred).toBeCloseTo(469_328.08, 1);
    expect(r.lpTotal).toBeCloseTo(1_586_932.81, 1);
    expect(r.gpTotal).toBeCloseTo(213_067.19, 1);
    expect(r.lpIrr).toBeCloseTo(0.1201165, 5);
    expect(r.lpTotal + r.gpTotal).toBeCloseTo(1_800_000, 4);
  });
  it("two-tier IRR hurdle (12% then residual 70/30)", () => {
    const r = runWaterfall({ lpEquity: 900_000, gpEquity: 100_000, preferredReturn: 0.08, tiers: [{ hurdleIrr: 0.12, lpShare: 0.8 }, { hurdleIrr: 0.2, lpShare: 0.7 }], cashFlows: [-1_000_000, 0, 0, 0, 0, 2_500_000] });
    expect(r.years[4]!.tierDistributions[0]).toBeCloseTo(329_640.31, 1);
    expect(r.lpTotal).toBeCloseTo(2_076_829.65, 1);
    expect(r.gpTotal).toBeCloseTo(423_170.35, 1);
    expect(r.lpIrr).toBeCloseTo(0.1820386, 5);
  });
  it("GP catch-up brings GP to exactly the promote share of profits", () => {
    const r = runWaterfall({ lpEquity: 900_000, gpEquity: 100_000, preferredReturn: 0.08, catchUp: true, tiers: [{ hurdleIrr: 0.08, lpShare: 0.8 }], cashFlows: cf });
    expect(r.lpTotal).toBeCloseTo(1_540_000, 2);
    expect(r.gpTotal).toBeCloseTo(260_000, 2);
    expect((r.gpTotal - 100_000) / 800_000).toBeCloseTo(0.2, 8);
  });
  it("validates inputs", () => {
    expect(() => runWaterfall({ lpEquity: 1, gpEquity: 0, preferredReturn: 0.08, tiers: [], cashFlows: [-2, 1] })).toThrow(FinanceInputError);
  });
});

describe("stress test", () => {
  const base: UnderwritingAssumptions = { purchasePrice: 10_000_000, closingCostRate: 0.02, initialCapex: 200_000, units: 100, monthlyRentPerUnit: 1_000, otherIncomeAnnual: 30_000, vacancyRate: 0.05, operatingExpensesAnnual: 480_000, rentGrowth: 0.03, expenseGrowth: 0.02, loanToValue: 0.65, annualRate: 0.065, amortizationYears: 30, interestOnlyYears: 0, holdingPeriodYears: 5, exitCapRate: 0.07, saleCostRate: 0.02 };
  it("value shock scales exit value and shocks move metrics in the expected direction", () => {
    const rows = stressTest(base);
    const b = rows.find((r) => r.scenario === "Base case")!;
    const v = rows.find((r) => r.scenario === "Values −20%")!;
    const rate = rows.find((r) => r.scenario === "Rates +200 bps")!;
    expect(v.exitValue).toBeCloseTo(b.exitValue * 0.8, 4);
    expect(v.leveredIrr!).toBeLessThan(b.leveredIrr!);
    expect(rate.dscrYear1).toBeLessThan(b.dscrYear1);
    expect(applyShocks(base, { occupancyDecline: 0.1 }).vacancyRate).toBeCloseTo(0.15, 12);
  });
  it("flags a refinancing shortfall when proceeds cannot retire the balance", () => {
    const rows = stressTest(base, [{ name: "Tight refi", shocks: { refinanceLtvCap: 0.3 } }]);
    expect(rows[0]!.refinanceGap).toBeGreaterThan(0);
    expect(rows[0]!.breached).toContain("Refinance shortfall");
  });
});
