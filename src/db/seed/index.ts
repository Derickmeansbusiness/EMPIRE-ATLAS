/**
 * Idempotent research seed. Safe to run repeatedly: every record is keyed by slug or natural key.
 */
import { and, eq } from "drizzle-orm";
import type { AtlasDb } from "@/db/client";
import {
  capitalStackItems, claimSources, claims, dossierSections, historicalEvents, institutions, investors,
  quotations, relationships, sources, transactionParticipants, transactions, users,
} from "@/db/schema";
import { zellDossier } from "./zell";
import { roadmapInstitutions, roadmapInvestors } from "./roadmap";
import type { SeedInvestorDossier } from "./types";
import { createUser, setUserRole } from "@/lib/auth/service";

export const dossiers: SeedInvestorDossier[] = [zellDossier];

export async function seedResearch(db: AtlasDb): Promise<{ investors: number; claims: number; sources: number; transactions: number }> {
  let claimCount = 0; let sourceCount = 0; let txCount = 0;

  for (const d of dossiers) {
    const [investor] = await db.insert(investors).values({
      slug: d.investor.slug, fullName: d.investor.fullName, shortName: d.investor.shortName, bornYear: d.investor.bornYear ?? null,
      diedYear: d.investor.diedYear ?? null, nationality: d.investor.nationality ?? null, headline: d.investor.headline, summary: d.investor.summary,
      eraLabel: d.investor.eraLabel, primaryAssetClasses: d.investor.primaryAssetClasses, publishStatus: "published", researchStatus: "published",
      roadmapRank: d.investor.roadmapRank,
    }).onConflictDoUpdate({ target: investors.slug, set: {
      fullName: d.investor.fullName, shortName: d.investor.shortName, bornYear: d.investor.bornYear ?? null, diedYear: d.investor.diedYear ?? null,
      headline: d.investor.headline, summary: d.investor.summary, eraLabel: d.investor.eraLabel, primaryAssetClasses: d.investor.primaryAssetClasses,
      publishStatus: "published", researchStatus: "published", roadmapRank: d.investor.roadmapRank, updatedAt: new Date(),
    } }).returning();
    const investorId = investor!.id;

    const institutionIds = new Map<string, string>();
    for (const inst of d.institutions) {
      const [row] = await db.insert(institutions).values({
        slug: inst.slug, name: inst.name, kind: inst.kind, foundedYear: inst.foundedYear ?? null, headquarters: inst.headquarters ?? null,
        summary: inst.summary ?? null, publishStatus: inst.published === false ? "draft" : "published",
      }).onConflictDoUpdate({ target: institutions.slug, set: { name: inst.name, kind: inst.kind, foundedYear: inst.foundedYear ?? null, headquarters: inst.headquarters ?? null, summary: inst.summary ?? null, publishStatus: inst.published === false ? "draft" : "published" } }).returning();
      institutionIds.set(inst.slug, row!.id);
    }

    const sourceIds = new Map<string, string>();
    for (const s of d.sources) {
      const values = {
        slug: s.slug, title: s.title, sourceType: s.sourceType, publisher: s.publisher ?? null, author: s.author ?? null, url: s.url ?? null,
        documentReference: s.documentReference ?? null, publishedOn: s.publishedOn ?? null, accessedOn: s.accessedOn ?? null,
        licensingNote: s.licensingNote ?? null, reliabilityNote: s.reliabilityNote ?? null,
      };
      const [row] = await db.insert(sources).values(values).onConflictDoUpdate({ target: sources.slug, set: values }).returning();
      sourceIds.set(s.slug, row!.id);
      sourceCount++;
    }

    const txIds = new Map<string, string>();
    for (const t of d.transactions) {
      const values = {
        slug: t.slug, name: t.name, leadInvestorId: investorId, announcedOn: t.announcedOn ?? null, closedOn: t.closedOn ?? null,
        datePrecision: t.datePrecision ?? "day", assetDescription: t.assetDescription, market: t.market, location: t.location, assetClass: t.assetClass,
        headlineValueUsd: t.headlineValueUsd != null ? String(t.headlineValueUsd) : null, headlineValueLabel: t.headlineValueLabel,
        headlineValueStatus: t.headlineValueStatus, summary: t.summary, rightsAcquired: t.rightsAcquired, operatingStrategy: t.operatingStrategy,
        subsequentEvents: t.subsequentEvents, exitOrStatus: t.exitOrStatus, verifiedOutcome: t.verifiedOutcome, openQuestions: t.openQuestions,
        publishStatus: "published" as const,
      };
      const [row] = await db.insert(transactions).values(values).onConflictDoUpdate({ target: transactions.slug, set: { ...values, updatedAt: new Date() } }).returning();
      txIds.set(t.slug, row!.id);
      txCount++;
    }

    const claimIds = new Map<string, string>();
    for (const c of d.claims) {
      const values = {
        slug: c.slug, claimText: c.text, category: c.category, investorId,
        institutionId: c.institution ? institutionIds.get(c.institution) ?? null : null,
        transactionId: c.transaction ? txIds.get(c.transaction) ?? null : null,
        eventDate: c.eventDate ?? null, eventDatePrecision: c.eventDatePrecision ?? (c.eventDate ? "day" : null),
        verificationStatus: c.status, researcherNotes: c.notes ?? null, publishStatus: "published" as const,
      };
      const existing = await db.query.claims.findFirst({ where: eq(claims.slug, c.slug) });
      let claimId: string;
      if (existing) {
        // Preserve reviewer decisions: only overwrite verification status if no human review exists.
        const { verificationStatus: _vs, ...rest } = values;
        const set = existing.lastReviewedAt ? rest : values;
        await db.update(claims).set({ ...set, updatedAt: new Date() }).where(eq(claims.id, existing.id));
        claimId = existing.id;
      } else {
        const [row] = await db.insert(claims).values(values).returning();
        claimId = row!.id;
      }
      claimIds.set(c.slug, claimId);
      claimCount++;
      for (const link of c.sources) {
        const sourceId = sourceIds.get(link.source);
        if (!sourceId) throw new Error(`Seed: claim ${c.slug} references unknown source ${link.source}`);
        await db.insert(claimSources).values({ claimId, sourceId, excerpt: link.excerpt ?? null, locator: link.locator ?? null, supports: link.supports ?? true })
          .onConflictDoUpdate({ target: [claimSources.claimId, claimSources.sourceId], set: { excerpt: link.excerpt ?? null, locator: link.locator ?? null, supports: link.supports ?? true } });
      }
    }

    for (const s of d.sections) {
      await db.insert(dossierSections).values({ investorId, division: s.division, title: s.title, bodyMarkdown: s.body, evidenceConfidence: s.confidence })
        .onConflictDoUpdate({ target: [dossierSections.investorId, dossierSections.division], set: { title: s.title, bodyMarkdown: s.body, evidenceConfidence: s.confidence, updatedAt: new Date() } });
    }

    // Timeline events: rebuild for the investor (events have no natural key).
    await db.delete(historicalEvents).where(eq(historicalEvents.investorId, investorId));
    let order = 0;
    for (const e of d.events) {
      await db.insert(historicalEvents).values({
        investorId, occurredOn: e.date, datePrecision: e.precision ?? "day", title: e.title, description: e.description ?? null,
        category: e.category ?? "milestone", claimId: e.claim ? claimIds.get(e.claim) ?? null : null,
        transactionId: e.transaction ? txIds.get(e.transaction) ?? null : null, sortOrder: order++,
      });
    }

    for (const t of d.transactions) {
      const transactionId = txIds.get(t.slug)!;
      await db.delete(transactionParticipants).where(eq(transactionParticipants.transactionId, transactionId));
      for (const p of t.participants) {
        await db.insert(transactionParticipants).values({
          transactionId, partyKind: p.kind, role: p.role, note: p.note ?? null,
          investorId: p.kind === "investor" ? investorId : null,
          institutionId: p.kind === "institution" ? institutionIds.get(p.slug) ?? null : null,
        });
      }
      await db.delete(capitalStackItems).where(eq(capitalStackItems.transactionId, transactionId));
      let i = 0;
      for (const item of t.stack) {
        await db.insert(capitalStackItems).values({
          transactionId, side: item.side, layer: item.layer, label: item.label, amountUsd: item.amountUsd != null ? String(item.amountUsd) : null,
          amountLabel: item.amountLabel ?? null, providerInstitutionId: item.provider ? institutionIds.get(item.provider) ?? null : null,
          dataStatus: item.status, note: item.note ?? null, sortOrder: i++,
        });
      }
      await db.delete(historicalEvents).where(and(eq(historicalEvents.transactionId, transactionId), eq(historicalEvents.category, "__tx__")));
      // Transaction-scoped events are stored with investor_id null and transaction_id set.
      const txEvents = await db.select({ id: historicalEvents.id }).from(historicalEvents).where(eq(historicalEvents.transactionId, transactionId));
      for (const row of txEvents) {
        const ev = await db.query.historicalEvents.findFirst({ where: eq(historicalEvents.id, row.id) });
        if (ev && ev.investorId === null) await db.delete(historicalEvents).where(eq(historicalEvents.id, row.id));
      }
      let j = 0;
      for (const e of t.events) {
        await db.insert(historicalEvents).values({
          transactionId, occurredOn: e.date, datePrecision: e.precision ?? "day", title: e.title, description: e.description ?? null,
          category: e.category ?? "milestone", claimId: e.claim ? claimIds.get(e.claim) ?? null : null, sortOrder: j++,
        });
      }
    }

    // Relationships: rebuild for this investor's graph.
    await db.delete(relationships).where(eq(relationships.fromInvestorId, investorId));
    for (const inst of d.institutions) {
      const id = institutionIds.get(inst.slug)!;
      await db.delete(relationships).where(eq(relationships.fromInstitutionId, id));
    }
    for (const r of d.relationships) {
      const claimId = claimIds.get(r.claim);
      if (!claimId) throw new Error(`Seed: relationship references unknown claim ${r.claim}`);
      await db.insert(relationships).values({
        fromKind: r.from.kind === "investor" ? "individual" : (d.institutions.find((x) => x.slug === r.from.slug)?.kind ?? "company"),
        fromInvestorId: r.from.kind === "investor" ? investorId : null,
        fromInstitutionId: r.from.kind === "institution" ? institutionIds.get(r.from.slug) ?? null : null,
        toKind: r.to.kind === "investor" ? "individual" : r.to.kind === "transaction" ? "transaction" : (d.institutions.find((x) => x.slug === r.to.slug)?.kind ?? "company"),
        toInvestorId: r.to.kind === "investor" ? investorId : null,
        toInstitutionId: r.to.kind === "institution" ? institutionIds.get(r.to.slug) ?? null : null,
        toTransactionId: r.to.kind === "transaction" ? txIds.get(r.to.slug) ?? null : null,
        relationship: r.relationship, startYear: r.startYear ?? null, endYear: r.endYear ?? null, description: r.description ?? null, claimId, isHypothetical: false,
      });
    }

    await db.delete(quotations).where(eq(quotations.investorId, investorId));
    for (const q of d.quotations) {
      await db.insert(quotations).values({ investorId, quoteText: q.text, context: q.context, sourceId: sourceIds.get(q.source) ?? null, locator: q.locator ?? null, verificationStatus: q.status });
    }
  }

  for (const r of roadmapInvestors) {
    await db.insert(investors).values({
      slug: r.slug, fullName: r.fullName, shortName: r.shortName, bornYear: r.bornYear ?? null, diedYear: r.diedYear ?? null, headline: r.headline,
      eraLabel: r.eraLabel, primaryAssetClasses: r.primaryAssetClasses, publishStatus: "draft", researchStatus: r.researchStatus, roadmapRank: r.roadmapRank,
    }).onConflictDoNothing({ target: investors.slug });
  }
  for (const i of roadmapInstitutions) {
    await db.insert(institutions).values({ slug: i.slug, name: i.name, kind: i.kind, headquarters: i.headquarters ?? null, summary: i.summary, publishStatus: "draft" })
      .onConflictDoNothing({ target: institutions.slug });
  }

  return { investors: dossiers.length + roadmapInvestors.length, claims: claimCount, sources: sourceCount, transactions: txCount };
}

/**
 * Founding account. Created ONLY when ATLAS_FOUNDER_EMAIL and ATLAS_FOUNDER_PASSWORD are supplied
 * by the operator (environment or explicit argument). Public sign-up never reaches this path.
 */
export async function seedFounder(db: AtlasDb, opts: { email?: string; password?: string; name?: string } = {}): Promise<"created" | "exists" | "skipped"> {
  const email = opts.email ?? process.env.ATLAS_FOUNDER_EMAIL;
  const password = opts.password ?? process.env.ATLAS_FOUNDER_PASSWORD;
  const name = opts.name ?? process.env.ATLAS_FOUNDER_NAME ?? "Researcher 001";
  if (!email || !password) return "skipped";
  const existing = await db.query.users.findFirst({ where: eq(users.emailNormalized, email.trim().toLowerCase()) });
  if (existing) {
    if (existing.role !== "platform_owner" || existing.researcherNumber !== 1) await setUserRole(db, null, existing.id, "platform_owner", 1);
    return "exists";
  }
  await createUser(db, { email, password, displayName: name, role: "platform_owner", researcherNumber: 1 });
  return "created";
}
