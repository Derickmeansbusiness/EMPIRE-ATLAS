import "./_env";
import { createDatabase } from "../src/db/client";
import { runMigrations } from "../src/db/migrate";
import { seedFounder, seedResearch } from "../src/db/seed";

async function main() {
  const database = await createDatabase();
  await runMigrations(database);
  const research = await seedResearch(database.db);
  console.log(`[atlas] research seeded: ${research.investors} investors (1 published, ${research.investors - 1} queued), ${research.claims} claims, ${research.sources} sources, ${research.transactions} transactions`);
  const founder = await seedFounder(database.db);
  if (founder === "skipped") {
    console.log("[atlas] founder account skipped: set ATLAS_FOUNDER_EMAIL and ATLAS_FOUNDER_PASSWORD (or run `pnpm atlas:create-user`) to create Researcher 001.");
  } else {
    console.log(`[atlas] founder account (Researcher 001, Platform Owner): ${founder}`);
  }
  await database.close();
}
main().catch((err) => { console.error(err); process.exit(1); });
