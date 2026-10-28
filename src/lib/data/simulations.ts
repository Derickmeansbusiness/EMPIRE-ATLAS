/**
 * Simulation attempts and investment committee submissions (private, user-scoped).
 */
import { and, desc, eq } from "drizzle-orm";
import type { AtlasDb } from "@/db/client";
import { financialModels, investmentCommitteeSubmissions, researchProgress, simulationAttempts } from "@/db/schema";
import { debrief, getScenario, isComplete, nextStage, type AttemptRecord } from "@/simulation";
import { evaluateSubmission, type CommitteeSubmission } from "@/simulation/committee";
import type { UnderwritingAssumptions } from "@/finance/underwriting";
import { parseAssumptions } from "@/components/lab/underwriter-tool";

export async function startAttempt(db: AtlasDb, userId: string, scenarioSlug: string) {
  if (!getScenario(scenarioSlug)) throw new Error("Unknown scenario");
  const [row] = await db.insert(simulationAttempts).values({ userId, scenarioSlug, choices: [] }).returning();
  await db.insert(researchProgress).values({ userId, activityKind: "simulation.started", metadata: { scenarioSlug, attemptId: row!.id } });
  return row!;
}

export async function getAttempt(db: AtlasDb, userId: string, attemptId: string) {
  return (await db.query.simulationAttempts.findFirst({ where: and(eq(simulationAttempts.id, attemptId), eq(simulationAttempts.userId, userId)) })) ?? null;
}

export async function currentAttempt(db: AtlasDb, userId: string, scenarioSlug: string) {
  return (await db.query.simulationAttempts.findFirst({ where: and(eq(simulationAttempts.userId, userId), eq(simulationAttempts.scenarioSlug, scenarioSlug), eq(simulationAttempts.status, "in_progress")), orderBy: desc(simulationAttempts.updatedAt) })) ?? null;
}

export async function listAttempts(db: AtlasDb, userId: string) {
  return db.select().from(simulationAttempts).where(eq(simulationAttempts.userId, userId)).orderBy(desc(simulationAttempts.updatedAt));
}

/** Records a choice for the attempt's current stage. Completes the attempt (scoring it) when no stage remains. */
export async function recordChoice(db: AtlasDb, userId: string, attemptId: string, stageKey: string, optionKey: string): Promise<{ completed: boolean } | null> {
  const attempt = await getAttempt(db, userId, attemptId);
  if (!attempt || attempt.status !== "in_progress") return null;
  const scenario = getScenario(attempt.scenarioSlug);
  if (!scenario) return null;
  const record: AttemptRecord = { choices: attempt.choices as AttemptRecord["choices"] };
  const stage = nextStage(scenario, record);
  if (!stage || stage.key !== stageKey) throw new Error("Stage mismatch: the attempt has moved on.");
  if (!stage.options.some((o) => o.key === optionKey)) throw new Error("Unknown option.");
  const choices = [...record.choices, { stageKey, optionKey }];
  const next: AttemptRecord = { choices };
  const completed = isComplete(scenario, next);
  if (completed) {
    const d = debrief(scenario, next);
    await db.update(simulationAttempts).set({ choices, status: "completed", score: d.score, finalState: d.finalState, completedAt: new Date(), updatedAt: new Date() }).where(eq(simulationAttempts.id, attemptId));
    await db.insert(researchProgress).values({ userId, activityKind: "simulation.completed", metadata: { scenarioSlug: scenario.slug, attemptId, score: d.score.total } });
  } else {
    await db.update(simulationAttempts).set({ choices, updatedAt: new Date() }).where(eq(simulationAttempts.id, attemptId));
  }
  return { completed };
}

export interface CreateSubmissionInput extends Omit<CommitteeSubmission, "model" | "citedClaims"> { modelId?: string | null }

export async function createSubmission(db: AtlasDb, userId: string, input: CreateSubmissionInput) {
  let model: UnderwritingAssumptions | null = null; let modelId: string | null = null;
  if (input.modelId) {
    const m = await db.query.financialModels.findFirst({ where: and(eq(financialModels.id, input.modelId), eq(financialModels.userId, userId)) });
    if (m && (m.modelKind === "underwriter" || m.modelKind === "stress")) {
      const saved = m.assumptions as Record<string, unknown>;
      const sp: Record<string, string> = {}; for (const [k, v] of Object.entries(saved)) if (v != null && typeof v !== "object") sp[k] = String(v);
      model = parseAssumptions(sp).assumptions; modelId = m.id;
    }
  }
  const citedClaims = Array.from(new Set(Array.from(`${input.thesis}\n${input.assumptionsNarrative}`.matchAll(/\[\[claim:([a-z0-9-]+)\]\]/g)).map((m) => m[1]!)));
  const evaluation = evaluateSubmission({ ...input, model, citedClaims });
  const [row] = await db.insert(investmentCommitteeSubmissions).values({
    userId, title: input.title, thesis: input.thesis, assetDetails: input.assetDetails, sourcesAndUses: input.sourcesAndUses, assumptionsNarrative: input.assumptionsNarrative,
    capitalStack: input.capitalStack, risks: input.risks, sensitivity: input.sensitivity, exitStrategy: input.exitStrategy, recommendation: input.recommendation,
    modelId, modelSnapshot: model, evaluation: { total: evaluation.total, verdict: evaluation.verdict, dimensions: evaluation.dimensions }, memoMarkdown: evaluation.memo, score: evaluation.total, verdict: evaluation.verdict,
  }).returning();
  await db.insert(researchProgress).values({ userId, activityKind: "committee.submitted", metadata: { submissionId: row!.id, score: evaluation.total, verdict: evaluation.verdict } });
  return row!;
}

export async function getSubmission(db: AtlasDb, userId: string, id: string) {
  return (await db.query.investmentCommitteeSubmissions.findFirst({ where: and(eq(investmentCommitteeSubmissions.id, id), eq(investmentCommitteeSubmissions.userId, userId)) })) ?? null;
}

export async function listSubmissions(db: AtlasDb, userId: string) {
  return db.select().from(investmentCommitteeSubmissions).where(eq(investmentCommitteeSubmissions.userId, userId)).orderBy(desc(investmentCommitteeSubmissions.createdAt));
}

export async function simulationSummary(db: AtlasDb, userId: string) {
  const [attempts, subs] = await Promise.all([listAttempts(db, userId), listSubmissions(db, userId)]);
  const completed = attempts.filter((a) => a.status === "completed");
  const best = completed.reduce<number | null>((b, a) => { const t = (a.score as { total?: number } | null)?.total ?? null; return t == null ? b : b == null ? t : Math.max(b, t); }, null);
  return { attempts: attempts.length, completed: completed.length, inProgress: attempts.length - completed.length, bestScore: best, submissions: subs.length, bestVerdict: subs[0]?.verdict ?? null };
}
