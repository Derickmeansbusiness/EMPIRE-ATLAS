import { and, desc, eq, gte, sql } from "drizzle-orm";
import { queryRows, type AtlasDb } from "@/db/client";
import { auditEvents, claims, memberships, organizations, users, verificationReviews, type VerificationStatus } from "@/db/schema";
import { isTier } from "@/lib/entitlements";
import { competencyFor } from "@/lib/data/progress";

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

// ── Phase 5: tiers, organisations, cohorts, analytics, AI usage ──
export async function setMembershipTier(db: AtlasDb, actorId: string, userId: string, tier: string): Promise<boolean> {
  if (!isTier(tier)) return false;
  const rows = await db.update(users).set({ membershipTier: tier, updatedAt: new Date() }).where(eq(users.id, userId)).returning({ id: users.id });
  if (!rows.length) return false;
  await db.insert(auditEvents).values({ actorUserId: actorId, action: "user.tier_changed", objectKind: "user", objectId: userId, metadata: { tier } });
  return true;
}

export function slugify(name: string): string { return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "organization"; }

export async function createOrganization(db: AtlasDb, actorId: string, name: string) {
  let slug = slugify(name); let n = 1;
  while (await db.query.organizations.findFirst({ where: eq(organizations.slug, slug) })) slug = `${slugify(name)}-${++n}`;
  const [org] = await db.insert(organizations).values({ name, slug, kind: "institution" }).returning();
  await db.insert(auditEvents).values({ actorUserId: actorId, action: "organization.created", objectKind: "organization", objectId: org!.id });
  return org!;
}

export async function addOrganizationMember(db: AtlasDb, actorId: string, organizationId: string, email: string, roleInOrg: "member" | "instructor" = "member"): Promise<"added" | "no_user" | "exists"> {
  const user = await db.query.users.findFirst({ where: eq(users.emailNormalized, email.trim().toLowerCase()) });
  if (!user) return "no_user";
  const existing = await db.query.memberships.findFirst({ where: and(eq(memberships.userId, user.id), eq(memberships.organizationId, organizationId)) });
  if (existing) return "exists";
  await db.insert(memberships).values({ userId: user.id, organizationId, tier: "institutional", roleInOrg });
  await db.insert(auditEvents).values({ actorUserId: actorId, action: "organization.member_added", objectKind: "organization", objectId: organizationId, metadata: { userId: user.id, roleInOrg } });
  return "added";
}

export async function listOrganizations(db: AtlasDb) {
  return queryRows<{ id: string; name: string; slug: string; members: number }>(db, sql`select o.id, o.name, o.slug, (select count(*)::int from memberships m where m.organization_id = o.id) as members from organizations o order by o.name`);
}

export async function cohortSummary(db: AtlasDb, organizationId: string) {
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, organizationId) });
  if (!org) return null;
  const rows = await db.select({ m: memberships, u: users }).from(memberships).innerJoin(users, eq(users.id, memberships.userId)).where(eq(memberships.organizationId, organizationId));
  const members = [];
  for (const { m, u } of rows) {
    const { competency, program } = await competencyFor(db, u.id);
    members.push({ userId: u.id, name: u.displayName, email: u.email, roleInOrg: m.roleInOrg, level: competency.label, levelIndex: competency.index, weeksComplete: program.weeksComplete, quizzesPassed: program.stats.quizzesPassed.length, simulations: Object.keys(program.stats.simulationBest).length, committeeBest: program.stats.committeeBest?.score ?? null });
  }
  return { organization: org, members };
}

export interface Analytics {
  usersByRole: Array<{ role: string; n: number }>; usersByTier: Array<{ tier: string; n: number }>; active7: number; active30: number;
  activity30: Array<{ kind: string; n: number }>; quizzes: Array<{ slug: string; attempts: number; passed: number; avgPercent: number }>;
  simulations: Array<{ slug: string; completed: number; avgScore: number }>; committee: Array<{ verdict: string; n: number; avgScore: number }>;
  topDossiers: Array<{ name: string; opens: number }>; claimsByStatus: Array<{ status: string; n: number }>; programStarted: number; ritualDays30: number; historianQueries30: number;
}

export async function platformAnalytics(db: AtlasDb): Promise<Analytics> {
  const [usersByRole, usersByTier, active, activity30, quizzes, sims, committee, top, claimsByStatus, program, ritual, hist] = await Promise.all([
    queryRows<{ role: string; n: number }>(db, sql`select role::text as role, count(*)::int as n from users group by role order by n desc`),
    queryRows<{ tier: string; n: number }>(db, sql`select membership_tier as tier, count(*)::int as n from users group by membership_tier order by n desc`),
    queryRows<{ d7: number; d30: number }>(db, sql`select count(distinct user_id) filter (where created_at > now() - interval '7 days')::int as d7, count(distinct user_id) filter (where created_at > now() - interval '30 days')::int as d30 from research_progress`),
    queryRows<{ kind: string; n: number }>(db, sql`select activity_kind as kind, count(*)::int as n from research_progress where created_at > now() - interval '30 days' group by activity_kind order by n desc limit 15`),
    queryRows<{ slug: string; attempts: number; passed: number; avgp: number }>(db, sql`select quiz_slug as slug, count(*)::int as attempts, count(*) filter (where passed)::int as passed, coalesce(round(avg(score::numeric / nullif(max_score, 0) * 100)), 0)::int as avgp from quiz_attempts group by quiz_slug order by quiz_slug`),
    queryRows<{ slug: string; completed: number; avgs: number }>(db, sql`select scenario_slug as slug, count(*)::int as completed, coalesce(round(avg((score->>'total')::int)), 0)::int as avgs from simulation_attempts where status = 'completed' group by scenario_slug order by scenario_slug`),
    queryRows<{ verdict: string; n: number; avgs: number }>(db, sql`select verdict::text as verdict, count(*)::int as n, coalesce(round(avg(score)), 0)::int as avgs from investment_committee_submissions group by verdict order by n desc`),
    queryRows<{ name: string; opens: number }>(db, sql`select i.full_name as name, count(*)::int as opens from research_progress rp join investors i on i.id = rp.object_id where rp.activity_kind = 'dossier.opened' group by i.full_name order by opens desc limit 5`),
    queryRows<{ status: string; n: number }>(db, sql`select verification_status::text as status, count(*)::int as n from claims where publish_status = 'published' group by verification_status order by n desc`),
    queryRows<{ n: number }>(db, sql`select count(*)::int as n from profiles where program_started_on is not null`),
    queryRows<{ n: number }>(db, sql`select count(*)::int as n from ritual_entries where completed_at > now() - interval '30 days'`),
    queryRows<{ n: number }>(db, sql`select count(*)::int as n from audit_events where action = 'historian.query' and created_at > now() - interval '30 days'`),
  ]);
  return {
    usersByRole: usersByRole, usersByTier, active7: active[0]?.d7 ?? 0, active30: active[0]?.d30 ?? 0, activity30,
    quizzes: quizzes.map((q) => ({ slug: q.slug, attempts: q.attempts, passed: q.passed, avgPercent: q.avgp })), simulations: sims.map((s) => ({ slug: s.slug, completed: s.completed, avgScore: s.avgs })),
    committee: committee.map((c) => ({ verdict: c.verdict, n: c.n, avgScore: c.avgs })), topDossiers: top, claimsByStatus, programStarted: program[0]?.n ?? 0, ritualDays30: ritual[0]?.n ?? 0, historianQueries30: hist[0]?.n ?? 0,
  };
}

/** Number of historian queries the user has made in the last 24 hours (for the daily limit). */
export async function historianUsage24h(db: AtlasDb, userId: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const rows = await db.select({ id: auditEvents.id }).from(auditEvents).where(and(eq(auditEvents.actorUserId, userId), eq(auditEvents.action, "historian.query"), gte(auditEvents.createdAt, since)));
  return rows.length;
}
export async function recordHistorianQuery(db: AtlasDb, userId: string, meta: { role: string; retrieved: number; usedModel: boolean }) {
  // Only model calls count toward the daily limit; retrieval-only searches are logged separately.
  await db.insert(auditEvents).values({ actorUserId: userId, action: meta.usedModel ? "historian.query" : "historian.search", objectKind: "historian", metadata: meta });
}
