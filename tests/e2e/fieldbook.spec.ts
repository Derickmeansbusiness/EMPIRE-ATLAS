import { expect, test, type Page } from "@playwright/test";

const FOUNDER = { email: "researcher001@empire-atlas.test", password: "e2e-founder-passphrase" };
async function signIn(page: Page) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(FOUNDER.email);
  await page.getByLabel("Password").fill(FOUNDER.password);
  await page.getByRole("button", { name: /enter the archive/i }).click();
  await expect(page).toHaveURL(/command-center/);
}
// 1×1 transparent PNG
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

async function startFreshWalk(page: Page) {
  await page.goto("/fieldbook/properties/linden-court-apartments");
  const fresh = page.getByRole("button", { name: "Start a new one" });
  if (await fresh.count()) await fresh.click(); else await page.getByRole("button", { name: "Start a walk" }).click();
  await expect(page).toHaveURL(/\/walk\/[0-9a-f-]+$/);
}
const rate = (page: Page, itemKey: string, label: string) => page.locator(`fieldset[data-item="${itemKey}"]`).getByText(label, { exact: true }).click();

test("first end-to-end workflow: passage → statement challenge → walk → reconciliation → saved report", async ({ page, browser }) => {
  await signIn(page);

  // 1–3. Open the Fieldbook, read the sourced passage analysis, identify the skill
  await page.goto("/fieldbook");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Observe. Question. Verify. Underwrite. Decide.");
  await page.getByRole("link", { name: "Read the analysis" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Grant Cardone, p. 39");
  await expect(page.getByText("How to Create Wealth Investing in Real Estate").first()).toBeVisible();
  await expect(page.getByText("First-person account.", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("No verified supporting facts yet")).toBeVisible();
  await expect(page.getByText("Unsupported conclusion: do not cite").first()).toBeVisible();
  for (let n = 1; n <= 10; n++) await expect(page.locator("main section[aria-label='Ten-dimension analysis'] h2").nth(n - 1)).toContainText(`${n}.`);
  await page.locator("details[data-activity='analyze-operating-statements'] summary").click();
  await expect(page.getByText("What the passage does not say").first()).toBeVisible();

  // 4. Launch the fictional statement challenge
  await page.getByRole("link", { name: "Launch the statement challenge" }).click();
  await expect(page).toHaveURL(/challenges\/linden-court-t12$/);

  // 5–6. Normalise the statement; live totals update; answer everything
  await expect(page.getByText("$492,980").first()).toBeVisible();
  const set = async (id: string, v: string) => page.locator(`#${id}`).fill(v);
  await set("amt_vacancy", "82920"); await set("amt_creditLoss", "14200"); await set("amt_management", "32390.4"); await set("amt_repairs", "41600"); await set("amt_taxes", "78880"); await set("amt_reserves", "16000");
  await expect(page.locator("dl[aria-live='polite']")).toContainText("$389,890");
  await set("basis_vacancy", "Six vacant units on the rent roll at in-place rents");
  await set("basis_creditLoss", "Delinquency report: 14,200 more than 60 days past due");
  await set("basis_management", "Third-party management fee at 4% of EGI");
  await set("basis_repairs", "Removed the one-time sealcoat capex; normalised to $650 per unit");
  await set("basis_taxes", "Reassessed at the asking price using the effective rate");
  await set("basis_reserves", "$250 per unit per year replacement reserve");
  await set("reportedNoi", "492980"); await set("capRatePct", "5.7337"); await set("dscr", "1.1333"); await set("debtYieldPct", "8.821"); await set("maxPrice", "5377788");
  for (const id of ["management_missing", "repairs_low", "capex_in_opex", "tax_reassessment", "vacancy_understated", "credit_loss_understated", "reserves_missing"]) await page.locator(`input[name="anomalies"][value="${id}"]`).check();
  await page.locator("#questions").fill([
    "How will property taxes be reassessed on a sale at the asking price?", "Can you share a current insurance quote and loss runs?", "Please send invoices and scope for the parking lot work and the repairs ledger detail.",
    "What is the collections history and aging of delinquent balances?", "What was occupancy month by month, and are any units offline?", "What would third-party management cost versus the seller family's staff?",
    "What documents support the other income?", "What capital work has been done and what is the roof age and reserve history?",
  ].join("\n"));
  await page.locator("#largestDriver").selectOption("vacancy"); await page.locator("#dscrPasses").selectOption("no"); await page.locator("#recommendation").selectOption("negotiate");
  await page.locator("#rationale").fill("Normalised NOI near $390,000 gives a 5.7% cap rate at the ask and a DSCR under 1.25x, so the price has to come down toward $5.4 million.");

  // 7. Save answers and receive a transparent assessment
  await page.getByRole("button", { name: "Submit for assessment" }).click();
  await expect(page).toHaveURL(/results\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("100 / 100");
  await expect(page.getByText("Scoring detail")).toBeVisible();
  await expect(page.getByText("Matches the model solution").first()).toBeVisible();

  // 8. Open the linked fictional property
  await page.getByRole("link", { name: "Open Linden Court Apartments" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Linden Court Apartments");
  await expect(page.getByText("does not exist", { exact: false })).toBeVisible();

  // 9–10. Structured walk: rate items, persist, record findings with a cost source, attach a photo, add a follow-up
  await startFreshWalk(page);
  const walkUrl = page.url();
  await expect(page.getByText("Walk only areas you are lawfully permitted to enter", { exact: false }).first()).toBeVisible();
  await expect(page.locator("[data-testid=rated-count]")).toHaveText("0");
  await page.getByText("Parking, landscaping and lighting").click();
  await rate(page, "parking.surface", "Poor");
  await expect(page.locator("[data-testid=rated-count]")).toHaveText("1");
  await expect(page.locator("[data-testid=save-status]")).toHaveText("All changes saved.");
  await page.reload();
  await expect(page.locator("[data-testid=rated-count]")).toHaveText("1");
  await expect(page.locator('fieldset[data-item="parking.surface"] input[value="poor"]')).toBeChecked();

  await page.getByText("Parking, landscaping and lighting").click();
  await page.locator('fieldset[data-item="parking.surface"]').getByRole("link", { name: "Record a finding for this item" }).click();
  await expect(page.getByText("For checklist item:")).toBeVisible(); // the form remounts for the chosen item
  await page.getByLabel("Where (building, room or area)").fill("Main drive aisle and Building B frontage");
  await page.getByLabel("Component").selectOption("paving");
  await page.getByLabel("What you observed").fill("Interconnected cracking visible through fresh sealcoat, patched seams and ponding near the dumpster.");
  await page.getByLabel("Observed condition").selectOption("poor");
  await page.getByLabel("Severity").selectOption("material_repair");
  await page.getByLabel("Your confidence").selectOption("medium");
  await page.getByLabel("Low ($)").fill("40000"); await page.getByLabel("High ($)").fill("60000");
  await page.getByRole("button", { name: "Save finding" }).click();
  await expect(page.getByText("Say where the cost estimate comes from", { exact: false })).toBeVisible(); // cost without a source is refused
  // the refusal must not wipe what was chosen
  await expect(page.getByLabel("Component")).toHaveValue("paving"); await expect(page.getByLabel("Severity")).toHaveValue("material_repair"); await expect(page.getByLabel("Low ($)")).toHaveValue("40000");
  await page.getByLabel("Source of the estimate").fill("Own estimate, not a quote");
  await page.getByRole("button", { name: "Save finding" }).click();
  await expect(page.getByText("Finding saved.")).toBeVisible();
  await expect(page.locator("section[aria-label='Findings']").getByText("Main drive aisle and Building B frontage").first()).toBeVisible();

  // second finding: hidden condition → specialist, no cost
  await page.goto(`${walkUrl}?item=roof.interior#finding-form`);
  await page.getByLabel("Where (building, room or area)").fill("Building A top-floor corridor");
  await page.getByLabel("Component").selectOption("roof");
  await page.getByLabel("What you observed").fill("Brown ring on a ceiling tile and bubbled paint above a door.");
  await page.getByLabel("Severity").selectOption("specialist_investigation_required");
  await page.getByLabel("Specialist needed").fill("Roofing contractor");
  await page.getByRole("button", { name: "Save finding" }).click();
  await expect(page.getByText("Finding saved.")).toBeVisible();

  // photo: refused without consent semantics is covered below; here a real image is attached to the pavement finding
  await page.reload();
  const card = page.locator("section[aria-label='Findings'] .card", { hasText: "Main drive aisle and Building B frontage" });
  await card.locator('input[type="file"]').setInputFiles({ name: "lot.png", mimeType: "image/png", buffer: PNG });
  await card.getByLabel(/I have permission to photograph/).check();
  await card.getByRole("button", { name: "Upload photo" }).click();
  const img = page.locator("section[aria-label='Findings'] img").first();
  await expect(img).toBeVisible();
  const photoSrc = await img.getAttribute("src");
  expect(photoSrc).toMatch(/^\/fieldbook\/media\/[0-9a-f-]+$/);
  expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);

  await page.locator("#fu-title").fill("Request the pavement invoice and scope");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("Request the pavement invoice and scope")).toBeVisible();

  // 11. Finish the walk and compare site findings with reported financials
  await page.getByRole("button", { name: "Finish the walk and reconcile" }).click();
  await expect(page).toHaveURL(/reconcile\?session=/);
  await expect(page.getByRole("heading", { name: "1. What the seller reports" })).toBeVisible();
  await expect(page.getByText("$492,980").first()).toBeVisible();
  await expect(page.locator("[data-check=pavement]")).toContainText("$42,000");
  await expect(page.locator("[data-check=reserves]")).toBeVisible();
  for (const t of await page.locator("[data-check]").allInnerTexts()) expect(t).not.toMatch(/fraud|misrepresent|deceiv|lied/i); // questions, not accusations
  await expect(page.getByRole("heading", { name: "5. What we underwrite" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open the base case in the Capital Lab underwriter/ })).toHaveAttribute("href", /lab\/underwriter\?.*purchasePrice=6800000/);

  // 12–13. Generate the screening report and save it privately
  await page.getByLabel("Your screening decision").selectOption("negotiate");
  await page.getByLabel("Reasons").fill("Normalised NOI is well below the seller's figure, the base case fails the lender DSCR test, and the lot needs work the seller did not reserve for.");
  await page.getByRole("button", { name: "Generate and save the report" }).click();
  await expect(page).toHaveURL(/fieldbook\/reports\/[0-9a-f-]+$/);
  const reportUrl = page.url();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Property Intelligence Report: Linden Court Apartments");
  const frame = page.frameLocator("iframe[title='Property Intelligence Report']");
  await expect(frame.getByText("Screening decision: Negotiate")).toBeVisible();
  await expect(frame.getByText("6. Investment implications")).toBeVisible();
  const md = await page.request.get(`${reportUrl}/export?format=md`);
  expect(md.status()).toBe(200); expect(await md.text()).toContain("5. What we underwrite");
  await page.goto("/library");
  await expect(page.getByText("Property Intelligence Report: Linden Court Apartments").first()).toBeVisible();

  // Private to its owner: a different account cannot read the report or the photo
  const other = await browser.newContext(); const o = await other.newPage();
  await o.goto("/sign-up");
  await o.getByLabel("Display name").fill("Other Student"); await o.getByLabel("Email").fill(`other-${Date.now()}@empire-atlas.test`); await o.getByLabel("Password").fill("student-passphrase-1");
  await o.getByRole("button", { name: /create research account/i }).click(); await expect(o).toHaveURL(/command-center/);
  expect((await o.request.get(reportUrl)).status()).toBe(404);
  expect((await o.request.get(`${reportUrl}/export?format=md`)).status()).toBe(404);
  expect((await o.request.get(photoSrc!)).status()).toBe(404);
  await o.goto("/fieldbook"); await expect(o.getByText("None yet. Reports are saved")).toBeVisible();
  await other.close();
});

test("checklist drafts survive losing the connection and sync when it returns", async ({ page, context }) => {
  await signIn(page); await startFreshWalk(page);
  await page.getByText("Roof observations").click();
  await context.setOffline(true);
  await rate(page, "roof.visible", "Fair");
  await expect(page.locator("[data-testid=save-status]")).toContainText("Offline");
  await expect(page.locator("[data-testid=rated-count]")).toHaveText("1");
  await context.setOffline(false);
  await expect(page.locator("[data-testid=save-status]")).toHaveText("All changes saved.", { timeout: 15_000 });
  await page.reload();
  await expect(page.locator('fieldset[data-item="roof.visible"] input[value="fair"]')).toBeChecked();
});

test("location is tagged only when the user taps and allows it", async ({ page, context }) => {
  await signIn(page); await startFreshWalk(page);
  await expect(page.getByText("Tagged", { exact: false })).toHaveCount(0);
  await context.grantPermissions(["geolocation"]); await context.setGeolocation({ latitude: 41.8781, longitude: -87.6298, accuracy: 20 });
  await page.getByRole("button", { name: /Tag my location/ }).click();
  await expect(page.getByText("Tagged 41.8781, -87.6298")).toBeVisible();
  await page.getByRole("button", { name: "Remove location" }).click();
  await expect(page.getByRole("button", { name: /Tag my location/ })).toBeVisible();
});

test("the walk is usable on a phone: no sideways scroll and touch-sized controls", async ({ page }) => {
  await signIn(page); await startFreshWalk(page);
  await page.getByText("Parking, landscaping and lighting").click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const box = await page.locator('fieldset[data-item="parking.surface"] label').first().boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await page.goto("/fieldbook/challenges/linden-court-t12");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test("uploads and private routes refuse what they should", async ({ page, browser }) => {
  await signIn(page); await startFreshWalk(page);
  const sessionId = page.url().match(/walk\/([0-9a-f-]+)$/)![1]!;
  const post = (data: Record<string, string | { name: string; mimeType: string; buffer: Buffer }>) => page.request.post("/fieldbook/media", { multipart: data });
  expect((await post({ sessionId, photo: { name: "a.png", mimeType: "image/png", buffer: PNG } })).status()).toBe(400); // no consent
  expect((await post({ sessionId, consent: "1", photo: { name: "evil.png", mimeType: "image/png", buffer: Buffer.from("<script>alert(1)</script>") } })).status()).toBe(400); // not an image
  expect((await post({ sessionId, consent: "1", photo: { name: "big.png", mimeType: "image/png", buffer: Buffer.concat([PNG, Buffer.alloc(3_100_000)]) } })).status()).toBeGreaterThanOrEqual(400); // too large
  expect((await post({ sessionId: "00000000-0000-0000-0000-000000000000", consent: "1", photo: { name: "a.png", mimeType: "image/png", buffer: PNG } })).status()).toBe(400); // not your session
  expect((await page.request.post("/fieldbook/media", { headers: { origin: "https://evil.example" }, multipart: { sessionId, consent: "1", photo: { name: "a.png", mimeType: "image/png", buffer: PNG } } })).status()).toBe(403); // cross-site origin
  const anon = await browser.newContext();
  const m = await anon.request.get("/fieldbook/media/00000000-0000-0000-0000-000000000000", { maxRedirects: 0 }); expect([302, 307, 308, 404]).toContain(m.status());
  const r = await anon.request.get("/fieldbook", { maxRedirects: 0 }); expect([302, 307, 308]).toContain(r.status());
  await anon.close();
});
