import fs from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { queryRows, type AtlasDatabase } from "./client";

const MIGRATIONS_DIR = path.join(process.cwd(), "src", "db", "migrations");

export function listMigrationFiles(dir = MIGRATIONS_DIR): string[] {
  return fs.readdirSync(/*turbopackIgnore: true*/ dir).filter((f) => f.endsWith(".sql")).sort();
}

/** Applies every pending SQL migration in lexical order, recording each in atlas_migrations. */
export async function runMigrations(database: AtlasDatabase, dir = MIGRATIONS_DIR): Promise<string[]> {
  const { db, execRaw } = database;
  await execRaw(`create table if not exists atlas_migrations (name text primary key, applied_at timestamptz not null default now());`);
  const appliedRows = await queryRows<{ name: string }>(db, sql`select name from atlas_migrations`);
  const applied = new Set(appliedRows.map((r) => r.name));
  const ran: string[] = [];
  for (const file of listMigrationFiles(dir)) {
    if (applied.has(file)) continue;
    const text = fs.readFileSync(/*turbopackIgnore: true*/ path.join(dir, file), "utf8");
    await execRaw(text);
    await db.execute(sql`insert into atlas_migrations (name) values (${file}) on conflict do nothing`);
    ran.push(file);
  }
  return ran;
}
