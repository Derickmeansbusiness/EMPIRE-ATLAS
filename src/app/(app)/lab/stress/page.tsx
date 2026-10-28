import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { listTransactions } from "@/lib/data/research";
import { withSavedModel, type SP } from "@/lib/lab-params";
import { parseAssumptions, UNDERWRITER_FIELDS, toUiValues } from "@/components/lab/underwriter-tool";
import { stressTest } from "@/finance/stress";
import { FinanceInputError } from "@/finance/core";
import { Alert, Card, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { HypotheticalBanner, ParamForm, ResultsTable } from "@/components/lab/param-form";
import { SaveModelPanel } from "@/components/lab/shared";
import { formatMultiple, formatPct, formatUsd } from "@/lib/format";

export const metadata: Metadata = { title: "Portfolio Stress Test" };

export default async function StressPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const db = await getDb();
  const raw = await searchParams;
  const { sp, model } = await withSavedModel(db, user.id, raw);
  const { assumptions } = parseAssumptions(sp);
  const values = toUiValues(assumptions);
  let rows: ReturnType<typeof stressTest> | null = null; let error: string | null = null;
  try { rows = stressTest(assumptions); } catch (e) { error = e instanceof FinanceInputError ? e.message : "Could not compute."; }
  const txs = await listTransactions(db);
  return (
    <>
      <PageHeader eyebrow="Capital Architecture Lab" title="Portfolio Stress Test" description="Start from an acquisition base case and run it through rate increases, value declines, rent and occupancy losses, expense inflation and refinancing disruption. Each row is a full re-underwriting, not a sensitivity on one output." />
      <HypotheticalBanner modelName={model?.name} version={model?.version} />
      {raw.saved && <div className="mb-5"><Alert tone="success">Model saved.</Alert></div>}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-5">
          <Card><Eyebrow className="mb-3">Base case assumptions</Eyebrow><ParamForm action="/lab/stress" fields={UNDERWRITER_FIELDS} values={values} submitLabel="Run stress test" hidden={model ? { model: model.id } : {}} /></Card>
          <Card><Eyebrow className="mb-3">Save</Eyebrow><SaveModelPanel kind="stress" assumptions={values} returnTo="/lab/stress" existing={model ? { id: model.id, name: model.name, version: model.version, transactionId: model.transactionId } : null} transactions={txs.map((t) => ({ id: t.tx.id, name: t.tx.name }))} /></Card>
        </div>
        <div className="space-y-5">
          {error && <Alert tone="error">{error}</Alert>}
          {rows && (
            <>
              <Card>
                <Eyebrow className="mb-3">Scenario grid</Eyebrow>
                <ResultsTable headers={["Scenario", "NOI Y1", "DSCR Y1", "Levered IRR", "Multiple", "Exit value", "Refi proceeds", "Loan at exit", "Refi gap", "Breaches"]} rows={rows.map((r) => [r.scenario, formatUsd(r.noiYear1), formatMultiple(r.dscrYear1), formatPct(r.leveredIrr), formatMultiple(r.equityMultiple), formatUsd(r.exitValue), formatUsd(r.refinanceProceeds), formatUsd(r.loanBalanceAtExit), r.refinanceGap > 0 ? formatUsd(r.refinanceGap) : "—", r.breached.length ? r.breached.join("; ") : "none"])} />
              </Card>
              <Card>
                <Eyebrow className="mb-2">How shocks are applied</Eyebrow>
                <ul className="list-disc space-y-1 pl-5 text-xs text-platinum/75">
                  <li>Rate shock adds to the acquisition loan rate and to the refinancing rate.</li>
                  <li>Value decline widens the exit cap rate so exit value falls by the stated fraction.</li>
                  <li>Rent decline scales rent and other income; occupancy decline adds points to vacancy; expense increase scales year-1 opex.</li>
                  <li>Refinance proceeds = min(LTV cap × exit value, loan sized to a 1.25x DSCR on 30-year amortisation at the refi rate). A positive gap means the maturing balance cannot be refinanced without new equity.</li>
                </ul>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
