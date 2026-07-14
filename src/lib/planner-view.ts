import type { WorkspaceCity, WorkspaceDay, WorkspaceIdea, WorkspaceItem } from "@/lib/demo-data";

export interface DayGroup {
  city: WorkspaceCity;
  days: WorkspaceDay[];
}

export type DaySequenceEntry =
  | { kind: "day"; day: WorkspaceDay }
  | { kind: "empty_run"; id: string; days: WorkspaceDay[] };

export interface DaySignals {
  totalMinutes: number;
  unknownDurations: number;
  openDecisions: number;
  reservationNeeded?: WorkspaceItem;
  closedPlaces: WorkspaceItem[];
}

export function groupDaysByCity(days: readonly WorkspaceDay[], cities: readonly WorkspaceCity[]): DayGroup[] {
  const cityById = new Map(cities.map((city) => [city.id, city]));
  const groups: DayGroup[] = [];
  for (const day of days) {
    const city = cityById.get(day.cityId);
    if (!city) continue;
    const latest = groups.at(-1);
    if (latest?.city.id === city.id) latest.days.push(day);
    else groups.push({ city, days: [day] });
  }
  return groups;
}

export function compressEmptyDayRuns(days: readonly WorkspaceDay[], items: readonly WorkspaceItem[]): DaySequenceEntry[] {
  const itemDays = new Set(items.map((item) => item.dayId));
  const entries: DaySequenceEntry[] = [];
  let index = 0;
  while (index < days.length) {
    const day = days[index];
    const canCompress = !itemDays.has(day.id) && /open day/i.test(day.title);
    if (!canCompress) {
      entries.push({ kind: "day", day });
      index += 1;
      continue;
    }
    const run: WorkspaceDay[] = [];
    while (index < days.length) {
      const candidate = days[index];
      if (itemDays.has(candidate.id) || !/open day/i.test(candidate.title)) break;
      run.push(candidate);
      index += 1;
    }
    if (run.length > 1) entries.push({ kind: "empty_run", id: `${run[0].id}-${run.at(-1)?.id ?? run[0].id}`, days: run });
    else entries.push({ kind: "day", day: run[0] });
  }
  return entries;
}

export function formatDuration(item: WorkspaceItem): string {
  if (item.duration === undefined) return "Duration open";
  const hours = Math.floor(item.duration / 60);
  const minutes = item.duration % 60;
  const duration = hours > 0 ? `${hours} hr${minutes ? ` ${minutes} min` : ""}` : `${minutes} min`;
  if (item.durationSource === "provider") return `${duration} · provider`;
  if (item.durationSource === "estimate") return `About ${duration}`;
  return duration;
}

function itemSortMinute(item: WorkspaceItem): number {
  if (!item.start) return Number.POSITIVE_INFINITY;
  const exact = /^(\d{2}):(\d{2})$/.exec(item.start);
  if (exact) return Number(exact[1]) * 60 + Number(exact[2]);
  const periods: Record<string, number> = { Morning: 8 * 60, Afternoon: 13 * 60, Evening: 18 * 60 };
  return periods[item.start] ?? Number.POSITIVE_INFINITY;
}

export function sortItineraryItems(items: readonly WorkspaceItem[]): WorkspaceItem[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => itemSortMinute(left.item) - itemSortMinute(right.item) || left.index - right.index)
    .map(({ item }) => item);
}

export function getDaySignals(dayId: string, items: readonly WorkspaceItem[]): DaySignals {
  const dayItems = items.filter((item) => item.dayId === dayId);
  return {
    totalMinutes: dayItems.reduce((total, item) => total + (item.duration ?? 0), 0),
    unknownDurations: dayItems.filter((item) => item.duration === undefined).length,
    openDecisions: dayItems.filter((item) => item.kind === "placeholder").length,
    reservationNeeded: dayItems.find((item) => item.reservation === "needed"),
    closedPlaces: dayItems.filter((item) => item.health === "permanently_closed"),
  };
}

export function getVisibleIdeas(ideas: readonly WorkspaceIdea[], cityId: string, allCities: boolean): WorkspaceIdea[] {
  return allCities ? [...ideas] : ideas.filter((idea) => idea.cityId === cityId);
}
