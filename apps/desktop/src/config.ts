import { z } from "zod";

export const DESKTOP_DEVELOPMENT_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

export interface DesktopRuntimeConfig {
  origin: URL;
  development: boolean;
}

export function parseDesktopOrigin(value: string | undefined, development: boolean): URL {
  const rawOrigin = z.string().trim().min(1, "NIGHTTHREAD_WEB_ORIGIN is required").parse(value);
  const origin = new URL(rawOrigin);
  if (origin.pathname !== "/" || origin.search || origin.hash || origin.username || origin.password) {
    throw new Error("NIGHTTHREAD_WEB_ORIGIN must be an origin without a path, query, credentials, or fragment");
  }
  if (development) {
    if (!DESKTOP_DEVELOPMENT_ORIGINS.has(origin.origin)) {
      throw new Error("Development desktop builds may connect only to localhost:3000");
    }
  } else if (origin.protocol !== "https:") {
    throw new Error("Packaged desktop builds require an HTTPS Nightthread origin");
  }
  return origin;
}

export function loadRuntimeConfig(environment: NodeJS.ProcessEnv, packaged: boolean): DesktopRuntimeConfig {
  const development = !packaged && environment.NIGHTTHREAD_DESKTOP_DEV === "true";
  return {
    origin: parseDesktopOrigin(environment.NIGHTTHREAD_WEB_ORIGIN, development),
    development,
  };
}
