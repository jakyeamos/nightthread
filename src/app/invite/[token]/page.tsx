import { hashInvitationToken } from "@/domain/invitations";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/access";
import { Brand } from "@/components/brand";

interface InviteRow { id: string; tripId: string; tripName: string; expiresAt: number; revokedAt: number | null }

export const dynamic = "force-dynamic";

async function acceptInvite(formData: FormData): Promise<void> {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const token = String(formData.get("token"));
  const { env } = getCloudflareContext();
  const invitation = await env.DB.prepare(`select id, trip_id as tripId, expires_at as expiresAt, revoked_at as revokedAt from invitation_links where token_hash = ?1`).bind(hashInvitationToken(token)).first<Omit<InviteRow,"tripName">>();
  if (!invitation || invitation.revokedAt || invitation.expiresAt <= Date.now()) redirect("/trips?invite=expired");
  await env.DB.batch([
    env.DB.prepare(`insert into trip_members (trip_id,user_id,role,joined_at) values (?1,?2,'collaborator',?3) on conflict (trip_id,user_id) do nothing`).bind(invitation.tripId, user.id, Date.now()),
    env.DB.prepare(`insert into invitation_redemptions (invitation_id,user_id,accepted_at) values (?1,?2,?3) on conflict do nothing`).bind(invitation.id, user.id, Date.now()),
  ]);
  redirect(`/trips/${invitation.tripId}`);
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/?next=/invite/${encodeURIComponent(token)}`);
  const { env } = getCloudflareContext();
  const invitation = await env.DB.prepare(`select i.id, i.trip_id as tripId, t.name as tripName, i.expires_at as expiresAt, i.revoked_at as revokedAt from invitation_links i join trips t on t.id=i.trip_id where i.token_hash=?1 and t.deleted_at is null and i.revoked_at is null and i.expires_at > unixepoch('subsec')*1000`).bind(hashInvitationToken(token)).first<InviteRow>();
  return <main className="grid min-h-screen place-items-center px-6"><div className="surface w-full max-w-md rounded-2xl p-7 text-center"><Brand /><p className="eyebrow mt-10">Trip invitation</p>{invitation ? <><h1 className="display mt-3 text-5xl">{invitation.tripName}</h1><p className="muted mt-4 text-sm leading-6">Join this private trip as a collaborator. You’ll be able to add places, vote, and edit the shared plan.</p><form action={acceptInvite} className="mt-7"><input type="hidden" name="token" value={token} /><button className="h-11 w-full rounded-xl bg-[var(--ink)] text-sm font-semibold text-[var(--night)]">Accept invitation</button></form></> : <><h1 className="mt-4 text-xl font-semibold">This invitation is no longer active</h1><p className="muted mt-3 text-sm">Ask the trip owner to send a fresh link.</p></>}</div></main>;
}
