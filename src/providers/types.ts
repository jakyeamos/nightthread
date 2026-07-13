export interface PlaceSearchInput {
  query: string;
  bias?: { lat: number; lon: number };
  limit?: number;
}

export interface PlaceResult {
  provider: "geoapify";
  providerId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lon: number;
  categories: string[];
  timezone?: string;
  attribution: string;
}

export interface PlaceProvider {
  search(input: PlaceSearchInput): Promise<PlaceResult[]>;
  details(providerId: string): Promise<PlaceResult | null>;
}

export interface ImageSearchInput {
  query: string;
  page?: number;
  perPage?: number;
}

export interface ImageAttribution {
  label: string;
  sourceUrl: string;
  creatorName?: string;
  creatorUrl?: string;
  licenseName?: string;
}

export interface ImageResult {
  provider: "unsplash" | "wikimedia";
  providerId: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  attribution: ImageAttribution;
  downloadLocation?: string;
}

export interface ImageProvider {
  search(input: ImageSearchInput): Promise<ImageResult[]>;
  resolveAttribution(providerId: string): Promise<ImageAttribution | null>;
}
