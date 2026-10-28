import type { Metadata } from "next";
import { LinkButton, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Capital Lab" };

const tools: Array<[string, string, string]> = [
  ["Capital Stack Builder", "Senior, junior, mezzanine, preferred and common layers; LTV, LTC, debt-to-equity, weighted cost, coverage and gaps.", "Live"],
  ["Acquisition Underwriter", "Purchase price to IRR through actual financing cash flows: NOI, cap rate, debt yield, DSCR, cash-on-cash, equity multiple.", "Live"],
  ["Debt Structuring Lab", "Amortising, interest-only, balloon, fixed, floating, bridge and seller financing with real schedules.", "Live"],
  ["Private Credit Underwriting", "The lender's side: collateral, LTV, LTC, repayment capacity, income, fees, default and loss severity.", "Live"],
  ["Distressed Acquisition Simulator", "Distressed property, NPL purchase, discounted payoff, restructuring, foreclosure, workout, REO.", "Live"],
  ["Equity Waterfall Studio", "Preferred return, return of capital, promote tiers and distributions.", "Live"],
  ["Portfolio Stress Test", "Rate shocks, value declines, rent and occupancy losses, expense inflation, refinancing disruption.", "Live"],
];

export default function CapitalLabPublic() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <PageHeader eyebrow="Capital Lab" title="Financial engineering on a tested formula library" description="Every number in the lab is computed by the same deterministic TypeScript library that our unit tests exercise against independently calculated expected values. Formulas, conventions and warnings are shown with each result." />
      <ul className="grid gap-3 sm:grid-cols-2">
        {tools.map(([name, body, status]) => (
          <li key={name} className="card p-5">
            <div className="flex items-center justify-between gap-2"><h2 className="font-serif text-lg text-ivory">{name}</h2><span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] ${status.startsWith("Live") ? "border-positive/60 text-positive" : "border-platinum/30 text-slate-mist"}`}>{status}</span></div>
            <p className="mt-2 text-sm text-platinum/75">{body}</p>
          </li>
        ))}
      </ul>
      <div className="mt-8"><LinkButton href="/lab">Open the lab</LinkButton></div>
    </div>
  );
}
