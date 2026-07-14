import { describe, expect, it } from "vitest";
import { sanitizeLogMessage } from "./logger";

describe("desktop logs", () => {
  it("removes credentials from diagnostic messages", () => {
    const message = sanitizeLogMessage("Authorization: Bearer top-secret-token\nrequest failed");
    expect(message).not.toContain("top-secret-token");
    expect(message).toContain("request failed");
  });
});
