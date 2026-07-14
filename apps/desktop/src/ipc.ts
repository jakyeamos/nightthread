export const DESKTOP_IPC = {
  beginSignIn: "nightthread:begin-sign-in",
  retry: "nightthread:retry",
  goBack: "nightthread:go-back",
  goForward: "nightthread:go-forward",
  reload: "nightthread:reload",
  checkForUpdates: "nightthread:check-for-updates",
  installUpdate: "nightthread:install-update",
  openExternal: "nightthread:open-external",
  signOut: "nightthread:sign-out",
  updateState: "nightthread:update-state",
  shellState: "nightthread:shell-state",
} as const;

export type DesktopIpcChannel = (typeof DESKTOP_IPC)[keyof typeof DESKTOP_IPC];

export function isDesktopIpcChannel(value: string): value is DesktopIpcChannel {
  return Object.values(DESKTOP_IPC).some((channel) => channel === value);
}
