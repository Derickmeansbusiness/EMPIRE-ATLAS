/**
 * Static preview snapshot: boots a seeded instance, signs in as the demo founder, crawls the main screens and
 * writes self-contained HTML (scripts stripped, assets relative) for publishing as a read-only preview.
 * Usage: pnpm build && pnpm exec tsx scripts/dev-snapshot.ts <outDir>
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createDatabase } from "../src/db/client";
import { runMigrations } from "../src/db/migrate";
import { seedFounder, seedResearch } from "../src/db/seed";
import { createNote, toggleBookmark } from "../src/lib/data/workspace";
import { getDossier } from "../src/lib/data/research";
import { saveModel } from "../src/lib/data/models";
import { createSubmission, recordChoice, startAttempt } from "../src/lib/data/simulations";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";

const port = "3188";
const dataDir = path.resolve(".data/snapshot-pglite");
const outDir = path.resolve(process.argv[2] ?? ".data/snapshot-out");
const EMAIL = "researcher001@empire-atlas.test"; const PASSWORD = "snapshot-founder-passphrase";

const PAGES: Array<[string, string]> = [
  ["/", "index"], ["/explore", "explore"], ["/investigations", "investigations"], ["/how-it-works", "how-it-works"], ["/deal-archaeology", "deal-archaeology"],
  ["/capital-lab", "capital-lab"], ["/simulations", "simulations"], ["/methodology", "methodology"], ["/membership", "membership"], ["/sign-in", "sign-in"],
  ["/command-center", "command-center"], ["/dossiers", "dossiers"], ["/dossiers/sam-zell", "dossiers-sam-zell"], ["/dossiers/sam-zell?mode=reading", "dossiers-sam-zell-reading"],
  ["/timeline", "timeline"], ["/deals", "deals"], ["/deals/equity-office-sale-2007", "deals-equity-office-sale-2007"],
  ["/evidence/sources", "evidence-sources"], ["/evidence/claims/eop-merger-effective-2007-02-09", "evidence-claim-eop-merger"], ["/evidence/sources/nasdaq-phlx-memo-0349-07", "evidence-source-nasdaq"],
  ["/network?view=table", "network"], ["/network?view=map", "network-map"], ["/institutions/blackstone", "institutions-blackstone"],
  ["/lab", "lab"], ["/lab/underwriter", "lab-underwriter"], ["/lab/capital-stack", "lab-capital-stack"], ["/lab/debt", "lab-debt"], ["/lab/credit", "lab-credit"], ["/lab/distressed", "lab-distressed"], ["/lab/waterfall", "lab-waterfall"], ["/lab/stress", "lab-stress"],
  ["/lab/models", "lab-models"], ["/lab/cases/meridian-court-distressed-multifamily", "lab-case-meridian-court"],
  ["/simulator", "simulator"], ["/committee", "committee"], ["/committee/new", "committee-new"],
  ["/library", "library"], ["/profile", "profile"], ["/roadmap", "roadmap"], ["/admin", "admin"], ["/admin/claims", "admin-claims"], ["/admin/users", "admin-users"],
];

async function main() {
  fs.rmSync(dataDir, { recursive: true, force: true }); fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(path.join(outDir, "assets"), { recursive: true });
  const database = await createDatabase({ dataDir, mode: "file" });
  await runMigrations(database); await seedResearch(database.db);
  await seedFounder(database.db, { email: EMAIL, password: PASSWORD, name: "Researcher 001" });
  const founder = (await database.db.query.users.findFirst({ where: eq(users.emailNormalized, EMAIL) }))!;
  // Demo private work so the dashboard and library are not empty.
  const dossier = (await getDossier(database.db, "sam-zell"))!;
  const claim = dossier.claims.find((c) => c.slug === "eop-merger-effective-2007-02-09")!;
  await createNote(database.db, founder.id, { title: "Capital events are the best-documented layer", body: "Primary filings exist for the IPOs and the 2007 sale; private-era lenders remain unknown.", tags: ["zell", "evidence"], linkedKind: "claim", linkedId: claim.id });
  await toggleBookmark(database.db, founder.id, "claim", claim.id);
  await toggleBookmark(database.db, founder.id, "investor", dossier.investor.id);
  const tx = dossier.transactions[0]!;
  await saveModel(database.db, founder.id, { name: "Meridian Court — base case", kind: "underwriter", assumptions: { purchasePrice: 9320000, closingCostRate: 2.5, initialCapex: 1350000, units: 112, monthlyRentPerUnit: 1180, otherIncomeAnnual: 95000, vacancyRate: 9, operatingExpensesAnnual: 640000, rentGrowth: 3, expenseGrowth: 3, loanToValue: 60, annualRate: 7.25, amortizationYears: 30, interestOnlyYears: 2, holdingPeriodYears: 5, exitCapRate: 6.75, saleCostRate: 2 }, transactionId: tx.id });
  const attempt = await startAttempt(database.db, founder.id, "office-portfolio-top-of-cycle-2007");
  for (const [st, op] of [["offer", "negotiate"], ["competing_bid", "cash"], ["proceeds", "drypowder"], ["shock", "buy"]] as const) await recordChoice(database.db, founder.id, attempt.id, st, op);
  const sub = await createSubmission(database.db, founder.id, { title: "Meridian Court note acquisition (fictional)", thesis: "We buy the defaulted note at 70% of UPB, priced from the foreclosure path, and expect a discounted payoff within six months. ".repeat(3) + "[[claim:carter-hawley-hale-1991]] [[claim:grave-dancer-essay-1976]]", assetDetails: "112-unit garden apartment community, 81% occupied.", sourcesAndUses: "Sources: equity. Uses: note price, carry reserves, legal, closing costs.", assumptionsNarrative: "Rents from the rent roll and comparable leases; carry from tax and insurance source documents.", capitalStack: "All equity; no bridge.", risks: "Contested foreclosure and liquidity for 14 months of carry; interest rate and refinancing risk for the borrower's bridge; renovation execution; insurance and property tax reassessment.", sensitivity: "Stress scenarios: DPO refused, foreclosure runs 21 months, sale at 90% of stabilised value; combined downside.", exitStrategy: "Discounted payoff in month 6, else foreclosure and sale in year 3; 5-year hold fallback.", recommendation: "approve_with_conditions", modelId: null });
  PAGES.push([`/simulator/office-portfolio-top-of-cycle-2007/debrief/${attempt.id}`, "simulator-debrief"], [`/committee/${sub.id}`, "committee-memo"]);
  await database.close();

  const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: "", ATLAS_DATA_DIR: dataDir, ATLAS_SESSION_SECRET: "snapshot-only-secret-value-not-for-production-use-0001" };
  const server = spawn("pnpm", ["exec", "next", "start", "-p", port, "-H", "127.0.0.1"], { env, stdio: "ignore" });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 60; i++) { try { const r = await fetch(base); if (r.ok) break; } catch { /* retry */ } await new Promise((r) => setTimeout(r, 500)); }

  // Sign in through the real action to obtain a session cookie.
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/sign-in`); await page.getByLabel("Email").fill(EMAIL); await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /enter the archive/i }).click(); await page.waitForURL(/command-center/);

  const byPath = new Map<string, string>(); for (const [p, n] of PAGES) byPath.set(p, `${n}.html`);
  const assets = new Map<string, string>();
  const saveAsset = async (url: string): Promise<string> => {
    if (assets.has(url)) return assets.get(url)!;
    const name = path.basename(url.split("?")[0]!);
    const res = await ctx.request.get(`${base}${url}`); const buf = await res.body();
    let out = buf;
    if (name.endsWith(".css")) { let css = buf.toString("utf8"); const urls = Array.from(css.matchAll(/url\((\/_next\/static\/[^)]+)\)/g)).map((m) => m[1]!); for (const u of urls) { const local = await saveAsset(u); css = css.split(u).join(local.replace(/^assets\//, "")); } out = Buffer.from(css, "utf8"); }
    fs.writeFileSync(path.join(outDir, "assets", name), out);
    assets.set(url, `assets/${name}`); return `assets/${name}`;
  };

  for (const [p, name] of PAGES) {
    await page.goto(`${base}${p}`, { waitUntil: "networkidle" });
    let html = await page.content();
    html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<link[^>]+rel="preload"[^>]*>/gi, "").replace(/<link[^>]+rel="modulepreload"[^>]*>/gi, "");
    const cssLinks = Array.from(html.matchAll(/href="(\/_next\/static\/[^"]+\.css)"/g)).map((m) => m[1]!);
    for (const u of cssLinks) { const local = await saveAsset(u); html = html.split(`href="${u}"`).join(`href="${local}"`); }
    html = html.replace(/href="\/icon\.svg[^"]*"/g, 'href="assets/icon.svg"');
    // Rewrite internal links to snapshot pages; unknown internal routes go to the preview note.
    html = html.replace(/href="(\/[^"#?]*)(\?[^"#]*)?(#[^"]*)?"/g, (_m, pth: string, q: string | undefined, hash: string | undefined) => {
      const key = pth + (q ?? ""); const file = byPath.get(key) ?? byPath.get(pth) ?? (pth.startsWith("/dossiers/") || pth.startsWith("/deals/") || pth.startsWith("/evidence/") || pth.startsWith("/lab/") || pth.startsWith("/institutions/") || pth.startsWith("/simulator") || pth.startsWith("/committee") ? "preview-note.html" : "preview-note.html");
      return `href="${file}${hash ?? ""}"`;
    });
    html = html.replace(/<body([^>]*)>/, `<body$1><div style="position:sticky;top:0;z-index:100;background:#C19B63;color:#101722;font:600 12px/1.4 ui-sans-serif,system-ui;letter-spacing:.08em;text-transform:uppercase;padding:8px 16px;text-align:center">Static preview of Empire Atlas · read-only snapshot of the real app, signed in as Researcher 001 · forms and interactive tools need the live deployment</div>`);
    fs.writeFileSync(path.join(outDir, `${name}.html`), html);
  }
  fs.copyFileSync("src/app/icon.svg", path.join(outDir, "assets", "icon.svg"));
  fs.writeFileSync(path.join(outDir, "preview-note.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview note</title><style>body{margin:0;background:#101722;color:#F7F5F0;font-family:ui-sans-serif,system-ui;display:grid;place-items:center;min-height:100vh;padding:16px}main{max-width:560px;text-align:center}h1{font-family:Georgia,serif;font-weight:500;color:#C19B63}a{color:#C19B63}</style></head><body><main><h1>Not in this static preview</h1><p>This snapshot includes the main screens only. Forms, saved models, simulations and filters run on the live deployment.</p><p><a href="index.html">Back to the preview home</a> · <a href="command-center.html">Command Center</a></p></main></body></html>`);
  await browser.close(); server.kill("SIGTERM");
  console.log(`[atlas] snapshot: ${PAGES.length} pages, ${assets.size} assets → ${outDir}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
