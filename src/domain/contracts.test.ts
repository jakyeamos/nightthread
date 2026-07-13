import { describe, expect, it } from "vitest";
import { canUndoDeletion, createDeletionWindow } from "@/domain/deletions";
import { canAcceptInvitation, hashInvitationToken } from "@/domain/invitations";

describe("invitation contracts", () => {
  it("hashes tokens deterministically without retaining plaintext", () => {
    expect(hashInvitationToken("nightthread")).toHaveLength(64);
    expect(hashInvitationToken("nightthread")).toBe(hashInvitationToken("nightthread"));
  });

  it("rejects revoked and boundary-expired invitations", () => {
    const expiry = new Date("2026-08-12T12:00:00Z");
    expect(canAcceptInvitation({ expiresAt: expiry, revokedAt: null }, new Date(expiry.getTime() - 1))).toBe(true);
    expect(canAcceptInvitation({ expiresAt: expiry, revokedAt: null }, expiry)).toBe(false);
    expect(canAcceptInvitation({ expiresAt: expiry, revokedAt: new Date() }, new Date(expiry.getTime() - 1))).toBe(false);
  });
});

describe("deletion contracts", () => {
  it("accepts undo before, but not at, the ten-second boundary", () => {
    const deletedAt = new Date("2026-07-13T12:00:00Z");
    const { purgeAfter } = createDeletionWindow(deletedAt);
    expect(canUndoDeletion(purgeAfter, new Date(purgeAfter.getTime() - 1))).toBe(true);
    expect(canUndoDeletion(purgeAfter, purgeAfter)).toBe(false);
  });
});
