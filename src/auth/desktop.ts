export const DESKTOP_AUTH_CLIENTS = [
  "nightthread-desktop-macos",
  "nightthread-desktop-windows",
] as const;

export type DesktopAuthClient = (typeof DESKTOP_AUTH_CLIENTS)[number];

export function isDesktopAuthClient(clientId: string): clientId is DesktopAuthClient {
  return DESKTOP_AUTH_CLIENTS.some((candidate) => candidate === clientId);
}
