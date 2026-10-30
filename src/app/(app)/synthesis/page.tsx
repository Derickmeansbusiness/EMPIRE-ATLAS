import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { claims, investors, transactions } from "@/db/schema";
import { listPrinciples } from "@/lib/data/study";
import { PRINCIPLE_PROMPTS } from "@/lib/synthesis";
import { deletePrincipleAction } from "@/app/actions/study";
import { Alert, Card, EmptyState, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { PrincipleForm } from "@/components/study/forms";
import { VerificationBadge } from "@/components/research/status";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Strategy Synthesis" };

export default async function SynthesisPage({ searchParams }: { searchParams: Promise<{ prompt?: string; edit?: string; saved?: string; deleted?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const db = await getDb();
  const [list, invs, txs, cls] = await Promise.all([
    listPrinciples(db, user.id),
    db.select().from(investors).where(eq(investors.publishStatus, "published")),
    db.select().from(transactions).where(eq(transactions.publishStatus, "published")),
    db.select().from(claims).where(eq(claims.publishStatus, "published")),
  ]);
  const claimBySlug = new Map(cls.map((c) => [c.slug, c] as const));
  const prompt = sp.prompt != null ? PRINCIPLE_PROMPTS[Number(sp.prompt)] : undefined;
  const editing = sp.edit ? list.find((l) => l.principle.id === sp.edit)?.principle : undefined;
  const defaults = editing ? { id: editing.id, title: editing.title, statement: editing.statement, sourceInvestorId: editing.sourceInvestorId, supportingTransactionId: editing.supportingTransactionId, supportingClaimId: editing.supportingClaimId, relevantRisk: editing.relevantRisk, modernApplication: editing.modernApplication, personalNotes: editing.personalNotes }
    : prompt ? { title: prompt.title, statement: prompt.statement, sourceInvestorId: invs[0]?.id ?? null, supportingClaimId: claimBySlug.get(prompt.claim)?.id ?? null, relevantRisk: prompt.risk, modernApplication: prompt.modern } : {};
  return (
    <>
      <PageHeader eyebrow="Strategy Synthesis Engine" title="Principles you can defend" description="A principle is only as good as its evidence. Each one links to a source investor, a supporting transaction, a sourced claim, the risk it guards against and how it applies today. Your principles feed your doctrine." actions={<><Link href="/synthesis/compare" className="rounded-md border border-platinum/25 px-3 py-2 text-xs text-platinum hover:border-gold hover:text-gold">Compare strategies</Link><Link href="/doctrine" className="rounded-md bg-gold px-3 py-2 text-xs text-ink">My doctrine</Link></>} />
      {sp.saved && <div className="mb-5"><Alert tone="success">Principle saved.</Alert></div>}
      {sp.deleted && <div className="mb-5"><Alert tone="success">Principle deleted.</Alert></div>}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <Eyebrow>Your principles · {list.length}</Eyebrow>
          {list.length === 0 ? <EmptyState title="No principles yet" body="Start from one of the evidence-backed prompts on the right, or write your own." /> : list.map(({ principle: p, investor, transaction, claim }) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between gap-3"><h2 className="font-serif text-xl text-ivory">{p.title}</h2><span className="shrink-0 text-xs text-slate-mist">{formatRelative(p.updatedAt)}</span></div>
              <p className="mt-2 text-sm leading-relaxed text-platinum/85">{p.statement}</p>
              <dl className="mt-3 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-[130px_1fr]">
                {investor && <><dt className="text-slate-mist">Source investor</dt><dd><Link href={`/dossiers/${investor.slug}`} className="text-ivory hover:text-gold">{investor.fullName}</Link></dd></>}
                {transaction && <><dt className="text-slate-mist">Transaction</dt><dd><Link href={`/deals/${transaction.slug}`} className="text-ivory hover:text-gold">{transaction.name}</Link></dd></>}
                {claim && <><dt className="text-slate-mist">Evidence</dt><dd className="flex flex-wrap items-center gap-2"><VerificationBadge status={claim.verificationStatus} size="xs" /><Link href={`/evidence/claims/${claim.slug}`} className="text-platinum/85 hover:text-gold">{claim.claimText}</Link></dd></>}
                {p.relevantRisk && <><dt className="text-slate-mist">Relevant risk</dt><dd className="text-platinum/85">{p.relevantRisk}</dd></>}
                {p.modernApplication && <><dt className="text-slate-mist">Modern application</dt><dd className="text-platinum/85">{p.modernApplication}</dd></>}
                {p.personalNotes && <><dt className="text-slate-mist">My notes</dt><dd className="text-platinum/85">{p.personalNotes}</dd></>}
              </dl>
              {!claim && <p className="mt-3 text-xs text-gold-soft">No historical evidence attached. Link a claim to make this defensible.</p>}
              <div className="mt-3 flex items-center gap-4 text-xs"><Link href={`/synthesis?edit=${p.id}`} className="text-gold hover:underline">Edit</Link><form action={deletePrincipleAction}><input type="hidden" name="id" value={p.id} /><button type="submit" className="text-risk hover:underline">Delete</button></form></div>
            </Card>
          ))}
        </div>
        <aside className="space-y-5">
          <Card>
            <Eyebrow className="mb-3">{editing ? "Edit principle" : prompt ? "Starting from a prompt" : "New principle"}</Eyebrow>
            <PrincipleForm defaults={defaults} investors={invs.map((i) => ({ value: i.id, label: i.fullName }))} transactions={txs.map((t) => ({ value: t.id, label: t.name }))} claims={cls.map((c) => ({ value: c.id, label: `${c.claimText.slice(0, 90)}${c.claimText.length > 90 ? "…" : ""}` }))} />
          </Card>
          <Card>
            <Eyebrow className="mb-3">Evidence-backed starting points</Eyebrow>
            <ul className="space-y-2">{PRINCIPLE_PROMPTS.map((p, i) => <li key={p.title}><Link href={`/synthesis?prompt=${i}`} className="block rounded-md border hairline px-3 py-2 text-sm text-ivory hover:border-gold hover:text-gold">{p.title}<span className="mt-0.5 block text-xs text-slate-mist">Cites: {claimBySlug.get(p.claim)?.claimText.slice(0, 80)}…</span></Link></li>)}</ul>
            <p className="mt-3 text-xs text-slate-mist">A prompt pre-fills the form. Rewrite it in your own words before saving.</p>
          </Card>
        </aside>
      </div>
    </>
  );
}
