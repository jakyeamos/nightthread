import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireTripMember } from "@/auth/access";
import { createInvitationToken } from "@/domain/invitations";

export async function POST(request: Request, context: { params: Promise<{ tripId: string }> }): Promise<Response> {
  const { tripId } = await context.params;
  const { user } = await requireTripMember(tripId, "owner");
  const { env } = getCloudflareContext();
  const invitation = createInvitationToken();
  const invitationId = crypto.randomUUID();
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("update invitation_links set revoked_at=?1 where trip_id=?2 and revoked_at is null").bind(now, tripId),
    env.DB.prepare("insert into invitation_links (id,trip_id,token_hash,created_by,created_at,expires_at) values (?1,?2,?3,?4,?5,?6)").bind(invitationId, tripId, invitation.tokenHash, user.id, now, invitation.expiresAt.getTime()),
  ]);
  const url = new URL(`/invite/${invitation.token}`, request.url).toString();
  return Response.json({ url, expiresAt: invitation.expiresAt.toISOString() }, { headers: { "Cache-Control": "private, no-store" } });
}
