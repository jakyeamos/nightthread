import { describe, expect, it } from "vitest";
import { isLocalDemoAuthAllowed } from "@/auth/local-demo";

describe("local demo authentication boundary", () => {
  it("allows only loopback development requests with demo mode enabled", () => {
    expect(isLocalDemoAuthAllowed({ nodeEnv: "development", demoMode: "true", host: "localhost:3000" })).toBe(true);
    expect(isLocalDemoAuthAllowed({ nodeEnv: "development", demoMode: "true", host: "127.0.0.1:3000" })).toBe(true);
    expect(isLocalDemoAuthAllowed({ nodeEnv: "development", demoMode: "true", host: "[::1]:3000" })).toBe(true);
  });

  it("rejects production, disabled demo mode, and non-loopback hosts", () => {
    expect(isLocalDemoAuthAllowed({ nodeEnv: "production", demoMode: "true", host: "localhost:3000" })).toBe(false);
    expect(isLocalDemoAuthAllowed({ nodeEnv: "development", demoMode: "false", host: "localhost:3000" })).toBe(false);
    expect(isLocalDemoAuthAllowed({ nodeEnv: "development", demoMode: "true", host: "nightthread.example.com" })).toBe(false);
  });
});
