export type TripRole = "owner" | "collaborator";

export type IdeaPriority = "must_do" | "would_like" | "if_time";

export type ScheduleMode = "exact" | "period";

export type DayPeriod = "morning" | "afternoon" | "evening";

export type PlaceholderType =
  | "eat"
  | "travel"
  | "rest"
  | "coffee"
  | "explore"
  | "buffer";

export type ReservationStatus =
  | "none"
  | "needed"
  | "pending"
  | "confirmed"
  | "cancelled";

export type ItineraryItemKind = "activity" | "placeholder";

export type NightKind = "stay" | "travel";

export type ReactionKind = "heart" | "sparkles" | "thumbs_up" | "eyes";

export type AssetSource = "upload" | "unsplash" | "wikimedia";

export type ProviderSource = "manual" | "geoapify";

export type DeletableEntity =
  | "trip"
  | "city"
  | "saved_idea"
  | "itinerary_item"
  | "asset";

export interface PlanningItem {
  id: string;
  dayId: string;
  cityId: string;
  kind: ItineraryItemKind;
  scheduleMode: ScheduleMode;
  period?: DayPeriod;
  startMinute?: number;
  durationMinutes: number;
  placeholderType?: PlaceholderType;
  priority?: IdeaPriority;
  lat?: number;
  lon?: number;
}

export interface PlanningIdea {
  id: string;
  cityId?: string;
  priority: IdeaPriority;
  lat?: number;
  lon?: number;
}

export interface PlanningDay {
  id: string;
  cityId: string;
  ordinal: number;
}

export type PlanningWarning =
  | {
      code: "overlap";
      dayId: string;
      itemIds: [string, string];
      signature: string;
    }
  | {
      code: "overloaded_day";
      dayId: string;
      minutes: number;
      activityCount: number;
      signature: string;
    }
  | {
      code: "travel_gap";
      dayId: string;
      itemIds: [string, string];
      distanceKm: number;
      gapMinutes: number;
      signature: string;
    }
  | {
      code: "missing_buffer";
      dayId: string;
      activityCount: number;
      signature: string;
    }
  | {
      code: "priority_load";
      dayId: string;
      mustDoCount: number;
      signature: string;
    };

export interface NearbySuggestion {
  ideaId: string;
  itineraryItemId: string;
  dayId: string;
  distanceKm: number;
}

export interface GoodDaySuggestion {
  ideaId: string;
  dayId: string;
  scheduledMinutes: number;
}

export type TripEvent =
  | {
      type: "entity.patch";
      entityKind: string;
      entityId: string;
      version: number;
    }
  | {
      type: "presence.changed";
      userId: string;
      state: "joined" | "left";
    }
  | {
      type: "lock.changed";
      itemId: string;
      holderUserId: string | null;
      expiresAt: string | null;
    };
