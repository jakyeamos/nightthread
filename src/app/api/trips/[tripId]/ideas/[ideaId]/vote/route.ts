import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireTripMember } from "@/auth/access";

export async function POST(_request: Request, context: { params: Promise<{ tripId: string; ideaId: string }> }): Promise<Response> {
  const { tripId, ideaId } = await context.params;
  const { user } = await requireTripMember(tripId);
  const { env } = getCloudflareContext();
  const idea = await env.DB.prepare("select id from saved_ideas where id=?1 and trip_id=?2 and deleted_at is null").bind(ideaId, tripId).first();
  if (!idea) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  const existing = await env.DB.prepare("select 1 from votes where saved_idea_id=?1 and user_id=?2").bind(ideaId, user.id).first();
  if (existing) await env.DB.prepare("delete from votes where saved_idea_id=?1 and user_id=?2").bind(ideaId, user.id).run();
  else await env.DB.prepare("insert into votes (saved_idea_id,user_id,created_at) values (?1,?2,?3)").bind(ideaId, user.id, Date.now()).run();
  const count = await env.DB.prepare("select count(*) as count from votes where saved_idea_id=?1").bind(ideaId).first<{ count: number }>();
  return Response.json({ active: !existing, count: count?.count ?? 0 });
}
