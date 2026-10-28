import { createDatabase, type AtlasDatabase } from "@/db/client";
import { runMigrations } from "@/db/migrate";

export async function freshDatabase(): Promise<AtlasDatabase> {
  const database = await createDatabase({ mode: "memory", databaseUrl: "" });
  await runMigrations(database);
  return database;
}
