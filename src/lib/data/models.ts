/**
 * Saved financial models (private, hypothetical by definition). Every function is scoped by userId.
 */
import { and, desc, eq } from "drizzle-orm";
import type { AtlasDb } from "@/db/client";
import { financialModels, modelVersions, researchProgress, transactions } from "@/db/schema";

export const MODEL_KINDS = ["underwriter", "debt", "capital_stack", "credit", "distressed", "waterfall", "stress"] as const;
export type ModelKind = (typeof MODEL_KINDS)[number];

export const MODEL_KIND_LABEL: Record<ModelKind, string> = {
  underwriter: "Acquisition Underwriter", debt: "Debt Structuring Lab", capital_stack: "Capital Stack Builder", credit: "Private Credit Underwriting",
  distressed: "Distressed Acquisition Simulator", waterfall: "Equity Waterfall Studio", stress: "Portfolio Stress Test",
};
export const MODEL_KIND_PATH: Record<ModelKind, string> = {
  underwriter: "/lab/underwriter", debt: "/lab/debt", capital_stack: "/lab/capital-stack", credit: "/lab/credit", distressed: "/lab/distressed", waterfall: "/lab/waterfall", stress: "/lab/stress",
};

export interface SaveModelInput { name: string; kind: ModelKind; assumptions: Record<string, unknown>; outputs?: Record<string, unknown>; transactionId?: string | null; modelId?: string | null; note?: string | null }

export async function saveModel(db: AtlasDb, userId: string, input: SaveModelInput) {
  if (input.modelId) {
    const existing = await db.query.financialModels.findFirst({ where: and(eq(financialModels.id, input.modelId), eq(financialModels.userId, userId)) });
    if (!existing) return null;
    const version = existing.version + 1;
    const [updated] = await db.update(financialModels).set({ name: input.name, assumptions: input.assumptions, outputs: input.outputs ?? {}, version, updatedAt: new Date() }).where(eq(financialModels.id, existing.id)).returning();
    await db.insert(modelVersions).values({ modelId: existing.id, version, assumptions: input.assumptions, outputs: input.outputs ?? {}, note: input.note ?? null });
    await db.insert(researchProgress).values({ userId, activityKind: "model.saved", objectKind: "financial_model", objectId: existing.id, metadata: { kind: input.kind, version } });
    return updated!;
  }
  const [created] = await db.insert(financialModels).values({ userId, name: input.name, modelKind: input.kind, transactionId: input.transactionId ?? null, isHypothetical: true, assumptions: input.assumptions, outputs: input.outputs ?? {}, version: 1 }).returning();
  await db.insert(modelVersions).values({ modelId: created!.id, version: 1, assumptions: input.assumptions, outputs: input.outputs ?? {}, note: input.note ?? null });
  await db.insert(researchProgress).values({ userId, activityKind: "model.saved", objectKind: "financial_model", objectId: created!.id, metadata: { kind: input.kind, version: 1 } });
  return created!;
}

export async function getModel(db: AtlasDb, userId: string, modelId: string) {
  return (await db.query.financialModels.findFirst({ where: and(eq(financialModels.id, modelId), eq(financialModels.userId, userId)) })) ?? null;
}

export async function listModels(db: AtlasDb, userId: string, kind?: ModelKind) {
  const conds = [eq(financialModels.userId, userId)];
  if (kind) conds.push(eq(financialModels.modelKind, kind));
  return db.select({ model: financialModels, transaction: transactions }).from(financialModels).leftJoin(transactions, eq(transactions.id, financialModels.transactionId)).where(and(...conds)).orderBy(desc(financialModels.updatedAt));
}

export async function listModelsForTransaction(db: AtlasDb, userId: string, transactionId: string) {
  return db.select().from(financialModels).where(and(eq(financialModels.userId, userId), eq(financialModels.transactionId, transactionId))).orderBy(desc(financialModels.updatedAt));
}

export async function listVersions(db: AtlasDb, userId: string, modelId: string) {
  const model = await getModel(db, userId, modelId);
  if (!model) return [];
  return db.select().from(modelVersions).where(eq(modelVersions.modelId, modelId)).orderBy(desc(modelVersions.version));
}

export async function deleteModel(db: AtlasDb, userId: string, modelId: string): Promise<boolean> {
  const deleted = await db.delete(financialModels).where(and(eq(financialModels.id, modelId), eq(financialModels.userId, userId))).returning({ id: financialModels.id });
  return deleted.length > 0;
}
