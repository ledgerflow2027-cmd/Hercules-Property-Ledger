const { test, expect } = require("@playwright/test");

const screens = [
  { id: "dashboard", label: "Home" },
  { id: "properties", label: "Properties" },
  { id: "vendors", label: "Vendors" },
  { id: "tenants", label: "Tenants" },
  { id: "more", label: "More" }
];

async function seedPropertyProfileFixture(page) {
  // Isolated, deterministic data: never touches a user's real browser storage.
  await page.addInitScript(() => {
    const propertyPhotoSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400"><rect width="1200" height="400" fill="#dbeafe"/><rect x="80" y="55" width="1040" height="290" rx="28" fill="#93c5fd"/><path d="M180 300V170l170-100 170 100v130M250 300v-90h90v90" fill="#1e40af"/><text x="650" y="220" font-size="64" text-anchor="middle" fill="#1e3a8a">TEST PROPERTY</text></svg>';
    const tenantPhotoSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect width="600" height="800" fill="#fef3c7"/><circle cx="300" cy="260" r="125" fill="#b45309"/><path d="M80 800c20-220 110-320 220-320s200 100 220 320" fill="#1d4ed8"/><text x="300" y="750" font-size="38" text-anchor="middle" fill="#fff">TEST TENANT</text></svg>';
    const svgData = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    localStorage.setItem("propledger.properties", JSON.stringify([{
      id: "pw-test-property-001",
      name: "Playwright Test Residence",
      type: "Apartment",
      country: "AE",
      address: "Test Street, Abu Dhabi",
      city: "Abu Dhabi",
      units: 1,
      reference: "PW-TEST-001",
      photos: [svgData(propertyPhotoSvg)],
      tenant: {
        id: "pw-test-tenant-001",
        name: "Playwright Test Tenant",
        phone: "+971500000000",
        country: "AE",
        identityType: "Emirates ID",
        identity: "TEST-ONLY",
        photo: svgData(tenantPhotoSvg)
      }
    }]));
  });
}

async function unlockWorkspace(page) {
  await page.goto("./", { waitUntil: "networkidle" });
  await expect(page.locator("#onboarding")).toBeVisible();
  await page.locator("#previewPin").fill("1234");
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
  await page.locator("#previewPin").fill("1234");
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

test("seeded property profile shows aligned property and tenant photos", async ({ page }, testInfo) => {
  await seedPropertyProfileFixture(page);
  await unlockWorkspace(page);

  await page.locator('nav[aria-label="Main navigation"] [data-screen="properties"]').click();
  await expect(page.locator("#properties")).toBeVisible();

  const fixtureProperty = page.locator('#propertyList [data-saved-property="pw-test-property-001"]');
  await expect(fixtureProperty).toBeVisible();
  await fixtureProperty.click();

  const detail = page.locator("#profileDetail");
  await expect(detail).toHaveClass(/open/);
  await expect(detail.getByRole("heading", { name: /Playwright Test Residence/ })).toBeVisible();
  await expect(detail.getByText("Playwright Test Tenant")).toBeVisible();

  const photoPair = detail.locator(".property-tenant-photo-pair");
  await expect(photoPair).toBeVisible();
  const propertyPhoto = photoPair.locator('img[alt="Property photo"]');
  const tenantPhoto = photoPair.locator('img[alt="Associated tenant photo"]');
  await expect(propertyPhoto).toBeVisible();
  await expect(tenantPhoto).toBeVisible();
  await expect(propertyPhoto).toHaveJSProperty("complete", true);
  await expect(tenantPhoto).toHaveJSProperty("complete", true);

  const layout = await photoPair.evaluate(pair => {
    const propertyFrame = pair.children[0].getBoundingClientRect();
    const tenantFrame = pair.children[1].getBoundingClientRect();
    const tenantImage = pair.querySelector('img[alt="Associated tenant photo"]');
    const style = getComputedStyle(tenantImage);
    return {
      propertyHeight: Math.round(propertyFrame.height),
      tenantHeight: Math.round(tenantFrame.height),
      columns: getComputedStyle(pair).gridTemplateColumns,
      objectFit: style.objectFit,
      objectPosition: style.objectPosition
    };
  });
  expect(layout.propertyHeight).toBeGreaterThan(0);
  expect(Math.abs(layout.propertyHeight - layout.tenantHeight)).toBeLessThanOrEqual(1);
  const columnWidths = layout.columns.split(/\s+/).map(value => Number.parseFloat(value));
  expect(columnWidths).toHaveLength(2);
  expect(columnWidths[0]).toBeGreaterThan(0);
  expect(columnWidths[1]).toBeGreaterThan(0);
  expect(Math.abs(columnWidths[0] / columnWidths[1] - 3)).toBeLessThanOrEqual(0.02);
  expect(layout.objectFit).toBe("cover");
  expect(["center center", "50% 50%"]).toContain(layout.objectPosition);

  await page.screenshot({
    path: testInfo.outputPath(`${testInfo.project.name}-seeded-property-profile.png`),
    fullPage: true
  });
});
