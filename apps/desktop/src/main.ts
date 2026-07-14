import { join } from "node:path";
import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  safeStorage,
  screen,
  session,
  shell,
  type MenuItemConstructorOptions,
} from "electron";
import type { DesktopShellState } from "@nightthread/desktop-contract";
import { loadRuntimeConfig, type DesktopRuntimeConfig } from "./config";
import { desktopClientId, pollDeviceToken, requestDeviceCode } from "./device-flow";
import { DESKTOP_IPC } from "./ipc";
import { DesktopLogger } from "./logger";
import { isAllowedExternalUrl, isAllowedNightthreadUrl, resolveDeepLink } from "./navigation";
import { EncryptedTokenStore } from "./token-store";
import { DesktopUpdater } from "./updater";
import { isVisibleOnDisplay, readWindowBounds, writeWindowBounds } from "./window-state";

declare const __NIGHTTHREAD_PACKAGED_WEB_ORIGIN__: string;

let mainWindow: BrowserWindow | null = null;
let runtimeConfig: DesktopRuntimeConfig;
let tokenStore: EncryptedTokenStore;
let currentToken: string | null = null;
let updater: DesktopUpdater;
let shellState: DesktopShellState = { phase: "starting", message: "Opening Nightthread…" };
let authorizationGeneration = 0;
let handledUnauthorizedSession = false;

const logger = new DesktopLogger(join(app.getPath("userData"), "logs", "desktop.log"));
const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.setAsDefaultProtocolClient("nightthread");
  app.on("second-instance", (_event, commandLine) => {
    mainWindow?.show();
    mainWindow?.focus();
    const deepLink = commandLine.find((argument) => argument.startsWith("nightthread://"));
    if (deepLink) void openDeepLink(deepLink);
  });
  app.on("open-url", (event, url) => {
    event.preventDefault();
    void openDeepLink(url);
  });
  app.whenReady().then(startApplication).catch((error: unknown) => void showFatal(error));
}

app.on("window-all-closed", () => {
  updater?.stop();
  app.quit();
});

async function startApplication(): Promise<void> {
  runtimeConfig = loadRuntimeConfig({
    ...process.env,
    NIGHTTHREAD_WEB_ORIGIN: app.isPackaged ? __NIGHTTHREAD_PACKAGED_WEB_ORIGIN__ : process.env.NIGHTTHREAD_WEB_ORIGIN,
  }, app.isPackaged);
  process.env.NIGHTTHREAD_APP_VERSION = app.getVersion();
  tokenStore = new EncryptedTokenStore(join(app.getPath("userData"), "session.json"), safeStorage);
  if (!tokenStore.isAvailable()) throw new Error("Nightthread requires the operating system's secure credential storage");
  currentToken = await tokenStore.read();
  configureSessionSecurity();
  registerIpcHandlers();
  await createMainWindow();
  updater = new DesktopUpdater(() => mainWindow, logger, app.isPackaged);
  updater.start();
  installMenu();
  if (currentToken) await loadWebApplication();
  else await loadLocalShell({ phase: "signed-out", message: "Sign in securely in your browser to continue." });
  const initialDeepLink = process.argv.find((argument) => argument.startsWith("nightthread://"));
  if (initialDeepLink) await openDeepLink(initialDeepLink);
}

async function createMainWindow(): Promise<void> {
  const statePath = join(app.getPath("userData"), "window-state.json");
  const storedBounds = await readWindowBounds(statePath);
  const workAreas = screen.getAllDisplays().map(({ workArea }) => workArea);
  const bounds = isVisibleOnDisplay(storedBounds, workAreas) ? storedBounds : { width: 1440, height: 900 };
  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    backgroundColor: "#f3f8fb",
    title: "Nightthread",
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: runtimeConfig.development,
    },
  });
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("close", () => {
    if (mainWindow) void writeWindowBounds(statePath, mainWindow.getBounds());
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalUrl(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (isAllowedNightthreadUrl(url, runtimeConfig.origin) || url.startsWith("file://")) return;
    event.preventDefault();
    if (isAllowedExternalUrl(url)) void shell.openExternal(url);
  });
  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    void logger.write("error", `Renderer stopped: ${details.reason}`);
    void loadLocalShell({ phase: "fatal", message: "The Nightthread window stopped unexpectedly. Reload to continue." });
  });
  mainWindow.webContents.on("did-finish-load", publishCurrentState);
}

function configureSessionSecurity(): void {
  const defaultSession = session.defaultSession;
  defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  defaultSession.setPermissionCheckHandler(() => false);
  const websocketOrigin = runtimeConfig.origin.origin.replace(/^http/, "ws");
  defaultSession.webRequest.onBeforeSendHeaders(
    { urls: [`${runtimeConfig.origin.origin}/*`, `${websocketOrigin}/*`] },
    (details, callback) => {
      if (!isAllowedNightthreadUrl(details.url.replace(/^ws/, "http"), runtimeConfig.origin)) {
        callback({ requestHeaders: details.requestHeaders });
        return;
      }
      const requestHeaders: Record<string, string> = {
        ...details.requestHeaders,
        "X-Nightthread-Desktop": app.getVersion(),
      };
      if (currentToken) requestHeaders.Authorization = `Bearer ${currentToken}`;
      callback({ requestHeaders });
    },
  );
  defaultSession.webRequest.onCompleted(
    { urls: [`${runtimeConfig.origin.origin}/*`] },
    (details) => {
      if (details.statusCode === 401 && currentToken && !handledUnauthorizedSession) {
        handledUnauthorizedSession = true;
        void clearSession("Your Nightthread session expired. Sign in again to continue.");
      }
    },
  );
}

function registerIpcHandlers(): void {
  ipcMain.handle(DESKTOP_IPC.beginSignIn, () => beginDeviceAuthorization());
  ipcMain.handle(DESKTOP_IPC.retry, () => currentToken ? loadWebApplication() : beginDeviceAuthorization());
  ipcMain.handle(DESKTOP_IPC.goBack, () => mainWindow?.webContents.navigationHistory.goBack());
  ipcMain.handle(DESKTOP_IPC.goForward, () => mainWindow?.webContents.navigationHistory.goForward());
  ipcMain.handle(DESKTOP_IPC.reload, () => mainWindow?.webContents.reload());
  ipcMain.handle(DESKTOP_IPC.checkForUpdates, () => updater.check());
  ipcMain.handle(DESKTOP_IPC.installUpdate, () => updater.install());
  ipcMain.handle(DESKTOP_IPC.openExternal, async (_event, url: unknown) => {
    if (typeof url !== "string" || !isAllowedExternalUrl(url)) throw new Error("Only HTTPS links may open outside Nightthread");
    await shell.openExternal(url);
  });
  ipcMain.handle(DESKTOP_IPC.signOut, () => signOut());
}

async function beginDeviceAuthorization(): Promise<void> {
  const generation = ++authorizationGeneration;
  try {
    const clientId = desktopClientId(process.platform);
    const request = await requestDeviceCode(runtimeConfig.origin, clientId);
    if (!isAllowedNightthreadUrl(request.verification_uri_complete, runtimeConfig.origin)) {
      throw new Error("Nightthread returned an unsafe verification address");
    }
    await loadLocalShell({
      phase: "authorizing",
      message: "Finish signing in and approve this application in your browser.",
      userCode: request.user_code,
    });
    await shell.openExternal(request.verification_uri_complete);
    const deadline = Date.now() + request.expires_in * 1000;
    let intervalSeconds = request.interval;
    while (generation === authorizationGeneration && Date.now() < deadline) {
      await delay(intervalSeconds * 1000);
      const result = await pollDeviceToken(runtimeConfig.origin, clientId, request.device_code, intervalSeconds);
      if (result.state === "pending") {
        intervalSeconds = result.nextIntervalSeconds;
        continue;
      }
      if (result.state === "authorized") {
        await tokenStore.write(result.token);
        currentToken = result.token;
        handledUnauthorizedSession = false;
        await loadWebApplication();
        return;
      }
      if (result.state === "denied") {
        await loadLocalShell({ phase: "signed-out", message: "Connection was denied. You can try again when you're ready." });
        return;
      }
      if (result.state === "expired") {
        await loadLocalShell({ phase: "signed-out", message: "That sign-in request expired. Start a new one to continue." });
        return;
      }
      throw new Error(result.message);
    }
    if (generation === authorizationGeneration) {
      await loadLocalShell({ phase: "signed-out", message: "That sign-in request expired. Start a new one to continue." });
    }
  } catch (error) {
    await logger.write("error", error instanceof Error ? error.message : "Desktop authorization failed");
    await loadLocalShell({ phase: "offline", message: "Nightthread could not reach the sign-in service. Check your connection and retry." });
  }
}

async function loadWebApplication(pathname = "/trips"): Promise<void> {
  try {
    await mainWindow?.loadURL(new URL(pathname, runtimeConfig.origin).toString());
  } catch (error) {
    await logger.write("warn", error instanceof Error ? error.message : "Web application load failed");
    await loadLocalShell({ phase: "offline", message: "Nightthread is offline or unavailable. Your plans are safe in the cloud." });
  }
}

async function loadLocalShell(nextState: DesktopShellState): Promise<void> {
  shellState = nextState;
  await mainWindow?.loadFile(join(__dirname, "shell", "index.html"));
  publishCurrentState();
}

function publishCurrentState(): void {
  mainWindow?.webContents.send(DESKTOP_IPC.shellState, shellState);
  if (updater) mainWindow?.webContents.send(DESKTOP_IPC.updateState, updater.currentState());
}

async function signOut(): Promise<void> {
  authorizationGeneration += 1;
  if (currentToken) {
    try {
      await fetch(new URL("/api/auth/sign-out", runtimeConfig.origin), {
        method: "POST",
        headers: { Authorization: `Bearer ${currentToken}` },
      });
    } catch (error) {
      await logger.write("warn", error instanceof Error ? error.message : "Remote sign-out failed");
    }
  }
  await clearSession("Signed out securely.");
}

async function clearSession(message: string): Promise<void> {
  authorizationGeneration += 1;
  currentToken = null;
  await tokenStore.clear();
  await session.defaultSession.clearStorageData({ storages: ["cookies", "localstorage", "indexdb", "serviceworkers", "cachestorage"] });
  await loadLocalShell({ phase: "signed-out", message });
}

async function openDeepLink(rawUrl: string): Promise<void> {
  if (!runtimeConfig || !currentToken) return;
  const destination = resolveDeepLink(rawUrl, runtimeConfig.origin);
  if (destination) await loadWebApplication(destination.pathname);
}

function installMenu(): void {
  const template: MenuItemConstructorOptions[] = [
    ...(process.platform === "darwin" ? [{ role: "appMenu" as const }] : []),
    {
      label: "Navigation",
      submenu: [
        { label: "Back", accelerator: "Alt+Left", click: () => mainWindow?.webContents.navigationHistory.goBack() },
        { label: "Forward", accelerator: "Alt+Right", click: () => mainWindow?.webContents.navigationHistory.goForward() },
        { label: "Reload", accelerator: "CmdOrCtrl+R", click: () => mainWindow?.webContents.reload() },
      ],
    },
    {
      label: "Nightthread",
      submenu: [
        { label: "Check for Updates…", click: () => void updater.check() },
        { type: "separator" },
        { label: "Sign Out", click: () => void signOut() },
      ],
    },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function showFatal(error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : "Nightthread could not start";
  await logger.write("error", message);
  if (!mainWindow) {
    mainWindow = new BrowserWindow({
      width: 1024,
      height: 768,
      backgroundColor: "#f3f8fb",
      webPreferences: { preload: join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false },
    });
  }
  shellState = { phase: "fatal", message };
  await mainWindow.loadFile(join(__dirname, "shell", "index.html"));
  publishCurrentState();
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
