import { describe, expect, it } from "vitest";
import { isAllowedExternalUrl, isAllowedNightthreadUrl, resolveDeepLink } from "./navigation";

const origin = new URL("https://nightthread.example");

describe("desktop navigation policy", () => {
  it("keeps in-app navigation on the exact configured origin", () => {
    expect(isAllowedNightthreadUrl("https://nightthread.example/trips", origin)).toBe(true);
    expect(isAllowedNightthreadUrl("https://nightthread.example.evil.test/trips", origin)).toBe(false);
    expect(isAllowedNightthreadUrl("javascript:alert(1)", origin)).toBe(false);
  });

  it("opens only HTTPS external links", () => {
    expect(isAllowedExternalUrl("https://www.electronjs.org" )).toBe(true);
    expect(isAllowedExternalUrl("http://example.com")).toBe(false);
    expect(isAllowedExternalUrl("file:///tmp/private")).toBe(false);
  });

  it("maps validated trip and invitation deep links", () => {
    expect(resolveDeepLink("nightthread://trip/fe16c92f-b590-4fb8-b138-55aca35c918e", origin)?.pathname).toBe("/trips/fe16c92f-b590-4fb8-b138-55aca35c918e");
    expect(resolveDeepLink("nightthread://invite/abcdefghijklmnopqrstuvwxyz", origin)?.pathname).toBe("/invitations/abcdefghijklmnopqrstuvwxyz");
    expect(resolveDeepLink("nightthread://trip/not-a-trip", origin)).toBeNull();
  });
});
