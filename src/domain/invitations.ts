import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, randomBytes } from "@noble/hashes/utils.js";

const INVITATION_TTL_MS = 30 * 24 * 60 * 60 * 1_000;

export interface InvitationToken {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export function hashInvitationToken(token: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(token)));
}

export function createInvitationToken(now = new Date()): InvitationToken {
  const token = bytesToHex(randomBytes(32));
  return {
    token,
    tokenHash: hashInvitationToken(token),
    expiresAt: new Date(now.getTime() + INVITATION_TTL_MS),
  };
}

export function canAcceptInvitation(
  invitation: { expiresAt: Date; revokedAt: Date | null },
  now = new Date(),
): boolean {
  return invitation.revokedAt === null && now.getTime() < invitation.expiresAt.getTime();
}
