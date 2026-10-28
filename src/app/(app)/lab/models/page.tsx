import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { listModels, MODEL_KIND_LABEL, MODEL_KIND_PATH, type ModelKind } from "@/lib/data/models";
import { deleteModelAction } from "@/app/actions/models";
import { Alert, EmptyState, PageHeader } from "@/components/ui/primitives";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Saved Models" };

export default async function ModelsPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const db = await getDb();
  const models = await listModels(db, user.id);
  return (
    <>
      <PageHeader eyebrow="Capital Architecture Lab" title="Saved models" description="Every saved model is hypothetical, private to you, and versioned. Reopen one to continue from its last inputs." />
      {sp.deleted && <div className="mb-5"><Alert tone="success">Model deleted.</Alert></div>}
      {models.length === 0 ? <EmptyState title="No saved models yet" body="Run any lab tool and use the Save model panel to keep a named, versioned scenario." /> : (
        <ul className="space-y-2">
          {models.map(({ model, transaction }) => {
            const kind = model.modelKind as ModelKind;
            return (
              <li key={model.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><Link href={`${MODEL_KIND_PATH[kind]}?model=${model.id}`} className="font-serif text-lg text-ivory hover:text-gold">{model.name}</Link><span className="rounded-full border border-sky-400/50 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-sky-200">Hypothetical</span></div>
                  <p className="text-xs text-slate-mist">{MODEL_KIND_LABEL[kind]} · v{model.version} · updated {formatRelative(model.updatedAt)}{transaction ? <> · attached to <Link href={`/deals/${transaction.slug}`} className="text-gold hover:underline">{transaction.name}</Link></> : null}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Link href={`/lab/models/${model.id}`} className="text-platinum/80 hover:text-gold">Versions</Link>
                  <Link href={`${MODEL_KIND_PATH[kind]}?model=${model.id}`} className="rounded-md border border-platinum/25 px-3 py-1.5 text-platinum hover:border-gold hover:text-gold">Open</Link>
                  <form action={deleteModelAction}><input type="hidden" name="modelId" value={model.id} /><button type="submit" className="rounded-md border border-risk/50 px-3 py-1.5 text-risk hover:bg-risk/10">Delete</button></form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
