import { describe, expect, it } from "vitest";
import { compressEmptyDayRuns, formatDuration, getDaySignals, getVisibleIdeas, groupDaysByCity } from "@/lib/planner-view";
import { wanderlogDemoTrip } from "@/lib/demo-trips";

describe("planner view behavior", () => {
  it("groups the long itinerary by consecutive city stays", () => {
    const groups = groupDaysByCity(wanderlogDemoTrip.days, wanderlogDemoTrip.cities);
    expect(groups.at(-1)?.city.name).toBe("Rome");
    expect(groups.at(-1)?.days).toHaveLength(6);
  });

  it("compresses repeated open days but leaves departure distinct", () => {
    const romeDays = wanderlogDemoTrip.days.filter((day) => day.cityId === "rome");
    const entries = compressEmptyDayRuns(romeDays, wanderlogDemoTrip.items);
    const run = entries.find((entry) => entry.kind === "empty_run");
    expect(run?.kind === "empty_run" ? run.days : []).toHaveLength(4);
    expect(entries.at(-1)).toMatchObject({ kind: "day", day: { ordinal: 18 } });
  });

  it("distinguishes unknown, estimated, and provider durations", () => {
    expect(formatDuration({ id: "open", dayId: "d", title: "Open", subtitle: "", kind: "activity" })).toBe("Duration open");
    expect(formatDuration({ id: "estimate", dayId: "d", title: "Estimate", subtitle: "", kind: "activity", duration: 90, durationSource: "estimate" })).toBe("About 1 hr 30 min");
    expect(formatDuration({ id: "provider", dayId: "d", title: "Provider", subtitle: "", kind: "placeholder", duration: 453, durationSource: "provider" })).toBe("7 hr 33 min · provider");
  });

  it("keeps planning signals scoped to the active day", () => {
    const signals = getDaySignals("wl-day-2", wanderlogDemoTrip.items);
    expect(signals.closedPlaces).toHaveLength(1);
    expect(signals.unknownDurations).toBeGreaterThan(0);
    expect(signals.openDecisions).toBe(0);
  });

  it("filters saved ideas to the active city unless all cities is explicit", () => {
    expect(getVisibleIdeas(wanderlogDemoTrip.ideas, "rome", false).map((idea) => idea.name)).toEqual(["First day in Rome"]);
    expect(getVisibleIdeas(wanderlogDemoTrip.ideas, "rome", true)).toHaveLength(4);
  });
});
