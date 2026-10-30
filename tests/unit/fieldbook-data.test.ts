import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./helpers/db";
import type { AtlasDatabase } from "@/db/client";
import { createUser } from "@/lib/auth/service";
import { seedResearch } from "@/db/seed";
import {
  addFinding, addFollowUp, addMedia, completeSession, createPassage, deleteMedia, getMedia, getPassageBySlug, getProperty, getReport, getSession, listAttempts,
  listFindingRevisions, listFindings, listMyPassages, listReports, MAX_IMAGE_BYTES, recordAttempt, saveItem, saveReport, setFollowUpDone, setSessionLocation, sniffImage,
  startOrResumeSession, toFindingLike, updateFinding,
} from "@/lib/data/fieldbook";
import { listNotes } from "@/lib/data/workspace";
import { buildSnapshot, reportMarkdown } from "@/fieldbook/report";
import { lindenCourt } from "@/fieldbook/challenges/linden-court";
import { FEATURED_EXERCISES, FEATURED_STATEMENTS } from "@/fieldbook/featured";

let database: AtlasDatabase; let alice: string; let bob: string; let propertyId: string;
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
beforeAll(async () => {
  database = await freshDatabase(); await seedResearch(database.db);
  alice = (await createUser(database.db, { email: "alice@x.com", password: "alice-passphrase-1", displayName: "Alice" })).id;
  bob = (await createUser(database.db, { email: "bob@x.com", password: "bob-passphrase-123", displayName: "Bob" })).id;
  propertyId = (await getProperty(database.db, alice, "linden-court-apartments"))!.id;
});
afterAll(async () => { await database.close(); });

describe("featured passage record", () => {
  it("is seeded idempotently with attribution, no stored text and all ten dimensions", async () => {
    await seedResearch(database.db); // second run must not duplicate
    const rec = (await getPassageBySlug(database.db, "cardone-how-to-create-wealth-p39"))!;
    expect(rec.passage.author).toBe("Grant Cardone"); expect(rec.passage.sourceTitle).toBe("How to Create Wealth Investing in Real Estate"); expect(rec.passage.location).toBe("p. 39");
    expect(rec.passage.excerpt).toBeNull(); expect(rec.passage.publishedLabel).toBeNull(); expect(rec.passage.edition).toBeNull(); expect(rec.passage.isFirstPerson).toBe(true);
    expect(rec.statements).toHaveLength(FEATURED_STATEMENTS.length);
    expect(new Set(rec.statements.map((s) => s.dimension)).size).toBe(10);
    expect(rec.exercises).toHaveLength(FEATURED_EXERCISES.length);
    expect(rec.statements.some((s) => s.evidenceClass === "verified_supporting_fact")).toBe(false); // nothing corroborated yet
    for (const s of rec.statements.filter((x) => x.dimension === 3)) expect(s.body).toMatch(/not independently corroborated/);
  });
  it("keeps a user’s own pasted excerpt private to them", async () => {
    const p = await createPassage(database.db, alice, { sourceTitle: "How to Create Wealth Investing in Real Estate", author: "Grant Cardone", sourceKind: "book", location: "p. 39", excerpt: "my short quote", isFirstPerson: true });
    expect((await listMyPassages(database.db, alice)).map((x) => x.id)).toContain(p.id);
    expect(await listMyPassages(database.db, bob)).toHaveLength(0);
    expect((await getPassageBySlug(database.db, "cardone-how-to-create-wealth-p39"))!.passage.excerpt).toBeNull();
  });
});

describe("inspection sessions", () => {
  it("resumes the draft, saves items, rejects unknown items and other users", async () => {
    const s = await startOrResumeSession(database.db, alice, propertyId, "multifamily");
    expect((await startOrResumeSession(database.db, alice, propertyId, "multifamily")).id).toBe(s.id);
    expect(await saveItem(database.db, alice, s.id, "parking.surface", "poor", "cracked")).toBe(true);
    expect(await saveItem(database.db, alice, s.id, "parking.surface", "fair", "revised")).toBe(true);
    expect(await saveItem(database.db, alice, s.id, "not.an.item", "good", null)).toBe(false);
    expect(await saveItem(database.db, bob, s.id, "parking.surface", "good", null)).toBe(false);
    const got = (await getSession(database.db, alice, s.id))!;
    expect(got.items).toHaveLength(1); expect(got.items[0]!.rating).toBe("fair"); expect(got.items[0]!.note).toBe("revised");
    expect(await getSession(database.db, bob, s.id)).toBeNull();
  });
  it("stores location only when asked and locks completed sessions", async () => {
    const s = await startOrResumeSession(database.db, alice, propertyId, "multifamily");
    expect((await getSession(database.db, alice, s.id))!.session.location).toBeNull();
    expect(await setSessionLocation(database.db, alice, s.id, { lat: 41.5, lng: -90.5, accuracy: 12 })).toBe(true);
    expect((await getSession(database.db, alice, s.id))!.session.location?.lat).toBe(41.5);
    expect(await setSessionLocation(database.db, bob, s.id, { lat: 1, lng: 1, accuracy: null })).toBe(false);
    expect(await completeSession(database.db, alice, s.id, "done")).toBe(true);
    expect(await saveItem(database.db, alice, s.id, "roof.visible", "fair", null)).toBe(false);
    const next = await startOrResumeSession(database.db, alice, propertyId, "multifamily"); expect(next.id).not.toBe(s.id);
  });
});

describe("findings, history, follow-ups and photos", () => {
  it("records findings with cost source, preserves revisions, and enforces the cost-source constraint", async () => {
    const s = await startOrResumeSession(database.db, alice, propertyId, "multifamily");
    const f = (await addFinding(database.db, alice, s.id, { locationLabel: "Main lot", component: "paving", description: "Cracking", condition: "poor", severity: "material_repair", confidence: "medium", costLow: 10_000, costHigh: 20_000, costSource: "Own estimate" }))!;
    await updateFinding(database.db, alice, f.id, { locationLabel: "Main lot", component: "paving", description: "Cracking and ponding", condition: "poor", severity: "major_capital_replacement", confidence: "high", costLow: 40_000, costHigh: 60_000, costSource: "Contractor phone estimate", resolution: null });
    const revs = await listFindingRevisions(database.db, alice, f.id);
    expect(revs).toHaveLength(1); expect((revs[0]!.snapshot as { severity: string }).severity).toBe("material_repair");
    expect(await listFindingRevisions(database.db, bob, f.id)).toHaveLength(0);
    const list = await listFindings(database.db, alice, s.id); expect(list[0]!.costLowN).toBe(40_000); expect(toFindingLike(list)[0]!.costHigh).toBe(60_000);
    await expect(addFinding(database.db, alice, s.id, { locationLabel: "x", component: "roof", description: "x", condition: "fair", severity: "minor_maintenance", confidence: "low", costLow: 5, costHigh: 9 })).rejects.toThrow();
    expect(await addFinding(database.db, bob, s.id, { locationLabel: "x", component: "roof", description: "x", condition: "fair", severity: "minor_maintenance", confidence: "low" })).toBeNull();
    expect(await updateFinding(database.db, bob, f.id, { locationLabel: "x", component: "roof", description: "hijack", condition: "fair", severity: "minor_maintenance", confidence: "low" })).toBeNull();
    const fu = (await addFollowUp(database.db, alice, s.id, "Request pavement invoice", f.id, "2026-11-15"))!;
    expect(await addFollowUp(database.db, bob, s.id, "x", null, null)).toBeNull();
    expect(await setFollowUpDone(database.db, bob, fu.id, true)).toBe(false); expect(await setFollowUpDone(database.db, alice, fu.id, true)).toBe(true);
  });
  it("accepts real images by magic bytes, refuses disguised files, oversize and other users’ sessions, and serves only to the owner", async () => {
    const s = await startOrResumeSession(database.db, alice, propertyId, "multifamily");
    expect(sniffImage(PNG)).toBe("image/png"); expect(sniffImage(new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull();
    const ok = await addMedia(database.db, alice, s.id, null, PNG, "lot"); expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect((await getMedia(database.db, alice, ok.id))!.contentType).toBe("image/png"); expect(Array.from((await getMedia(database.db, alice, ok.id))!.bytes)).toEqual(Array.from(PNG));
    expect(await getMedia(database.db, bob, ok.id)).toBeNull();
    expect((await addMedia(database.db, alice, s.id, null, new TextEncoder().encode("<svg onload=alert(1)>"), null)).ok).toBe(false);
    const big = new Uint8Array(MAX_IMAGE_BYTES + 1); big.set(PNG); expect((await addMedia(database.db, alice, s.id, null, big, null)).ok).toBe(false);
    expect((await addMedia(database.db, bob, s.id, null, PNG, null)).ok).toBe(false);
    expect(await deleteMedia(database.db, bob, ok.id)).toBe(false); expect(await deleteMedia(database.db, alice, ok.id)).toBe(true);
  });
});

describe("attempts and reports", () => {
  it("keeps attempt history per user, and saves a report into the private Research Library", async () => {
    await recordAttempt(database.db, alice, "linden-court-t12", { a: 1 }, { total: 41.5, max: 100 });
    await recordAttempt(database.db, alice, "linden-court-t12", { a: 2 }, { total: 78, max: 100 });
    const hist = await listAttempts(database.db, alice, "linden-court-t12"); expect(hist.map((h) => h.score)).toEqual([78, 42].map((n) => n)); // newest first; 41.5 rounds to 42
    expect(await listAttempts(database.db, bob, "linden-court-t12")).toHaveLength(0);
    const s = await startOrResumeSession(database.db, alice, propertyId, "multifamily");
    const snap = buildSnapshot({ propertyName: "Linden Court Apartments", fictional: true, author: "Alice", date: "2026-10-30", challenge: lindenCourt, findings: [], decision: "investigate", rationale: "Need documents first.", sessionDate: null, checklistProgress: { done: 0, total: 70 } });
    const rep = await saveReport(database.db, alice, { propertyId, sessionId: s.id, attemptId: hist[0]!.id, title: "Linden Court screening", snapshot: snap, markdown: reportMarkdown(snap) });
    expect((await getReport(database.db, alice, rep.id))!.markdown).toContain("Screening decision: Investigate further");
    expect(await getReport(database.db, bob, rep.id)).toBeNull(); expect(await listReports(database.db, bob)).toHaveLength(0);
    const notes = await listNotes(database.db, alice); expect(notes.some((n) => n.id === rep.noteId && n.tags.includes("fieldbook"))).toBe(true);
    expect((await listNotes(database.db, bob)).length).toBe(0);
  });
});
