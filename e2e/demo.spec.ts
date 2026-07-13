import { expect, test } from "@playwright/test";

test("landing explains privacy and sign-in choices", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /follow the thread/i })).toBeVisible();
  await expect(page.getByText("Private trips. Invited people only.")).toBeVisible();
  await expect(page.getByRole("button", { name: /magic link/i })).toBeVisible();
});

for (const viewport of [
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1728, height: 1117 },
]) {
  test(`planner remains usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/trips/demo/planner");
    await expect(page.getByRole("heading", { name: "Tokyo", exact: true })).toBeVisible();
    await expect(page.getByText("DAY 1", { exact: true })).toBeVisible();
    if (viewport.width >= 1280) await expect(page.getByText("Planning signals")).toBeVisible();
    else await expect(page.getByText("Planning signals")).toBeHidden();
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
    if (viewport.width === 1440) await page.screenshot({ path: "/Users/jakyeamos/.codex/visualizations/2026/07/13/019f5d22-cb38-7723-a51b-d4d4ebb9be5b/nightthread-planner-1440.png", fullPage: false });
  });
}

test("scheduling retains the idea and deletion can be undone", async ({ page }) => {
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
