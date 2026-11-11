const { test, expect } = require("@playwright/test");

const screens = [
  { id: "dashboard", label: "Home" },
  { id: "properties", label: "Properties" },
  { id: "vendors", label: "Vendors" },
  { id: "tenants", label: "Tenants" },
  { id: "more", label: "More" }
];

test("live Propledger loads and core screens render without runtime errors", async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  const response = await page.goto("/", { waitUntil: "networkidle" });
  expect(response, "The live app should return an HTTP response").not.toBeNull();
  expect(response.status(), "The live app should return HTTP 200").toBe(200);
  await expect(page).toHaveTitle(/Propledger/i);

  // The prototype should expose its main navigation without requiring test data or edits.
  await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();

  for (const screen of screens) {
    await page.locator(`[data-screen="${screen.id}"]`).first().click();
    await expect(page.locator(`#${screen.id}`)).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`${testInfo.project.name}-${screen.id}.png`),
      fullPage: true
    });
  }

  await expect(page.locator("#ledgerlyRuntimeWarning")).toHaveCount(0);
  expect(pageErrors, "No uncaught JavaScript errors should occur while navigating core screens").toEqual([]);
});

test("property profile detail opens from the Properties screen when a demo property is available", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator('[data-screen="properties"]').first().click();
  await expect(page.locator("#properties")).toBeVisible();

  const propertyList = page.locator("#propertyList");
  const firstProperty = propertyList.locator(".item").first();
  test.skip(await firstProperty.count() === 0, "No property card is present to open in this build");

  await firstProperty.click();
  const detail = page.locator("#profileDetail");
  await expect(detail).toHaveClass(/open/);
  await page.screenshot({
    path: testInfo.outputPath(`${testInfo.project.name}-property-profile-details.png`),
    fullPage: true
  });
});
