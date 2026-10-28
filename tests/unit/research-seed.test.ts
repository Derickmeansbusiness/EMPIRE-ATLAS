import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./helpers/db";
import type { AtlasDatabase } from "@/db/client";
import { seedResearch } from "@/db/seed";
import { zellDossier } from "@/db/seed/zell";
import { evidenceSummary, getClaimBySlug, getDossier, getTransaction, listInvestors, listInvestorRoadmap } from "@/lib/data/research";

let database: AtlasDatabase;
beforeAll(async () => { database = await freshDatabase(); await seedResearch(database.db); await seedResearch(database.db); });
afterAll(async () => { await database.close(); });

describe("research seed integrity", () => {
  it("every claim has at least one source link and every section citation resolves", async () => {
    const d = await getDossier(database.db, "sam-zell");
    expect(d).not.toBeNull();
    for (const c of d!.claims) expect(c.sources.length, `claim ${c.slug} has no sources`).toBeGreaterThan(0);
    const slugs = new Set(d!.claims.map((c) => c.slug));
    for (const s of d!.sections) {
      for (const m of s.bodyMarkdown.matchAll(/\[\[claim:([a-z0-9-]+)\]\]/g)) expect(slugs.has(m[1]!), `section ${s.division} cites unknown claim ${m[1]}`).toBe(true);
    }
    expect(d!.sections.map((s) => s.division)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
  it("is idempotent (no duplicate claims or sources after a second run)", async () => {
    const d = await getDossier(database.db, "sam-zell");
    expect(d!.claims.length).toBe(zellDossier.claims.length);
    const claimSlugs = d!.claims.map((c) => c.slug);
    expect(new Set(claimSlugs).size).toBe(claimSlugs.length);
    expect(d!.events.length).toBe(zellDossier.events.length);
  });
  it("only published investors are listed publicly; queued subjects appear in the roadmap", async () => {
    const published = await listInvestors(database.db);
    expect(published.map((i) => i.slug)).toEqual(["sam-zell"]);
    const roadmap = await listInvestorRoadmap(database.db);
    expect(roadmap.length).toBe(16);
  });
  it("verified_primary claims cite filings or exchange notices", async () => {
    const d = await getDossier(database.db, "sam-zell");
    for (const c of d!.claims.filter((x) => x.verificationStatus === "verified_primary")) {
      const primary = c.sources.some((s) => ["sec_filing", "exchange_notice", "company_filing", "press_release", "book"].includes(s.source.sourceType));
      expect(primary, `claim ${c.slug} is marked verified_primary without a primary-type source`).toBe(true);
    }
    const summary = await evidenceSummary(database.db);
    expect(summary.verified_primary).toBeGreaterThan(0);
    expect(summary.contested).toBeGreaterThan(0);
    expect(summary.unverified).toBeGreaterThan(0);
  });
  it("transaction keeps documented, estimated and unknown lines distinct", async () => {
    const t = await getTransaction(database.db, "equity-office-sale-2007");
    expect(t).not.toBeNull();
    const statuses = new Set(t!.stack.map((s) => s.item.dataStatus));
    expect(statuses.has("documented")).toBe(true);
    expect(statuses.has("estimate")).toBe(true);
    expect(statuses.has("unknown")).toBe(true);
    const unknown = t!.stack.filter((s) => s.item.dataStatus === "unknown");
    for (const u of unknown) expect(u.item.amountUsd).toBeNull();
    expect(t!.claims.length).toBeGreaterThan(3);
  });
  it("claim detail exposes sources and review history", async () => {
    const c = await getClaimBySlug(database.db, "eop-merger-effective-2007-02-09");
    expect(c?.claim.verificationStatus).toBe("verified_primary");
    expect(c?.transaction?.slug).toBe("equity-office-sale-2007");
    expect(c?.reviews).toEqual([]);
  });
});
