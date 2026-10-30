/** Builds the retrieval corpus from published research only (never drafts, never private user work). */
import { eq } from "drizzle-orm";
import type { AtlasDb } from "@/db/client";
import { caseStudies, claims, dossierSections, investors, transactions } from "@/db/schema";
import { buildIndex, type CorpusDoc, type Index } from "@/ai/retrieval";

export async function loadCorpus(db: AtlasDb): Promise<CorpusDoc[]> {
  const [cl, inv, secs, txs, cases] = await Promise.all([
    db.select().from(claims).where(eq(claims.publishStatus, "published")),
    db.select().from(investors).where(eq(investors.publishStatus, "published")),
    db.select().from(dossierSections),
    db.select().from(transactions).where(eq(transactions.publishStatus, "published")),
    db.select().from(caseStudies).where(eq(caseStudies.publishStatus, "published")),
  ]);
  const invById = new Map(inv.map((i) => [i.id, i] as const));
  const docs: CorpusDoc[] = [];
  for (const c of cl) docs.push({ ref: `claim:${c.slug}`, kind: "claim", slug: c.slug, title: c.claimText.slice(0, 120), text: `${c.claimText}${c.researcherNotes ? ` Researcher note: ${c.researcherNotes}` : ""}`, href: `/evidence/claims/${c.slug}`, status: c.verificationStatus });
  for (const s of secs) { const i = invById.get(s.investorId); if (!i) continue; docs.push({ ref: `doc:section:${i.slug}-${s.division}`, kind: "section", slug: `${i.slug}-${s.division}`, title: `${i.fullName} — ${s.title}`, text: s.bodyMarkdown.replace(/\[\[claim:[a-z0-9-]+\]\]/g, ""), href: `/dossiers/${i.slug}#division-${s.division}`, status: s.evidenceConfidence }); }
  for (const t of txs) docs.push({ ref: `doc:transaction:${t.slug}`, kind: "transaction", slug: t.slug, title: t.name, text: [t.summary, t.rightsAcquired && `Rights acquired: ${t.rightsAcquired}`, t.verifiedOutcome && `Verified outcome: ${t.verifiedOutcome}`, t.openQuestions && `Open questions: ${t.openQuestions}`].filter(Boolean).join(" "), href: `/deals/${t.slug}` });
  for (const c of cases) docs.push({ ref: `doc:case:${c.slug}`, kind: "case", slug: c.slug, title: `${c.title} (${c.kind})`, text: `${c.summary} ${c.bodyMarkdown}`, href: `/lab/cases/${c.slug}`, status: c.kind === "fictional" ? "hypothetical" : null });
  return docs;
}

let cached: { at: number; index: Index } | null = null;
/** Short-lived in-process cache; the corpus changes only on seed or admin review. */
export async function corpusIndex(db: AtlasDb, ttlMs = 60_000): Promise<Index> {
  if (cached && Date.now() - cached.at < ttlMs) return cached.index;
  const index = buildIndex(await loadCorpus(db));
  cached = { at: Date.now(), index };
  return index;
}
export function resetCorpusCache() { cached = null; }
