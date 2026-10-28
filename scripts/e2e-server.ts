/**
 * Boots an isolated, seeded instance of the app for Playwright.
 * Uses a throwaway PGlite directory and a known founder account.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createDatabase } from "../src/db/client";
import { runMigrations } from "../src/db/migrate";
import { seedFounder, seedResearch } from "../src/db/seed";

const port = process.env.E2E_PORT ?? "3100";
const dataDir = path.resolve(".data/e2e-pglite");
fs.rmSync(dataDir, { recursive: true, force: true });

const env: NodeJS.ProcessEnv = {
  ...process.env,
  DATABASE_URL: "",
  ATLAS_DATA_DIR: dataDir,
  ATLAS_SESSION_SECRET: "e2e-only-session-secret-not-for-production-use-0001",
  ATLAS_SIGNUP_MODE: "open",
};

async function main() {
  const database = await createDatabase({ dataDir, mode: "file" });
  await runMigrations(database);
  await seedResearch(database.db);
  await seedFounder(database.db, { email: "researcher001@empire-atlas.test", password: "e2e-founder-passphrase", name: "Researcher 001" });
  await database.close();
  const child: ChildProcess = spawn("pnpm", ["exec", "next", "start", "-p", port, "-H", "127.0.0.1"], { env, stdio: "inherit" });
  child.on("exit", (code: number | null) => process.exit(code ?? 0));
  for (const sig of ["SIGINT", "SIGTERM"] as const) process.on(sig, () => child.kill(sig));
}
main().catch((err) => { console.error(err); process.exit(1); });
