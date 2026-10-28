import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { listTransactions } from "@/lib/data/research";
import { num, withSavedModel, type SP } from "@/lib/lab-params";
import { buildLoanSchedule, summarizeCapitalStack, debtServiceCoverage, type CapitalLayer } from "@/finance/core";
import { Alert, Card, Eyebrow, PageHeader, Stat } from "@/components/ui/primitives";
import { HypotheticalBanner, ParamForm, type FieldSpec } from "@/components/lab/param-form";
import { SaveModelPanel } from "@/components/lab/shared";
import { formatMultiple, formatPct, formatUsd } from "@/lib/format";

export const metadata: Metadata = { title: "Capital Stack Builder" };

const LAYERS: Array<{ key: string; name: string; kind: CapitalLayer["kind"]; isDebt: boolean; amount: number; rate: number; amort: number; io: number }> = [
  { key: "senior", name: "Senior secured debt", kind: "senior_debt", isDebt: true, amount: 6_500_000, rate: 6.5, amort: 30, io: 0 },
  { key: "junior", name: "Junior debt", kind: "junior_debt", isDebt: true, amount: 0, rate: 9, amort: 30, io: 0 },
  { key: "mezz", name: "Mezzanine debt", kind: "mezzanine", isDebt: true, amount: 1_000_000, rate: 12, amort: 0, io: 5 },
  { key: "pref", name: "Preferred equity", kind: "preferred_equity", isDebt: false, amount: 500_000, rate: 10, amort: 0, io: 0 },
  { key: "common", name: "Common (LP) equity", kind: "common_equity", isDebt: false, amount: 2_150_000, rate: 15, amort: 0, io: 0 },
  { key: "sponsor", name: "Sponsor capital", kind: "sponsor_equity", isDebt: false, amount: 250_000, rate: 15, amort: 0, io: 0 },
];

export default async function CapitalStackPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const db = await getDb();
  const raw = await searchParams;
  const { sp, model } = await withSavedModel(db, user.id, raw);
  const values: Record<string, number> = { totalUses: num(sp, "totalUses", 10_400_000), value: num(sp, "value", 10_000_000), noi: num(sp, "noi", 690_000), term: num(sp, "term", 5) };
  for (const l of LAYERS) { values[`${l.key}Amount`] = num(sp, `${l.key}Amount`, l.amount); values[`${l.key}Rate`] = num(sp, `${l.key}Rate`, l.rate); if (l.isDebt) { values[`${l.key}Amort`] = num(sp, `${l.key}Amort`, l.amort); values[`${l.key}Io`] = num(sp, `${l.key}Io`, l.io); } }
  const layers: CapitalLayer[] = LAYERS.map((l) => ({ name: l.name, kind: l.kind, amount: values[`${l.key}Amount`]!, annualRate: values[`${l.key}Rate`]! / 100 }));
  const summary = summarizeCapitalStack(layers, { totalUses: values.totalUses!, value: values.value! });
  const debtRows = LAYERS.filter((l) => l.isDebt && values[`${l.key}Amount`]! > 0).map((l) => {
    const amortYears = values[`${l.key}Amort`]! > 0 ? values[`${l.key}Amort`]! : values.term!;
    const io = values[`${l.key}Amort`]! > 0 ? Math.min(values[`${l.key}Io`]!, values.term!) : values.term!;
    const s = buildLoanSchedule({ principal: values[`${l.key}Amount`]!, annualRate: values[`${l.key}Rate`]! / 100, amortizationYears: amortYears, termYears: values.term!, interestOnlyYears: io });
    return { name: l.name, amount: values[`${l.key}Amount`]!, rate: values[`${l.key}Rate`]! / 100, ds: s.annualDebtService, balloon: s.balloonBalance };
  });
  const totalDs = debtRows.reduce((a, r) => a + r.ds, 0);
  const dscr = totalDs > 0 ? debtServiceCoverage(values.noi!, totalDs) : null;
  const seniorDs = debtRows[0]?.ds ?? 0;
  const seniorDscr = seniorDs > 0 ? debtServiceCoverage(values.noi!, seniorDs) : null;
  const warnings: string[] = [];
  if (summary.fundingGap > 0) warnings.push(`Funding gap of ${formatUsd(summary.fundingGap)}: sources do not cover uses.`);
  if (summary.fundingGap < 0) warnings.push(`Sources exceed uses by ${formatUsd(-summary.fundingGap)}.`);
  if (summary.loanToValue != null && summary.loanToValue > 0.8) warnings.push(`Combined LTV ${formatPct(summary.loanToValue, 1)} is above 80%.`);
  if (dscr != null && dscr < 1.2) warnings.push(`Combined DSCR ${formatMultiple(dscr)} is below 1.20x.`);
  const fields: FieldSpec[] = [
    { key: "totalUses", label: "Total uses ($)", kind: "usd" }, { key: "value", label: "Appraised value ($)", kind: "usd" }, { key: "noi", label: "Stabilised NOI ($)", kind: "usd" }, { key: "term", label: "Hold / term (years)", kind: "int" },
    ...LAYERS.flatMap((l): FieldSpec[] => [
      { key: `${l.key}Amount`, label: `${l.name} ($)`, kind: "usd" }, { key: `${l.key}Rate`, label: `${l.name} rate / target (%)`, kind: "pct" },
      ...(l.isDebt ? [{ key: `${l.key}Amort`, label: `${l.name} amortisation (yrs, 0 = IO)`, kind: "int" } as FieldSpec, { key: `${l.key}Io`, label: `${l.name} IO years`, kind: "int" } as FieldSpec] : []),
    ]),
  ];
  const txs = await listTransactions(db);
  return (
    <>
      <PageHeader eyebrow="Capital Architecture Lab" title="Capital Stack Builder" description="Layer senior, junior, mezzanine, preferred and common capital. The builder computes sources versus uses, leverage ratios, weighted cost, debt service by layer, coverage and any funding gap." />
      <HypotheticalBanner modelName={model?.name} version={model?.version} />
      {raw.saved && <div className="mb-5"><Alert tone="success">Model saved.</Alert></div>}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-5">
          <Card><Eyebrow className="mb-3">Layers &amp; uses</Eyebrow><ParamForm action="/lab/capital-stack" fields={fields} values={values} submitLabel="Build stack" hidden={model ? { model: model.id } : {}} /></Card>
          <Card><Eyebrow className="mb-3">Save</Eyebrow><SaveModelPanel kind="capital_stack" assumptions={values} returnTo="/lab/capital-stack" existing={model ? { id: model.id, name: model.name, version: model.version, transactionId: model.transactionId } : null} transactions={txs.map((t) => ({ id: t.tx.id, name: t.tx.name }))} /></Card>
        </div>
        <div className="space-y-5">
          <Card>
            <Eyebrow className="mb-3">Stack</Eyebrow>
            <div className="flex h-7 w-full overflow-hidden rounded-md border hairline" role="img" aria-label="Capital stack proportions">
              {layers.filter((l) => l.amount > 0).map((l, i) => <div key={l.name} className={["bg-gold", "bg-gold-soft", "bg-platinum/70", "bg-sky-300/80", "bg-positive/80", "bg-slate-mist"][i % 6]} style={{ width: `${(l.amount / Math.max(1, summary.totalSources)) * 100}%` }} title={`${l.name}: ${formatUsd(l.amount)}`} />)}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
              <Stat label="Total sources" value={formatUsd(summary.totalSources)} />
              <Stat label="Total debt" value={formatUsd(summary.totalDebt)} />
              <Stat label="Total equity" value={formatUsd(summary.totalEquity)} />
              <Stat label="Funding gap" value={formatUsd(summary.fundingGap)} tone={summary.fundingGap > 0 ? "risk" : "positive"} />
              <Stat label="LTV" value={formatPct(summary.loanToValue, 1)} />
              <Stat label="LTC" value={formatPct(summary.loanToCost, 1)} />
              <Stat label="Debt / equity" value={summary.debtToEquity == null ? "—" : formatMultiple(summary.debtToEquity)} />
              <Stat label="Weighted cost of capital" value={formatPct(summary.weightedCostOfCapital)} sub="rates as entered" />
              <Stat label="Annual debt service" value={formatUsd(totalDs)} />
              <Stat label="Combined DSCR" value={dscr == null ? "n/a" : formatMultiple(dscr)} tone={dscr != null && dscr < 1.2 ? "risk" : "positive"} />
              <Stat label="Senior DSCR" value={seniorDscr == null ? "n/a" : formatMultiple(seniorDscr)} />
            </div>
            {warnings.length > 0 && <ul className="mt-5 space-y-1.5">{warnings.map((w) => <li key={w}><Alert tone="warning">{w}</Alert></li>)}</ul>}
          </Card>
          <Card>
            <Eyebrow className="mb-3">Debt service by layer (year 1)</Eyebrow>
            <table className="w-full text-xs numeric"><thead className="text-left text-[0.6rem] uppercase tracking-[0.14em] text-slate-mist"><tr><th className="p-1.5">Layer</th><th className="p-1.5 text-right">Amount</th><th className="p-1.5 text-right">Rate</th><th className="p-1.5 text-right">Debt service</th><th className="p-1.5 text-right">Balloon at term</th></tr></thead>
              <tbody>{debtRows.map((r) => <tr key={r.name} className="border-t hairline"><td className="p-1.5 text-ivory">{r.name}</td><td className="p-1.5 text-right">{formatUsd(r.amount)}</td><td className="p-1.5 text-right">{formatPct(r.rate)}</td><td className="p-1.5 text-right">{formatUsd(r.ds)}</td><td className="p-1.5 text-right">{formatUsd(r.balloon)}</td></tr>)}</tbody></table>
          </Card>
          <Card><Eyebrow className="mb-2">Formulas</Eyebrow><ul className="list-disc space-y-1 pl-5 text-xs text-platinum/75"><li>LTV = total debt ÷ value; LTC = total debt ÷ total uses; D/E = total debt ÷ total equity.</li><li>Weighted cost = Σ(amount × rate) ÷ total sources; shown only when every layer has a rate.</li><li>Debt service per layer from a real monthly schedule (amortisation 0 = interest-only for the term).</li><li>Combined DSCR = NOI ÷ Σ debt service of all debt layers; preferred equity is not debt and is excluded.</li></ul></Card>
        </div>
      </div>
    </>
  );
}
