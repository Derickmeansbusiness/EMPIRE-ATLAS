/**
 * Boots the seeded e2e instance and captures screenshots for visual review (docs/reports/screens/).
 * Usage: pnpm build && pnpm exec tsx scripts/dev-screenshots.ts
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { createDatabase } from "../src/db/client";
import { runMigrations } from "../src/db/migrate";
import { seedFounder, seedResearch } from "../src/db/seed";

const port = "3177";
const dataDir = path.resolve(".data/shots-pglite");
const outDir = path.resolve("docs/reports/screens");

async function main() {
  fs.rmSync(dataDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const database = await createDatabase({ dataDir, mode: "file" });
  await runMigrations(database); await seedResearch(database.db);
  await seedFounder(database.db, { email: "researcher001@empire-atlas.test", password: "e2e-founder-passphrase", name: "Researcher 001" });
  await database.close();
  const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: "", ATLAS_DATA_DIR: dataDir, ATLAS_SESSION_SECRET: "screenshots-only-secret-value-not-for-production-0001" };
  const server = spawn("pnpm", ["exec", "next", "start", "-p", port, "-H", "127.0.0.1"], { env, stdio: "ignore" });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 60; i++) { try { const r = await fetch(base); if (r.ok) break; } catch { /* retry */ } await new Promise((r) => setTimeout(r, 500)); }
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
  for (const [name, width] of [["desktop", 1440], ["mobile", 390]] as const) {
    const ctx = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(`${base}/`); await page.screenshot({ path: `${outDir}/home-${name}.png`, fullPage: true });
    await page.goto(`${base}/sign-in`);
    await page.getByLabel("Email").fill("researcher001@empire-atlas.test"); await page.getByLabel("Password").fill("e2e-founder-passphrase");
    await page.getByRole("button", { name: /enter the archive/i }).click(); await page.waitForURL(/command-center/);
    await page.screenshot({ path: `${outDir}/command-center-${name}.png`, fullPage: true });
    await page.goto(`${base}/dossiers/sam-zell`); await page.screenshot({ path: `${outDir}/dossier-${name}.png`, fullPage: width === 390 ? false : true });
    await page.goto(`${base}/deals/equity-office-sale-2007`); await page.screenshot({ path: `${outDir}/deal-${name}.png`, fullPage: false });
    await page.goto(`${base}/lab/underwriter`); await page.screenshot({ path: `${outDir}/underwriter-${name}.png`, fullPage: false });
    await ctx.close();
  }
  await browser.close(); server.kill("SIGTERM");
  console.log(`[atlas] screenshots written to ${outDir}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
