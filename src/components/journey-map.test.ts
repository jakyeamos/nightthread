import { describe, expect, it } from "vitest";
import { createJourneyMapStyle, NIGHT_GLOBE_TILES } from "@/components/journey-map";

describe("journey map styles", () => {
  it("keeps the Geoapify key behind the trip tile proxy", () => {
    const style = createJourneyMapStyle("journey", "trip/with spaces");
    const source = style.sources.atlas;
    expect(source.type).toBe("raster");
    if (source.type !== "raster") throw new Error("Expected raster source");
    expect(source.tiles).toEqual(["/api/trips/trip%2Fwith%20spaces/map-tiles/{z}/{x}/{y}"]);
    expect(JSON.stringify(style)).not.toContain("apiKey");
  });

  it("uses the annual NASA Black Marble globe source", () => {
    const style = createJourneyMapStyle("night_globe", "demo");
    expect(style.projection).toEqual({ type: "globe" });
    const source = style.sources.earthAtNight;
    expect(source.type).toBe("raster");
    if (source.type !== "raster") throw new Error("Expected raster source");
    expect(source.tiles).toEqual([NIGHT_GLOBE_TILES]);
    expect(source.maxzoom).toBe(8);
    expect(NIGHT_GLOBE_TILES).toContain("/2016-01-01/");
    expect(NIGHT_GLOBE_TILES).toMatch(/\.png$/);
  });
});
