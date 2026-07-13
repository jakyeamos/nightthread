import type {
  ImageAttribution,
  ImageProvider,
  ImageResult,
  ImageSearchInput,
} from "@/providers/types";

interface UnsplashPhoto {
  id: string;
  width: number;
  height: number;
  urls: { regular: string; small: string };
  links: { html: string; download_location: string };
  user: { name: string; links: { html: string } };
}

interface UnsplashSearchResponse {
  results?: UnsplashPhoto[];
}

export function createUnsplashProvider(accessKey: string): ImageProvider {
  const cache = new Map<string, ImageAttribution>();
  return {
    async search(input: ImageSearchInput): Promise<ImageResult[]> {
      const url = new URL("https://api.unsplash.com/search/photos");
      url.searchParams.set("query", input.query);
      url.searchParams.set("page", String(input.page ?? 1));
      url.searchParams.set("per_page", String(Math.min(input.perPage ?? 8, 12)));
      url.searchParams.set("content_filter", "high");
      const response = await fetch(url, {
        headers: { Authorization: `Client-ID ${accessKey}` },
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) throw new Error(`Unsplash request failed (${response.status})`);
      const body = (await response.json()) as UnsplashSearchResponse;
      return (body.results ?? []).map((photo) => {
        const attribution: ImageAttribution = {
          label: `Photo by ${photo.user.name} on Unsplash`,
          sourceUrl: `${photo.links.html}?utm_source=nightthread&utm_medium=referral`,
          creatorName: photo.user.name,
          creatorUrl: `${photo.user.links.html}?utm_source=nightthread&utm_medium=referral`,
          licenseName: "Unsplash API Terms",
        };
        cache.set(photo.id, attribution);
        return {
          provider: "unsplash",
          providerId: photo.id,
          url: photo.urls.regular,
          thumbnailUrl: photo.urls.small,
          width: photo.width,
          height: photo.height,
          attribution,
          downloadLocation: photo.links.download_location,
        };
      });
    },
    async resolveAttribution(providerId: string): Promise<ImageAttribution | null> {
      return cache.get(providerId) ?? null;
    },
  };
}
