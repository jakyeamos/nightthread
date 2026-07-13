import { expect, type Page, test } from "@playwright/test";

const viewports = [
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1728, height: 1117 },
];

const rasterPixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

async function mockMapTiles(page: Page, failNight = false): Promise<void> {
  await page.route("**/api/trips/demo/map-tiles/**", async (route) => route.fulfill({ status: 200, contentType: "image/png", body: rasterPixel }));
  await page.route("**/gibs.earthdata.nasa.gov/**", async (route) => {
    if (failNight) await route.fulfill({ status: 503, contentType: "text/plain", body: "unavailable" });
    else await route.fulfill({ status: 200, contentType: "image/png", body: rasterPixel });
  });
}

for (const viewport of viewports) {
  test(`welcome remains inviting and light at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /follow the thread/i })).toBeVisible();
    await expect(page.getByText("Private trips. Invited people only.")).toBeVisible();
    await expect(page.getByRole("button", { name: /magic link/i })).toBeVisible();
    await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
    await expect(page.locator(".welcome-photo")).toBeVisible();
  });
}

for (const viewport of viewports) {
  test(`planner remains usable and light at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await mockMapTiles(page);
    await page.setViewportSize(viewport);
    await page.goto("/trips/demo/planner");
    await expect(page.getByRole("heading", { name: "Tokyo", exact: true })).toBeVisible();
    await expect(page.getByText("DAY 1", { exact: true })).toBeVisible();
    if (viewport.width >= 1280) await expect(page.getByText("Planning signals")).toBeVisible();
    else await expect(page.getByText("Planning signals")).toBeHidden();
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
    await expect(page.locator(".night-globe-stage")).toHaveCount(0);
    if (viewport.width === 1440) await page.screenshot({ path: "/Users/jakyeamos/.codex/visualizations/2026/07/13/019f5d22-cb38-7723-a51b-d4d4ebb9be5b/nightthread-light-planner-1440.png", fullPage: false });
  });
}

for (const viewport of viewports) {
  test(`journey and night globe work at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await mockMapTiles(page);
    await page.setViewportSize(viewport);
    await page.goto("/trips/demo");
    await expect(page.getByRole("heading", { name: "Tokyo after dark" })).toBeVisible();
    await expect(page.locator('[data-map-mode="journey"]')).toBeVisible();
    await expect(page.locator('[data-map-projection="mercator"] button[aria-label*="nights"]')).toHaveCount(3);
    await page.getByRole("radio", { name: "Globe at night" }).click();
    const globe = page.locator('[data-map-mode="night_globe"]');
    await expect(globe).toBeVisible();
    await expect(globe).toHaveAttribute("data-map-projection", "globe");
    await expect(globe.locator('button[aria-label*="nights"]')).toHaveCount(3);
    await globe.locator('button[aria-label^="2."]').focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Kyoto, Japan")).toBeVisible();
    await globe.locator(".maplibregl-canvas").focus();
    await page.keyboard.press("ArrowRight");
    await page.getByRole("button", { name: "Recenter journey" }).click();
    await expect(page.getByText(/NASA\/GSFC\/ESDIS GIBS/)).toBeVisible();
    const stageHeight = await page.locator(".night-globe-stage").evaluate((element) => element.getBoundingClientRect().height);
    expect(stageHeight).toBeGreaterThanOrEqual(Math.max(520, viewport.height * 0.65));
    if (viewport.width === 1440) await page.locator(".night-globe-stage").screenshot({ path: "/Users/jakyeamos/.codex/visualizations/2026/07/13/019f5d22-cb38-7723-a51b-d4d4ebb9be5b/nightthread-globe-stage-1440.png" });
  });
}

test("night imagery failure returns to the light journey map", async ({ page }) => {
  await mockMapTiles(page, true);
  await page.goto("/trips/demo");
  await page.getByRole("radio", { name: "Globe at night" }).click();
  await expect(page.getByRole("status")).toContainText("night imagery is unavailable", { timeout: 15_000 });
  await expect(page.locator('[data-map-mode="journey"]')).toBeVisible();
});

test("reduced motion keeps both map modes available", async ({ page }) => {
  await mockMapTiles(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/trips/demo");
  await page.getByRole("radio", { name: "Globe at night" }).click();
  await expect(page.locator('[data-map-mode="night_globe"]')).toBeVisible();
});

test("scheduling retains the idea and deletion can be undone", async ({ page }) => {
  await mockMapTiles(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/trips/demo/planner");
  const tsukiji = page.getByRole("article").filter({ hasText: "Tsukiji outer market" });
  await tsukiji.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("Scheduled", { exact: true })).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Tsukiji outer market" })).toHaveCount(2);
  const item = page.getByRole("article").filter({ hasText: "Arrive at Haneda" });
  await item.hover();
  await item.getByRole("button", { name: /delete arrive/i }).click();
  await expect(page.getByText("Removed Arrive at Haneda")).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("heading", { name: "Arrive at Haneda" })).toBeVisible();
});
