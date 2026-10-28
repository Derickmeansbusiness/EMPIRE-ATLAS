import { expect, test, type Page } from "@playwright/test";

/**
 * Acceptance criteria for the first milestone (docs/PRODUCT_SPEC.md §17):
 * homepage → sign in → command center → Zell dossier → sourced findings → timeline → evidence →
 * save a note → bookmark a claim → open the linked transaction → return later and see saved work.
 */
const FOUNDER = { email: "researcher001@empire-atlas.test", password: "e2e-founder-passphrase" };

async function signIn(page: Page, email = FOUNDER.email, password = FOUNDER.password) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /enter the archive/i }).click();
  await expect(page).toHaveURL(/command-center/);
}

test("homepage renders with real counts and navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("great fortunes");
  await expect(page.getByText("Published dossiers")).toBeVisible();
  await expect(page.getByText("Sam Zell").first()).toBeVisible();
  await page.getByRole("link", { name: "Explore the empires" }).first().click();
  await expect(page).toHaveURL(/explore/);
  await expect(page.getByRole("heading", { name: /Samuel Zell/ })).toBeVisible();
});

test("private routes redirect anonymous visitors to sign-in", async ({ page }) => {
  await page.goto("/command-center");
  await expect(page).toHaveURL(/sign-in\?next=/);
  await page.goto("/dossiers/sam-zell");
  await expect(page).toHaveURL(/sign-in/);
});

test("wrong password is rejected without leaking account existence", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(FOUNDER.email);
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: /enter the archive/i }).click();
  await expect(page.getByText("Invalid email or password.")).toBeVisible();
  await page.getByLabel("Email").fill("nobody@empire-atlas.test");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: /enter the archive/i }).click();
  await expect(page.getByText("Invalid email or password.")).toBeVisible();
});

test("Researcher 001 completes the founding research loop and finds saved work on return", async ({ page, context }) => {
  await signIn(page);
  await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
  await expect(page.locator("main").getByText(/Researcher 001/).first()).toBeVisible();

  // The recommendation is derived from stored activity, so its target varies between runs; it must always exist.
  await expect(page.locator("main").getByRole("link", { name: "Go" })).toBeVisible();

  // Dossier
  await page.goto("/dossiers/sam-zell");
  await expect(page.getByRole("heading", { level: 1, name: "Samuel Zell" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Origins and initial advantages/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Failures, bankruptcies/ })).toBeVisible();

  // Timeline + evidence sections render real records
  await expect(page.locator("#timeline").getByText("Equity Residential IPO")).toBeVisible();
  await expect(page.locator("#evidence").getByText(/sourced claims/)).toBeVisible();

  // Inline citation → claim record
  const chip = page.locator("#division-5 a[href^='/evidence/claims/']").first();
  await chip.click();
  await expect(page).toHaveURL(/evidence\/claims\//);
  await expect(page.getByText(/Verified from primary documentation|Supported by credible secondary|Contested|Unverified/).first()).toBeVisible();
  await expect(page.locator("a[href^='/evidence/sources/']").first()).toBeVisible();

  // Bookmark the claim (idempotent across desktop/mobile runs sharing one seeded account)
  const addBookmark = page.getByRole("button", { name: /bookmark this claim/i });
  if (await addBookmark.isVisible()) await addBookmark.click();
  await expect(page.getByRole("button", { name: /remove bookmark/i })).toBeVisible();

  // Save a note linked to the claim
  await page.getByLabel("Title", { exact: true }).fill("Capital events are the best-documented layer");
  await page.getByLabel("Note", { exact: true }).fill("Primary filings exist for the IPOs and the 2007 sale; private-era lenders remain unknown.");
  await page.getByLabel("Tags").fill("zell, evidence");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText("Note saved and linked to this claim.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Capital events are the best-documented layer" }).first()).toBeVisible();

  // Linked transaction
  await page.goto("/dossiers/sam-zell");
  await page.getByRole("link", { name: /Sale of Equity Office Properties Trust/ }).first().click();
  await expect(page).toHaveURL(/deals\/equity-office-sale-2007/);
  await expect(page.getByRole("heading", { name: /Capital stack as documented/ })).toBeVisible();
  await expect(page.getByText("Unknown").first()).toBeVisible();
  await expect(page.getByText("Documented").first()).toBeVisible();

  // Return later: new browser context, same cookies cleared → sign in again and see saved work
  await context.clearCookies();
  await page.goto("/command-center");
  await expect(page).toHaveURL(/sign-in/);
  await signIn(page);
  await expect(page.getByRole("link", { name: "Capital events are the best-documented layer" }).first()).toBeVisible();
  await page.goto("/library");
  await expect(page.getByText(/Bookmarks · [1-9]\d*/)).toBeVisible();
  await expect(page.getByText(/Notes · [1-9]\d*/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Capital events are the best-documented layer" }).first()).toBeVisible();
});

test("a student cannot reach administration, the owner can review a claim", async ({ page, browser }) => {
  // Public sign-up creates a Student
  await page.goto("/sign-up");
  await page.getByLabel("Display name").fill("Student Tester");
  await page.getByLabel("Email").fill(`student-${Date.now()}@empire-atlas.test`);
  await page.getByLabel("Password").fill("student-passphrase-1");
  await page.getByRole("button", { name: /create research account/i }).click();
  await expect(page).toHaveURL(/command-center/);
  await page.goto("/profile");
  await expect(page.locator("main").getByText("Student", { exact: true })).toBeVisible();
  await page.goto("/admin");
  await expect(page).toHaveURL(/command-center\?denied=1/);
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/command-center\?denied=1/);

  // Owner reviews a claim; the change is logged and visible
  const ownerContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  await signIn(owner);
  await owner.goto("/admin/claims?status=unverified");
  await expect(owner.getByRole("heading", { name: /Claims verification queue/ })).toBeVisible();
  const firstForm = owner.locator("form").filter({ has: owner.getByRole("button", { name: "Record review" }) }).first();
  await firstForm.getByLabel("New verification status").selectOption("contested");
  await firstForm.getByLabel("Review note").fill("E2E: downgraded pending primary source.");
  await firstForm.getByRole("button", { name: "Record review" }).click();
  await expect(owner.getByText("Review recorded.")).toBeVisible();
  await owner.goto("/admin");
  await expect(owner.getByText("claim.reviewed").first()).toBeVisible();
  await ownerContext.close();
});

test("lab tools compute from inputs and show warnings", async ({ page }) => {
  await signIn(page);
  await page.goto("/lab/underwriter?loanToValue=85&annualRate=9");
  await expect(page.getByText(/DSCR .* is below the 1.20x threshold/).first()).toBeVisible();
  await page.goto("/lab/debt?principal=1000000&rate=6.5&amort=30&term=10&io=0");
  await expect(page.getByText("$847,761").first()).toBeVisible();
});

test("mobile layout exposes navigation and dossier content", async ({ page }) => {
  await signIn(page);
  await page.goto("/dossiers/sam-zell");
  await expect(page.getByRole("heading", { level: 1, name: "Samuel Zell" })).toBeVisible();
  const menu = page.getByText("Menu").first();
  if (await menu.isVisible()) {
    await menu.click();
    await expect(page.getByRole("link", { name: "Research Library" })).toBeVisible();
  }
});
