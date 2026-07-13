import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireTripMember } from "@/auth/access";
import { isPublicDemoTripId } from "@/lib/demo-trip-ids";
import { recordProviderTelemetry } from "@/platform/telemetry";

const tilePart = /^\d+$/;
const attribution = "Powered by Geoapify | © OpenMapTiles | © OpenStreetMap contributors";

interface TileCoordinates {
  z: number;
  x: number;
  y: number;
}

interface AuthorizationFailure {
  code: string;
  status: 401 | 403;
}

type MembershipVerifier = (tripId: string) => Promise<unknown>;

export function parseTileCoordinates(z: string, x: string, y: string): TileCoordinates | null {
  if (![z, x, y].every((part) => tilePart.test(part))) return null;
  const coordinates = { z: Number(z), x: Number(x), y: Number(y) };
  if (coordinates.z > 20) return null;
  const edge = 2 ** coordinates.z;
  if (coordinates.x >= edge || coordinates.y >= edge) return null;
  return coordinates;
}

export function geoapifyTileUrl(coordinates: TileCoordinates, apiKey: string): string {
  return `https://maps.geoapify.com/v1/tile/osm-bright-smooth/${coordinates.z}/${coordinates.x}/${coordinates.y}.png?apiKey=${encodeURIComponent(apiKey)}`;
}

export async function authorizeTileRequest(tripId: string, demoEnabled: boolean, verify: MembershipVerifier = requireTripMember): Promise<AuthorizationFailure | null> {
  if (isPublicDemoTripId(tripId) && demoEnabled) return null;
  try {
    await verify(tripId);
    return null;
  } catch (error) {
    const code = error instanceof Error ? error.message : "FORBIDDEN";
    return { code, status: code === "UNAUTHENTICATED" ? 401 : 403 };
  }
}

function tileHeaders(requestId: string, contentType = "image/png"): HeadersInit {
  return {
    "Cache-Control": "private, max-age=3600",
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    "X-Map-Attribution": attribution,
    "X-Request-Id": requestId,
  };
}

function errorResponse(error: string, requestId: string, status: number): Response {
  return Response.json({ error, requestId }, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "X-Request-Id": requestId } });
}

export async function GET(request: Request, context: { params: Promise<{ tripId: string; z: string; x: string; y: string }> }): Promise<Response> {
  const { tripId, z, x, y } = await context.params;
  const requestId = crypto.randomUUID();
  const coordinates = parseTileCoordinates(z, x, y);
  if (!coordinates) return errorResponse("INVALID_TILE", requestId, 400);

  const authorization = await authorizeTileRequest(tripId, process.env.NEXT_PUBLIC_DEMO_MODE === "true");
  if (authorization) return errorResponse(authorization.code, requestId, authorization.status);

  const { env, ctx } = getCloudflareContext();
  const cacheUrl = new URL(`/__nightthread-map-cache/osm-bright-smooth/${z}/${x}/${y}`, request.url);
  const cacheKey = new Request(cacheUrl);
  const edgeCache = await caches.open("nightthread-map-tiles");
  const cached = await edgeCache.match(cacheKey).catch(() => undefined);
  if (cached) return new Response(cached.body, { headers: tileHeaders(requestId, cached.headers.get("Content-Type") ?? "image/png") });

  const startedAt = performance.now();
  const upstream = await fetch(geoapifyTileUrl(coordinates, env.GEOAPIFY_API_KEY));
  ctx.waitUntil(recordProviderTelemetry(env, { requestId, provider: "geoapify", operation: "map_tile", ok: upstream.ok, latencyMs: performance.now() - startedAt }).catch(() => undefined));
  const contentType = upstream.headers.get("Content-Type") ?? "";
  if (!upstream.ok || !upstream.body || !contentType.startsWith("image/")) return errorResponse("MAP_TILE_UNAVAILABLE", requestId, 502);

  const body = await upstream.arrayBuffer();
  const cacheResponse = new Response(body, { headers: { "Cache-Control": "public, max-age=86400", "Content-Type": contentType, "X-Content-Type-Options": "nosniff", "X-Map-Attribution": attribution } });
  ctx.waitUntil(edgeCache.put(cacheKey, cacheResponse.clone()).catch(() => undefined));
  return new Response(body, { headers: tileHeaders(requestId, contentType) });
}
