import { describe, expect, it } from "vitest";
import {
  detectMissingBuffers,
  detectOverlaps,
  detectOverloadedDays,
  detectPriorityLoad,
  detectTravelGaps,
  suggestGoodDay,
  suggestNearbyIdeas,
} from "@/domain/planning-rules";
import type { PlanningItem } from "@/domain/types";

const baseItem: PlanningItem = {
  id: "item-1",
  dayId: "day-1",
  cityId: "city-1",
  kind: "activity",
  scheduleMode: "exact",
  startMinute: 540,
  durationMinutes: 60,
};

describe("planning rules", () => {
  it("treats touching exact-time intervals as non-overlapping", () => {
    expect(
      detectOverlaps([
        baseItem,
        { ...baseItem, id: "item-2", startMinute: 600 },
      ]),
    ).toHaveLength(0);
    expect(
      detectOverlaps([
        baseItem,
        { ...baseItem, id: "item-2", startMinute: 599 },
      ]),
    ).toHaveLength(1);
  });

  it("warns above 600 minutes or at eight activities", () => {
    expect(
      detectOverloadedDays([{ ...baseItem, durationMinutes: 600 }]),
    ).toHaveLength(0);
    expect(
      detectOverloadedDays([{ ...baseItem, durationMinutes: 601 }]),
    ).toHaveLength(1);
    expect(
      detectOverloadedDays(
        Array.from({ length: 8 }, (_, index) => ({
          ...baseItem,
          id: `item-${index}`,
          durationMinutes: 30,
        })),
      ),
    ).toHaveLength(1);
  });

  it("uses strict travel distance and gap thresholds", () => {
    const origin = { ...baseItem, lat: 35.6812, lon: 139.7671 };
    const destination = {
      ...baseItem,
      id: "item-2",
      startMinute: 689,
      lat: 35.6586,
      lon: 139.7454,
    };
    expect(detectTravelGaps([origin, destination])).toHaveLength(0);
    expect(
      detectTravelGaps([
        origin,
        { ...destination, lat: 35.6762, lon: 139.6503 },
      ]),
    ).toHaveLength(1);
    expect(
      detectTravelGaps([
        origin,
        { ...destination, startMinute: 690, lat: 35.6762, lon: 139.6503 },
      ]),
    ).toHaveLength(0);
  });

  it("requires four activities and no qualifying buffer", () => {
    const activities = Array.from({ length: 4 }, (_, index) => ({
      ...baseItem,
      id: `item-${index}`,
    }));
    expect(detectMissingBuffers(activities)).toHaveLength(1);
    expect(
      detectMissingBuffers([
        ...activities,
        {
          ...baseItem,
          id: "buffer",
          kind: "placeholder",
          placeholderType: "buffer",
          durationMinutes: 30,
        },
      ]),
    ).toHaveLength(0);
  });

  it("warns at five scheduled must-do activities", () => {
    expect(
      detectPriorityLoad(
        Array.from({ length: 5 }, (_, index) => ({
          ...baseItem,
          id: `item-${index}`,
          priority: "must_do",
        })),
      ),
    ).toHaveLength(1);
  });

  it("deduplicates nearby ideas and chooses the nearest item", () => {
    const suggestions = suggestNearbyIdeas(
      [
        { ...baseItem, lat: 35.6812, lon: 139.7671 },
        {
          ...baseItem,
          id: "item-2",
          dayId: "day-2",
          lat: 35.6808,
          lon: 139.7667,
        },
      ],
      [
        {
          id: "idea-1",
          cityId: "city-1",
          priority: "would_like",
          lat: 35.6807,
          lon: 139.7666,
        },
      ],
    );
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].itineraryItemId).toBe("item-2");
  });

  it("chooses the least-loaded matching day then the lowest ordinal", () => {
    const suggestion = suggestGoodDay(
      { id: "idea-1", cityId: "city-1", priority: "must_do" },
      [
        { id: "day-2", cityId: "city-1", ordinal: 2 },
        { id: "day-1", cityId: "city-1", ordinal: 1 },
      ],
      [],
    );
    expect(suggestion?.dayId).toBe("day-1");
  });
});
