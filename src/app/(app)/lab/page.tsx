import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { listModels, MODEL_KIND_LABEL, MODEL_KIND_PATH, type ModelKind } from "@/lib/data/models";
import { listCaseStudies } from "@/lib/data/cases";
import { Card, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Capital Architecture Lab" };

const tools = [
  { href: "/lab/capital-stack", name: "Capital Stack Builder", body: "Senior, junior, mezzanine, preferred and common layers; LTV, LTC, D/E, weighted cost, debt service by layer, coverage and gaps." },
  { href: "/lab/underwriter", name: "Acquisition Underwriter", body: "NOI, cap rate, debt yield, DSCR, cash-on-cash, levered IRR and equity multiple from actual financing cash flows." },
  { href: "/lab/debt", name: "Debt Structuring Lab", body: "Amortising, interest-only, balloon, floating-rate, bridge and seller financing with full schedules and a side-by-side comparison." },
  { href: "/lab/credit", name: "Private Credit Underwriting", body: "The lender's view: collateral, coverage, income, fees, a defined default scenario, recovery and loss severity." },
  { href: "/lab/distressed", name: "Distressed Acquisition Simulator", body: "Non-performing loan purchase with discounted payoff, restructuring and foreclosure-to-REO paths." },
  { href: "/lab/waterfall", name: "Equity Waterfall Studio", body: "Return of capital, compounding preferred return, GP catch-up, IRR-hurdle promote tiers." },
  { href: "/lab/stress", name: "Portfolio Stress Test", body: "Rate, value, rent, occupancy, expense and refinancing shocks, each a full re-underwriting." },
];

export default async function LabPage() {
  const user = await requireUser();
  const db = await getDb();
  const [models, cases] = await Promise.all([listModels(db, user.id), listCaseStudies(db)]);
  return (
    <>
      <PageHeader eyebrow="Capital Architecture Lab" title="Financial engineering" description="Seven tools on one deterministic formula library, unit-tested against independently calculated values. Inputs are hypothetical by definition; save them as named, versioned models and attach them to a historical transaction without touching the record." actions={<Link href="/lab/models" className="rounded-md border border-platinum/25 px-3 py-2 text-xs text-platinum hover:border-gold hover:text-gold">Saved models ({models.length})</Link>} />
      <div className="grid gap-4 md:grid-cols-2">
        {tools.map((t) => (
          <Card key={t.name}>
            <div className="flex items-center justify-between gap-2"><h2 className="font-serif text-xl text-ivory"><Link href={t.href} className="hover:text-gold">{t.name}</Link></h2><span className="rounded-full border border-positive/60 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-positive">live</span></div>
            <p className="mt-2 text-sm text-platinum/75">{t.body}</p>
            <Link href={t.href} className="mt-3 inline-block text-sm text-gold hover:underline">Open →</Link>
          </Card>
        ))}
      </div>
      {cases.length > 0 && (
        <section className="mt-8">
          <Eyebrow className="mb-3">Modern cases (fictional, principle-driven)</Eyebrow>
          <div className="grid gap-4 md:grid-cols-2">
            {cases.map((c) => (
              <Card key={c.id}>
                <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-sky-400/50 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-sky-200">{c.kind}</span><span className="text-xs text-slate-mist">{c.subtitle}</span></div>
                <h2 className="mt-2 font-serif text-xl text-ivory"><Link href={`/lab/cases/${c.slug}`} className="hover:text-gold">{c.title}</Link></h2>
                <p className="mt-2 text-sm text-platinum/75">{c.summary}</p>
              </Card>
            ))}
          </div>
        </section>
      )}
      {models.length > 0 && (
        <Card className="mt-8">
          <Eyebrow className="mb-3">Recent saved models</Eyebrow>
          <ul className="space-y-1.5 text-sm">{models.slice(0, 5).map(({ model }) => <li key={model.id}><Link href={`${MODEL_KIND_PATH[model.modelKind as ModelKind]}?model=${model.id}`} className="text-ivory hover:text-gold">{model.name}</Link><span className="ml-2 text-xs text-slate-mist">{MODEL_KIND_LABEL[model.modelKind as ModelKind]} · v{model.version} · {formatRelative(model.updatedAt)}</span></li>)}</ul>
        </Card>
      )}
      <Card className="mt-6"><Eyebrow className="mb-2">Conventions</Eyebrow><ul className="list-disc space-y-1 pl-5 text-xs text-platinum/75"><li>Rates are nominal annual rates divided by payments per year.</li><li>Returns are computed from levered cash flows: equity out, cash flow after debt service in, and net sale proceeds after loan payoff. Appreciation is never counted as profit until a modelled sale.</li><li>Exit value uses the final year’s NOI divided by the exit cap rate (trailing convention), stated on the result.</li><li>Nothing is rounded inside the library; display rounding only.</li></ul></Card>
    </>
  );
}
