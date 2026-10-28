import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { Card, Eyebrow, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Capital Architecture Lab" };

const tools = [
  { href: "/lab/underwriter", name: "Acquisition Underwriter", status: "live", body: "NOI, cap rate, debt yield, DSCR, cash-on-cash, levered IRR and equity multiple from actual financing cash flows." },
  { href: "/lab/debt", name: "Debt Structuring Lab", status: "live", body: "Amortising, interest-only and balloon structures with full period-by-period schedules." },
  { href: null, name: "Capital Stack Builder", status: "Phase 2", body: "Layer senior, junior, mezzanine, preferred and common capital; compute LTV, LTC, D/E, weighted cost and gaps." },
  { href: null, name: "Private Credit Underwriting", status: "Phase 2", body: "The lender's view: collateral, coverage, income, fees, default and loss severity." },
  { href: null, name: "Distressed Acquisition Simulator", status: "Phase 2", body: "NPL purchase, discounted payoff, restructuring, foreclosure, workout and REO paths." },
  { href: null, name: "Equity Waterfall Studio", status: "Phase 2", body: "Preferred return, return of capital, promote tiers." },
  { href: null, name: "Portfolio Stress Test", status: "Phase 2", body: "Rate, value, rent, occupancy, expense and refinancing shocks." },
];

export default async function LabPage() {
  await requireUser();
  return (
    <>
      <PageHeader eyebrow="Capital Architecture Lab" title="Financial engineering" description="Every result is produced by the platform's deterministic formula library, which is unit-tested against independently calculated values. Inputs you enter here are hypothetical by definition and are never written into the historical record." />
      <div className="grid gap-4 md:grid-cols-2">
        {tools.map((t) => (
          <Card key={t.name}>
            <div className="flex items-center justify-between gap-2"><h2 className="font-serif text-xl text-ivory">{t.name}</h2><span className={`rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] ${t.status === "live" ? "border-positive/60 text-positive" : "border-platinum/30 text-slate-mist"}`}>{t.status}</span></div>
            <p className="mt-2 text-sm text-platinum/75">{t.body}</p>
            {t.href ? <Link href={t.href} className="mt-3 inline-block text-sm text-gold hover:underline">Open →</Link> : <p className="mt-3 text-xs text-slate-mist">Not yet built. No mock results are shown.</p>}
          </Card>
        ))}
      </div>
      <Card className="mt-6"><Eyebrow className="mb-2">Conventions</Eyebrow><ul className="list-disc space-y-1 pl-5 text-xs text-platinum/75"><li>Rates are nominal annual rates divided by payments per year.</li><li>Returns are computed from levered cash flows: equity out, cash flow after debt service in, and net sale proceeds after loan payoff. Price appreciation is never counted as profit until a modelled sale.</li><li>Exit value uses the final year’s NOI divided by the exit cap rate (trailing convention), stated on the result.</li><li>Nothing is rounded inside the library; display rounding only.</li></ul></Card>
    </>
  );
}
