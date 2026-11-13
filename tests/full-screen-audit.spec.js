const { test, expect } = require("@playwright/test");

const routes = [
  "dashboard", "properties", "vendors", "tenants", "more", "activity",
  "accounting", "accounting-ledger", "accounting-statements",
  "accounting-subledgers", "documents", "notices", "settings", "support", "founder"
];

async function unlock(page) {
  await page.goto("./", { waitUntil: "networkidle" });
  await expect(page.locator("#onboarding")).toBeVisible();
  await page.locator("#previewPin").fill("1234");
  await page.locator("#enter").click();
  await expect(page.locator("#app")).toBeVisible();
  await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
}

async function openScreen(page, id) {
  const mainNav = page.locator('nav[aria-label="Main navigation"]');
  const primary = mainNav.locator(`[data-screen="${id}"]`);
  if (await primary.count()) {
    await primary.click();
  } else {
    await mainNav.locator('[data-screen="more"]').click();
    await expect(page.locator("#more")).toBeVisible();
    const entry = page.locator(`#more [data-screen="${id}"]`);
    await expect(entry, `More menu should expose the ${id} screen`).toBeVisible();
    await entry.click();
  }
  await expect(page.locator(`#${id}`), `${id} screen should render`).toBeVisible();
}

async function checkViewport(page, screenId, language) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    section: document.querySelector(".screen:not(.hidden)")?.scrollWidth || 0
  }));
  expect(
    dimensions.document,
    `${screenId} (${language}) must not create page-level horizontal scrolling: ${JSON.stringify(dimensions)}`
  ).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test("all 15 app screens render in English, Arabic and Urdu without page overflow", async ({ page }, testInfo) => {
  test.setTimeout(180000);
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  const response = await page.goto("./", { waitUntil: "networkidle" });
  expect(response).not.toBeNull();
  expect(response.status()).toBe(200);
  await expect(page).toHaveTitle(/Propledger/i);
  await unlock(page);

  const quickSwitch = page.locator("#langQuick");
  for (const id of routes) {
    await openScreen(page, id);
    const screen = page.locator(`#${id}`);
    await expect(screen.locator("h1").first()).toBeVisible();

    // Start in English for every screen, then exercise both RTL languages and restore English.
    const languageStates = [
      { code: "en", dir: "ltr", screenshot: true },
      { code: "ar", dir: "rtl", screenshot: false },
      { code: "ur", dir: "rtl", screenshot: true }
    ];
    for (let index = 0; index < languageStates.length; index++) {
      const state = languageStates[index];
      if (state.code !== "en") await quickSwitch.click();
      await expect(page.locator("html")).toHaveAttribute("lang", state.code);
      await expect(page.locator("html")).toHaveAttribute("dir", state.dir);
      await checkViewport(page, id, state.code);

      if (state.screenshot) {
        await page.screenshot({
          path: testInfo.outputPath(`${testInfo.project.name}-${id}-${state.code}.png`),
          fullPage: true
        });
      }
    }
    await quickSwitch.click(); // Urdu -> English before moving to the next screen.
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  }

  await expect(page.locator("#ledgerlyRuntimeWarning")).toHaveCount(0);
  expect(pageErrors, "No uncaught JavaScript errors across the full screen/language sweep").toEqual([]);
});

test("property, tenant, vendor, receipt and payment dialogs open and close", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await unlock(page);

  await openScreen(page, "properties");
  await page.locator("#addProperty").click();
  await expect(page.locator("#propertyModal")).toHaveClass(/open/);
  await page.locator("#closeProperty").click();
  await expect(page.locator("#propertyModal")).not.toHaveClass(/open/);

  await openScreen(page, "tenants");
  await page.locator("#addTenant").click();
  await expect(page.locator("#tenantManagementModal")).toHaveClass(/open/);
  await page.locator("#closeTenantManagement").click();
  await expect(page.locator("#tenantManagementModal")).not.toHaveClass(/open/);

  await openScreen(page, "vendors");
  await page.locator("#addVendor").click();
  await expect(page.locator("#vendorModal")).toHaveClass(/open/);
  await page.locator("#closeVendor").click();
  await expect(page.locator("#vendorModal")).not.toHaveClass(/open/);

  await openScreen(page, "activity");
  await page.locator("#receipt").click();
  await expect(page.locator("#receiptModal")).toHaveClass(/open/);
  await page.locator("#closeReceipt").click();
  await expect(page.locator("#receiptModal")).not.toHaveClass(/open/);

  await page.locator("#payment").click();
  await expect(page.locator("#paymentModal")).toHaveClass(/open/);
  await page.locator("#closePayment").click();
  await expect(page.locator("#paymentModal")).not.toHaveClass(/open/);

  expect(pageErrors, "Dialog open/close interactions should not throw").toEqual([]);
});

test("accounting report controls execute safely with an empty isolated preview book", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await unlock(page);

  for (const [screen, controls] of [
    ["accounting-ledger", ["#runLedger", "#runTrialBalance"]],
    ["accounting-statements", ["#runStatements"]],
    ["accounting-subledgers", ["#runSubledger"]]
  ]) {
    await openScreen(page, screen);
    for (const selector of controls) {
      await page.locator(selector).click();
    }
  }

  expect(pageErrors, "Empty-book report generation should be handled without runtime errors").toEqual([]);
});

test("dashboard headings, action labels and generated cards translate in Arabic and Urdu", async ({ page }) => {
  await unlock(page);
  const checks = [
    { code: "ar", expected: ["⚠️ مستأجرون متأخرون في السداد", "🧰 الموردون", "✨ ما الذي ترغب في القيام به؟", "متخصص تنظيف", "شقة مارينا فيو 101 · الإمارات"] },
    { code: "ur", expected: ["⚠️ کرایہ ادا کرنے میں تاخیر والے کرایہ دار", "🧰 وینڈرز", "✨ آپ کیا کرنا چاہیں گے؟", "صفائی کے ماہر", "مرینا ویو اپارٹمنٹ 101 · متحدہ عرب امارات"] }
  ];
  for (let index = 0; index < checks.length; index++) {
    const state = checks[index];
    await page.locator("#langQuick").click();
    await expect(page.locator("html")).toHaveAttribute("lang", state.code);
    for (const phrase of state.expected) {
      await expect(page.locator("#dashboard")).toContainText(phrase);
    }
    await expect(page.locator("#dashboard .carousel-heading h2").nth(1)).toContainText(state.expected[0]);
    await expect(page.locator("#dashboard .carousel-heading h2").nth(2)).toContainText(state.expected[1]);
  }
});
