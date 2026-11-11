const { test, expect } = require("@playwright/test");

const screens = [
  { id: "dashboard", label: "Home" },
  { id: "properties", label: "Properties" },
  { id: "vendors", label: "Vendors" },
  { id: "tenants", label: "Tenants" },
  { id: "more", label: "More" }
];

async function unlockWorkspace(page) {
  await page.goto("./", { waitUntil: "networkidle" });
  await expect(page.locator("#onboarding")).toBeVisible();
  await page.locator("#enter").click();
  await expect(page.locator("#app")).toBeVisible();
  await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
}

test("live Propledger loads and core screens render without runtime errors", async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  const response = await page.goto("./", { waitUntil: "networkidle" });
  expect(response, "The live app should return an HTTP response").not.toBeNull();
  expect(response.status(), "The live app should return HTTP 200").toBe(200);
  await expect(page).toHaveTitle(/Propledger/i);
  await expect(page.locator("#onboarding")).toBeVisible();

  // The app intentionally hides its main navigation until the preview workspace is unlocked.
  await page.locator("#enter").click();
  await expect(page.locator("#app")).toBeVisible();
  await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();

  for (const screen of screens) {
    const navButton = page.locator(`nav[aria-label="Main navigation"] [data-screen="${screen.id}"]`);
    await expect(navButton).toBeVisible();
    await navButton.click();
    await expect(page.locator(`#${screen.id}`)).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`${testInfo.project.name}-${screen.id}.png`),
      fullPage: true
    });
  }

  await expect(page.locator("#ledgerlyRuntimeWarning")).toHaveCount(0);
  expect(pageErrors, "No uncaught JavaScript errors should occur while navigating core screens").toEqual([]);
});

test("property profile detail opens when a property record is available", async ({ page }, testInfo) => {
  await unlockWorkspace(page);
  const propertiesNav = page.locator('nav[aria-label="Main navigation"] [data-screen="properties"]');
  await propertiesNav.click();
  await expect(page.locator("#properties")).toBeVisible();

  const firstProperty = page.locator("#propertyList .item").first();
  if (await firstProperty.count() === 0) {
    test.skip(true, "This isolated GitHub runner has no user-saved property records; profile detail requires seeded test data.");
  }

  await firstProperty.click();
  const detail = page.locator("#profileDetail");
  await expect(detail).toHaveClass(/open/);
  await page.screenshot({
    path: testInfo.outputPath(`${testInfo.project.name}-property-profile-details.png`),
    fullPage: true
  });
});
