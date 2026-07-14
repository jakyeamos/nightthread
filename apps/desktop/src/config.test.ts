import { describe, expect, it } from "vitest";
import { parseDesktopOrigin } from "./config";

describe("desktop origin policy", () => {
  it("allows only the Nightthread localhost origin in development", () => {
    expect(parseDesktopOrigin("http://localhost:3000", true).origin).toBe("http://localhost:3000");
    expect(() => parseDesktopOrigin("http://localhost:4000", true)).toThrow();
    expect(() => parseDesktopOrigin("https://nightthread.example", true)).toThrow();
  });

  it("requires a clean HTTPS origin in packaged builds", () => {
    expect(parseDesktopOrigin("https://nightthread.example", false).origin).toBe("https://nightthread.example");
    expect(() => parseDesktopOrigin("http://nightthread.example", false)).toThrow();
    expect(() => parseDesktopOrigin("https://nightthread.example/trips", false)).toThrow();
  });
});
