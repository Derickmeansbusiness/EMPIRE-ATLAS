import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { getTransaction } from "@/lib/data/research";
import { bookmarkedIds, listNotes, recordProgress } from "@/lib/data/workspace";
import { listModelsForTransaction, MODEL_KIND_LABEL, MODEL_KIND_PATH, type ModelKind } from "@/lib/data/models";
import { can } from "@/lib/auth/roles";
import { Alert, Card, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { DataStatusBadge } from "@/components/research/status";
import { SourcesAndUses } from "@/components/research/capital-stack";
import { Timeline } from "@/components/research/timeline";
import { ClaimCard } from "@/components/research/claim-card";
import { NoteForm } from "@/components/workspace/note-form";
import { formatHistoricalDate, formatRelative } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const db = await getDb(); const t = await getTransaction(db, slug, true);
  return { title: t ? t.tx.name : "Transaction" };
}

export default async function DealPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ saved?: string }> }) {
  const user = await requireUser();
  const { slug } = await params; const sp = await searchParams;
  const db = await getDb();
  const t = await getTransaction(db, slug, can(user.role, "research:read_drafts"));
  if (!t) notFound();
  await recordProgress(db, user.id, "transaction.opened", "transaction", t.tx.id);
  const [claimBookmarks, notes, attachedModels] = await Promise.all([bookmarkedIds(db, user.id, "claim"), listNotes(db, user.id, { linkedKind: "transaction", linkedId: t.tx.id }), listModelsForTransaction(db, user.id, t.tx.id)]);
  const claimById = new Map(t.claims.map((c) => [c.id, c] as const));
  const returnTo = `/deals/${t.tx.slug}`;
  const fields: Array<[string, string | null]> = [
    ["Rights acquired", t.tx.rightsAcquired], ["Operating strategy", t.tx.operatingStrategy], ["Subsequent events", t.tx.subsequentEvents],
    ["Exit or present status", t.tx.exitOrStatus], ["Verified outcome", t.tx.verifiedOutcome], ["Unresolved historical questions", t.tx.openQuestions],
  ];
  return (
    <>
      {sp.saved === "note" && <div className="mb-6"><Alert tone="success">Note saved to your library.</Alert></div>}
      <PageHeader eyebrow={`Deal archaeology · ${t.tx.assetClass} · ${t.tx.market}`} title={t.tx.name} description={t.tx.summary} />
      <div className="grid gap-5 md:grid-cols-4">
        <Card><Eyebrow className="mb-1">Headline value</Eyebrow><p className="font-serif text-xl text-gold-soft">{t.tx.headlineValueLabel}</p><div className="mt-2"><DataStatusBadge status={t.tx.headlineValueStatus} /></div></Card>
        <Card><Eyebrow className="mb-1">Announced</Eyebrow><p className="font-serif text-xl">{formatHistoricalDate(t.tx.announcedOn, "day")}</p></Card>
        <Card><Eyebrow className="mb-1">Closed</Eyebrow><p className="font-serif text-xl">{formatHistoricalDate(t.tx.closedOn, t.tx.datePrecision)}</p></Card>
        <Card><Eyebrow className="mb-1">Lead investor</Eyebrow>{t.investor ? <Link href={`/dossiers/${t.investor.slug}`} className="font-serif text-xl hover:text-gold">{t.investor.fullName}</Link> : <p>—</p>}</Card>
      </div>

      <section className="mt-8">
        <Eyebrow className="mb-1">Sources &amp; uses</Eyebrow>
        <h2 className="editorial-h2 mb-4 text-2xl">Capital stack as documented</h2>
        <SourcesAndUses rows={t.stack} />
        <div className="mt-4 card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><Eyebrow>My hypothetical models attached to this record</Eyebrow><Link href={`/lab/capital-stack?totalUses=39000000000&value=39000000000`} className="text-xs text-gold hover:underline">Model it in the Capital Stack Builder →</Link></div>
          {attachedModels.length === 0 ? <p className="mt-2 text-xs text-slate-mist">None yet. Models you save from any lab tool can be attached here. They are stored separately from the historical record and always labelled hypothetical.</p> : (
            <ul className="mt-2 space-y-1.5 text-sm">{attachedModels.map((m) => <li key={m.id} className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-sky-400/50 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-sky-200">Hypothetical</span><Link href={`${MODEL_KIND_PATH[m.modelKind as ModelKind]}?model=${m.id}`} className="text-ivory hover:text-gold">{m.name}</Link><span className="text-xs text-slate-mist">{MODEL_KIND_LABEL[m.modelKind as ModelKind]} · v{m.version}</span></li>)}</ul>
          )}
        </div>
      </section>

      <div className="mt-8 grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <Card>
            <Eyebrow className="mb-1">Asset</Eyebrow>
            <p className="text-sm leading-relaxed text-platinum/85">{t.tx.assetDescription}</p>
            <p className="mt-2 text-xs text-slate-mist">{t.tx.location}</p>
          </Card>
          {fields.map(([label, value]) => value && (
            <Card key={label}><Eyebrow className="mb-1">{label}</Eyebrow><p className="text-sm leading-relaxed text-platinum/85 whitespace-pre-line">{value}</p></Card>
          ))}
          <section className="card p-5 sm:p-7">
            <Eyebrow className="mb-1">Transaction timeline</Eyebrow>
            <h2 className="editorial-h2 mb-6 text-2xl">From announcement to aftermath</h2>
            <Timeline events={t.events} claimById={claimById} />
          </section>
          <section>
            <Eyebrow className="mb-1">Evidence behind this reconstruction</Eyebrow>
            <h2 className="editorial-h2 mb-4 text-2xl">{t.claims.length} sourced claims</h2>
            <div className="space-y-3">{t.claims.map((c) => <ClaimCard key={c.id} claim={c} bookmarked={claimBookmarks.has(c.id)} returnTo={`${returnTo}#claim-${c.slug}`} />)}</div>
          </section>
        </div>
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <Eyebrow className="mb-2">Investor &amp; counterparties</Eyebrow>
            <ul className="space-y-2 text-sm">
              {t.participants.map(({ p, investor, institution }) => (
                <li key={p.id}>
                  <p className="text-ivory">{investor ? <Link href={`/dossiers/${investor.slug}`} className="hover:text-gold">{investor.fullName}</Link> : institution?.name}</p>
                  <p className="text-xs text-slate-mist">{p.role}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <Eyebrow className="mb-2">My notes on this transaction</Eyebrow>
            {notes.length > 0 && <ul className="mb-4 space-y-1.5">{notes.map((n) => <li key={n.id}><Link href={`/library/notes/${n.id}`} className="text-sm text-ivory hover:text-gold">{n.title}</Link><span className="ml-2 text-xs text-slate-mist">{formatRelative(n.updatedAt)}</span></li>)}</ul>}
            <NoteForm linkedKind="transaction" linkedId={t.tx.id} returnTo={returnTo} compact />
          </Card>
        </aside>
      </div>
    </>
  );
}
