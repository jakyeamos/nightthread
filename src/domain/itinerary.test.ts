import { describe, expect, it } from "vitest";
import { calendarDateForOrdinal, moveItem, parseCost, replacePlaceholder } from "@/domain/itinerary";

describe("stable day ordinals", () => {
  it("recomputes calendar dates without changing ordinal identity", () => {
    expect(calendarDateForOrdinal("2026-10-12", 5)).toBe("2026-10-16");
    expect(calendarDateForOrdinal("2026-11-02", 5)).toBe("2026-11-06");
    expect(calendarDateForOrdinal(null, 5)).toBeNull();
  });
});

describe("itinerary ordering", () => {
  it("moves and densely reindexes items", () => {
    expect(moveItem([{ id: "a", position: 0 }, { id: "b", position: 1 }, { id: "c", position: 2 }], "c", 0)).toEqual([{ id: "c", position: 0 }, { id: "a", position: 1 }, { id: "b", position: 2 }]);
  });
});

describe("placeholder replacement", () => {
  it("preserves day, time, duration, and position", () => {
    const result = replacePlaceholder({ id: "p", position: 3, dayId: "day-2", kind: "placeholder", savedIdeaId: null, placeholderType: "eat", startMinute: 720, durationMinutes: 75 }, "idea-1");
    expect(result).toMatchObject({ position: 3, dayId: "day-2", startMinute: 720, durationMinutes: 75, kind: "activity", savedIdeaId: "idea-1", placeholderType: null });
  });
});

describe("cost validation", () => {
  it("keeps amount paired with ISO currency", () => {
    expect(parseCost("12.50", "jpy")).toEqual({ amountMinor: 1250, currency: "JPY" });
    expect(parseCost("", "")).toBeNull();
    expect(() => parseCost("12.999", "JPY")).toThrow("INVALID_COST");
    expect(() => parseCost("12", "YEN!" )).toThrow("INVALID_COST");
  });
});
