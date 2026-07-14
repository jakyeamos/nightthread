import { describe, expect, it } from "vitest";
import { DESKTOP_IPC, isDesktopIpcChannel } from "./ipc";

describe("typed desktop IPC", () => {
  it("accepts only the closed Nightthread channel set", () => {
    expect(isDesktopIpcChannel(DESKTOP_IPC.signOut)).toBe(true);
    expect(isDesktopIpcChannel("nightthread:execute")).toBe(false);
    expect(isDesktopIpcChannel("electron:ipc")).toBe(false);
  });
});
