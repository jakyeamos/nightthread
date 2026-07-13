import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { requireTripMember } from "@/auth/access";

const inputSchema = z.object({
  kind: z.enum(["heart", "sparkles", "thumbs_up", "eyes"]),
  target: z.discriminatedUnion("type", [
    z.object({ type: z.literal("idea"), id: z.string().min(1) }),
    z.object({ type: z.literal("item"), id: z.string().min(1) }),
  ]),
});

export async function POST(request: Request, context: { params: Promise<{ tripId: string }> }): Promise<Response> {
  const { tripId } = await context.params;
  const { user } = await requireTripMember(tripId);
  const parsed = inputSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "INVALID_REACTION" }, { status: 400 });
  const { env } = getCloudflareContext();
  const table = parsed.data.target.type === "idea" ? "saved_ideas" : "itinerary_items";
  const column = parsed.data.target.type === "idea" ? "saved_idea_id" : "itinerary_item_id";
  const target = await env.DB.prepare(`select id from ${table} where id=?1 and trip_id=?2 and deleted_at is null`).bind(parsed.data.target.id, tripId).first();
  if (!target) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  const existing = await env.DB.prepare(`select id from reactions where user_id=?1 and kind=?2 and ${column}=?3`).bind(user.id, parsed.data.kind, parsed.data.target.id).first<{ id: string }>();
  if (existing) await env.DB.prepare("delete from reactions where id=?1").bind(existing.id).run();
  else await env.DB.prepare(`insert into reactions (id,user_id,kind,${column},created_at) values (?1,?2,?3,?4,?5)`).bind(crypto.randomUUID(), user.id, parsed.data.kind, parsed.data.target.id, Date.now()).run();
  return Response.json({ active: !existing });
}
