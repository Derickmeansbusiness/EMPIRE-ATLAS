import { expect, test, type Page } from "@playwright/test";

const FOUNDER = { email: "researcher001@empire-atlas.test", password: "e2e-founder-passphrase" };

async function signIn(page: Page) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(FOUNDER.email);
  await page.getByLabel("Password").fill(FOUNDER.password);
  await page.getByRole("button", { name: /enter the archive/i }).click();
  await expect(page).toHaveURL(/command-center/);
}

test("all seven lab tools render computed results", async ({ page }) => {
  await signIn(page);
  for (const [path, marker] of [
    ["/lab/capital-stack", "Combined DSCR"], ["/lab/underwriter", "Levered IRR"], ["/lab/debt", "All-in annual cost"],
    ["/lab/credit", "Loss severity"], ["/lab/distressed", "Discounted payoff"], ["/lab/waterfall", "Promote earned"], ["/lab/stress", "Combined downturn"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByText(marker).first()).toBeVisible();
    await expect(page.getByText("Hypothetical").first()).toBeVisible();
  }
});

test("saving, versioning, reloading and attaching a model", async ({ page }) => {
  await signIn(page);
  await page.goto("/lab/underwriter?purchasePrice=9320000&loanToValue=60");
  await page.getByLabel("Model name").fill("Meridian Court — base case");
  await page.getByLabel(/Attach to a historical transaction/).selectOption({ index: 1 });
  await page.getByRole("button", { name: "Save model" }).click();
  await expect(page).toHaveURL(/model=/);
  await expect(page.getByText("Model saved.")).toBeVisible();
  await expect(page.getByText(/Loaded saved model “Meridian Court — base case” \(v1\)/)).toBeVisible();
  // Reload from the saved model only (no inputs in the URL) and confirm the saved purchase price is applied
  const url = new URL(page.url());
  const modelId = url.searchParams.get("model")!;
  await page.goto(`/lab/underwriter?model=${modelId}`);
  await expect(page.locator("#p-purchasePrice")).toHaveValue("9320000");
  // New version
  await page.getByLabel(/Model name/).fill("Meridian Court — v2");
  await page.getByLabel("Version note").fill("renamed");
  await page.getByRole("button", { name: "Save new version" }).click();
  await expect(page.getByText(/\(v2\)/)).toBeVisible();
  await page.goto("/lab/models");
  await expect(page.getByRole("link", { name: "Meridian Court — v2" }).first()).toBeVisible();
  await expect(page.getByText(/v2 · updated/).first()).toBeVisible();
  // Attached to the deal, labelled hypothetical
  await page.goto("/deals/equity-office-sale-2007");
  await expect(page.getByRole("link", { name: "Meridian Court — v2" }).first()).toBeVisible();
  // Version history
  await page.goto(`/lab/models/${modelId}`);
  await expect(page.getByText("Version 2").first()).toBeVisible();
  await expect(page.getByText("Version 1").first()).toBeVisible();
});

test("the fictional case is labelled and opens presets in the lab", async ({ page }) => {
  await signIn(page);
  await page.goto("/lab");
  await page.getByRole("link", { name: /Meridian Court/ }).first().click();
  await expect(page).toHaveURL(/lab\/cases\/meridian-court/);
  await expect(page.getByText("Fictional").first()).toBeVisible();
  await expect(page.getByText(/every figure in this case are fictional/)).toBeVisible();
  await page.getByRole("link", { name: "Distressed Acquisition Simulator" }).first().click();
  await expect(page).toHaveURL(/lab\/distressed\?/);
  await expect(page.locator("#p-purchasePriceOfLoan")).toHaveValue("9100000");
  await expect(page.getByText("Foreclose, take REO, sell")).toBeVisible();
});

test("capital stack flags a funding gap and the waterfall sums to the distributions", async ({ page }) => {
  await signIn(page);
  await page.goto("/lab/capital-stack?totalUses=12000000");
  await expect(page.getByText(/Funding gap of/)).toBeVisible();
  await page.goto("/lab/waterfall?lpEquity=900000&gpEquity=100000&preferredReturn=8&tier1Hurdle=8&tier1LpShare=80&tier2Hurdle=18&tier2LpShare=80&residualLpShare=60&distributions=0,0,0,0,1800000");
  // Pref clears the 8% hurdle, so the 330,671.92 remainder flows through the 18% tier at 80/20: LP total 1,586,932.81 (Python-verified).
  await expect(page.getByText("$1,586,933").first()).toBeVisible();
});
