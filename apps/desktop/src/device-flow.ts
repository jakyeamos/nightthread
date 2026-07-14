import { z } from "zod";

export const deviceCodeResponseSchema = z.object({
  device_code: z.string().min(1),
  user_code: z.string().min(1),
  verification_uri: z.string().url(),
  verification_uri_complete: z.string().url(),
  expires_in: z.number().positive(),
  interval: z.number().positive(),
});

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string(),
  expires_in: z.number().positive(),
  scope: z.string().optional(),
});

const tokenErrorSchema = z.object({
  error: z.enum(["authorization_pending", "slow_down", "expired_token", "access_denied", "invalid_request", "invalid_grant"]),
  error_description: z.string().optional(),
});

export type DeviceCodeResponse = z.infer<typeof deviceCodeResponseSchema>;
export type DevicePollResult =
  | { state: "pending"; nextIntervalSeconds: number }
  | { state: "authorized"; token: string }
  | { state: "denied" }
  | { state: "expired" }
  | { state: "failed"; message: string };

export function desktopClientId(platform: NodeJS.Platform): "nightthread-desktop-macos" | "nightthread-desktop-windows" {
  if (platform === "darwin") return "nightthread-desktop-macos";
  if (platform === "win32") return "nightthread-desktop-windows";
  throw new Error("Nightthread desktop supports macOS and Windows only");
}

export async function requestDeviceCode(origin: URL, clientId: string, fetcher: typeof fetch = fetch): Promise<DeviceCodeResponse> {
  const response = await fetcher(new URL("/api/auth/device/code", origin), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: clientId }),
  });
  const payload: unknown = await response.json();
  if (!response.ok) throw new Error("Nightthread could not start desktop sign-in");
  return deviceCodeResponseSchema.parse(payload);
}

export async function pollDeviceToken(origin: URL, clientId: string, deviceCode: string, intervalSeconds: number, fetcher: typeof fetch = fetch): Promise<DevicePollResult> {
  const response = await fetcher(new URL("/api/auth/device/token", origin), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      device_code: deviceCode,
      client_id: clientId,
    }),
  });
  const payload: unknown = await response.json();
  const token = tokenResponseSchema.safeParse(payload);
  if (response.ok && token.success) return { state: "authorized", token: token.data.access_token };
  const error = tokenErrorSchema.safeParse(payload);
  if (!error.success) return { state: "failed", message: "Nightthread returned an invalid sign-in response" };
  if (error.data.error === "authorization_pending") return { state: "pending", nextIntervalSeconds: intervalSeconds };
  if (error.data.error === "slow_down") return { state: "pending", nextIntervalSeconds: intervalSeconds + 5 };
  if (error.data.error === "access_denied") return { state: "denied" };
  if (error.data.error === "expired_token") return { state: "expired" };
  return { state: "failed", message: error.data.error_description ?? "Desktop sign-in failed" };
}
