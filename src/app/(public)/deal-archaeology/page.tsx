import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { listTransactions } from "@/lib/data/research";
import { LinkButton, PageHeader } from "@/components/ui/primitives";
import { DATA_STATUS_META } from "@/components/research/status";
import { formatHistoricalDate } from "@/lib/format";

export const metadata: Metadata = { title: "Deal Archaeology" };

export default async function DealArchaeologyPublic() {
  const db = await getDb();
  const txs = await listTransactions(db);
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <PageHeader eyebrow="Deal Archaeology" title="Transactions reconstructed line by line" description="Each record separates what the documents say from what reporters estimated and from what nobody has yet established. Hypothetical models are stored apart from the historical record." />
      <div className="grid gap-4 md:grid-cols-2">
        {txs.map(({ tx, investor }) => (
          <article key={tx.slug} className="card p-6">
            <p className="text-xs text-slate-mist">{investor?.fullName} · {formatHistoricalDate(tx.closedOn, tx.datePrecision)}</p>
            <h2 className="mt-1 font-serif text-2xl text-ivory">{tx.name}</h2>
            <p className="mt-2 text-sm text-platinum/75">{tx.assetDescription}</p>
            <p className="mt-3 font-serif text-xl text-gold-soft">{tx.headlineValueLabel}</p>
            <div className="mt-5"><LinkButton href={`/deals/${tx.slug}`} variant="secondary">Open</LinkButton></div>
          </article>
        ))}
      </div>
      <section className="mt-12 card-light p-6 sm:p-8">
        <p className="eyebrow mb-3" style={{ color: "#8a6a35" }}>Data statuses used in every reconstruction</p>
        <dl className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(DATA_STATUS_META) as Array<keyof typeof DATA_STATUS_META>).map((k) => (
            <div key={k} className="border-l-2 border-gold pl-3"><dt className="text-sm font-semibold text-ink">{DATA_STATUS_META[k].label}</dt><dd className="text-xs text-ink/70">{k === "documented" ? "Stated in a filing, contract, court record or company document." : k === "interpretation" ? "An analytical reading supported by documents but not stated in them." : k === "estimate" ? "A figure reported by credible sources without a documentary basis in our corpus." : k === "unknown" ? "Nobody has established it. Left blank rather than guessed." : "Created by a user inside a model. Never part of the historical record."}</dd></div>
          ))}
        </dl>
      </section>
    </div>
  );
}
