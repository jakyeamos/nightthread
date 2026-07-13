import { describe, expect, it } from "vitest";
import { wanderlogDemoTrip } from "@/lib/demo-trips";

describe("Wanderlog stress fixture", () => {
  it("preserves the full long-trip shape", () => {
    expect(wanderlogDemoTrip.days.map((day) => day.ordinal)).toEqual(Array.from({ length: 18 }, (_, index) => index + 1));
    expect(wanderlogDemoTrip.cities).toHaveLength(8);
    expect(wanderlogDemoTrip.cities.reduce((total, city) => total + city.nights, 0)).toBe(17);
    expect(wanderlogDemoTrip.items).toHaveLength(36);
  });

  it("keeps every item and idea attached to a known day or city", () => {
    const dayIds = new Set(wanderlogDemoTrip.days.map((day) => day.id));
    const cityIds = new Set(wanderlogDemoTrip.cities.map((city) => city.id));
    expect(wanderlogDemoTrip.items.every((item) => dayIds.has(item.dayId))).toBe(true);
    expect(wanderlogDemoTrip.ideas.every((idea) => cityIds.has(idea.cityId))).toBe(true);
  });

  it("retains transfers, open days, and flexible ordering", () => {
    expect(wanderlogDemoTrip.items).toContainEqual(expect.objectContaining({ title: "Budapest → Prague", duration: 453, placeholderType: "travel" }));
    expect(wanderlogDemoTrip.items.some((item) => item.start !== undefined)).toBe(false);
    expect(wanderlogDemoTrip.days.filter((day) => day.title === "Rome — open day")).toHaveLength(4);
  });
});
