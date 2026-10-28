/**
 * Fictional modern cases. Every entity, figure and date here is invented to illustrate transferable
 * principles. Nothing in this file is historical, and the UI labels it as fictional everywhere.
 */
export interface SeedCase {
  slug: string; title: string; subtitle: string; kind: "fictional" | "historical"; investorSlug?: string; transactionSlug?: string;
  summary: string; disclaimer: string; body: string; modelPresets: Record<string, Record<string, string | number>>;
}

export const seedCases: SeedCase[] = [
  {
    slug: "meridian-court-distressed-multifamily",
    title: "Meridian Court: a distressed multifamily note, three ways out",
    subtitle: "Fictional 2020s U.S. secondary-market case inspired by the Zell dossier",
    kind: "fictional",
    investorSlug: "sam-zell",
    summary: "A fictional 112-unit garden apartment community whose owner has stopped paying a bank loan. You can buy the note at a discount, buy the property after foreclosure, or walk away. The exercise applies the Grave Dancer principles — buy the claim, price the capital structure, keep liquidity — to invented numbers.",
    disclaimer: "Meridian Court, Larkspur Savings Bank, Halcyon Residential Partners and every figure in this case are fictional. They are not based on any real property, lender, borrower or transaction. The case exists to practise the reasoning illustrated by the Sam Zell dossier, whose claims are cited separately with their verification status.",
    body: `## The situation (fictional)

Meridian Court is a 112-unit, 1986-vintage garden apartment community in a secondary Sun Belt metro. Occupancy has slipped to 81%. The owner, Halcyon Residential Partners, bought it in 2021 for $16.8 million with a $12.6 million floating-rate bank loan from Larkspur Savings Bank (75% LTV, interest-only, maturing next spring). Debt service has roughly doubled since origination; the owner has missed three payments and has no equity to inject.

Larkspur has told its board it wants the exposure off the books before year-end. A broker opinion of value puts the property at $13.0–13.8 million today if stabilised, and perhaps $11.5 million as-is. The unpaid balance is $12.6 million plus about $0.4 million of accrued interest and default charges.

## What is actually for sale

Three different things could be bought, and they are not the same:

1. **The loan.** Larkspur will sell the note. Buying it makes you the senior creditor with control of the workout, not the owner of the building. This is the Carter Hawley Hale move from the dossier: own the claim that converts into control.
2. **The building, later.** Wait for foreclosure and buy the REO from the bank, or from whoever buys the note. Cleaner title, less control over timing.
3. **Nothing.** Pass if the price does not leave room for the carry, the capital expenditure and the probability that the borrower fights.

## The numbers you are given (all invented)

- Unpaid principal balance: $12.6M; accrued: $0.4M.
- Indicative note price: $9.1M (72% of UPB; 79% of as-is value).
- Monthly carry while you hold a non-performing note: about $38,000 (taxes and insurance advances, servicing, legal).
- Judicial foreclosure in this state: 11–14 months. Legal budget $220,000.
- Renovation to reach stabilised occupancy: $1.35M ($12,000 per unit). Nine months.
- Stabilised NOI estimate: $1.02M. Market cap rate for stabilised 1980s product: 6.5–7.0%.
- Borrower's signalled appetite: a discounted payoff at 80–84% of UPB if given six months to refinance with a bridge lender.

## Questions to answer before you touch the lab

- Which exit are you actually underwriting? Price the note so that the **worst** realistic path (foreclosure with a fight) still returns capital.
- Where does the value come from — the discount on the claim, the operating turnaround, or cap-rate compression you are hoping for? Only the first two are under your control.
- How long can you carry $38,000 a month without distributions? Liquidity, not leverage, decides whether you survive a 14-month foreclosure.
- If you win the note and the borrower offers 82% of UPB in month six, do you take it? That is a 14% gross return in half a year with no renovation risk. The dossier's lesson on selling certainty applies to you as the seller of a workout.

## Principles from the dossier being exercised

- Buy the claim, not the building, when the capital structure is the problem (Zell/Chilmark, 1991).
- Price the downside path first; the Grave Dancer essay's warning about the danced-upon.
- Match capital to the timeline: a 14-month foreclosure financed with 90-day money is how Macklowe lost the towers after 2007.

## How to use the lab with this case

Use the presets below. They open each tool with Meridian Court's fictional inputs so you can change one assumption at a time. Save your versions as models and attach them to this case through the notes.`,
    modelPresets: {
      distressed: { unpaidPrincipalBalance: 13_000_000, purchasePriceOfLoan: 9_100_000, propertyValueToday: 11_500_000, monthlyCarryCost: 38_000, dpoPercentOfUpb: 82, dpoMonth: 6, restructuredBalancePercent: 88, restructureRate: 7, restructureTermYears: 25, restructureStartMonth: 4, foreclosureMonths: 13, legalCosts: 220_000, reoRenovation: 1_350_000, reoHoldMonths: 9, reoSalePriceRatio: 118, saleCostRate: 2.5 },
      underwriter: { purchasePrice: 9_320_000, closingCostRate: 2.5, initialCapex: 1_350_000, units: 112, monthlyRentPerUnit: 1_180, otherIncomeAnnual: 95_000, vacancyRate: 9, operatingExpensesAnnual: 640_000, rentGrowth: 3, expenseGrowth: 3, loanToValue: 60, annualRate: 7.25, amortizationYears: 30, interestOnlyYears: 2, holdingPeriodYears: 5, exitCapRate: 6.75, saleCostRate: 2 },
      stress: { purchasePrice: 9_320_000, closingCostRate: 2.5, initialCapex: 1_350_000, units: 112, monthlyRentPerUnit: 1_180, otherIncomeAnnual: 95_000, vacancyRate: 9, operatingExpensesAnnual: 640_000, rentGrowth: 3, expenseGrowth: 3, loanToValue: 60, annualRate: 7.25, amortizationYears: 30, interestOnlyYears: 2, holdingPeriodYears: 5, exitCapRate: 6.75, saleCostRate: 2 },
      credit: { loanAmount: 6_400_000, collateralValue: 11_500_000, totalProjectCost: 10_900_000, borrowerNoi: 820_000, annualRate: 9.5, termYears: 2, amortizationYears: 2, interestOnlyYears: 2, originationFeeRate: 1.5, exitFeeRate: 1, defaultMonth: 14, recoveryValue: 10_000_000, liquidationCostRate: 7, monthsToRecover: 12, probabilityOfDefault: 10 },
    },
  },
];
