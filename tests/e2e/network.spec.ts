import { expect, test, type Page } from "@playwright/test";

const FOUNDER = { email: "researcher001@empire-atlas.test", password: "e2e-founder-passphrase" };
async function signIn(page: Page) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(FOUNDER.email);
  await page.getByLabel("Password").fill(FOUNDER.password);
  await page.getByRole("button", { name: /enter the archive/i }).click();
  await expect(page).toHaveURL(/command-center/);
}

test("network graph renders nodes, filters, shows evidence on click and links to institution pages", async ({ page }) => {
  await signIn(page);
  await page.goto("/network");
  await expect(page.getByText(/14 relationships/)).toBeVisible();
  const graph = page.getByTestId("network-graph");
  await expect(graph.locator(".react-flow__node")).toHaveCount(await graph.locator(".react-flow__node").count());
  expect(await graph.locator(".react-flow__node").count()).toBeGreaterThan(5);
  await graph.locator(".react-flow__node", { hasText: "Blackstone" }).first().click();
  await expect(page.getByText("Relationships (")).toBeVisible();
  await expect(page.getByRole("link", { name: "evidence →" }).first()).toBeVisible();
  await page.getByRole("link", { name: "Open institution →" }).click();
  await expect(page).toHaveURL(/institutions\/blackstone/);
  await expect(page.getByRole("heading", { level: 1, name: "Blackstone" })).toBeVisible();
  await expect(page.getByText(/Documented relationships \(/)).toBeVisible();
  // Filters
  await page.goto("/network?status=verified_primary&view=table");
  await expect(page.getByText(/filtered from/)).toBeVisible();
  await expect(page.locator("table").getByText("Secondary", { exact: true })).toHaveCount(0);
  await expect(page.locator("table").getByText("Primary", { exact: true }).first()).toBeVisible();
  await page.goto("/network?relationship=co_founded&view=table");
  await expect(page.locator("table").getByText("acquired", { exact: true })).toHaveCount(0);
  await expect(page.locator("table").getByText("co founded").first()).toBeVisible();
});

test("geographic view draws documented locations only", async ({ page }) => {
  await signIn(page);
  await page.goto("/network?view=map");
  await expect(page.getByRole("img", { name: /Schematic map/ })).toBeVisible();
  await expect(page.locator("main aside").getByText("Chicago, IL").first()).toBeVisible();
  await expect(page.locator("main aside").getByRole("link", { name: "Blackstone", exact: true })).toBeVisible();
  await expect(page.getByText("Not a basemap")).toBeVisible();
});
