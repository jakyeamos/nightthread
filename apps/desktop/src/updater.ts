import type { BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";
import type { DesktopUpdateState } from "@nightthread/desktop-contract";
import { DESKTOP_IPC } from "./ipc";
import type { DesktopLogger } from "./logger";

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

export class DesktopUpdater {
  private timer: NodeJS.Timeout | null = null;
  private state: DesktopUpdateState = { phase: "idle" };

  constructor(
    private readonly window: () => BrowserWindow | null,
    private readonly logger: DesktopLogger,
    private readonly enabled: boolean,
  ) {
    autoUpdater.channel = "beta";
    autoUpdater.allowPrerelease = true;
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.logger = null;
    autoUpdater.on("checking-for-update", () => this.publish({ phase: "checking" }));
    autoUpdater.on("update-available", (info) => this.publish({ phase: "available", version: info.version }));
    autoUpdater.on("update-not-available", () => this.publish({ phase: "current" }));
    autoUpdater.on("download-progress", (progress) => this.publish({ phase: "downloading", percent: Math.round(progress.percent) }));
    autoUpdater.on("update-downloaded", (info) => this.publish({ phase: "ready", version: info.version }));
    autoUpdater.on("error", (error) => {
      void this.logger.write("error", `Updater failed: ${error.message}`);
      this.publish({ phase: "error", message: "Update check failed. You can keep using Nightthread." });
    });
  }

  start(): void {
    if (!this.enabled) return;
    void this.check();
    this.timer = setInterval(() => void this.check(), FOUR_HOURS_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async check(): Promise<void> {
    if (!this.enabled) {
      this.publish({ phase: "current" });
      return;
    }
    await autoUpdater.checkForUpdates();
  }

  install(): void {
    if (this.state.phase === "ready") autoUpdater.quitAndInstall(false, true);
  }

  currentState(): DesktopUpdateState {
    return this.state;
  }

  private publish(state: DesktopUpdateState): void {
    this.state = state;
    this.window()?.webContents.send(DESKTOP_IPC.updateState, state);
  }
}
