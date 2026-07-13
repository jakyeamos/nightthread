import { demoCities, demoDays, demoIdeas, demoItems, type WorkspaceCity, type WorkspaceDay, type WorkspaceIdea, type WorkspaceItem } from "@/lib/demo-data";
import { WANDERLOG_SAMPLE_TRIP_ID } from "@/lib/demo-trip-ids";
import { wanderlogCities, wanderlogDays, wanderlogIdeas, wanderlogItems, wanderlogSourceUrl } from "@/lib/wanderlog-fixture";

export interface TripWorkspace {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  dateLabel: string;
  timeZoneLabel: string;
  totalDays: number;
  totalNights: number;
  cities: WorkspaceCity[];
  days: WorkspaceDay[];
  ideas: WorkspaceIdea[];
  items: WorkspaceItem[];
  persistence: "fixture" | "d1";
  source?: { label: string; url: string };
}

export const tokyoDemoTrip: TripWorkspace = {
  id: "demo",
  name: "Tokyo after dark",
  startDate: "2026-10-12",
  endDate: "2026-10-21",
  dateLabel: "Oct 12–21",
  timeZoneLabel: "Japan Standard Time",
  totalDays: 10,
  totalNights: 9,
  persistence: "fixture",
  cities: demoCities,
  days: demoDays,
  ideas: demoIdeas,
  items: demoItems,
};

export const wanderlogDemoTrip: TripWorkspace = {
  id: WANDERLOG_SAMPLE_TRIP_ID,
  name: "Budapest, Prague & the Alps",
  startDate: "2027-06-10",
  endDate: "2027-06-27",
  dateLabel: "Jun 10–27",
  timeZoneLabel: "Local time changes by city",
  totalDays: 18,
  totalNights: 17,
  persistence: "fixture",
  cities: wanderlogCities,
  days: wanderlogDays,
  ideas: wanderlogIdeas,
  items: wanderlogItems,
  source: { label: "Transcribed from the shared Wanderlog trip", url: wanderlogSourceUrl },
};

export function getDemoTripFixture(tripId: string): TripWorkspace | null {
  if (tripId === tokyoDemoTrip.id) return tokyoDemoTrip;
  if (tripId === wanderlogDemoTrip.id) return wanderlogDemoTrip;
  return null;
}
