import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { requireTripMember } from "@/auth/access";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request, context: { params: Promise<{ tripId: string }> }): Promise<Response> {
  const { tripId } = await context.params;
  const { user } = await requireTripMember(tripId);
  const body = await request.formData();
  const file = body.get("file");
  if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size > MAX_BYTES) return Response.json({ error: "INVALID_IMAGE", allowedTypes: [...allowedTypes], maxBytes: MAX_BYTES }, { status: 400 });
  const assetId = crypto.randomUUID();
  const key = `${tripId}/${assetId}`;
  const { env } = getCloudflareContext();
  await env.PRIVATE_ASSETS.put(key, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { tripId, uploadedBy: user.id } });
  await env.DB.prepare(`insert into assets (id,trip_id,source,r2_object_key,mime_type,byte_size,created_at) values (?1,?2,'upload',?3,?4,?5,?6)`).bind(assetId, tripId, key, file.type, file.size, Date.now()).run();
  return Response.json({ id: assetId }, { status: 201 });
}

export async function GET(request: Request, context: { params: Promise<{ tripId: string }> }): Promise<Response> {
  const { tripId } = await context.params;
  await requireTripMember(tripId);
  const assetId = z.string().uuid().safeParse(new URL(request.url).searchParams.get("id"));
  if (!assetId.success) return Response.json({ error: "INVALID_ASSET" }, { status: 400 });
  const { env } = getCloudflareContext();
  const row = await env.DB.prepare(`select r2_object_key as objectKey, mime_type as mimeType from assets where id=?1 and trip_id=?2 and deleted_at is null`).bind(assetId.data, tripId).first<{ objectKey: string; mimeType: string }>();
  if (!row?.objectKey) return new Response("Not found", { status: 404 });
  const object = await env.PRIVATE_ASSETS.get(row.objectKey);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, { headers: { "Content-Type": row.mimeType, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
