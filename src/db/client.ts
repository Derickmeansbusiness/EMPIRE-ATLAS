/**
 * Database client factory.
 *
 * - DATABASE_URL set   → postgres.js driver (any Postgres, including Supabase).
 * - DATABASE_URL empty → embedded PGlite engine persisted in ./.data/pglite (local dev),
 *                        or in-memory when ATLAS_DB_MODE=memory (tests).
 *
 * Both paths expose the same Drizzle API plus `execRaw` for multi-statement SQL migrations.
 */
import * as schema from "./schema";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";

export type AtlasDb = PgDatabase<PgQueryResultHKT, typeof schema>;

export interface AtlasDatabase {
  db: AtlasDb;
  driver: "pglite" | "postgres";
  execRaw: (sqlText: string) => Promise<void>;
  close: () => Promise<void>;
}

declare global {
  var __atlasDb: Promise<AtlasDatabase> | undefined;
}

export interface CreateDatabaseOptions {
  databaseUrl?: string;
  mode?: "memory" | "file";
  dataDir?: string;
}

export async function createDatabase(opts: CreateDatabaseOptions = {}): Promise<AtlasDatabase> {
  const url = opts.databaseUrl ?? process.env.DATABASE_URL ?? "";
  if (url.trim().length > 0) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const sql = postgres(url, { max: 10, prepare: false });
    const db = drizzle(sql, { schema }) as unknown as AtlasDb;
    return {
      db,
      driver: "postgres",
      execRaw: async (text) => { await sql.unsafe(text); },
      close: async () => { await sql.end({ timeout: 5 }); },
    };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const mode = opts.mode ?? (process.env.ATLAS_DB_MODE === "memory" ? "memory" : "file");
  const dataDir = opts.dataDir ?? process.env.ATLAS_DATA_DIR ?? ".data/pglite";
  if (mode === "file") {
    const fs = await import("node:fs");
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const client = mode === "memory" ? new PGlite() : new PGlite(dataDir);
  await client.waitReady;
  const db = drizzle(client, { schema }) as unknown as AtlasDb;
  return {
    db,
    driver: "pglite",
    execRaw: async (text) => { await client.exec(text); },
    close: async () => { await client.close(); },
  };
}

/** Process-wide singleton used by the Next.js server (survives HMR in development). */
export function getDatabase(): Promise<AtlasDatabase> {
  if (!globalThis.__atlasDb) {
    globalThis.__atlasDb = createDatabase().then(async (database) => {
      const { runMigrations } = await import("./migrate");
      await runMigrations(database);
      return database;
    });
  }
  return globalThis.__atlasDb;
}

export async function getDb(): Promise<AtlasDb> {
  return (await getDatabase()).db;
}

/**
 * Driver-portable raw query: PGlite returns `{ rows }`, postgres.js returns an array.
 */
export async function queryRows<T>(db: AtlasDb, query: SQL): Promise<T[]> {
  const result = (await db.execute(query)) as unknown;
  if (Array.isArray(result)) return result as T[];
  return ((result as { rows?: T[] }).rows ?? []) as T[];
}

export { schema };
