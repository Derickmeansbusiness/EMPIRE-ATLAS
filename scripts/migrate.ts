import "./_env";
import { createDatabase } from "../src/db/client";
import { runMigrations } from "../src/db/migrate";

async function main() {
  const database = await createDatabase();
  const ran = await runMigrations(database);
  console.log(`[atlas] driver=${database.driver} migrations applied: ${ran.length ? ran.join(", ") : "none (up to date)"}`);
  await database.close();
}
main().catch((err) => { console.error(err); process.exit(1); });
