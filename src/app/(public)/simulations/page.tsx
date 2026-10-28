import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Simulations" };

export default function SimulationsPublic() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <PageHeader eyebrow="Empire Strategy Simulator" title="Decide first. Then see what history did." description="Scenarios place you inside a documented moment with only the information available at the time. The historical outcome is sealed until you commit, and scoring rewards reasoning, prudent leverage and diligence rather than hindsight." />
      <div className="card p-6">
        <p className="eyebrow mb-2">Status</p>
        <p className="text-sm text-platinum/80">The simulator is scheduled for Phase 4. The first exercise, a lender negotiation inspired by the documented 2007 Equity Office sale and the subsequent refinancing failures of its buyers, will ship with its scenario engine, decision tracking and debrief. Nothing is live here yet, and we would rather say so than show a mock.</p>
      </div>
    </div>
  );
}
