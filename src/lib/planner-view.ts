import type { DemoCity, DemoDay, DemoIdea, DemoItem } from "@/lib/demo-data";

export interface DayGroup {
  city: DemoCity;
  days: DemoDay[];
}

export type DaySequenceEntry =
  | { kind: "day"; day: DemoDay }
  | { kind: "empty_run"; id: string; days: DemoDay[] };

export interface DaySignals {
  totalMinutes: number;
  unknownDurations: number;
  openDecisions: number;
  reservationNeeded?: DemoItem;
  closedPlaces: DemoItem[];
}

export function groupDaysByCity(days: readonly DemoDay[], cities: readonly DemoCity[]): DayGroup[] {
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

export function compressEmptyDayRuns(days: readonly DemoDay[], items: readonly DemoItem[]): DaySequenceEntry[] {
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
    const run: DemoDay[] = [];
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

export function formatDuration(item: DemoItem): string {
  if (item.duration === undefined) return "Duration open";
  const hours = Math.floor(item.duration / 60);
  const minutes = item.duration % 60;
  const duration = hours > 0 ? `${hours} hr${minutes ? ` ${minutes} min` : ""}` : `${minutes} min`;
  if (item.durationSource === "provider") return `${duration} · provider`;
  if (item.durationSource === "estimate") return `About ${duration}`;
  return duration;
}

export function getDaySignals(dayId: string, items: readonly DemoItem[]): DaySignals {
  const dayItems = items.filter((item) => item.dayId === dayId);
  return {
    totalMinutes: dayItems.reduce((total, item) => total + (item.duration ?? 0), 0),
    unknownDurations: dayItems.filter((item) => item.duration === undefined).length,
    openDecisions: dayItems.filter((item) => item.kind === "placeholder").length,
    reservationNeeded: dayItems.find((item) => item.reservation === "needed"),
    closedPlaces: dayItems.filter((item) => item.health === "permanently_closed"),
  };
}

export function getVisibleIdeas(ideas: readonly DemoIdea[], cityId: string, allCities: boolean): DemoIdea[] {
  return allCities ? [...ideas] : ideas.filter((idea) => idea.cityId === cityId);
}
