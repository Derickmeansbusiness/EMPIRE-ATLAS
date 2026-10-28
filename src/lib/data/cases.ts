import { asc, eq } from "drizzle-orm";
import type { AtlasDb } from "@/db/client";
import { caseStudies, investors, transactions } from "@/db/schema";

export async function listCaseStudies(db: AtlasDb, includeDrafts = false) {
  return db.select().from(caseStudies).where(includeDrafts ? undefined : eq(caseStudies.publishStatus, "published")).orderBy(asc(caseStudies.title));
}

export async function getCaseStudy(db: AtlasDb, slug: string, includeDrafts = false) {
  const c = await db.query.caseStudies.findFirst({ where: eq(caseStudies.slug, slug) });
  if (!c || (!includeDrafts && c.publishStatus !== "published")) return null;
  const [investor, transaction] = await Promise.all([
    c.investorId ? db.query.investors.findFirst({ where: eq(investors.id, c.investorId) }) : Promise.resolve(null),
    c.transactionId ? db.query.transactions.findFirst({ where: eq(transactions.id, c.transactionId) }) : Promise.resolve(null),
  ]);
  return { caseStudy: c, investor: investor ?? null, transaction: transaction ?? null };
}
