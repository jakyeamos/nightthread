import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies, headers } from "next/headers";
import { createAuth } from "@/auth/server";
import { isCurrentLocalDemoRequest, LOCAL_DEMO_COOKIE, LOCAL_DEMO_USER } from "@/auth/local-demo";
import type { TripRole } from "@/domain/types";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface TripMembership {
  user: AuthenticatedUser;
  role: TripRole;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const requestHeaders = await headers();
  if (isCurrentLocalDemoRequest(requestHeaders.get("host")) && (await cookies()).get(LOCAL_DEMO_COOKIE)?.value === "1") {
    return LOCAL_DEMO_USER;
  }
  const { env } = getCloudflareContext();
  const session = await createAuth(env).api.getSession({ headers: requestHeaders });
  if (!session) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };
}

export async function requireTripMember(
  tripId: string,
  requiredRole?: TripRole,
): Promise<TripMembership> {
  const { env } = getCloudflareContext();
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const row = await env.DB.prepare(
    `select tm.role
     from trip_members tm
     join trips t on t.id = tm.trip_id
     where tm.trip_id = ?1 and tm.user_id = ?2 and t.deleted_at is null`,
  )
    .bind(tripId, user.id)
    .first<{ role: TripRole }>();
  if (!row || (requiredRole && row.role !== requiredRole)) {
    throw new Error("FORBIDDEN");
  }
  return { user, role: row.role };
}
