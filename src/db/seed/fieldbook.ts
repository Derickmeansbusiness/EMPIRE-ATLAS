/** Idempotent seed for The Investor's Fieldbook: the featured passage, its editorial analysis, exercises and fictional properties. */
import { and, eq, isNull } from "drizzle-orm";
import type { AtlasDb } from "@/db/client";
import { analysisStatements, practiceExercises, properties, quoteAnalyses, sourcePassages } from "@/db/schema";
import { FEATURED_EXERCISES, FEATURED_PASSAGE, FEATURED_STATEMENTS } from "@/fieldbook/featured";
import { CHALLENGES } from "@/fieldbook/challenges";

export async function seedFieldbook(db: AtlasDb): Promise<void> {
  const f = FEATURED_PASSAGE;
  const [passage] = await db.insert(sourcePassages).values({
    userId: null, slug: f.slug, sourceTitle: f.sourceTitle, author: f.author, sourceKind: f.sourceKind, location: f.location, isFirstPerson: f.isFirstPerson, excerpt: null,
  }).onConflictDoUpdate({ target: sourcePassages.slug, set: { sourceTitle: f.sourceTitle, author: f.author, location: f.location, isFirstPerson: f.isFirstPerson, updatedAt: new Date() } }).returning();
  const passageId = passage!.id;

  // Platform analysis (user_id NULL) is editorial content: replace it wholesale so edits to the source file apply.
  await db.delete(quoteAnalyses).where(and(eq(quoteAnalyses.passageId, passageId), isNull(quoteAnalyses.userId)));
  const [analysis] = await db.insert(quoteAnalyses).values({ passageId, userId: null, aiAssisted: false }).returning();
  const counters = new Map<number, number>();
  await db.insert(analysisStatements).values(FEATURED_STATEMENTS.map((s) => {
    const position = counters.get(s.dimension) ?? 0; counters.set(s.dimension, position + 1);
    return { analysisId: analysis!.id, dimension: s.dimension, body: s.body, evidenceClass: s.evidenceClass, position };
  }));

  for (const e of FEATURED_EXERCISES) {
    await db.insert(practiceExercises).values({ slug: e.slug, passageId, historicalBehavior: e.historicalBehavior, skillKey: e.skillKey, skillLabel: e.skillLabel, modernExercise: e.modernExercise, launchHref: e.launchHref, position: e.position })
      .onConflictDoUpdate({ target: practiceExercises.slug, set: { passageId, historicalBehavior: e.historicalBehavior, skillKey: e.skillKey, skillLabel: e.skillLabel, modernExercise: e.modernExercise, launchHref: e.launchHref, position: e.position } });
  }

  for (const c of CHALLENGES) {
    const p = c.property;
    await db.insert(properties).values({ userId: null, slug: c.propertySlug, name: p.name, assetClass: p.assetClass, units: p.units, yearBuilt: p.yearBuilt, locationLabel: p.locationLabel, isFictional: true, summary: p.summary, challengeSlug: c.slug })
      .onConflictDoUpdate({ target: properties.slug, set: { name: p.name, units: p.units, yearBuilt: p.yearBuilt, locationLabel: p.locationLabel, summary: p.summary, challengeSlug: c.slug } });
  }
}
