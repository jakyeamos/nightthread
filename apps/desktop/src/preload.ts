import { contextBridge, ipcRenderer } from "electron";
import type { DesktopBridge, DesktopShellState, DesktopUpdateState } from "@nightthread/desktop-contract";
import { DESKTOP_IPC } from "./ipc";

function subscribe<T>(channel: string, listener: (value: T) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, value: T): void => listener(value);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

const bridge: DesktopBridge = {
  platform: process.platform === "darwin" ? "macos" : "windows",
  appVersion: process.env.NIGHTTHREAD_APP_VERSION ?? "development",
  beginSignIn: () => ipcRenderer.invoke(DESKTOP_IPC.beginSignIn) as Promise<void>,
  retry: () => ipcRenderer.invoke(DESKTOP_IPC.retry) as Promise<void>,
  goBack: () => ipcRenderer.invoke(DESKTOP_IPC.goBack) as Promise<void>,
  goForward: () => ipcRenderer.invoke(DESKTOP_IPC.goForward) as Promise<void>,
  reload: () => ipcRenderer.invoke(DESKTOP_IPC.reload) as Promise<void>,
  checkForUpdates: () => ipcRenderer.invoke(DESKTOP_IPC.checkForUpdates) as Promise<void>,
  installUpdate: () => ipcRenderer.invoke(DESKTOP_IPC.installUpdate) as Promise<void>,
  openExternal: (url) => ipcRenderer.invoke(DESKTOP_IPC.openExternal, url) as Promise<void>,
  signOut: () => ipcRenderer.invoke(DESKTOP_IPC.signOut) as Promise<void>,
  onUpdateState: (listener) => subscribe<DesktopUpdateState>(DESKTOP_IPC.updateState, listener),
  onShellState: (listener) => subscribe<DesktopShellState>(DESKTOP_IPC.shellState, listener),
};

contextBridge.exposeInMainWorld("nightthreadDesktop", bridge);
