import { expect, test, type Page } from "@playwright/test";

const FOUNDER = { email: "researcher001@empire-atlas.test", password: "e2e-founder-passphrase" };
async function signIn(page: Page) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(FOUNDER.email);
  await page.getByLabel("Password").fill(FOUNDER.password);
  await page.getByRole("button", { name: /enter the archive/i }).click();
  await expect(page).toHaveURL(/command-center/);
}

test("a principle with evidence feeds a doctrine that exports escaped and printable", async ({ page }) => {
  await signIn(page);
  await page.goto("/synthesis");
  await page.getByLabel("Principle", { exact: true }).fill("Match debt maturity <b>to</b> strategy");
  await page.getByLabel("Statement").fill("Short loans on long-lived assets create refinancing risk that equity must absorb.");
  await page.getByLabel("Historical evidence").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Save principle" }).click();
  await expect(page.getByText("Match debt maturity").first()).toBeVisible();

  await page.goto("/doctrine");
  const first = page.getByLabel(/^1\./);
  await first.fill("Buy income-producing real estate below replacement cost with a documented exit.");
  await page.getByRole("button", { name: "Save doctrine" }).click();
  await page.goto("/doctrine");
  await expect(page.getByLabel(/^1\./)).toHaveValue(/below replacement cost/);

  const res = await page.request.get("/doctrine/export?format=html");
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toContain("below replacement cost");
  expect(html).not.toContain("<b>to</b>");
  const md = await page.request.get("/doctrine/export?format=md");
  expect(md.status()).toBe(200);
  expect(await md.text()).toContain("Investment Doctrine");
});

test("a ritual day is completed with a journal entry", async ({ page }) => {
  await signIn(page);
  await page.goto("/ritual");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Five days");
  const btn = page.getByRole("button", { name: /^Mark .* complete$/ }).first();
  if (await btn.count()) {
    await page.getByLabel(/^Journal/).first().fill("Read the merger claim; could not establish the lender syndicate.");
    await btn.click();
  }
  await page.goto("/ritual");
  await expect(page.getByText(/could not establish the lender syndicate/).first()).toBeVisible();
});

test("the calculation quiz grades against the finance library", async ({ page }) => {
  await signIn(page);
  await page.goto("/quizzes/capital-calculations");
  // Values computed independently in Python; see tests/unit/quiz.test.ts.
  const answers = ["599.55", "1.40", "62.5", "847761", "8.90", "12500000", "469328", "9.175"];
  for (let i = 0; i < answers.length; i++) await page.locator(`input[name^="q_"]`).nth(i).fill(answers[i]!);
  await page.getByRole("button", { name: "Submit answers" }).click();
  await expect(page).toHaveURL(/results\//);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Passed · 100%");
  await page.goto("/profile");
  await expect(page.getByText("Capital calculations").first()).toBeVisible();
});

test("the program shows progress and the historian degrades honestly without a key", async ({ page }) => {
  await signIn(page);
  await page.goto("/program");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Twenty-four weeks");
  await page.goto("/historian");
  await expect(page.getByRole("button", { name: "Ask the assistant" })).toBeDisabled();
  await page.getByLabel("Your question").fill("How was the Equity Office sale financed?");
  await page.getByRole("button", { name: "Search the evidence" }).click();
  await expect(page.getByRole("region", { name: "Retrieved evidence" })).toBeVisible();
});

test("admin sees analytics and the organizations page", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/analytics");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Platform analytics");
  await page.goto("/admin/organizations");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
