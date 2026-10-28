import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { listTransactions } from "@/lib/data/research";
import { withSavedModel } from "@/lib/lab-params";
import { Alert, PageHeader } from "@/components/ui/primitives";
import { parseAssumptions, toUiValues, UnderwriterTool } from "@/components/lab/underwriter-tool";
import { HypotheticalBanner } from "@/components/lab/param-form";
import { SaveModelPanel } from "@/components/lab/shared";

export const metadata: Metadata = { title: "Acquisition Underwriter" };

export default async function UnderwriterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const db = await getDb();
  const raw = await searchParams;
  const { sp, model } = await withSavedModel(db, user.id, raw);
  const { assumptions } = parseAssumptions(sp);
  const txs = await listTransactions(db);
  return (
    <>
      <PageHeader eyebrow="Capital Architecture Lab" title="Acquisition Underwriter" description="Enter assumptions and the model computes income, financing and returns from actual cash flows. Inputs live in the URL so you can share a scenario, and you can save named, versioned models." />
      <HypotheticalBanner modelName={model?.name} version={model?.version} />
      {raw.saved && <div className="mb-5"><Alert tone="success">Model saved.</Alert></div>}
      <UnderwriterTool sp={sp} modelId={model?.id} savePanel={<SaveModelPanel kind="underwriter" assumptions={toUiValues(assumptions)} returnTo="/lab/underwriter" existing={model ? { id: model.id, name: model.name, version: model.version, transactionId: model.transactionId } : null} transactions={txs.map((t) => ({ id: t.tx.id, name: t.tx.name }))} />} />
    </>
  );
}
