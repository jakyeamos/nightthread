import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import type {
  GoodDaySuggestion,
  NearbySuggestion,
  PlanningDay,
  PlanningIdea,
  PlanningItem,
  PlanningWarning,
} from "@/domain/types";

const EARTH_RADIUS_KM = 6_371;

function warningSignature(value: unknown): string {
  const canonical = JSON.stringify(value, (_, entry: unknown) => {
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      return Object.fromEntries(
        Object.entries(entry).sort(([left], [right]) =>
          left.localeCompare(right),
        ),
      );
    }
    return entry;
  });

  return bytesToHex(sha256(new TextEncoder().encode(canonical)));
}

function groupByDay(items: readonly PlanningItem[]): Map<string, PlanningItem[]> {
  const groups = new Map<string, PlanningItem[]>();
  for (const item of items) {
    const current = groups.get(item.dayId) ?? [];
    current.push(item);
    groups.set(item.dayId, current);
  }
  return groups;
}

function haversineKm(
  left: Pick<PlanningItem | PlanningIdea, "lat" | "lon">,
  right: Pick<PlanningItem | PlanningIdea, "lat" | "lon">,
): number | null {
  if (
    left.lat === undefined ||
    left.lon === undefined ||
    right.lat === undefined ||
    right.lon === undefined
  ) {
    return null;
  }

  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(right.lat - left.lat);
  const deltaLon = toRadians(right.lon - left.lon);
  const originLat = toRadians(left.lat);
  const destinationLat = toRadians(right.lat);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(originLat) *
      Math.cos(destinationLat) *
      Math.sin(deltaLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function detectOverlaps(
  items: readonly PlanningItem[],
): PlanningWarning[] {
  const warnings: PlanningWarning[] = [];
  for (const [dayId, dayItems] of groupByDay(items)) {
    const exact = dayItems
      .filter(
        (item): item is PlanningItem & { startMinute: number } =>
          item.scheduleMode === "exact" && item.startMinute !== undefined,
      )
      .sort(
        (left, right) =>
          left.startMinute - right.startMinute || left.id.localeCompare(right.id),
      );

    for (let index = 0; index < exact.length; index += 1) {
      for (let next = index + 1; next < exact.length; next += 1) {
        const left = exact[index];
        const right = exact[next];
        if (right.startMinute >= left.startMinute + left.durationMinutes) break;
        const itemIds = [left.id, right.id].sort() as [string, string];
        warnings.push({
          code: "overlap",
          dayId,
          itemIds,
          signature: warningSignature({ code: "overlap", dayId, itemIds }),
        });
      }
    }
  }
  return warnings;
}

export function detectOverloadedDays(
  items: readonly PlanningItem[],
): PlanningWarning[] {
  const warnings: PlanningWarning[] = [];
  for (const [dayId, dayItems] of groupByDay(items)) {
    const minutes = dayItems.reduce(
      (total, item) => total + item.durationMinutes,
      0,
    );
    const activityCount = dayItems.filter((item) => item.kind === "activity").length;
    if (minutes <= 600 && activityCount < 8) continue;
    warnings.push({
      code: "overloaded_day",
      dayId,
      minutes,
      activityCount,
      signature: warningSignature({
        code: "overloaded_day",
        dayId,
        items: dayItems
          .map(({ id, durationMinutes, kind }) => ({ id, durationMinutes, kind }))
          .sort((left, right) => left.id.localeCompare(right.id)),
      }),
    });
  }
  return warnings;
}

export function detectTravelGaps(
  items: readonly PlanningItem[],
): PlanningWarning[] {
  const warnings: PlanningWarning[] = [];
  for (const [dayId, dayItems] of groupByDay(items)) {
    const exact = dayItems
      .filter(
        (item): item is PlanningItem & { startMinute: number } =>
          item.kind === "activity" &&
          item.scheduleMode === "exact" &&
          item.startMinute !== undefined &&
          item.lat !== undefined &&
          item.lon !== undefined,
      )
      .sort((left, right) => left.startMinute - right.startMinute);

    for (let index = 0; index < exact.length - 1; index += 1) {
      const left = exact[index];
      const right = exact[index + 1];
      const gapMinutes =
        right.startMinute - (left.startMinute + left.durationMinutes);
      const distanceKm = haversineKm(left, right);
      if (distanceKm === null || distanceKm <= 8 || gapMinutes < 0 || gapMinutes >= 90) {
        continue;
      }
      const itemIds: [string, string] = [left.id, right.id];
      warnings.push({
        code: "travel_gap",
        dayId,
        itemIds,
        distanceKm,
        gapMinutes,
        signature: warningSignature({
          code: "travel_gap",
          dayId,
          itemIds,
          distanceKm: Number(distanceKm.toFixed(3)),
          gapMinutes,
        }),
      });
    }
  }
  return warnings;
}

export function detectMissingBuffers(
  items: readonly PlanningItem[],
): PlanningWarning[] {
  const warnings: PlanningWarning[] = [];
  for (const [dayId, dayItems] of groupByDay(items)) {
    const activityCount = dayItems.filter((item) => item.kind === "activity").length;
    const hasBuffer = dayItems.some(
      (item) => item.placeholderType === "buffer" && item.durationMinutes >= 30,
    );
    if (activityCount < 4 || hasBuffer) continue;
    warnings.push({
      code: "missing_buffer",
      dayId,
      activityCount,
      signature: warningSignature({
        code: "missing_buffer",
        dayId,
        activities: dayItems
          .filter((item) => item.kind === "activity")
          .map(({ id }) => id)
          .sort(),
        buffers: dayItems
          .filter((item) => item.placeholderType === "buffer")
          .map(({ id, durationMinutes }) => ({ id, durationMinutes }))
          .sort((left, right) => left.id.localeCompare(right.id)),
      }),
    });
  }
  return warnings;
}

export function detectPriorityLoad(
  items: readonly PlanningItem[],
): PlanningWarning[] {
  const warnings: PlanningWarning[] = [];
  for (const [dayId, dayItems] of groupByDay(items)) {
    const mustDo = dayItems.filter(
      (item) => item.kind === "activity" && item.priority === "must_do",
    );
    if (mustDo.length < 5) continue;
    warnings.push({
      code: "priority_load",
      dayId,
      mustDoCount: mustDo.length,
      signature: warningSignature({
        code: "priority_load",
        dayId,
        itemIds: mustDo.map(({ id }) => id).sort(),
      }),
    });
  }
  return warnings;
}

export function suggestNearbyIdeas(
  scheduled: readonly PlanningItem[],
  unscheduled: readonly PlanningIdea[],
): NearbySuggestion[] {
  const suggestions: NearbySuggestion[] = [];
  for (const idea of unscheduled) {
    let nearest: NearbySuggestion | null = null;
    for (const item of scheduled) {
      if (idea.cityId !== undefined && idea.cityId !== item.cityId) continue;
      const distanceKm = haversineKm(idea, item);
      if (distanceKm === null || distanceKm > 2) continue;
      if (!nearest || distanceKm < nearest.distanceKm) {
        nearest = {
          ideaId: idea.id,
          itineraryItemId: item.id,
          dayId: item.dayId,
          distanceKm,
        };
      }
    }
    if (nearest) suggestions.push(nearest);
  }
  return suggestions;
}

export function suggestGoodDay(
  idea: PlanningIdea,
  days: readonly PlanningDay[],
  items: readonly PlanningItem[],
): GoodDaySuggestion | null {
  if (!idea.cityId) return null;
  const loads = new Map<string, number>();
  for (const item of items) {
    loads.set(item.dayId, (loads.get(item.dayId) ?? 0) + item.durationMinutes);
  }
  const match = days
    .filter((day) => day.cityId === idea.cityId)
    .map((day) => ({ day, load: loads.get(day.id) ?? 0 }))
    .filter(({ load }) => load < 360)
    .sort(
      (left, right) => left.load - right.load || left.day.ordinal - right.day.ordinal,
    )[0];
  if (!match) return null;
  return {
    ideaId: idea.id,
    dayId: match.day.id,
    scheduledMinutes: match.load,
  };
}

export function evaluatePlanningWarnings(
  items: readonly PlanningItem[],
): PlanningWarning[] {
  return [
    ...detectOverlaps(items),
    ...detectOverloadedDays(items),
    ...detectTravelGaps(items),
    ...detectMissingBuffers(items),
    ...detectPriorityLoad(items),
  ];
}
