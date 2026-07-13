import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { requireTripMember } from "@/auth/access";
import { createUnsplashProvider } from "@/providers/images";
import { recordProviderTelemetry } from "@/platform/telemetry";

const querySchema = z.object({
  tripId: z.string().min(1),
  q: z.string().trim().min(2).max(160),
});

export async function GET(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    tripId: url.searchParams.get("tripId"),
    q: url.searchParams.get("q"),
  });
  if (!parsed.success) return Response.json({ error: "INVALID_QUERY", requestId }, { status: 400, headers: { "X-Request-Id": requestId } });
  try {
    await requireTripMember(parsed.data.tripId);
    const { env } = getCloudflareContext();
    const results = await createUnsplashProvider(env.UNSPLASH_ACCESS_KEY).search({
      query: parsed.data.q,
    });
    await recordProviderTelemetry(env, { requestId, provider: "unsplash", operation: "search", ok: true, latencyMs: performance.now() - startedAt }).catch(() => undefined);
    return Response.json({ results, manualUploadAvailable: true, requestId }, { headers: { "X-Request-Id": requestId } });
  } catch (error) {
    const { env } = getCloudflareContext();
    await recordProviderTelemetry(env, { requestId, provider: "unsplash", operation: "search", ok: false, latencyMs: performance.now() - startedAt }).catch(() => undefined);
    const status = error instanceof Error && error.message === "UNAUTHENTICATED" ? 401 : error instanceof Error && error.message === "FORBIDDEN" ? 403 : 502;
    return Response.json(
      { error: "IMAGE_SEARCH_UNAVAILABLE", results: [], manualUploadAvailable: true, requestId },
      { status, headers: { "X-Request-Id": requestId } },
    );
  }
}
