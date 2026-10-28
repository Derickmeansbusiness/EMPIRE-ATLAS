/**
 * Private user work: notes, bookmarks, progress. Every query is scoped by userId —
 * callers must pass the authenticated user's id, never a client-supplied one.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { queryRows, type AtlasDb } from "@/db/client";
import {
  bookmarks, claims, investors, researchNotes, researchProgress, transactions,
  type LinkedObjectKind,
} from "@/db/schema";

export interface NoteInput {
  title: string;
  body: string;
  tags?: string[];
  linkedKind?: LinkedObjectKind | null;
  linkedId?: string | null;
}

export async function createNote(db: AtlasDb, userId: string, input: NoteInput) {
  const [note] = await db.insert(researchNotes).values({
    userId,
    title: input.title,
    body: input.body,
    tags: input.tags ?? [],
    linkedKind: input.linkedKind ?? null,
    linkedId: input.linkedId ?? null,
  }).returning();
  await db.insert(researchProgress).values({ userId, activityKind: "note.created", objectKind: input.linkedKind ?? null, objectId: input.linkedId ?? null, metadata: { noteId: note!.id } });
  return note!;
}

export async function updateNote(db: AtlasDb, userId: string, noteId: string, input: Partial<NoteInput>) {
  const [note] = await db.update(researchNotes)
    .set({ ...(input.title !== undefined ? { title: input.title } : {}), ...(input.body !== undefined ? { body: input.body } : {}), ...(input.tags !== undefined ? { tags: input.tags } : {}), updatedAt: new Date() })
    .where(and(eq(researchNotes.id, noteId), eq(researchNotes.userId, userId)))
    .returning();
  return note ?? null;
}

export async function deleteNote(db: AtlasDb, userId: string, noteId: string) {
  const deleted = await db.delete(researchNotes).where(and(eq(researchNotes.id, noteId), eq(researchNotes.userId, userId))).returning({ id: researchNotes.id });
  return deleted.length > 0;
}

export async function listNotes(db: AtlasDb, userId: string, opts: { linkedKind?: LinkedObjectKind; linkedId?: string; limit?: number } = {}) {
  const conds = [eq(researchNotes.userId, userId)];
  if (opts.linkedKind && opts.linkedId) conds.push(eq(researchNotes.linkedKind, opts.linkedKind), eq(researchNotes.linkedId, opts.linkedId));
  return db.select().from(researchNotes).where(and(...conds)).orderBy(desc(researchNotes.updatedAt)).limit(opts.limit ?? 200);
}

export async function getNote(db: AtlasDb, userId: string, noteId: string) {
  return (await db.query.researchNotes.findFirst({ where: and(eq(researchNotes.id, noteId), eq(researchNotes.userId, userId)) })) ?? null;
}

export async function toggleBookmark(db: AtlasDb, userId: string, targetKind: LinkedObjectKind, targetId: string): Promise<{ bookmarked: boolean }> {
  const existing = await db.query.bookmarks.findFirst({ where: and(eq(bookmarks.userId, userId), eq(bookmarks.targetKind, targetKind), eq(bookmarks.targetId, targetId)) });
  if (existing) {
    await db.delete(bookmarks).where(eq(bookmarks.id, existing.id));
    return { bookmarked: false };
  }
  await db.insert(bookmarks).values({ userId, targetKind, targetId });
  await db.insert(researchProgress).values({ userId, activityKind: "bookmark.created", objectKind: targetKind, objectId: targetId });
  return { bookmarked: true };
}

export async function listBookmarks(db: AtlasDb, userId: string) {
  const rows = await db.select().from(bookmarks).where(eq(bookmarks.userId, userId)).orderBy(desc(bookmarks.createdAt));
  const claimIds = rows.filter((b) => b.targetKind === "claim").map((b) => b.targetId);
  const investorIds = rows.filter((b) => b.targetKind === "investor").map((b) => b.targetId);
  const txIds = rows.filter((b) => b.targetKind === "transaction").map((b) => b.targetId);
  const [claimRows, investorRows, txRows] = await Promise.all([
    claimIds.length ? db.select().from(claims).where(inArray(claims.id, claimIds)) : Promise.resolve([]),
    investorIds.length ? db.select().from(investors).where(inArray(investors.id, investorIds)) : Promise.resolve([]),
    txIds.length ? db.select().from(transactions).where(inArray(transactions.id, txIds)) : Promise.resolve([]),
  ]);
  const claimMap = new Map(claimRows.map((c) => [c.id, c]));
  const invMap = new Map(investorRows.map((i) => [i.id, i]));
  const txMap = new Map(txRows.map((t) => [t.id, t]));
  return rows.map((b) => ({
    bookmark: b,
    claim: b.targetKind === "claim" ? claimMap.get(b.targetId) ?? null : null,
    investor: b.targetKind === "investor" ? invMap.get(b.targetId) ?? null : null,
    transaction: b.targetKind === "transaction" ? txMap.get(b.targetId) ?? null : null,
  }));
}

export async function bookmarkedIds(db: AtlasDb, userId: string, targetKind: LinkedObjectKind): Promise<Set<string>> {
  const rows = await db.select({ id: bookmarks.targetId }).from(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.targetKind, targetKind)));
  return new Set(rows.map((r) => r.id));
}

export async function recordProgress(db: AtlasDb, userId: string, activityKind: string, objectKind?: LinkedObjectKind, objectId?: string, metadata: Record<string, unknown> = {}) {
  await db.insert(researchProgress).values({ userId, activityKind, objectKind: objectKind ?? null, objectId: objectId ?? null, metadata });
}

export async function workspaceSummary(db: AtlasDb, userId: string) {
  type Summary = { notes: number; bookmarks: number; models: number; principles: number; dossiers_opened: number; transactions_opened: number; last_activity: string | null };
  const r = await queryRows<Summary>(db, sql`
    select
      (select count(*)::int from research_notes where user_id = ${userId}) as notes,
      (select count(*)::int from bookmarks where user_id = ${userId}) as bookmarks,
      (select count(*)::int from financial_models where user_id = ${userId}) as models,
      (select count(*)::int from investment_principles where user_id = ${userId}) as principles,
      (select count(distinct object_id)::int from research_progress where user_id = ${userId} and activity_kind = 'dossier.opened') as dossiers_opened,
      (select count(distinct object_id)::int from research_progress where user_id = ${userId} and activity_kind = 'transaction.opened') as transactions_opened,
      (select max(created_at) from research_progress where user_id = ${userId}) as last_activity`);
  return r[0]!;
}

export async function recentActivity(db: AtlasDb, userId: string, limit = 8) {
  return db.select().from(researchProgress).where(eq(researchProgress.userId, userId)).orderBy(desc(researchProgress.createdAt)).limit(limit);
}
