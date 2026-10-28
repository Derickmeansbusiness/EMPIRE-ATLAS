/**
 * Read access to published research (investors, dossiers, transactions, evidence).
 * Draft/in-review content is only returned when `includeDrafts` is true (admin paths).
 */
import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { queryRows, type AtlasDb } from "@/db/client";
import {
  capitalStackItems, claimSources, claims, dossierSections, historicalEvents, institutions, investors,
  quotations, relationships, sources, transactionParticipants, transactions,
  type Claim, type Source,
} from "@/db/schema";

export type ClaimWithSources = Claim & { sources: Array<{ source: Source; excerpt: string | null; locator: string | null; supports: boolean }> };

export async function listInvestors(db: AtlasDb, includeDrafts = false) {
  const rows = await db.select().from(investors)
    .where(includeDrafts ? undefined : eq(investors.publishStatus, "published"))
    .orderBy(asc(investors.roadmapRank), asc(investors.fullName));
  return rows;
}

export async function listInvestorRoadmap(db: AtlasDb) {
  return db.select().from(investors).orderBy(asc(investors.roadmapRank), asc(investors.fullName));
}

export async function getInvestorBySlug(db: AtlasDb, slug: string, includeDrafts = false) {
  const inv = await db.query.investors.findFirst({ where: eq(investors.slug, slug) });
  if (!inv) return null;
  if (!includeDrafts && inv.publishStatus !== "published") return null;
  return inv;
}

export async function getClaimsWithSources(db: AtlasDb, where: ReturnType<typeof eq> | ReturnType<typeof and> | undefined, includeDrafts = false): Promise<ClaimWithSources[]> {
  const claimRows = await db.select().from(claims)
    .where(includeDrafts ? where : and(where, eq(claims.publishStatus, "published")))
    .orderBy(asc(claims.eventDate), asc(claims.slug));
  if (claimRows.length === 0) return [];
  const links = await db.select({ link: claimSources, source: sources })
    .from(claimSources).innerJoin(sources, eq(sources.id, claimSources.sourceId))
    .where(inArray(claimSources.claimId, claimRows.map((c) => c.id)));
  const bySrc = new Map<string, ClaimWithSources["sources"]>();
  for (const { link, source } of links) {
    const arr = bySrc.get(link.claimId) ?? [];
    arr.push({ source, excerpt: link.excerpt, locator: link.locator, supports: link.supports });
    bySrc.set(link.claimId, arr);
  }
  return claimRows.map((c) => ({ ...c, sources: bySrc.get(c.id) ?? [] }));
}

export async function getDossier(db: AtlasDb, slug: string, includeDrafts = false) {
  const investor = await getInvestorBySlug(db, slug, includeDrafts);
  if (!investor) return null;
  const [sections, events, investorClaims, quotes, txs, rels] = await Promise.all([
    db.select().from(dossierSections).where(eq(dossierSections.investorId, investor.id)).orderBy(asc(dossierSections.division)),
    db.select().from(historicalEvents).where(eq(historicalEvents.investorId, investor.id)).orderBy(asc(historicalEvents.occurredOn), asc(historicalEvents.sortOrder)),
    getClaimsWithSources(db, eq(claims.investorId, investor.id), includeDrafts),
    db.select({ q: quotations, source: sources }).from(quotations).leftJoin(sources, eq(sources.id, quotations.sourceId)).where(eq(quotations.investorId, investor.id)),
    db.select().from(transactions).where(and(eq(transactions.leadInvestorId, investor.id), includeDrafts ? undefined : eq(transactions.publishStatus, "published"))).orderBy(asc(transactions.closedOn)),
    db.select({ rel: relationships, institution: institutions, claim: claims })
      .from(relationships)
      .leftJoin(institutions, or(eq(institutions.id, relationships.toInstitutionId), eq(institutions.id, relationships.fromInstitutionId)))
      .leftJoin(claims, eq(claims.id, relationships.claimId))
      .where(or(eq(relationships.fromInvestorId, investor.id), eq(relationships.toInvestorId, investor.id))),
  ]);
  const claimMap = new Map(investorClaims.map((c) => [c.slug, c] as const));
  const claimById = new Map(investorClaims.map((c) => [c.id, c] as const));
  return { investor, sections, events, claims: investorClaims, claimMap, claimById, quotes, transactions: txs, relationships: rels };
}

export async function listTransactions(db: AtlasDb, includeDrafts = false) {
  return db.select({ tx: transactions, investor: investors })
    .from(transactions)
    .leftJoin(investors, eq(investors.id, transactions.leadInvestorId))
    .where(includeDrafts ? undefined : eq(transactions.publishStatus, "published"))
    .orderBy(desc(transactions.closedOn));
}

export async function getTransaction(db: AtlasDb, slug: string, includeDrafts = false) {
  const tx = await db.query.transactions.findFirst({ where: eq(transactions.slug, slug) });
  if (!tx || (!includeDrafts && tx.publishStatus !== "published")) return null;
  const [investor, participants, stack, txClaims, events] = await Promise.all([
    tx.leadInvestorId ? db.query.investors.findFirst({ where: eq(investors.id, tx.leadInvestorId) }) : Promise.resolve(null),
    db.select({ p: transactionParticipants, investor: investors, institution: institutions })
      .from(transactionParticipants)
      .leftJoin(investors, eq(investors.id, transactionParticipants.investorId))
      .leftJoin(institutions, eq(institutions.id, transactionParticipants.institutionId))
      .where(eq(transactionParticipants.transactionId, tx.id)),
    db.select({ item: capitalStackItems, provider: institutions })
      .from(capitalStackItems).leftJoin(institutions, eq(institutions.id, capitalStackItems.providerInstitutionId))
      .where(eq(capitalStackItems.transactionId, tx.id)).orderBy(asc(capitalStackItems.side), asc(capitalStackItems.sortOrder)),
    getClaimsWithSources(db, eq(claims.transactionId, tx.id), includeDrafts),
    db.select().from(historicalEvents).where(eq(historicalEvents.transactionId, tx.id)).orderBy(asc(historicalEvents.occurredOn), asc(historicalEvents.sortOrder)),
  ]);
  return { tx, investor: investor ?? null, participants, stack, claims: txClaims, events };
}

export async function getClaimBySlug(db: AtlasDb, slug: string, includeDrafts = false) {
  const list = await getClaimsWithSources(db, eq(claims.slug, slug), includeDrafts);
  const claim = list[0];
  if (!claim) return null;
  const [investor, tx, reviews] = await Promise.all([
    claim.investorId ? db.query.investors.findFirst({ where: eq(investors.id, claim.investorId) }) : Promise.resolve(null),
    claim.transactionId ? db.query.transactions.findFirst({ where: eq(transactions.id, claim.transactionId) }) : Promise.resolve(null),
    queryRows<{ id: string; from_status: string | null; to_status: string; note: string | null; created_at: string; reviewer_name: string | null }>(db, sql`select vr.*, u.display_name as reviewer_name from verification_reviews vr left join users u on u.id = vr.reviewer_id where vr.claim_id = ${claim.id} order by vr.created_at desc`),
  ]);
  return { claim, investor: investor ?? null, transaction: tx ?? null, reviews };
}

export async function getClaimsByIds(db: AtlasDb, ids: string[]) {
  if (ids.length === 0) return [];
  return getClaimsWithSources(db, inArray(claims.id, ids), false);
}

export async function listSources(db: AtlasDb) {
  const rows = await queryRows<Record<string, unknown>>(db, sql`
    select s.id, s.slug, s.title, s.source_type as "sourceType", s.publisher, s.author, s.url, s.document_reference as "documentReference",
      s.published_on::text as "publishedOn", s.accessed_on::text as "accessedOn", s.licensing_note as "licensingNote", s.reliability_note as "reliabilityNote", s.created_at as "createdAt",
      (select count(*)::int from claim_sources cs where cs.source_id = s.id) as claim_count
    from sources s order by s.published_on asc nulls last, s.title asc`);
  return rows as unknown as Array<Source & { claim_count: number }>;
}

export async function getSourceBySlug(db: AtlasDb, slug: string) {
  const source = await db.query.sources.findFirst({ where: eq(sources.slug, slug) });
  if (!source) return null;
  const linked = await db.select({ claim: claims, link: claimSources, investor: investors })
    .from(claimSources).innerJoin(claims, eq(claims.id, claimSources.claimId))
    .leftJoin(investors, eq(investors.id, claims.investorId))
    .where(and(eq(claimSources.sourceId, source.id), eq(claims.publishStatus, "published")))
    .orderBy(asc(claims.eventDate));
  return { source, linked };
}

export async function evidenceSummary(db: AtlasDb) {
  const rows = await queryRows<{ status: string; n: number }>(db, sql`
    select verification_status as status, count(*)::int as n
    from claims where publish_status = 'published' group by verification_status`);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.status] = r.n;
  return out;
}

export async function listInstitutions(db: AtlasDb, includeDrafts = false) {
  return db.select().from(institutions).where(includeDrafts ? undefined : eq(institutions.publishStatus, "published")).orderBy(asc(institutions.name));
}
