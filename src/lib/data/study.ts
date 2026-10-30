/** Synthesis (principles, doctrine), ritual, quizzes and collections. All private and user-scoped. */
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { AtlasDb } from "@/db/client";
import {
  claims, collectionItems, investmentDoctrines, investmentPrinciples, investors, quizAttempts, researchCollections, researchNotes,
  researchProgress, ritualEntries, transactions, type LinkedObjectKind,
} from "@/db/schema";
import type { DoctrineKey } from "@/lib/doctrine";
import type { ExportPrinciple } from "@/lib/doctrine";
import { VERIFICATION_LABELS } from "@/lib/labels";

// ── principles ──
export interface PrincipleInput { title: string; statement: string; sourceInvestorId?: string | null; supportingTransactionId?: string | null; supportingClaimId?: string | null; relevantRisk?: string | null; modernApplication?: string | null; personalNotes?: string | null }

export async function savePrinciple(db: AtlasDb, userId: string, input: PrincipleInput, id?: string | null) {
  const values = { title: input.title, statement: input.statement, sourceInvestorId: input.sourceInvestorId ?? null, supportingTransactionId: input.supportingTransactionId ?? null, supportingClaimId: input.supportingClaimId ?? null, relevantRisk: input.relevantRisk ?? null, modernApplication: input.modernApplication ?? null, personalNotes: input.personalNotes ?? null };
  if (id) {
    const [row] = await db.update(investmentPrinciples).set({ ...values, updatedAt: new Date() }).where(and(eq(investmentPrinciples.id, id), eq(investmentPrinciples.userId, userId))).returning();
    return row ?? null;
  }
  const [row] = await db.insert(investmentPrinciples).values({ userId, ...values }).returning();
  await db.insert(researchProgress).values({ userId, activityKind: "principle.saved", metadata: { principleId: row!.id } });
  return row!;
}

export async function deletePrinciple(db: AtlasDb, userId: string, id: string) {
  return (await db.delete(investmentPrinciples).where(and(eq(investmentPrinciples.id, id), eq(investmentPrinciples.userId, userId))).returning({ id: investmentPrinciples.id })).length > 0;
}

export async function listPrinciples(db: AtlasDb, userId: string) {
  const rows = await db.select().from(investmentPrinciples).where(eq(investmentPrinciples.userId, userId)).orderBy(desc(investmentPrinciples.updatedAt));
  const invIds = rows.map((r) => r.sourceInvestorId).filter((x): x is string => !!x);
  const txIds = rows.map((r) => r.supportingTransactionId).filter((x): x is string => !!x);
  const clIds = rows.map((r) => r.supportingClaimId).filter((x): x is string => !!x);
  const [inv, tx, cl] = await Promise.all([
    invIds.length ? db.select().from(investors).where(inArray(investors.id, invIds)) : Promise.resolve([]),
    txIds.length ? db.select().from(transactions).where(inArray(transactions.id, txIds)) : Promise.resolve([]),
    clIds.length ? db.select().from(claims).where(inArray(claims.id, clIds)) : Promise.resolve([]),
  ]);
  const im = new Map(inv.map((x) => [x.id, x] as const)); const tm = new Map(tx.map((x) => [x.id, x] as const)); const cm = new Map(cl.map((x) => [x.id, x] as const));
  return rows.map((p) => ({ principle: p, investor: p.sourceInvestorId ? im.get(p.sourceInvestorId) ?? null : null, transaction: p.supportingTransactionId ? tm.get(p.supportingTransactionId) ?? null : null, claim: p.supportingClaimId ? cm.get(p.supportingClaimId) ?? null : null }));
}

export async function exportPrinciples(db: AtlasDb, userId: string): Promise<ExportPrinciple[]> {
  return (await listPrinciples(db, userId)).map(({ principle: p, investor, transaction, claim }) => ({ title: p.title, statement: p.statement, sourceInvestor: investor?.fullName ?? null, transaction: transaction?.name ?? null, claimText: claim?.claimText ?? null, claimStatus: claim ? VERIFICATION_LABELS[claim.verificationStatus] : null, relevantRisk: p.relevantRisk, modernApplication: p.modernApplication }));
}

// ── doctrine ──
export async function getDoctrine(db: AtlasDb, userId: string) {
  return (await db.query.investmentDoctrines.findFirst({ where: eq(investmentDoctrines.userId, userId) })) ?? null;
}

export async function saveDoctrine(db: AtlasDb, userId: string, values: Record<DoctrineKey, string>) {
  await db.insert(investmentDoctrines).values({ userId, ...values }).onConflictDoUpdate({ target: investmentDoctrines.userId, set: { ...values, updatedAt: new Date() } });
}

// ── ritual ──
export async function completeRitualDay(db: AtlasDb, userId: string, weekStart: string, day: number, journal: string) {
  await db.insert(ritualEntries).values({ userId, weekStart, day, journal }).onConflictDoUpdate({ target: [ritualEntries.userId, ritualEntries.weekStart, ritualEntries.day], set: { journal, completedAt: new Date() } });
  await db.insert(researchProgress).values({ userId, activityKind: "ritual.completed", metadata: { weekStart, day } });
}
export async function reopenRitualDay(db: AtlasDb, userId: string, weekStart: string, day: number) {
  await db.delete(ritualEntries).where(and(eq(ritualEntries.userId, userId), eq(ritualEntries.weekStart, weekStart), eq(ritualEntries.day, day)));
}
export async function ritualJournal(db: AtlasDb, userId: string, limit = 40) {
  return db.select().from(ritualEntries).where(eq(ritualEntries.userId, userId)).orderBy(desc(ritualEntries.weekStart), desc(ritualEntries.day)).limit(limit);
}
/** Activity recorded between two dates, to show the learner what they actually did that week. */
export async function activityBetween(db: AtlasDb, userId: string, from: Date, to: Date) {
  const rows = await db.select().from(researchProgress).where(eq(researchProgress.userId, userId)).orderBy(desc(researchProgress.createdAt)).limit(300);
  return rows.filter((r) => r.createdAt >= from && r.createdAt < to);
}

// ── quizzes ──
export async function recordQuizAttempt(db: AtlasDb, userId: string, quizSlug: string, answers: Record<string, string>, score: number, max: number, passed: boolean) {
  const [row] = await db.insert(quizAttempts).values({ userId, quizSlug, answers, score, maxScore: max, passed }).returning();
  await db.insert(researchProgress).values({ userId, activityKind: passed ? "quiz.passed" : "quiz.attempted", metadata: { quizSlug, score, max } });
  return row!;
}
export async function getQuizAttempt(db: AtlasDb, userId: string, id: string) {
  return (await db.query.quizAttempts.findFirst({ where: and(eq(quizAttempts.id, id), eq(quizAttempts.userId, userId)) })) ?? null;
}
export async function listQuizAttempts(db: AtlasDb, userId: string) {
  return db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId)).orderBy(desc(quizAttempts.createdAt));
}

// ── collections ──
export async function createCollection(db: AtlasDb, userId: string, name: string, kind: "folder" | "reading_list", description?: string | null) {
  const [row] = await db.insert(researchCollections).values({ userId, name, kind, description: description ?? null }).returning();
  return row!;
}
export async function listCollections(db: AtlasDb, userId: string) {
  return db.select().from(researchCollections).where(eq(researchCollections.userId, userId)).orderBy(asc(researchCollections.kind), asc(researchCollections.name));
}
export async function getCollection(db: AtlasDb, userId: string, id: string) {
  return (await db.query.researchCollections.findFirst({ where: and(eq(researchCollections.id, id), eq(researchCollections.userId, userId)) })) ?? null;
}
export async function deleteCollection(db: AtlasDb, userId: string, id: string) {
  return (await db.delete(researchCollections).where(and(eq(researchCollections.id, id), eq(researchCollections.userId, userId))).returning({ id: researchCollections.id })).length > 0;
}
export async function assignNoteToCollection(db: AtlasDb, userId: string, noteId: string, collectionId: string | null) {
  if (collectionId && !(await getCollection(db, userId, collectionId))) return false;
  const rows = await db.update(researchNotes).set({ collectionId, updatedAt: new Date() }).where(and(eq(researchNotes.id, noteId), eq(researchNotes.userId, userId))).returning({ id: researchNotes.id });
  return rows.length > 0;
}
export async function addToReadingList(db: AtlasDb, userId: string, collectionId: string, targetKind: LinkedObjectKind, targetId: string) {
  const c = await getCollection(db, userId, collectionId);
  if (!c || c.kind !== "reading_list") return false;
  const existing = await db.select().from(collectionItems).where(eq(collectionItems.collectionId, collectionId));
  await db.insert(collectionItems).values({ collectionId, targetKind, targetId, position: existing.length }).onConflictDoNothing();
  return true;
}
export async function removeFromReadingList(db: AtlasDb, userId: string, collectionId: string, itemId: string) {
  if (!(await getCollection(db, userId, collectionId))) return false;
  return (await db.delete(collectionItems).where(and(eq(collectionItems.id, itemId), eq(collectionItems.collectionId, collectionId))).returning({ id: collectionItems.id })).length > 0;
}
export async function collectionContents(db: AtlasDb, userId: string, collectionId: string) {
  const c = await getCollection(db, userId, collectionId);
  if (!c) return null;
  const [notes, items] = await Promise.all([
    db.select().from(researchNotes).where(and(eq(researchNotes.userId, userId), eq(researchNotes.collectionId, collectionId))).orderBy(desc(researchNotes.updatedAt)),
    db.select().from(collectionItems).where(eq(collectionItems.collectionId, collectionId)).orderBy(asc(collectionItems.position)),
  ]);
  const claimIds = items.filter((i) => i.targetKind === "claim").map((i) => i.targetId); const invIds = items.filter((i) => i.targetKind === "investor").map((i) => i.targetId); const txIds = items.filter((i) => i.targetKind === "transaction").map((i) => i.targetId);
  const [cl, inv, tx] = await Promise.all([
    claimIds.length ? db.select().from(claims).where(inArray(claims.id, claimIds)) : Promise.resolve([]),
    invIds.length ? db.select().from(investors).where(inArray(investors.id, invIds)) : Promise.resolve([]),
    txIds.length ? db.select().from(transactions).where(inArray(transactions.id, txIds)) : Promise.resolve([]),
  ]);
  const cm = new Map(cl.map((x) => [x.id, x] as const)); const im = new Map(inv.map((x) => [x.id, x] as const)); const tm = new Map(tx.map((x) => [x.id, x] as const));
  return { collection: c, notes, items: items.map((i) => ({ item: i, claim: cm.get(i.targetId) ?? null, investor: im.get(i.targetId) ?? null, transaction: tm.get(i.targetId) ?? null })) };
}

/** Markdown export of every note, grouped by folder, for the Research Library. */
export async function exportNotesMarkdown(db: AtlasDb, userId: string, author: string): Promise<string> {
  const [notes, collections] = await Promise.all([db.select().from(researchNotes).where(eq(researchNotes.userId, userId)).orderBy(asc(researchNotes.createdAt)), listCollections(db, userId)]);
  const byCol = new Map<string | null, typeof notes>();
  for (const n of notes) byCol.set(n.collectionId, [...(byCol.get(n.collectionId) ?? []), n]);
  const L: string[] = [`# Research notes — ${author}`, "", `Exported ${new Date().toISOString().slice(0, 10)} from Empire Atlas. ${notes.length} note${notes.length === 1 ? "" : "s"}.`, ""];
  const section = (title: string, list: typeof notes) => { if (!list.length) return; L.push(`## ${title}`, ""); for (const n of list) { L.push(`### ${n.title}`, "", `*Updated ${n.updatedAt.toISOString().slice(0, 10)}${n.tags.length ? ` · tags: ${n.tags.join(", ")}` : ""}${n.linkedKind ? ` · linked to ${n.linkedKind}` : ""}*`, "", n.body.trim() || "_(empty)_", ""); } };
  for (const c of collections.filter((x) => x.kind === "folder")) section(c.name, byCol.get(c.id) ?? []);
  section("Unfiled", byCol.get(null) ?? []);
  return L.join("\n");
}
