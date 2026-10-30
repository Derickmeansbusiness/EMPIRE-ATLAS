/**
 * Derives a learner's activity statistics from stored records (never from page views alone), then competency and
 * program status. Every query is scoped by userId.
 */
import { and, eq } from "drizzle-orm";
import { queryRows, type AtlasDb } from "@/db/client";
import { investmentDoctrines, profiles, programProgress, ritualEntries } from "@/db/schema";
import { sql } from "drizzle-orm";
import { CURRICULUM, weekStatuses, recommendedWeek, type ActivityStats, type WeekStatus } from "@/program/curriculum";
import { computeCompetency, type CompetencyResult, type CompetencyStats } from "@/lib/competency";
import { QUIZZES } from "@/quiz/bank";
import { filledCount } from "@/lib/doctrine";

export async function gatherStats(db: AtlasDb, userId: string): Promise<ActivityStats> {
  const [dossiers, deals, cases, models, sims, committee, quizzes, counts, activity, doctrine] = await Promise.all([
    queryRows<{ slug: string }>(db, sql`select distinct i.slug from research_progress rp join investors i on i.id = rp.object_id where rp.user_id = ${userId} and rp.activity_kind = 'dossier.opened'`),
    queryRows<{ slug: string }>(db, sql`select distinct t.slug from research_progress rp join transactions t on t.id = rp.object_id where rp.user_id = ${userId} and rp.activity_kind = 'transaction.opened'`),
    queryRows<{ slug: string }>(db, sql`select distinct c.slug from research_progress rp join case_studies c on c.id = rp.object_id where rp.user_id = ${userId} and rp.activity_kind = 'case.opened'`),
    queryRows<{ model_kind: string; n: number }>(db, sql`select model_kind, count(*)::int as n from financial_models where user_id = ${userId} group by model_kind`),
    queryRows<{ scenario_slug: string; best: number }>(db, sql`select scenario_slug, max((score->>'total')::int)::int as best from simulation_attempts where user_id = ${userId} and status = 'completed' group by scenario_slug`),
    queryRows<{ n: number; best: number | null; approved: boolean | null }>(db, sql`select count(*)::int as n, max(score)::int as best, bool_or(verdict = 'approved') as approved from investment_committee_submissions where user_id = ${userId}`),
    queryRows<{ quiz_slug: string }>(db, sql`select distinct quiz_slug from quiz_attempts where user_id = ${userId} and passed`),
    queryRows<{ principles: number; notes: number; ritual: number }>(db, sql`select (select count(*)::int from investment_principles where user_id = ${userId}) as principles, (select count(*)::int from research_notes where user_id = ${userId}) as notes, (select count(*)::int from ritual_entries where user_id = ${userId}) as ritual`),
    queryRows<{ activity_kind: string; n: number }>(db, sql`select activity_kind, count(*)::int as n from research_progress where user_id = ${userId} group by activity_kind`),
    db.query.investmentDoctrines.findFirst({ where: eq(investmentDoctrines.userId, userId) }),
  ]);
  const c = committee[0]!;
  let committeeBest: ActivityStats["committeeBest"] = null;
  if (c.n > 0 && c.best != null) {
    const v = await queryRows<{ verdict: string }>(db, sql`select verdict from investment_committee_submissions where user_id = ${userId} order by score desc, created_at desc limit 1`);
    committeeBest = { score: c.best, verdict: v[0]?.verdict ?? "resubmit" };
  }
  return {
    dossiersOpened: dossiers.map((r) => r.slug), transactionsOpened: deals.map((r) => r.slug), casesOpened: cases.map((r) => r.slug),
    modelKinds: Object.fromEntries(models.map((r) => [r.model_kind, r.n])), simulationBest: Object.fromEntries(sims.map((r) => [r.scenario_slug, r.best])),
    committeeCount: c.n, committeeBest, committeeApproved: c.approved === true, quizzesPassed: quizzes.map((r) => r.quiz_slug),
    principles: counts[0]!.principles, notes: counts[0]!.notes, ritualDays: counts[0]!.ritual,
    doctrineFieldsFilled: filledCount(doctrine ? { targetAssets: doctrine.targetAssets, geographicStrategy: doctrine.geographicStrategy, acquisitionCriteria: doctrine.acquisitionCriteria, financingCriteria: doctrine.financingCriteria, riskTolerance: doctrine.riskTolerance, capitalPartnerStrategy: doctrine.capitalPartnerStrategy, committeeStandards: doctrine.committeeStandards, exitStrategies: doctrine.exitStrategies } : null),
    activity: Object.fromEntries(activity.map((r) => [r.activity_kind, r.n])),
  };
}

export async function manualDone(db: AtlasDb, userId: string): Promise<Set<string>> {
  const rows = await db.select().from(programProgress).where(eq(programProgress.userId, userId));
  return new Set(rows.map((r) => `${r.week}:${r.taskKey}`));
}

export interface ProgramState { statuses: WeekStatus[]; weeksComplete: number; recommended: number | null; startedOn: string | null; stats: ActivityStats }

export async function programState(db: AtlasDb, userId: string, stats?: ActivityStats): Promise<ProgramState> {
  const s = stats ?? (await gatherStats(db, userId));
  const [manual, profile] = await Promise.all([manualDone(db, userId), db.query.profiles.findFirst({ where: eq(profiles.userId, userId) })]);
  const statuses = weekStatuses(s, manual);
  return { statuses, weeksComplete: statuses.filter((w) => w.complete).length, recommended: recommendedWeek(statuses), startedOn: profile?.programStartedOn ?? null, stats: s };
}

export function toCompetencyStats(s: ActivityStats, weeksComplete: number): CompetencyStats {
  return { quizzesPassed: s.quizzesPassed, allQuizSlugs: QUIZZES.map((q) => q.slug), modelKinds: Object.keys(s.modelKinds), notes: s.notes, simulationBest: s.simulationBest, committeeBest: s.committeeBest, committeeApproved: s.committeeApproved, principles: s.principles, doctrineFieldsFilled: s.doctrineFieldsFilled, programWeeksComplete: weeksComplete };
}

export async function competencyFor(db: AtlasDb, userId: string): Promise<{ competency: CompetencyResult; program: ProgramState }> {
  const program = await programState(db, userId);
  const competency = computeCompetency(toCompetencyStats(program.stats, program.weeksComplete));
  // Keep the profile's stored level in step so lists and cohort views can read it cheaply.
  await db.update(profiles).set({ competencyLevel: competency.level, updatedAt: new Date() }).where(and(eq(profiles.userId, userId), sql`${profiles.competencyLevel} <> ${competency.level}`));
  return { competency, program };
}

export async function startProgram(db: AtlasDb, userId: string): Promise<void> {
  await db.update(profiles).set({ programStartedOn: new Date().toISOString().slice(0, 10), updatedAt: new Date() }).where(eq(profiles.userId, userId));
}

export async function setTaskDone(db: AtlasDb, userId: string, week: number, taskKey: string, done: boolean, note?: string | null): Promise<boolean> {
  const w = CURRICULUM.find((x) => x.week === week); const t = w?.tasks.find((x) => x.key === taskKey);
  if (!w || !t || t.check.type !== "manual") return false; // auto tasks complete from activity only
  if (done) await db.insert(programProgress).values({ userId, week, taskKey, note: note ?? null }).onConflictDoUpdate({ target: [programProgress.userId, programProgress.week, programProgress.taskKey], set: { note: note ?? null, completedAt: new Date() } });
  else await db.delete(programProgress).where(and(eq(programProgress.userId, userId), eq(programProgress.week, week), eq(programProgress.taskKey, taskKey)));
  return true;
}

export async function ritualEntriesFor(db: AtlasDb, userId: string) {
  return db.select().from(ritualEntries).where(eq(ritualEntries.userId, userId));
}
