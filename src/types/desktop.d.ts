import type { DesktopBridge } from "@nightthread/desktop-contract";

declare global {
  interface Window {
    nightthreadDesktop?: DesktopBridge;
  }
}

export {};
