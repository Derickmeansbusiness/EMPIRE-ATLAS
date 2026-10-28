import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { listTransactions } from "@/lib/data/research";
import { can } from "@/lib/auth/roles";
import { PageHeader } from "@/components/ui/primitives";
import { DataStatusBadge } from "@/components/research/status";
import { formatHistoricalDate } from "@/lib/format";

export const metadata: Metadata = { title: "Deal Archaeology" };

export default async function DealsPage() {
  const user = await requireUser();
  const db = await getDb();
  const txs = await listTransactions(db, can(user.role, "research:read_drafts"));
  return (
    <>
      <PageHeader eyebrow="Deal Archaeology" title="Reconstructed transactions" description="Sources and uses, participants, rights acquired, subsequent events and open questions. Documented, estimated and unknown figures are always labelled." />
      <div className="grid gap-5 md:grid-cols-2">
        {txs.map(({ tx, investor }) => (
          <article key={tx.id} className="card p-6 rise">
            <p className="text-xs text-slate-mist">{investor?.fullName} · {formatHistoricalDate(tx.closedOn, tx.datePrecision)} · {tx.assetClass}</p>
            <h2 className="mt-1 font-serif text-2xl text-ivory"><Link href={`/deals/${tx.slug}`} className="hover:text-gold">{tx.name}</Link></h2>
            <p className="mt-2 text-sm text-platinum/75">{tx.summary}</p>
            <div className="mt-4 flex items-center gap-2"><span className="font-serif text-lg text-gold-soft">{tx.headlineValueLabel}</span><DataStatusBadge status={tx.headlineValueStatus} /></div>
            {tx.publishStatus !== "published" && <p className="mt-2 text-xs uppercase tracking-wide text-risk">Draft</p>}
          </article>
        ))}
      </div>
    </>
  );
}
