import { describe, expect, it, vi } from "vitest";
import { authorizeTileRequest, GET, geoapifyTileUrl, parseTileCoordinates } from "@/app/api/trips/[tripId]/map-tiles/[z]/[x]/[y]/route";

describe("map tile contract", () => {
  it("accepts only coordinates inside the zoom grid", () => {
    expect(parseTileCoordinates("0", "0", "0")).toEqual({ z: 0, x: 0, y: 0 });
    expect(parseTileCoordinates("2", "3", "3")).toEqual({ z: 2, x: 3, y: 3 });
    expect(parseTileCoordinates("2", "4", "0")).toBeNull();
    expect(parseTileCoordinates("2", "0", "4")).toBeNull();
    expect(parseTileCoordinates("21", "0", "0")).toBeNull();
    expect(parseTileCoordinates("x", "0", "0")).toBeNull();
  });

  it("builds the exact Geoapify raster request and encodes its secret", () => {
    expect(geoapifyTileUrl({ z: 5, x: 28, y: 12 }, "secret key")).toBe("https://maps.geoapify.com/v1/tile/osm-bright-smooth/5/28/12.png?apiKey=secret%20key");
  });

  it("rejects invalid coordinates before membership or provider access", async () => {
    const response = await GET(new Request("https://nightthread.test/api/tile"), { params: Promise.resolve({ tripId: "private-trip", z: "2", x: "4", y: "0" }) });
    expect(response.status).toBe(400);
  });

  it.each([["UNAUTHENTICATED", 401], ["FORBIDDEN", 403]] as const)("maps membership %s failures to a private status", async (code, status) => {
    const verify = vi.fn(async () => { throw new Error(code); });
    await expect(authorizeTileRequest("private-trip", false, verify)).resolves.toEqual({ code, status });
    expect(verify).toHaveBeenCalledWith("private-trip");
  });

  it("allows only the explicitly enabled public demo to bypass membership", async () => {
    const verify = vi.fn(async () => undefined);
    await expect(authorizeTileRequest("demo", true, verify)).resolves.toBeNull();
    expect(verify).not.toHaveBeenCalled();
    await expect(authorizeTileRequest("private-trip", true, verify)).resolves.toBeNull();
    expect(verify).toHaveBeenCalledWith("private-trip");
  });
});
