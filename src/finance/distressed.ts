/**
 * Distressed acquisition paths, each as explicit monthly cash flows from the buyer's side.
 * Nothing here is probabilistic; every path is a defined scenario the user chooses.
 */
import { annualizeRate, equityMultiple, FinanceInputError, irr } from "./core";

export interface DistressedInputs {
  unpaidPrincipalBalance: number;   // UPB of the non-performing loan
  purchasePriceOfLoan: number;      // what the buyer pays for the note
  noteRate: number;                 // contract rate (annual) for restructuring calcs
  propertyValueToday: number;
  monthlyCarryCost: number;         // taxes, insurance, servicing while holding the note / REO
  // Discounted payoff
  dpoPercentOfUpb: number; dpoMonth: number;
  // Restructuring
  restructureRate: number; restructureTermYears: number; restructureStartMonth: number; restructuredBalancePercent: number; // of UPB
  // Foreclosure → REO
  foreclosureMonths: number; legalCosts: number; reoRenovation: number; reoHoldMonths: number; reoSalePriceRatio: number; // of propertyValueToday
  saleCostRate: number;
}

export interface PathResult { name: string; key: "dpo" | "restructure" | "foreclosure"; cashFlows: number[]; irrAnnual: number | null; multiple: number; totalProfit: number; months: number; narrative: string }

export interface DistressedResult { discountToUpb: number; priceToValue: number; paths: PathResult[]; breakevenPurchasePriceForeclosure: number; warnings: string[] }

function pad(n: number): number[] { return Array.from({ length: Math.max(0, n) }, () => 0); }

export function analyzeDistressedLoan(i: DistressedInputs): DistressedResult {
  if (i.purchasePriceOfLoan <= 0 || i.unpaidPrincipalBalance <= 0) throw new FinanceInputError("purchase price and UPB must be > 0");
  const warnings: string[] = [];
  const discount = 1 - i.purchasePriceOfLoan / i.unpaidPrincipalBalance;
  const priceToValue = i.purchasePriceOfLoan / i.propertyValueToday;

  // Path 1: discounted payoff — borrower refinances and pays X% of UPB at month N.
  const dpo = [-i.purchasePriceOfLoan, ...pad(i.dpoMonth).map(() => -i.monthlyCarryCost)];
  dpo[dpo.length - 1]! += i.unpaidPrincipalBalance * i.dpoPercentOfUpb;
  // Path 2: restructure — balance written to Y% of UPB, borrower pays amortising at new rate over new term, buyer sells note/holds to maturity (modelled as receiving payments to maturity).
  const newBal = i.unpaidPrincipalBalance * i.restructuredBalancePercent;
  const n = Math.round(i.restructureTermYears * 12); const r = i.restructureRate / 12;
  const pmt = r === 0 ? newBal / n : (newBal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const restructure = [-i.purchasePriceOfLoan, ...pad(i.restructureStartMonth).map(() => -i.monthlyCarryCost), ...pad(n).map(() => pmt)];
  // Path 3: foreclosure → REO → sale.
  const foreclosure = [-i.purchasePriceOfLoan, ...pad(i.foreclosureMonths).map(() => -i.monthlyCarryCost)];
  foreclosure[foreclosure.length - 1]! -= i.legalCosts + i.reoRenovation;
  for (let k = 0; k < i.reoHoldMonths; k++) foreclosure.push(-i.monthlyCarryCost);
  const sale = i.propertyValueToday * i.reoSalePriceRatio;
  foreclosure[foreclosure.length - 1]! += sale * (1 - i.saleCostRate);

  const build = (name: string, key: PathResult["key"], cf: number[], narrative: string): PathResult => {
    const m = irr(cf);
    const pos = cf.filter((c) => c > 0).reduce((a, b) => a + b, 0); const neg = cf.filter((c) => c < 0).reduce((a, b) => a - b, 0);
    return { name, key, cashFlows: cf, irrAnnual: m == null ? null : annualizeRate(m, 12), multiple: neg > 0 ? equityMultiple(cf) : 0, totalProfit: pos - neg, months: cf.length - 1, narrative };
  };
  const paths = [
    build("Discounted payoff", "dpo", dpo, `Borrower pays ${(i.dpoPercentOfUpb * 100).toFixed(0)}% of UPB in month ${i.dpoMonth}.`),
    build("Restructure and hold", "restructure", restructure, `Balance reset to ${(i.restructuredBalancePercent * 100).toFixed(0)}% of UPB at ${(i.restructureRate * 100).toFixed(2)}% over ${i.restructureTermYears} years, starting month ${i.restructureStartMonth}.`),
    build("Foreclose, take REO, sell", "foreclosure", foreclosure, `${i.foreclosureMonths} months to title, ${i.reoHoldMonths} months of REO, sale at ${(i.reoSalePriceRatio * 100).toFixed(0)}% of today's value.`),
  ];
  // Breakeven purchase price for the foreclosure path: price at which total profit = 0 (ignoring time value).
  const foreclosureOutflowsExPrice = foreclosure.slice(1).filter((c) => c < 0).reduce((a, b) => a - b, 0) + Math.max(0, -(foreclosure[foreclosure.length - 1]! - sale * (1 - i.saleCostRate)));
  const breakeven = sale * (1 - i.saleCostRate) - foreclosureOutflowsExPrice;
  if (priceToValue > 0.8) warnings.push("Paying more than 80% of current value for the note leaves little margin if foreclosure is the only exit.");
  if (i.foreclosureMonths > 18) warnings.push("Foreclosure timelines beyond 18 months (judicial states) make carry cost the dominant risk.");
  return { discountToUpb: discount, priceToValue, paths, breakevenPurchasePriceForeclosure: breakeven, warnings };
}
