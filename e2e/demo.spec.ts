import { expect, type Page, test } from "@playwright/test";

const viewports = [
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1728, height: 1117 },
];

const rasterPixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

async function mockMapTiles(page: Page, failNight = false): Promise<void> {
  await page.route("**/api/trips/*/map-tiles/**", async (route) => route.fulfill({ status: 200, contentType: "image/png", body: rasterPixel }));
  await page.route("**/gibs.earthdata.nasa.gov/**", async (route) => {
    if (failNight) await route.fulfill({ status: 503, contentType: "text/plain", body: "unavailable" });
    else await route.fulfill({ status: 200, contentType: "image/png", body: rasterPixel });
  });
}

test("Wanderlog fixture stresses long multi-city planning", async ({ page }, testInfo) => {
  await mockMapTiles(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/trips/demo-wanderlog");
  await expect(page.getByRole("heading", { name: "Budapest, Prague & the Alps" })).toBeVisible();
  await expect(page.getByText("18", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("8", { exact: true }).first()).toBeVisible();
  const stopRail = page.getByTestId("route-stop-rail");
  await expect(stopRail.locator('[data-stop-id="bern"]')).toContainText("Transfer stop");
  await expect(page.getByRole("button", { name: "Next route stops" })).toBeEnabled();
  await page.getByRole("button", { name: "Next route stops" }).click();
  await expect(page.getByRole("button", { name: "Previous route stops" })).toBeEnabled();
  await expect(page.getByText("4", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("transport choices open")).toBeVisible();
  await expect(page.getByText("7", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("stays need lodging")).toBeVisible();
  await expect(page.locator('[data-map-mode="journey"] [data-journey-pin]')).toHaveCount(8);
  await expect(page.locator('[data-map-mode="journey"] [data-map-frame]')).toBeVisible();
  await expect(page.locator('[data-map-mode="journey"] button[aria-label*="Transfer stop"]')).toHaveCount(1);
  await page.getByRole("radio", { name: "Globe at night" }).click();
  await expect(page.locator('[data-map-mode="night_globe"] [data-journey-pin]')).toHaveCount(8);
  await expect(page.locator('[data-map-mode="night_globe"] [data-map-frame]')).toBeVisible();
  await expect(page.locator('[data-map-mode="night_globe"] button[aria-label*="Transfer stop"]')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath("nightthread-wanderlog-overview-1440.png"), fullPage: false });

  await page.goto("/trips/demo-wanderlog/planner");
  const contextHeader = page.locator('header[data-active-city]');
  await expect(contextHeader).toHaveAttribute("data-active-city", "budapest");
  await expect(page.getByRole("heading", { name: "Budapest → Prague" })).toBeVisible();
  await expect(page.getByText("7 hr 33 min · provider")).toBeVisible();
  await expect(page.getByText("Transport unresolved", { exact: true }).first()).toBeVisible();
  await page.getByRole("combobox", { name: "Jump to day" }).selectOption("wl-day-18");
  const finalDay = page.getByText("DAY 18", { exact: true });
  await expect(finalDay).toBeVisible();
  await expect(page.getByRole("heading", { name: "Departure day" })).toBeVisible();
  await expect(contextHeader).toHaveAttribute("data-active-city", "rome");
  await expect(contextHeader).toContainText("Europe/Rome");
  await expect(page.getByText("Planning signals · Day 18")).toBeVisible();
  await expect(page.getByRole("button", { name: "Rome · 1", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "First day in Rome" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Oeschinen Lake" })).toHaveCount(0);
  await page.getByRole("button", { name: "All cities · 4" }).click();
  await expect(page.getByRole("heading", { name: "Oeschinen Lake" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "4 open days in Rome" })).toBeVisible();
  await page.getByRole("combobox", { name: "Jump to day" }).selectOption("wl-day-2");
  await expect(page.getByText("Provider marks this place permanently closed")).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await expect(page.getByText("Provider marks this place permanently closed")).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
  await page.screenshot({ path: testInfo.outputPath("nightthread-wanderlog-stress-1440.png"), fullPage: false });
});

for (const viewport of [{ width: 1024, height: 768 }, { width: 1728, height: 1117 }]) {
  test(`Wanderlog fixture reaches the final day at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await mockMapTiles(page);
    await page.setViewportSize(viewport);
    await page.goto("/trips/demo-wanderlog/planner");
    await page.getByRole("combobox", { name: "Jump to day" }).selectOption("wl-day-18");
    const finalDay = page.getByText("DAY 18", { exact: true });
    await expect(finalDay).toBeVisible();
    await expect(page.getByRole("heading", { name: "Departure day" })).toBeVisible();
    await expect(page.locator('header[data-active-city]')).toHaveAttribute("data-active-city", "rome");
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
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
  test(`planner remains usable and light at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await mockMapTiles(page);
    await page.setViewportSize(viewport);
    await page.goto("/trips/demo/planner");
    await expect(page.getByRole("heading", { name: "Tokyo", exact: true }).first()).toBeVisible();
    await expect(page.getByText("DAY 1", { exact: true })).toBeVisible();
    if (viewport.width >= 1280) await expect(page.getByText(/Planning signals · Day 1/)).toBeVisible();
    else await expect(page.getByText(/Planning signals · Day 1/)).toBeHidden();
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
    await expect(page.locator(".night-globe-stage")).toHaveCount(0);
    if (viewport.width === 1440) await page.screenshot({ path: testInfo.outputPath("nightthread-light-planner-1440.png"), fullPage: false });
  });
}

for (const viewport of viewports) {
  test(`journey and night globe work at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await mockMapTiles(page);
    await page.setViewportSize(viewport);
    await page.goto("/trips/demo");
    await expect(page.getByRole("heading", { name: "Tokyo after dark" })).toBeVisible();
    await expect(page.locator('[data-map-mode="journey"]')).toBeVisible();
    await expect(page.locator('[data-map-projection="mercator"] [data-journey-pin]')).toHaveCount(3);
    await expect(page.locator('[data-map-projection="mercator"] [data-map-frame]')).toBeVisible();
    await page.getByRole("radio", { name: "Globe at night" }).click();
    const globe = page.locator('[data-map-mode="night_globe"]');
    await expect(globe).toBeVisible();
    await expect(globe).toHaveAttribute("data-map-projection", "globe");
    await expect(globe.locator('[data-journey-pin]')).toHaveCount(3);
    await expect(globe.locator('[data-map-frame]')).toBeVisible();
    const globeBounds = await globe.boundingBox();
    const canvasBounds = await globe.locator(".maplibregl-canvas").boundingBox();
    expect(canvasBounds?.height).toBeCloseTo(globeBounds?.height ?? 0, 0);
    expect(canvasBounds?.width).toBeCloseTo(globeBounds?.width ?? 0, 0);
    await globe.locator('button[aria-label^="2."]').focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Kyoto, Japan")).toBeVisible();
    await globe.locator(".maplibregl-canvas").focus();
    await page.keyboard.press("ArrowRight");
    await page.getByRole("button", { name: "Recenter journey" }).click();
    await expect(page.getByText(/NASA\/GSFC\/ESDIS GIBS/)).toBeVisible();
    const stageHeight = await page.locator(".night-globe-stage").evaluate((element) => element.getBoundingClientRect().height);
    expect(stageHeight).toBeGreaterThanOrEqual(Math.max(520, viewport.height * 0.65));
    if (viewport.width === 1440) await page.locator(".night-globe-stage").screenshot({ path: testInfo.outputPath("nightthread-globe-stage-1440.png") });
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
