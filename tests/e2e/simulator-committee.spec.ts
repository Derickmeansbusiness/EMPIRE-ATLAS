import { expect, test, type Page } from "@playwright/test";

const FOUNDER = { email: "researcher001@empire-atlas.test", password: "e2e-founder-passphrase" };
async function signIn(page: Page) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(FOUNDER.email);
  await page.getByLabel("Password").fill(FOUNDER.password);
  await page.getByRole("button", { name: /enter the archive/i }).click();
  await expect(page).toHaveURL(/command-center/);
}

test("a scenario seals outcomes until the final decision, then debriefs with cited history", async ({ page }) => {
  await signIn(page);
  await page.goto("/simulator");
  const card = page.locator("section", { hasText: "The office portfolio at the top of the cycle" }).first();
  const again = card.getByRole("button", { name: "Play again" });
  if (await again.isVisible()) await again.click(); else await card.getByRole("button", { name: /Begin scenario|Continue/ }).click();
  await expect(page).toHaveURL(/simulator\/office-portfolio-top-of-cycle-2007\/play\//);
  await expect(page.getByText("Stage 1 of")).toBeVisible();
  // No outcome text leaks before deciding
  await expect(page.locator("main").getByText(/Blackstone|\$55\.50|Tribune/)).toHaveCount(0);
  // Stage 1: negotiate
  await page.locator("form", { hasText: "keep the solicitation window open" }).getByRole("button", { name: "Commit to this" }).click();
  await expect(page.getByText("Consequence")).toBeVisible();
  await expect(page.getByText(/Stage 2 of \d/)).toBeVisible();
  await page.locator("form", { hasText: "Take the raised all-cash bid" }).getByRole("button", { name: "Commit to this" }).click();
  await expect(page.getByText(/Stage 3 of \d/)).toBeVisible();
  await page.locator("form", { hasText: "distressed dry powder" }).getByRole("button", { name: "Commit to this" }).click();
  await expect(page.getByText(/Stage 4 of \d/)).toBeVisible();
  await page.locator("form", { hasText: "Buy distressed claims" }).getByRole("button", { name: "Commit to this" }).click();
  await expect(page).toHaveURL(/debrief/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/\/100 · Empire Architect/);
  await expect(page.getByText("Documented history").first()).toBeVisible();
  await expect(page.locator("main").getByRole("link", { name: /55\.50/ }).first()).toBeVisible();
  await expect(page.getByText(/the same as yours/).first()).toBeVisible();
  // Simulator list shows completion
  await page.goto("/simulator");
  await expect(page.getByText(/1 completed|2 completed|3 completed/).first()).toBeVisible();
});

test("the committee scores a submission and returns a memo", async ({ page }) => {
  await signIn(page);
  // Save a model to attach
  await page.goto("/lab/underwriter");
  await page.getByLabel(/Model name/).fill("Committee test model");
  await page.getByRole("button", { name: /Save model|Save new version/ }).click();
  await expect(page.getByText("Model saved.")).toBeVisible();
  await page.goto("/committee/new");
  await page.getByLabel("Title").fill("Fictional garden apartments");
  await page.getByLabel("Investment thesis").fill(("We buy below conservative intrinsic value with reserves and a trailing-NOI underwriting. ").repeat(12) + "[[claim:carter-hawley-hale-1991]] [[claim:grave-dancer-essay-1976]] [[claim:eqr-ipo-august-1993]]");
  await page.getByLabel("Attach a saved underwriting model").selectOption({ index: 1 });
  await page.getByLabel("Sources and uses").fill("Sources: equity and senior loan. Uses: price, closing costs, reserves.");
  await page.getByLabel("Underwriting assumptions").fill("Rents from comparable leases and the rent roll source documents.");
  await page.getByLabel("Capital stack").fill("Senior loan at 65% LTV; no mezzanine.");
  await page.getByLabel("Major risks and mitigations").fill(("Refinancing and interest rate risk at maturity; liquidity reserves; rent and occupancy softness; renovation execution; insurance and property tax. ").repeat(6));
  await page.getByLabel("Sensitivity analysis").fill("Stress scenarios: rates +200 bps, values −20%, rents −10%, occupancy −10 points, expenses +15%, combined downside; refinancing at 65% LTV and 1.25x DSCR.");
  await page.getByLabel("Exit strategy").fill("Sale in year 5 to a core buyer at a 7.0% cap rate with a refinancing fallback; 5-year hold.");
  await page.getByLabel("Your recommendation").selectOption("approve");
  await page.getByRole("button", { name: "Submit to committee" }).click();
  await expect(page).toHaveURL(/committee\/[0-9a-f-]+$/);
  await expect(page.getByText("Investment Committee Memo")).toBeVisible();
  await expect(page.getByText(/Verdict:/)).toBeVisible();
  await expect(page.getByText("Financial correctness").first()).toBeVisible();
  await expect(page.getByText(/5-year hold matches/)).toBeVisible();
  await page.goto("/committee");
  await expect(page.getByRole("link", { name: "Fictional garden apartments" }).first()).toBeVisible();
});
