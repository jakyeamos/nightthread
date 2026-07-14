import { describe, expect, it } from "vitest";
import { isDesktopAuthClient } from "@/auth/desktop";

describe("desktop authentication clients", () => {
  it("accepts only the two packaged desktop clients", () => {
    expect(isDesktopAuthClient("nightthread-desktop-macos")).toBe(true);
    expect(isDesktopAuthClient("nightthread-desktop-windows")).toBe(true);
    expect(isDesktopAuthClient("nightthread-desktop-linux")).toBe(false);
    expect(isDesktopAuthClient("nightthread-web")).toBe(false);
  });
});
