import type { Metadata } from "next";
import { LinkButton, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Simulations" };

export default function SimulationsPublic() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <PageHeader eyebrow="Empire Strategy Simulator" title="Decide first. Then see what history did." description="Scenarios place you inside a documented moment with only the information available at the time. The historical outcome is sealed until you commit, and scoring rewards reasoning, prudent leverage and diligence rather than hindsight." />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-6"><p className="eyebrow mb-2">Historical</p><h2 className="font-serif text-xl text-ivory">The office portfolio at the top of the cycle</h2><p className="mt-2 text-sm text-platinum/80">November 2006 to 2009 as chairman of the largest listed U.S. office landlord: an unsolicited cash offer, a competing stock-heavy bid, what to do with the proceeds, and the credit freeze. Four decisions; the documented record revealed afterwards with its citations.</p></div>
        <div className="card p-6"><p className="eyebrow mb-2">Fictional</p><h2 className="font-serif text-xl text-ivory">Meridian Court: negotiating the note</h2><p className="mt-2 text-sm text-platinum/80">Price a defaulted multifamily loan, decide how to carry it, answer the borrower’s discounted-payoff offer, and live with a contested foreclosure if you refuse. Every figure is invented; the reasoning is compared with the documented Zell/Chilmark method.</p></div>
      </div>
      <p className="mt-6 text-sm text-platinum/75">Scoring is deterministic and set when the scenario is written: financial reasoning, leverage prudence, diligence, liquidity and risk-adjusted return. Historical success is not treated as inevitable. <LinkButton href="/sign-up" className="ml-2 px-3 py-1.5 text-xs">Begin research</LinkButton></p>
    </div>
  );
}
