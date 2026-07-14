import { describe, expect, it, vi } from "vitest";
import { desktopClientId, pollDeviceToken } from "./device-flow";

function response(body: unknown, status = 400): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("desktop device flow", () => {
  it("maps supported operating systems to registered clients", () => {
    expect(desktopClientId("darwin")).toBe("nightthread-desktop-macos");
    expect(desktopClientId("win32")).toBe("nightthread-desktop-windows");
    expect(() => desktopClientId("linux")).toThrow();
  });

  it("respects pending and slow-down polling responses", async () => {
    const pendingFetch = vi.fn<typeof fetch>().mockResolvedValue(response({ error: "authorization_pending" }));
    const slowFetch = vi.fn<typeof fetch>().mockResolvedValue(response({ error: "slow_down" }));
    await expect(pollDeviceToken(new URL("https://nightthread.example"), "client", "code", 5, pendingFetch)).resolves.toEqual({ state: "pending", nextIntervalSeconds: 5 });
    await expect(pollDeviceToken(new URL("https://nightthread.example"), "client", "code", 5, slowFetch)).resolves.toEqual({ state: "pending", nextIntervalSeconds: 10 });
  });

  it("returns the bearer token only after successful exchange", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ access_token: "secret-session-token", token_type: "Bearer", expires_in: 3600 }, 200));
    await expect(pollDeviceToken(new URL("https://nightthread.example"), "client", "code", 5, fetcher)).resolves.toEqual({ state: "authorized", token: "secret-session-token" });
  });
});
