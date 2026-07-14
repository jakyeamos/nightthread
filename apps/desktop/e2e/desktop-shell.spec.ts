import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { _electron as electron, expect, test } from "@playwright/test";

test("launches the isolated local shell with the typed bridge", async () => {
  const userData = await mkdtemp(join(tmpdir(), "nightthread-electron-e2e-"));
  const appPath = resolve(__dirname, "..");
  const application = await electron.launch({
    args: [appPath, `--user-data-dir=${userData}`],
    env: {
      ...process.env,
      NIGHTTHREAD_DESKTOP_DEV: "true",
      NIGHTTHREAD_WEB_ORIGIN: "http://localhost:3000",
    },
  });
  try {
    const window = await application.firstWindow();
    await expect(window.getByRole("heading", { name: "Your trips, together" })).toBeVisible();
    await expect(window.getByRole("button", { name: "Sign in in browser" })).toBeVisible();
    await expect(window.getByText("Cloud-connected · No offline edits")).toBeVisible();
    const bridge = await window.evaluate(() => {
      const value = (window as Window & { nightthreadDesktop?: Record<string, unknown> }).nightthreadDesktop;
      return value ? Object.keys(value).sort() : [];
    });
    expect(bridge).toEqual(expect.arrayContaining(["appVersion", "beginSignIn", "checkForUpdates", "openExternal", "platform", "signOut"]));
  } finally {
    await application.close();
    await rm(userData, { recursive: true, force: true });
  }
});
