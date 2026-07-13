import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

export function getDatabase(): DrizzleD1Database<typeof schema> {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
}
