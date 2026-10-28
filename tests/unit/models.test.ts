import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./helpers/db";
import type { AtlasDatabase } from "@/db/client";
import { createUser } from "@/lib/auth/service";
import { seedResearch } from "@/db/seed";
import { deleteModel, getModel, listModels, listModelsForTransaction, listVersions, saveModel } from "@/lib/data/models";
import { getTransaction } from "@/lib/data/research";
import { getCaseStudy, listCaseStudies } from "@/lib/data/cases";

let database: AtlasDatabase; let alice: string; let bob: string; let txId: string;
beforeAll(async () => {
  database = await freshDatabase();
  await seedResearch(database.db);
  alice = (await createUser(database.db, { email: "a@example.com", password: "alice-passphrase-1", displayName: "A" })).id;
  bob = (await createUser(database.db, { email: "b@example.com", password: "bob-passphrase-123", displayName: "B" })).id;
  txId = (await getTransaction(database.db, "equity-office-sale-2007"))!.tx.id;
});
afterAll(async () => { await database.close(); });

describe("saved financial models", () => {
  it("creates, versions, lists, scopes and deletes", async () => {
    const m = await saveModel(database.db, alice, { name: "Base", kind: "underwriter", assumptions: { purchasePrice: 1 }, transactionId: txId });
    expect(m!.version).toBe(1);
    expect(m!.isHypothetical).toBe(true);
    const v2 = await saveModel(database.db, alice, { name: "Base v2", kind: "underwriter", assumptions: { purchasePrice: 2 }, modelId: m!.id, note: "raised price" });
    expect(v2!.version).toBe(2);
    expect((await listVersions(database.db, alice, m!.id)).map((v) => v.version)).toEqual([2, 1]);
    expect((await listModels(database.db, alice)).length).toBe(1);
    expect((await listModelsForTransaction(database.db, alice, txId)).length).toBe(1);
    // Bob cannot see, version or delete Alice's model
    expect(await getModel(database.db, bob, m!.id)).toBeNull();
    expect(await saveModel(database.db, bob, { name: "hijack", kind: "underwriter", assumptions: {}, modelId: m!.id })).toBeNull();
    expect(await listVersions(database.db, bob, m!.id)).toEqual([]);
    expect(await deleteModel(database.db, bob, m!.id)).toBe(false);
    expect((await listModelsForTransaction(database.db, bob, txId)).length).toBe(0);
    expect(await deleteModel(database.db, alice, m!.id)).toBe(true);
    expect((await listModels(database.db, alice)).length).toBe(0);
  });
});

describe("case studies", () => {
  it("the fictional Meridian Court case is published, labelled fictional and links to the Zell dossier", async () => {
    const list = await listCaseStudies(database.db);
    expect(list.map((c) => c.slug)).toContain("meridian-court-distressed-multifamily");
    const c = await getCaseStudy(database.db, "meridian-court-distressed-multifamily");
    expect(c!.caseStudy.kind).toBe("fictional");
    expect(c!.caseStudy.disclaimer).toMatch(/fictional/i);
    expect(c!.investor?.slug).toBe("sam-zell");
    expect(Object.keys(c!.caseStudy.modelPresets as object)).toEqual(expect.arrayContaining(["distressed", "underwriter"]));
  });
});
