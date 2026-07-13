import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "@/auth/server";

async function handle(request: Request): Promise<Response> {
  const { env } = getCloudflareContext();
  return createAuth(env).handler(request);
}

export { handle as GET, handle as POST };
