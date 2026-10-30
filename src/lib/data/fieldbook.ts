/** The Investor's Fieldbook data access. Platform rows have user_id NULL; every private query is scoped by userId. */
import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import type { AtlasDb } from "@/db/client";
import {
  analysisStatements, challengeAttempts, fieldbookReports, findingRevisions, findings, followUpActions, inspectionItems, inspectionMedia, inspectionSessions,
  practiceExercises, properties, quoteAnalyses, researchProgress, sourcePassages, type ItemRating, type Severity,
} from "@/db/schema";
import { createNote } from "@/lib/data/workspace";
import { allItems, getTemplate, templateForClass } from "@/fieldbook/templates";
import type { FindingLike } from "@/fieldbook/reconcile";
import type { ReportSnapshot } from "@/fieldbook/report";

const num = (v: string | null): number | null => (v == null ? null : Number(v));
async function progress(db: AtlasDb, userId: string, kind: string, metadata: Record<string, unknown> = {}) { await db.insert(researchProgress).values({ userId, activityKind: kind, metadata }); }

// ── passages ──
export async function getPassageBySlug(db: AtlasDb, slug: string) {
  const passage = await db.query.sourcePassages.findFirst({ where: and(eq(sourcePassages.slug, slug), isNull(sourcePassages.userId)) });
  if (!passage) return null;
  const analysis = await db.query.quoteAnalyses.findFirst({ where: and(eq(quoteAnalyses.passageId, passage.id), isNull(quoteAnalyses.userId)) });
  const statements = analysis ? await db.select().from(analysisStatements).where(eq(analysisStatements.analysisId, analysis.id)).orderBy(asc(analysisStatements.dimension), asc(analysisStatements.position)) : [];
  const exercises = await db.select().from(practiceExercises).where(eq(practiceExercises.passageId, passage.id)).orderBy(asc(practiceExercises.position));
  return { passage, statements, exercises };
}

export interface PassageInput { sourceTitle: string; author: string; sourceKind: string; publishedLabel?: string | null; edition?: string | null; location?: string | null; sourceUrl?: string | null; excerpt?: string | null; userNotes?: string | null; isFirstPerson: boolean }
export async function createPassage(db: AtlasDb, userId: string, input: PassageInput) {
  const [row] = await db.insert(sourcePassages).values({ userId, sourceTitle: input.sourceTitle, author: input.author, sourceKind: input.sourceKind, publishedLabel: input.publishedLabel ?? null, edition: input.edition ?? null, location: input.location ?? null, sourceUrl: input.sourceUrl ?? null, excerpt: input.excerpt ?? null, userNotes: input.userNotes ?? null, isFirstPerson: input.isFirstPerson }).returning();
  await progress(db, userId, "passage.added", { passageId: row!.id });
  return row!;
}
export const listMyPassages = (db: AtlasDb, userId: string) => db.select().from(sourcePassages).where(eq(sourcePassages.userId, userId)).orderBy(desc(sourcePassages.createdAt));
export async function getMyPassage(db: AtlasDb, userId: string, id: string) {
  return (await db.query.sourcePassages.findFirst({ where: and(eq(sourcePassages.id, id), eq(sourcePassages.userId, userId)) })) ?? null;
}
export async function deleteMyPassage(db: AtlasDb, userId: string, id: string) {
  return (await db.delete(sourcePassages).where(and(eq(sourcePassages.id, id), eq(sourcePassages.userId, userId))).returning({ id: sourcePassages.id })).length > 0;
}

// ── properties ──
export async function getProperty(db: AtlasDb, userId: string, slug: string) {
  return (await db.query.properties.findFirst({ where: and(eq(properties.slug, slug), or(isNull(properties.userId), eq(properties.userId, userId))) })) ?? null;
}

// ── inspection sessions ──
export async function startOrResumeSession(db: AtlasDb, userId: string, propertyId: string, assetClass: Parameters<typeof templateForClass>[0], opts: { forceNew?: boolean } = {}) {
  if (!opts.forceNew) {
    const draft = await db.query.inspectionSessions.findFirst({ where: and(eq(inspectionSessions.userId, userId), eq(inspectionSessions.propertyId, propertyId), eq(inspectionSessions.status, "draft")), orderBy: desc(inspectionSessions.startedAt) });
    if (draft) return draft;
  }
  const t = templateForClass(assetClass);
  const [row] = await db.insert(inspectionSessions).values({ userId, propertyId, templateSlug: t.slug }).returning();
  await progress(db, userId, "walk.started", { sessionId: row!.id, propertyId });
  return row!;
}
export const listSessions = (db: AtlasDb, userId: string, propertyId: string) => db.select().from(inspectionSessions).where(and(eq(inspectionSessions.userId, userId), eq(inspectionSessions.propertyId, propertyId))).orderBy(desc(inspectionSessions.startedAt));

export async function getSession(db: AtlasDb, userId: string, sessionId: string) {
  const session = await db.query.inspectionSessions.findFirst({ where: and(eq(inspectionSessions.id, sessionId), eq(inspectionSessions.userId, userId)) });
  if (!session) return null;
  const [items, fs, followUps, media] = await Promise.all([
    db.select().from(inspectionItems).where(eq(inspectionItems.sessionId, sessionId)),
    listFindings(db, userId, sessionId),
    db.select().from(followUpActions).where(and(eq(followUpActions.sessionId, sessionId), eq(followUpActions.userId, userId))).orderBy(asc(followUpActions.createdAt)),
    db.select({ id: inspectionMedia.id, findingId: inspectionMedia.findingId, caption: inspectionMedia.caption, byteSize: inspectionMedia.byteSize, createdAt: inspectionMedia.createdAt }).from(inspectionMedia).where(and(eq(inspectionMedia.sessionId, sessionId), eq(inspectionMedia.userId, userId))),
  ]);
  return { session, items, findings: fs, followUps, media };
}

/** Save one checklist response. Rejects unknown items and completed sessions. Returns false if the session is not the user's or is locked. */
export async function saveItem(db: AtlasDb, userId: string, sessionId: string, itemKey: string, rating: ItemRating, note: string | null): Promise<boolean> {
  const session = await db.query.inspectionSessions.findFirst({ where: and(eq(inspectionSessions.id, sessionId), eq(inspectionSessions.userId, userId)) });
  if (!session || session.status !== "draft") return false;
  const t = getTemplate(session.templateSlug); if (!t || !allItems(t).some((i) => i.key === itemKey)) return false;
  await db.insert(inspectionItems).values({ sessionId, itemKey, rating, note: note || null }).onConflictDoUpdate({ target: [inspectionItems.sessionId, inspectionItems.itemKey], set: { rating, note: note || null, observedAt: new Date() } });
  await db.update(inspectionSessions).set({ updatedAt: new Date() }).where(eq(inspectionSessions.id, sessionId));
  return true;
}

export async function setSessionLocation(db: AtlasDb, userId: string, sessionId: string, loc: { lat: number; lng: number; accuracy: number | null }): Promise<boolean> {
  const rows = await db.update(inspectionSessions).set({ location: { ...loc, capturedAt: new Date().toISOString() }, updatedAt: new Date() }).where(and(eq(inspectionSessions.id, sessionId), eq(inspectionSessions.userId, userId), eq(inspectionSessions.status, "draft"))).returning({ id: inspectionSessions.id });
  return rows.length > 0;
}
export async function clearSessionLocation(db: AtlasDb, userId: string, sessionId: string) {
  await db.update(inspectionSessions).set({ location: null }).where(and(eq(inspectionSessions.id, sessionId), eq(inspectionSessions.userId, userId)));
}

export async function completeSession(db: AtlasDb, userId: string, sessionId: string, summaryNote: string | null): Promise<boolean> {
  const rows = await db.update(inspectionSessions).set({ status: "completed", completedAt: new Date(), summaryNote, updatedAt: new Date() }).where(and(eq(inspectionSessions.id, sessionId), eq(inspectionSessions.userId, userId), eq(inspectionSessions.status, "draft"))).returning();
  if (!rows.length) return false;
  await progress(db, userId, "walk.completed", { sessionId });
  return true;
}
export async function reopenSession(db: AtlasDb, userId: string, sessionId: string) {
  return (await db.update(inspectionSessions).set({ status: "draft", completedAt: null, updatedAt: new Date() }).where(and(eq(inspectionSessions.id, sessionId), eq(inspectionSessions.userId, userId))).returning({ id: inspectionSessions.id })).length > 0;
}

// ── findings ──
export interface FindingInput { itemKey?: string | null; locationLabel: string; component: string; description: string; condition: "good" | "fair" | "poor" | "unknown"; severity: Severity; confidence: "low" | "medium" | "high"; financialImpact?: string | null; specialistNeeded?: string | null; followUpStatus?: "open" | "in_progress" | "resolved" | "wont_fix"; costLow?: number | null; costHigh?: number | null; costSource?: string | null; resolution?: string | null }

export async function listFindings(db: AtlasDb, userId: string, sessionId: string) {
  const rows = await db.select().from(findings).where(and(eq(findings.sessionId, sessionId), eq(findings.userId, userId))).orderBy(asc(findings.createdAt));
  const photos = rows.length ? await db.select({ findingId: inspectionMedia.findingId, n: sql<number>`count(*)::int` }).from(inspectionMedia).where(and(inArray(inspectionMedia.findingId, rows.map((r) => r.id)), eq(inspectionMedia.userId, userId))).groupBy(inspectionMedia.findingId) : [];
  const pm = new Map(photos.map((p) => [p.findingId, p.n] as const));
  return rows.map((r) => ({ ...r, costLowN: num(r.costLow), costHighN: num(r.costHigh), photoCount: pm.get(r.id) ?? 0 }));
}
export const toFindingLike = (rows: Awaited<ReturnType<typeof listFindings>>): FindingLike[] => rows.map((r) => ({ id: r.id, locationLabel: r.locationLabel, component: r.component, description: r.description, condition: r.condition, severity: r.severity, confidence: r.confidence, costLow: r.costLowN, costHigh: r.costHighN, costSource: r.costSource, specialistNeeded: r.specialistNeeded, followUpStatus: r.followUpStatus, photoCount: r.photoCount }));

export async function addFinding(db: AtlasDb, userId: string, sessionId: string, input: FindingInput) {
  const session = await db.query.inspectionSessions.findFirst({ where: and(eq(inspectionSessions.id, sessionId), eq(inspectionSessions.userId, userId)) });
  if (!session) return null;
  const [row] = await db.insert(findings).values({ sessionId, userId, itemKey: input.itemKey ?? null, locationLabel: input.locationLabel, component: input.component, description: input.description, condition: input.condition, severity: input.severity, confidence: input.confidence, financialImpact: input.financialImpact ?? null, specialistNeeded: input.specialistNeeded ?? null, followUpStatus: input.followUpStatus ?? "open", costLow: input.costLow == null ? null : String(input.costLow), costHigh: input.costHigh == null ? null : String(input.costHigh), costSource: input.costSource ?? null, resolution: input.resolution ?? null }).returning();
  await progress(db, userId, "finding.recorded", { findingId: row!.id, severity: input.severity });
  return row!;
}

/** Update a finding, appending the previous values to finding_revisions first so history is preserved. */
export async function updateFinding(db: AtlasDb, userId: string, findingId: string, input: FindingInput) {
  const prev = await db.query.findings.findFirst({ where: and(eq(findings.id, findingId), eq(findings.userId, userId)) });
  if (!prev) return null;
  await db.insert(findingRevisions).values({ findingId, snapshot: prev });
  const [row] = await db.update(findings).set({ itemKey: input.itemKey ?? prev.itemKey, locationLabel: input.locationLabel, component: input.component, description: input.description, condition: input.condition, severity: input.severity, confidence: input.confidence, financialImpact: input.financialImpact ?? null, specialistNeeded: input.specialistNeeded ?? null, followUpStatus: input.followUpStatus ?? prev.followUpStatus, costLow: input.costLow == null ? null : String(input.costLow), costHigh: input.costHigh == null ? null : String(input.costHigh), costSource: input.costSource ?? null, resolution: input.resolution ?? null, updatedAt: new Date() }).where(eq(findings.id, findingId)).returning();
  return row!;
}
export const listFindingRevisions = async (db: AtlasDb, userId: string, findingId: string) => {
  const own = await db.query.findings.findFirst({ where: and(eq(findings.id, findingId), eq(findings.userId, userId)) }); if (!own) return [];
  return db.select().from(findingRevisions).where(eq(findingRevisions.findingId, findingId)).orderBy(desc(findingRevisions.revisedAt));
};
export async function deleteFinding(db: AtlasDb, userId: string, findingId: string) {
  return (await db.delete(findings).where(and(eq(findings.id, findingId), eq(findings.userId, userId))).returning({ id: findings.id })).length > 0;
}

// ── follow-ups ──
export async function addFollowUp(db: AtlasDb, userId: string, sessionId: string, title: string, findingId: string | null, dueOn: string | null) {
  const s = await db.query.inspectionSessions.findFirst({ where: and(eq(inspectionSessions.id, sessionId), eq(inspectionSessions.userId, userId)) }); if (!s) return null;
  if (findingId) { const f = await db.query.findings.findFirst({ where: and(eq(findings.id, findingId), eq(findings.userId, userId), eq(findings.sessionId, sessionId)) }); if (!f) return null; }
  const [row] = await db.insert(followUpActions).values({ userId, sessionId, findingId, title, dueOn }).returning(); return row!;
}
export async function setFollowUpDone(db: AtlasDb, userId: string, id: string, done: boolean) {
  return (await db.update(followUpActions).set({ status: done ? "done" : "open", completedAt: done ? new Date() : null }).where(and(eq(followUpActions.id, id), eq(followUpActions.userId, userId))).returning({ id: followUpActions.id })).length > 0;
}

// ── media (private; bytes held in the database, served only through an authorised route) ──
export const MAX_IMAGE_BYTES = 3_000_000;
export type ImageType = "image/jpeg" | "image/png" | "image/webp";
/** Identify an image by its magic bytes, never by the client-declared type or file name. */
export function sniffImage(buf: Uint8Array): ImageType | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.length > 12 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "image/webp";
  return null;
}
export type MediaResult = { ok: true; id: string } | { ok: false; error: string };
export async function addMedia(db: AtlasDb, userId: string, sessionId: string, findingId: string | null, bytes: Uint8Array, caption: string | null): Promise<MediaResult> {
  if (bytes.length === 0) return { ok: false, error: "The file is empty." };
  if (bytes.length > MAX_IMAGE_BYTES) return { ok: false, error: "Photos are limited to 3 MB. Choose a smaller image." };
  const type = sniffImage(bytes); if (!type) return { ok: false, error: "Only JPEG, PNG and WebP images are accepted." };
  const s = await db.query.inspectionSessions.findFirst({ where: and(eq(inspectionSessions.id, sessionId), eq(inspectionSessions.userId, userId)) }); if (!s) return { ok: false, error: "Inspection not found." };
  if (findingId) { const f = await db.query.findings.findFirst({ where: and(eq(findings.id, findingId), eq(findings.userId, userId), eq(findings.sessionId, sessionId)) }); if (!f) return { ok: false, error: "Finding not found." }; }
  const [row] = await db.insert(inspectionMedia).values({ userId, sessionId, findingId, contentType: type, byteSize: bytes.length, dataBase64: Buffer.from(bytes).toString("base64"), caption }).returning({ id: inspectionMedia.id });
  return { ok: true, id: row!.id };
}
export async function getMedia(db: AtlasDb, userId: string, id: string) {
  const row = await db.query.inspectionMedia.findFirst({ where: and(eq(inspectionMedia.id, id), eq(inspectionMedia.userId, userId)) });
  return row ? { contentType: row.contentType, bytes: Buffer.from(row.dataBase64, "base64") } : null;
}
export async function deleteMedia(db: AtlasDb, userId: string, id: string) {
  return (await db.delete(inspectionMedia).where(and(eq(inspectionMedia.id, id), eq(inspectionMedia.userId, userId))).returning({ id: inspectionMedia.id })).length > 0;
}

// ── challenge attempts ──
export async function recordAttempt(db: AtlasDb, userId: string, challengeSlug: string, answers: unknown, result: { total: number; max: number }) {
  const [row] = await db.insert(challengeAttempts).values({ userId, challengeSlug, answers: answers as object, result: result as object, score: Math.round(result.total), maxScore: result.max }).returning();
  await progress(db, userId, "challenge.attempted", { attemptId: row!.id, challengeSlug, score: result.total });
  return row!;
}
export const listAttempts = (db: AtlasDb, userId: string, challengeSlug: string) => db.select().from(challengeAttempts).where(and(eq(challengeAttempts.userId, userId), eq(challengeAttempts.challengeSlug, challengeSlug))).orderBy(desc(challengeAttempts.createdAt));
export async function getAttempt(db: AtlasDb, userId: string, id: string) {
  return (await db.query.challengeAttempts.findFirst({ where: and(eq(challengeAttempts.id, id), eq(challengeAttempts.userId, userId)) })) ?? null;
}

// ── reports ──
/** Saves a frozen report and mirrors it into the private Research Library as a note. */
export async function saveReport(db: AtlasDb, userId: string, args: { propertyId: string; sessionId: string | null; attemptId: string | null; title: string; snapshot: ReportSnapshot; markdown: string }) {
  const note = await createNote(db, userId, { title: args.title, body: args.markdown, tags: ["fieldbook", "property-report"] });
  const [row] = await db.insert(fieldbookReports).values({ userId, propertyId: args.propertyId, sessionId: args.sessionId, attemptId: args.attemptId, title: args.title, snapshot: args.snapshot as unknown as object, markdown: args.markdown, noteId: note.id }).returning();
  await progress(db, userId, "report.saved", { reportId: row!.id });
  return row!;
}
export const listReports = (db: AtlasDb, userId: string) => db.select({ id: fieldbookReports.id, title: fieldbookReports.title, createdAt: fieldbookReports.createdAt, propertyId: fieldbookReports.propertyId }).from(fieldbookReports).where(eq(fieldbookReports.userId, userId)).orderBy(desc(fieldbookReports.createdAt));
export async function getReport(db: AtlasDb, userId: string, id: string) {
  return (await db.query.fieldbookReports.findFirst({ where: and(eq(fieldbookReports.id, id), eq(fieldbookReports.userId, userId)) })) ?? null;
}
