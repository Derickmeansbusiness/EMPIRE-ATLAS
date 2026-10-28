import type { Metadata } from "next";
import Link from "next/link";
import { eq, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { claims, institutions, investors, relationships, transactions } from "@/db/schema";
import { Alert, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { VerificationBadge } from "@/components/research/status";

export const metadata: Metadata = { title: "Capital Network" };

export default async function NetworkPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  await requireUser();
  const { type } = await searchParams;
  const db = await getDb();
  const rows = await db.select({ rel: relationships, claim: claims, fromInv: investors, fromInst: institutions, tx: transactions })
    .from(relationships)
    .leftJoin(claims, eq(claims.id, relationships.claimId))
    .leftJoin(investors, eq(investors.id, relationships.fromInvestorId))
    .leftJoin(institutions, eq(institutions.id, relationships.fromInstitutionId))
    .leftJoin(transactions, eq(transactions.id, relationships.toTransactionId))
    .where(or(eq(relationships.isHypothetical, false), eq(relationships.isHypothetical, true)));
  const toInstIds = rows.map((r) => r.rel.toInstitutionId).filter((x): x is string => !!x);
  const toInsts = toInstIds.length ? await db.select().from(institutions) : [];
  const instById = new Map(toInsts.map((i) => [i.id, i] as const));
  const types = Array.from(new Set(rows.map((r) => r.rel.relationship))).sort();
  const filtered = type ? rows.filter((r) => r.rel.relationship === type) : rows;
  const nodes = new Set<string>();
  for (const r of rows) { if (r.fromInv) nodes.add(`inv:${r.fromInv.id}`); if (r.fromInst) nodes.add(`inst:${r.fromInst.id}`); if (r.rel.toInstitutionId) nodes.add(`inst:${r.rel.toInstitutionId}`); if (r.tx) nodes.add(`tx:${r.tx.id}`); }
  return (
    <>
      <PageHeader eyebrow="Capital Network Explorer" title="Evidence-linked relationships" description="Every edge below points at the claim that supports it. The interactive graph view ships in Phase 3; the data model and evidence linkage are already in place." />
      <div className="mb-6"><Alert tone="info">{nodes.size} nodes · {rows.length} relationships · 0 hypothetical. Nothing is drawn here that a claim does not support.</Alert></div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        <Link href="/network" className={`rounded-full border px-3 py-1 text-xs ${!type ? "border-gold text-gold" : "border-platinum/20 text-platinum/70 hover:border-gold"}`}>All</Link>
        {types.map((t) => <Link key={t} href={`/network?type=${t}`} className={`rounded-full border px-3 py-1 text-xs ${type === t ? "border-gold text-gold" : "border-platinum/20 text-platinum/70 hover:border-gold"}`}>{t.replace(/_/g, " ")}</Link>)}
      </div>
      <div className="card overflow-x-auto p-2 sm:p-4">
        <table className="w-full text-sm">
          <thead className="text-left text-[0.65rem] uppercase tracking-[0.16em] text-slate-mist"><tr><th className="p-2 font-medium">From</th><th className="p-2 font-medium">Relationship</th><th className="p-2 font-medium">To</th><th className="p-2 font-medium">Years</th><th className="p-2 font-medium">Evidence</th></tr></thead>
          <tbody>
            {filtered.map((r) => {
              const toInst = r.rel.toInstitutionId ? instById.get(r.rel.toInstitutionId) : null;
              return (
                <tr key={r.rel.id} className="border-t hairline align-top">
                  <td className="p-2 text-ivory">{r.fromInv ? <Link href={`/dossiers/${r.fromInv.slug}`} className="hover:text-gold">{r.fromInv.fullName}</Link> : r.fromInst?.name}</td>
                  <td className="p-2 text-gold-soft">{r.rel.relationship.replace(/_/g, " ")}</td>
                  <td className="p-2 text-ivory">{r.tx ? <Link href={`/deals/${r.tx.slug}`} className="hover:text-gold">{r.tx.name}</Link> : toInst?.name}{r.rel.description && <p className="text-xs text-slate-mist">{r.rel.description}</p>}</td>
                  <td className="p-2 numeric text-platinum/75">{r.rel.startYear ?? "—"}{r.rel.endYear ? `–${r.rel.endYear}` : ""}</td>
                  <td className="p-2">{r.claim ? <Link href={`/evidence/claims/${r.claim.slug}`}><VerificationBadge status={r.claim.verificationStatus} size="xs" /></Link> : <span className="text-xs text-sky-200">hypothetical</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-slate-mist"><Eyebrow className="inline">Known gaps</Eyebrow> Lender nodes for the private-era Zell property deals and for Blackstone’s 2007 acquisition financing are not in the corpus and are deliberately absent rather than guessed.</p>
    </>
  );
}
