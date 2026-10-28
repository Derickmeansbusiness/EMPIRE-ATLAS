import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { listTransactions, getDossier } from "@/lib/data/research";
import { Eyebrow, LinkButton, PageHeader } from "@/components/ui/primitives";
import { formatHistoricalDate } from "@/lib/format";
import { DataStatusBadge } from "@/components/research/status";

export const metadata: Metadata = { title: "Featured Investigations" };

export default async function InvestigationsPage() {
  const db = await getDb();
  const [txs, zell] = await Promise.all([listTransactions(db), getDossier(db, "sam-zell")]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <PageHeader eyebrow="Featured Investigations" title="Where the research currently goes deepest" description="Investigations combine a dossier, a reconstructed transaction and the evidence behind both. These are the live ones." />
      <div className="grid gap-6 lg:grid-cols-2">
        {txs.map(({ tx, investor }) => (
          <article key={tx.slug} className="card p-6">
            <Eyebrow className="mb-2">Deal archaeology</Eyebrow>
            <h2 className="font-serif text-2xl text-ivory">{tx.name}</h2>
            <p className="mt-1 text-xs text-slate-mist">{investor?.fullName} · {formatHistoricalDate(tx.closedOn, tx.datePrecision)}</p>
            <p className="mt-3 text-sm leading-relaxed text-platinum/80">{tx.summary}</p>
            <div className="mt-4 flex items-center gap-2 text-sm"><span className="font-serif text-lg text-gold-soft numeric">{tx.headlineValueLabel}</span><DataStatusBadge status={tx.headlineValueStatus} /></div>
            <div className="mt-5"><LinkButton href={`/deals/${tx.slug}`} variant="secondary">Open the reconstruction</LinkButton></div>
          </article>
        ))}
        {zell && (
          <article className="card p-6">
            <Eyebrow className="mb-2">Dossier</Eyebrow>
            <h2 className="font-serif text-2xl text-ivory">{zell.investor.fullName}</h2>
            <p className="mt-1 text-xs text-slate-mist">{zell.claims.length} sourced claims · {zell.events.length} timeline events · {zell.sections.length} analytical divisions</p>
            <p className="mt-3 text-sm leading-relaxed text-platinum/80">{zell.investor.headline}</p>
            <div className="mt-5"><LinkButton href="/dossiers/sam-zell" variant="secondary">Open the dossier</LinkButton></div>
          </article>
        )}
      </div>
    </div>
  );
}
