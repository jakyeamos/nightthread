export type DesktopPlatform = "macos" | "windows";

export type DesktopUpdateState =
  | { phase: "idle" }
  | { phase: "checking" }
  | { phase: "available"; version: string }
  | { phase: "downloading"; percent: number }
  | { phase: "ready"; version: string }
  | { phase: "current" }
  | { phase: "error"; message: string };

export type DesktopShellState =
  | { phase: "starting"; message: string }
  | { phase: "signed-out"; message: string }
  | { phase: "authorizing"; message: string; userCode: string }
  | { phase: "offline"; message: string }
  | { phase: "fatal"; message: string };

export interface DesktopBridge {
  platform: DesktopPlatform;
  appVersion: string;
  beginSignIn(): Promise<void>;
  retry(): Promise<void>;
  goBack(): Promise<void>;
  goForward(): Promise<void>;
  reload(): Promise<void>;
  checkForUpdates(): Promise<void>;
  installUpdate(): Promise<void>;
  openExternal(url: string): Promise<void>;
  signOut(): Promise<void>;
  onUpdateState(listener: (state: DesktopUpdateState) => void): () => void;
  onShellState(listener: (state: DesktopShellState) => void): () => void;
}
