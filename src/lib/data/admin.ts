import { desc, eq, sql } from "drizzle-orm";
import { queryRows, type AtlasDb } from "@/db/client";
import { auditEvents, claims, users, verificationReviews, type VerificationStatus } from "@/db/schema";

export async function listUsers(db: AtlasDb) {
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function reviewClaim(db: AtlasDb, reviewerId: string, claimId: string, toStatus: VerificationStatus, note: string | null) {
  const current = await db.query.claims.findFirst({ where: eq(claims.id, claimId) });
  if (!current) throw new Error("Claim not found");
  await db.insert(verificationReviews).values({ claimId, reviewerId, fromStatus: current.verificationStatus, toStatus, note });
  await db.update(claims).set({ verificationStatus: toStatus, lastReviewedAt: new Date(), lastReviewedBy: reviewerId, updatedAt: new Date() }).where(eq(claims.id, claimId));
  await db.insert(auditEvents).values({ actorUserId: reviewerId, action: "claim.reviewed", objectKind: "claim", objectId: claimId, metadata: { from: current.verificationStatus, to: toStatus } });
}

export interface PlatformStats { users: number; published_investors: number; total_investors: number; published_claims: number; claims_needing_review: number; sources: number; published_transactions: number; notes: number }

export async function platformStats(db: AtlasDb): Promise<PlatformStats> {
  const r = await queryRows<PlatformStats>(db, sql`
    select
      (select count(*)::int from users) as users,
      (select count(*)::int from investors where publish_status = 'published') as published_investors,
      (select count(*)::int from investors) as total_investors,
      (select count(*)::int from claims where publish_status = 'published') as published_claims,
      (select count(*)::int from claims where verification_status in ('unverified','contested')) as claims_needing_review,
      (select count(*)::int from sources) as sources,
      (select count(*)::int from transactions where publish_status = 'published') as published_transactions,
      (select count(*)::int from research_notes) as notes`);
  return r[0]!;
}

export async function recentAudit(db: AtlasDb, limit = 25) {
  return db.select({ e: auditEvents, actor: users.displayName }).from(auditEvents).leftJoin(users, eq(users.id, auditEvents.actorUserId)).orderBy(desc(auditEvents.createdAt)).limit(limit);
}
