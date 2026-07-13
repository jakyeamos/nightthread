import type { PlaceProvider, PlaceResult, PlaceSearchInput } from "@/providers/types";

interface GeoapifyFeature {
  properties?: {
    place_id?: string;
    name?: string;
    formatted?: string;
    lat?: number;
    lon?: number;
    categories?: string[];
    timezone?: { name?: string };
  };
}

interface GeoapifyResponse {
  features?: GeoapifyFeature[];
}

function normalize(feature: GeoapifyFeature): PlaceResult | null {
  const properties = feature.properties;
  if (
    !properties?.place_id ||
    !properties.name ||
    !properties.formatted ||
    properties.lat === undefined ||
    properties.lon === undefined
  ) {
    return null;
  }
  return {
    provider: "geoapify",
    providerId: properties.place_id,
    name: properties.name,
    formattedAddress: properties.formatted,
    lat: properties.lat,
    lon: properties.lon,
    categories: properties.categories ?? [],
    timezone: properties.timezone?.name,
    attribution: "© OpenStreetMap contributors · Powered by Geoapify",
  };
}

export function createGeoapifyProvider(apiKey: string): PlaceProvider {
  async function request(url: URL): Promise<PlaceResult[]> {
    url.searchParams.set("apiKey", apiKey);
    const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error(`Geoapify request failed (${response.status})`);
    const body = (await response.json()) as GeoapifyResponse;
    return (body.features ?? [])
      .map(normalize)
      .filter((result): result is PlaceResult => result !== null);
  }

  return {
    async search(input: PlaceSearchInput): Promise<PlaceResult[]> {
      const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
      url.searchParams.set("text", input.query);
      url.searchParams.set("format", "geojson");
      url.searchParams.set("limit", String(Math.min(input.limit ?? 8, 12)));
      if (input.bias) {
        url.searchParams.set("bias", `proximity:${input.bias.lon},${input.bias.lat}`);
      }
      return request(url);
    },
    async details(providerId: string): Promise<PlaceResult | null> {
      const url = new URL("https://api.geoapify.com/v2/place-details");
      url.searchParams.set("id", providerId);
      return (await request(url))[0] ?? null;
    },
  };
}
