import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { requireTripMember } from "@/auth/access";
import { createGeoapifyProvider } from "@/providers/geoapify";
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
    const results = await createGeoapifyProvider(env.GEOAPIFY_API_KEY).search({
      query: parsed.data.q,
    });
    await recordProviderTelemetry(env, { requestId, provider: "geoapify", operation: "search", ok: true, latencyMs: performance.now() - startedAt }).catch(() => undefined);
    return Response.json({ results, manualEntryAvailable: true, requestId }, { headers: { "X-Request-Id": requestId } });
  } catch (error) {
    const { env } = getCloudflareContext();
    await recordProviderTelemetry(env, { requestId, provider: "geoapify", operation: "search", ok: false, latencyMs: performance.now() - startedAt }).catch(() => undefined);
    const status = error instanceof Error && error.message === "UNAUTHENTICATED" ? 401 : error instanceof Error && error.message === "FORBIDDEN" ? 403 : 502;
    return Response.json(
      { error: "SEARCH_UNAVAILABLE", results: [], manualEntryAvailable: true, requestId },
      { status, headers: { "X-Request-Id": requestId } },
    );
  }
}
