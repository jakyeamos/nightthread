import { z } from "zod";

const tripIdSchema = z.string().uuid();
const invitationTokenSchema = z.string().min(20).max(256).regex(/^[A-Za-z0-9_-]+$/);

export function isAllowedNightthreadUrl(rawUrl: string, origin: URL): boolean {
  try {
    const candidate = new URL(rawUrl);
    return candidate.origin === origin.origin && (candidate.protocol === "https:" || origin.protocol === "http:");
  } catch {
    return false;
  }
}

export function isAllowedExternalUrl(rawUrl: string): boolean {
  try {
    const candidate = new URL(rawUrl);
    return candidate.protocol === "https:";
  } catch {
    return false;
  }
}

export function resolveDeepLink(rawUrl: string, origin: URL): URL | null {
  try {
    const link = new URL(rawUrl);
    if (link.protocol !== "nightthread:") return null;
    if (link.hostname === "trip") {
      const tripId = tripIdSchema.safeParse(link.pathname.replace(/^\//, ""));
      return tripId.success ? new URL(`/trips/${tripId.data}`, origin) : null;
    }
    if (link.hostname === "invite") {
      const token = invitationTokenSchema.safeParse(link.pathname.replace(/^\//, ""));
      return token.success ? new URL(`/invitations/${token.data}`, origin) : null;
    }
    return null;
  } catch {
    return null;
  }
}
