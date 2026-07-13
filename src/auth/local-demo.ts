export const LOCAL_DEMO_COOKIE = "nightthread-local-demo";
export const LOCAL_DEMO_USER = {
  id: "nightthread-local-demo-user",
  name: "Local trip planner",
  email: "local-demo@nightthread.test",
  image: null,
} as const;

interface LocalDemoAuthContext {
  nodeEnv: string | undefined;
  demoMode: string | undefined;
  host: string | null;
}

export function isLocalDemoAuthAllowed({ nodeEnv, demoMode, host }: LocalDemoAuthContext): boolean {
  if (nodeEnv !== "development" || demoMode !== "true" || !host) return false;
  const hostname = host.startsWith("[") ? host.slice(1, host.indexOf("]")) : host.split(":")[0];
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function isCurrentLocalDemoRequest(host: string | null): boolean {
  return isLocalDemoAuthAllowed({
    nodeEnv: process.env.NODE_ENV,
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE,
    host,
  });
}
