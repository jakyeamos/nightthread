import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { requireTripMember } from "@/auth/access";
import { canUndoDeletion, createDeletionWindow } from "@/domain/deletions";

const inputSchema = z.object({
  targetKind: z.enum(["trip", "city", "saved_idea", "itinerary_item", "asset"]),
  targetId: z.string().min(1),
});
const tableByKind = { trip: "trips", city: "cities", saved_idea: "saved_ideas", itinerary_item: "itinerary_items", asset: "assets" } as const;

export async function DELETE(request: Request, context: { params: Promise<{ tripId: string }> }): Promise<Response> {
  const { tripId } = await context.params;
  const parsed = inputSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "INVALID_TARGET" }, { status: 400 });
  const requiredRole = parsed.data.targetKind === "trip" || parsed.data.targetKind === "city" ? "owner" : undefined;
  const { user } = await requireTripMember(tripId, requiredRole);
  const { env } = getCloudflareContext();
  const table = tableByKind[parsed.data.targetKind];
  const target = await env.DB.prepare(`select id from ${table} where id=?1 and ${parsed.data.targetKind === "trip" ? "id" : "trip_id"}=?2 and deleted_at is null`).bind(parsed.data.targetId, tripId).first();
  if (!target) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  const deletionId = crypto.randomUUID();
  const window = createDeletionWindow();
  await env.DB.batch([
    env.DB.prepare(`update ${table} set deleted_at=?1 where id=?2`).bind(window.deletedAt.getTime(), parsed.data.targetId),
    env.DB.prepare("insert into deletion_tombstones (id,trip_id,target_kind,target_id,deleted_by,deleted_at,purge_after) values (?1,?2,?3,?4,?5,?6,?7)").bind(deletionId, tripId, parsed.data.targetKind, parsed.data.targetId, user.id, window.deletedAt.getTime(), window.purgeAfter.getTime()),
  ]);
  return Response.json({ deletionId, undoUntil: window.purgeAfter.toISOString() });
}

export async function POST(request: Request, context: { params: Promise<{ tripId: string }> }): Promise<Response> {
  const { tripId } = await context.params;
  const { user } = await requireTripMember(tripId);
  const body = z.object({ deletionId: z.string().min(1) }).safeParse(await request.json());
  if (!body.success) return Response.json({ error: "INVALID_UNDO" }, { status: 400 });
  const { env } = getCloudflareContext();
  const deletion = await env.DB.prepare("select target_kind as targetKind,target_id as targetId,purge_after as purgeAfter from deletion_tombstones where id=?1 and trip_id=?2 and undone_at is null and purged_at is null").bind(body.data.deletionId, tripId).first<{ targetKind: keyof typeof tableByKind; targetId: string; purgeAfter: number }>();
  if (!deletion || !canUndoDeletion(new Date(deletion.purgeAfter))) return Response.json({ error: "UNDO_EXPIRED" }, { status: 409 });
  if ((deletion.targetKind === "trip" || deletion.targetKind === "city")) await requireTripMember(tripId, "owner");
  await env.DB.batch([
    env.DB.prepare(`update ${tableByKind[deletion.targetKind]} set deleted_at=null where id=?1`).bind(deletion.targetId),
    env.DB.prepare("update deletion_tombstones set undone_at=?1 where id=?2").bind(Date.now(), body.data.deletionId),
    env.DB.prepare("insert into activity_events (id,trip_id,actor_user_id,entity_kind,entity_id,action,created_at) values (?1,?2,?3,?4,?5,'restored',?6)").bind(crypto.randomUUID(), tripId, user.id, deletion.targetKind, deletion.targetId, Date.now()),
  ]);
  return Response.json({ restored: true });
}
