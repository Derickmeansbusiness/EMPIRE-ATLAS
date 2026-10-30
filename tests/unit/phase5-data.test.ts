import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./helpers/db";
import type { AtlasDatabase } from "@/db/client";
import { createUser } from "@/lib/auth/service";
import { seedResearch } from "@/db/seed";
import { getDossier, getTransaction } from "@/lib/data/research";
import { createNote, recordProgress } from "@/lib/data/workspace";
import { saveModel } from "@/lib/data/models";
import { createSubmission, recordChoice, startAttempt } from "@/lib/data/simulations";
import {
  addToReadingList, assignNoteToCollection, collectionContents, completeRitualDay, createCollection, deleteCollection, deletePrinciple, exportNotesMarkdown,
  exportPrinciples, getDoctrine, listPrinciples, recordQuizAttempt, removeFromReadingList, reopenRitualDay, ritualJournal, saveDoctrine, savePrinciple,
} from "@/lib/data/study";
import { competencyFor, gatherStats, programState, setTaskDone, startProgram, toCompetencyStats } from "@/lib/data/progress";
import { addOrganizationMember, cohortSummary, createOrganization, historianUsage24h, listOrganizations, platformAnalytics, recordHistorianQuery, setMembershipTier } from "@/lib/data/admin";
import { weekStartOf } from "@/lib/ritual";

let database: AtlasDatabase; let alice: string; let bob: string; let admin: string; let investorId: string; let txId: string; let claimId: string;
beforeAll(async () => {
  database = await freshDatabase(); await seedResearch(database.db);
  alice = (await createUser(database.db, { email: "alice@x.com", password: "alice-passphrase-1", displayName: "Alice" })).id;
  bob = (await createUser(database.db, { email: "bob@x.com", password: "bob-passphrase-123", displayName: "Bob" })).id;
  admin = (await createUser(database.db, { email: "owner@x.com", password: "owner-passphrase-12", displayName: "Owner", role: "platform_owner" })).id;
  const d = (await getDossier(database.db, "sam-zell"))!; investorId = d.investor.id; claimId = d.claims.find((c) => c.slug === "eop-merger-effective-2007-02-09")!.id;
  txId = (await getTransaction(database.db, "equity-office-sale-2007"))!.tx.id;
});
afterAll(async () => { await database.close(); });

describe("principles and doctrine", () => {
  it("saves principles with evidence references, scoped to their owner", async () => {
    const p = await savePrinciple(database.db, alice, { title: "Preserve liquidity", statement: "Keep reserves.", sourceInvestorId: investorId, supportingTransactionId: txId, supportingClaimId: claimId, relevantRisk: "Forced selling", modernApplication: "Hold 12 months of carry" });
    expect(p!.title).toBe("Preserve liquidity");
    const list = await listPrinciples(database.db, alice);
    expect(list[0]!.investor?.slug).toBe("sam-zell"); expect(list[0]!.transaction?.slug).toBe("equity-office-sale-2007"); expect(list[0]!.claim?.slug).toBe("eop-merger-effective-2007-02-09");
    expect(await listPrinciples(database.db, bob)).toHaveLength(0);
    expect(await savePrinciple(database.db, bob, { title: "x", statement: "y" }, p!.id)).toBeNull();
    expect(await deletePrinciple(database.db, bob, p!.id)).toBe(false);
    const updated = await savePrinciple(database.db, alice, { title: "Preserve liquidity first", statement: "Keep reserves." }, p!.id);
    expect(updated!.title).toBe("Preserve liquidity first");
    const ex = await exportPrinciples(database.db, alice);
    expect(ex[0]).toMatchObject({ title: "Preserve liquidity first" });
    expect(await deletePrinciple(database.db, alice, p!.id)).toBe(true);
  });
  it("upserts one doctrine per user and counts substantive sections", async () => {
    const empty = { targetAssets: "", geographicStrategy: "", acquisitionCriteria: "", financingCriteria: "", riskTolerance: "", capitalPartnerStrategy: "", committeeStandards: "", exitStrategies: "" };
    await saveDoctrine(database.db, alice, { ...empty, targetAssets: "Garden apartments in secondary markets.", exitStrategies: "Sell in year five or refinance." });
    await saveDoctrine(database.db, alice, { ...empty, targetAssets: "Garden apartments in secondary markets.", exitStrategies: "Sell in year five or refinance.", riskTolerance: "No more than 65% leverage; six months of reserves." });
    expect((await getDoctrine(database.db, alice))!.riskTolerance).toMatch(/65%/);
    expect(await getDoctrine(database.db, bob)).toBeNull();
    expect((await gatherStats(database.db, alice)).doctrineFieldsFilled).toBe(3);
  });
});

describe("weekly ritual", () => {
  it("records, updates and reopens days; the journal is private", async () => {
    const ws = weekStartOf(new Date());
    await completeRitualDay(database.db, alice, ws, 1, "Read two sources.");
    await completeRitualDay(database.db, alice, ws, 1, "Read two sources and logged gaps.");
    await completeRitualDay(database.db, alice, ws, 2, "");
    const j = await ritualJournal(database.db, alice);
    expect(j).toHaveLength(2); expect(j.find((e) => e.day === 1)!.journal).toMatch(/logged gaps/);
    expect(await ritualJournal(database.db, bob)).toHaveLength(0);
    expect((await gatherStats(database.db, alice)).ritualDays).toBe(2);
    await reopenRitualDay(database.db, alice, ws, 2);
    expect(await ritualJournal(database.db, alice)).toHaveLength(1);
  });
});

describe("quizzes, stats, program and competency", () => {
  it("derives activity, program completion and competency from stored records", async () => {
    const before = await programState(database.db, bob);
    expect(before.weeksComplete).toBe(0); expect(before.recommended).toBe(1); expect(before.startedOn).toBeNull();
    // Week 1: methodology (manual) + open dossier + evidence quiz
    await recordProgress(database.db, bob, "dossier.opened", "investor", investorId);
    await recordQuizAttempt(database.db, bob, "reading-the-evidence", { e1: "1" }, 6, 6, true);
    await recordQuizAttempt(database.db, bob, "zell-record", { z1: "0" }, 2, 7, false);
    let s = await gatherStats(database.db, bob);
    expect(s.dossiersOpened).toEqual(["sam-zell"]); expect(s.quizzesPassed).toEqual(["reading-the-evidence"]); // a failed attempt does not count
    let prog = await programState(database.db, bob, s);
    expect(prog.statuses[0]!.doneCount).toBe(2); expect(prog.recommended).toBe(1);
    expect(await setTaskDone(database.db, bob, 1, "dossier-sam-zell", true)).toBe(false); // auto tasks cannot be ticked by hand
    expect(await setTaskDone(database.db, bob, 1, "nope", true)).toBe(false);
    expect(await setTaskDone(database.db, bob, 99, "methodology", true)).toBe(false);
    expect(await setTaskDone(database.db, bob, 1, "methodology", true, "Read it")).toBe(true);
    prog = await programState(database.db, bob);
    expect(prog.weeksComplete).toBe(1); expect(prog.recommended).toBe(2);
    expect(await setTaskDone(database.db, bob, 1, "methodology", false)).toBe(true);
    expect((await programState(database.db, bob)).weeksComplete).toBe(0);
    await startProgram(database.db, bob);
    expect((await programState(database.db, bob)).startedOn).toBe(new Date().toISOString().slice(0, 10));
    // Competency: quiz passed, but no model or note yet
    expect((await competencyFor(database.db, bob)).competency.label).toBe("Research Apprentice");
    await saveModel(database.db, bob, { name: "m", kind: "underwriter", assumptions: { purchasePrice: 1 } });
    await createNote(database.db, bob, { title: "n", body: "b" });
    const c = await competencyFor(database.db, bob);
    expect(c.competency.label).toBe("Deal Analyst");
    expect(c.competency.next?.label).toBe("Credit Architect");
    expect(toCompetencyStats(c.program.stats, 0).allQuizSlugs.length).toBe(4);
    // Simulation and committee flow into stats
    const a = await startAttempt(database.db, bob, "office-portfolio-top-of-cycle-2007");
    for (const [st, op] of [["offer", "negotiate"], ["competing_bid", "cash"], ["proceeds", "drypowder"], ["shock", "buy"]] as const) await recordChoice(database.db, bob, a.id, st, op);
    await createSubmission(database.db, bob, { title: "T", thesis: "A thesis long enough to pass validation and explain the plan in sentences.", assetDetails: "", sourcesAndUses: "", assumptionsNarrative: "", capitalStack: "", risks: "Refinancing risk and liquidity.", sensitivity: "", exitStrategy: "Sale in year 5; 5-year hold.", recommendation: "decline", modelId: null });
    s = await gatherStats(database.db, bob);
    expect(s.simulationBest["office-portfolio-top-of-cycle-2007"]).toBeGreaterThanOrEqual(85);
    expect(s.committeeCount).toBe(1); expect(s.committeeBest).not.toBeNull();
    expect(s.modelKinds).toEqual({ underwriter: 1 }); expect(s.notes).toBe(1);
    // The profile's stored level follows computed competency
    const { profiles } = await import("@/db/schema"); const { eq } = await import("drizzle-orm");
    expect((await database.db.query.profiles.findFirst({ where: eq(profiles.userId, bob) }))!.competencyLevel).toBe("deal_analyst");
  });
});

describe("collections", () => {
  it("folders hold notes, reading lists hold evidence, and neither crosses users", async () => {
    const folder = await createCollection(database.db, alice, "Zell research", "folder");
    const list = await createCollection(database.db, alice, "To read", "reading_list");
    const note = await createNote(database.db, alice, { title: "Filed note", body: "Body text here." });
    expect(await assignNoteToCollection(database.db, alice, note.id, folder.id)).toBe(true);
    expect(await assignNoteToCollection(database.db, bob, note.id, folder.id)).toBe(false);
    expect(await assignNoteToCollection(database.db, alice, note.id, (await createCollection(database.db, bob, "Bob's", "folder")).id)).toBe(false);
    expect(await addToReadingList(database.db, alice, folder.id, "claim", claimId)).toBe(false); // not a reading list
    expect(await addToReadingList(database.db, bob, list.id, "claim", claimId)).toBe(false);
    expect(await addToReadingList(database.db, alice, list.id, "claim", claimId)).toBe(true);
    expect(await addToReadingList(database.db, alice, list.id, "claim", claimId)).toBe(true); // idempotent
    const contents = await collectionContents(database.db, alice, list.id);
    expect(contents!.items).toHaveLength(1); expect(contents!.items[0]!.claim?.slug).toBe("eop-merger-effective-2007-02-09");
    expect((await collectionContents(database.db, alice, folder.id))!.notes.map((n) => n.title)).toEqual(["Filed note"]);
    expect(await collectionContents(database.db, bob, folder.id)).toBeNull();
    const md = await exportNotesMarkdown(database.db, alice, "Alice");
    expect(md).toContain("## Zell research"); expect(md).toContain("### Filed note");
    expect(await removeFromReadingList(database.db, bob, list.id, contents!.items[0]!.item.id)).toBe(false);
    expect(await removeFromReadingList(database.db, alice, list.id, contents!.items[0]!.item.id)).toBe(true);
    expect(await deleteCollection(database.db, bob, folder.id)).toBe(false);
    expect(await deleteCollection(database.db, alice, folder.id)).toBe(true);
  });
});

describe("tiers, organisations, cohorts, analytics and AI usage", () => {
  it("validates tiers, creates organisations with unique slugs, and summarises a cohort", async () => {
    expect(await setMembershipTier(database.db, admin, alice, "professional")).toBe(true);
    expect(await setMembershipTier(database.db, admin, alice, "platinum")).toBe(false);
    expect(await setMembershipTier(database.db, admin, "00000000-0000-0000-0000-000000000000", "researcher")).toBe(false);
    const o1 = await createOrganization(database.db, admin, "Lakeview Real Estate Club"); const o2 = await createOrganization(database.db, admin, "Lakeview Real Estate Club");
    expect(o1.slug).toBe("lakeview-real-estate-club"); expect(o2.slug).toBe("lakeview-real-estate-club-2");
    expect(await addOrganizationMember(database.db, admin, o1.id, "BOB@x.com")).toBe("added");
    expect(await addOrganizationMember(database.db, admin, o1.id, "bob@x.com")).toBe("exists");
    expect(await addOrganizationMember(database.db, admin, o1.id, "ghost@x.com")).toBe("no_user");
    expect((await listOrganizations(database.db)).find((o) => o.id === o1.id)!.members).toBe(1);
    const cohort = await cohortSummary(database.db, o1.id);
    expect(cohort!.members).toHaveLength(1);
    expect(cohort!.members[0]).toMatchObject({ name: "Bob", level: "Deal Analyst", quizzesPassed: 1, simulations: 1 });
    expect(await cohortSummary(database.db, "00000000-0000-0000-0000-000000000000")).toBeNull();
  });
  it("aggregates platform analytics from stored records", async () => {
    const a = await platformAnalytics(database.db);
    expect(a.usersByRole.reduce((n, r) => n + r.n, 0)).toBe(3);
    expect(a.usersByTier.find((t) => t.tier === "professional")!.n).toBe(1);
    expect(a.active30).toBeGreaterThanOrEqual(2);
    expect(a.quizzes.find((q) => q.slug === "zell-record")).toMatchObject({ attempts: 1, passed: 0 });
    expect(a.quizzes.find((q) => q.slug === "reading-the-evidence")).toMatchObject({ attempts: 1, passed: 1, avgPercent: 100 });
    expect(a.simulations[0]!.completed).toBe(1); expect(a.committee.length).toBeGreaterThan(0);
    expect(a.topDossiers[0]).toMatchObject({ name: "Samuel Zell" }); expect(a.programStarted).toBe(1); expect(a.claimsByStatus.length).toBeGreaterThan(0);
  });
  it("counts historian queries per user for the daily limit", async () => {
    expect(await historianUsage24h(database.db, alice)).toBe(0);
    await recordHistorianQuery(database.db, alice, { role: "historian", retrieved: 4, usedModel: true });
    await recordHistorianQuery(database.db, alice, { role: "historian", retrieved: 4, usedModel: true });
    await recordHistorianQuery(database.db, alice, { role: "historian", retrieved: 0, usedModel: false }); // search-only: not counted
    expect(await historianUsage24h(database.db, alice)).toBe(2);
    expect(await historianUsage24h(database.db, bob)).toBe(0);
  });
});
