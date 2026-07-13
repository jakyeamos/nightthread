import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type {
  AssetSource,
  DayPeriod,
  DeletableEntity,
  IdeaPriority,
  ItineraryItemKind,
  NightKind,
  PlaceholderType,
  ProviderSource,
  ReactionKind,
  ReservationStatus,
  ScheduleMode,
  TripRole,
} from "@/domain/types";
import { user } from "@/db/schema/auth";

const timestamp = (name: string) =>
  integer(name, { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date());

export const trips = sqliteTable(
  "trips",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    startDate: text("start_date"),
    endDate: text("end_date"),
    startingLocationText: text("starting_location_text"),
    startingLat: real("starting_lat"),
    startingLon: real("starting_lon"),
    coverAssetId: text("cover_asset_id"),
    defaultCurrency: text("default_currency", { length: 3 }).notNull().default("USD"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    check("trips_currency_length", sql`length(${table.defaultCurrency}) = 3`),
    check(
      "trips_date_order",
      sql`${table.startDate} is null or ${table.endDate} is null or ${table.startDate} <= ${table.endDate}`,
    ),
  ],
);

export const tripMembers = sqliteTable(
  "trip_members",
  {
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").$type<TripRole>().notNull(),
    joinedAt: timestamp("joined_at"),
  },
  (table) => [
    primaryKey({ columns: [table.tripId, table.userId] }),
    index("trip_members_user_idx").on(table.userId),
    uniqueIndex("trip_members_one_owner_idx")
      .on(table.tripId)
      .where(sql`${table.role} = 'owner'`),
    check("trip_members_role", sql`${table.role} in ('owner', 'collaborator')`),
  ],
);

export const invitationLinks = sqliteTable(
  "invitation_links",
  {
    id: text("id").primaryKey(),
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at"),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("invitation_links_trip_idx").on(table.tripId),
    uniqueIndex("invitation_links_active_trip_idx")
      .on(table.tripId)
      .where(sql`${table.revokedAt} is null`),
  ],
);

export const invitationRedemptions = sqliteTable(
  "invitation_redemptions",
  {
    invitationId: text("invitation_id")
      .notNull()
      .references(() => invitationLinks.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    acceptedAt: timestamp("accepted_at"),
  },
  (table) => [primaryKey({ columns: [table.invitationId, table.userId] })],
);

export const assets = sqliteTable(
  "assets",
  {
    id: text("id").primaryKey(),
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    source: text("source").$type<AssetSource>().notNull(),
    r2ObjectKey: text("r2_object_key"),
    externalUrl: text("external_url"),
    mimeType: text("mime_type").notNull(),
    byteSize: integer("byte_size"),
    width: integer("width"),
    height: integer("height"),
    photographerName: text("photographer_name"),
    photographerUrl: text("photographer_url"),
    licenseName: text("license_name"),
    attributionText: text("attribution_text"),
    createdAt: timestamp("created_at"),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("assets_trip_idx").on(table.tripId),
    check("assets_source", sql`${table.source} in ('upload', 'unsplash', 'wikimedia')`),
    check(
      "assets_location",
      sql`(${table.source} = 'upload' and ${table.r2ObjectKey} is not null and ${table.externalUrl} is null) or (${table.source} != 'upload' and ${table.externalUrl} is not null and ${table.r2ObjectKey} is null)`,
    ),
  ],
);

export const cities = sqliteTable(
  "cities",
  {
    id: text("id").primaryKey(),
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    name: text("name").notNull(),
    countryCode: text("country_code", { length: 2 }),
    timezone: text("timezone").notNull(),
    lat: real("lat"),
    lon: real("lon"),
    heroAssetId: text("hero_asset_id").references(() => assets.id, {
      onDelete: "set null",
    }),
    sourceProvider: text("source_provider").$type<ProviderSource>().notNull(),
    sourcePlaceId: text("source_place_id"),
    sourceAttribution: text("source_attribution"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("cities_trip_idx").on(table.tripId),
    uniqueIndex("cities_active_position_idx")
      .on(table.tripId, table.position)
      .where(sql`${table.deletedAt} is null`),
    check("cities_source", sql`${table.sourceProvider} in ('manual', 'geoapify')`),
  ],
);

export const tripDays = sqliteTable(
  "trip_days",
  {
    id: text("id").primaryKey(),
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    cityId: text("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "restrict" }),
    ordinal: integer("ordinal").notNull(),
    calendarDate: text("calendar_date"),
    label: text("label"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("trip_days_ordinal_idx").on(table.tripId, table.ordinal),
    index("trip_days_city_idx").on(table.cityId),
  ],
);

export const tripNights = sqliteTable(
  "trip_nights",
  {
    id: text("id").primaryKey(),
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    afterDayId: text("after_day_id")
      .notNull()
      .references(() => tripDays.id, { onDelete: "cascade" }),
    kind: text("kind").$type<NightKind>().notNull(),
    stayCityId: text("stay_city_id").references(() => cities.id, {
      onDelete: "restrict",
    }),
    fromCityId: text("from_city_id").references(() => cities.id, {
      onDelete: "restrict",
    }),
    toCityId: text("to_city_id").references(() => cities.id, {
      onDelete: "restrict",
    }),
    calendarDate: text("calendar_date"),
    notes: text("notes"),
  },
  (table) => [
    uniqueIndex("trip_nights_day_idx").on(table.tripId, table.afterDayId),
    check("trip_nights_kind", sql`${table.kind} in ('stay', 'travel')`),
    check(
      "trip_nights_shape",
      sql`(${table.kind} = 'stay' and ${table.stayCityId} is not null and ${table.fromCityId} is null and ${table.toCityId} is null) or (${table.kind} = 'travel' and ${table.stayCityId} is null and ${table.fromCityId} is not null and ${table.toCityId} is not null)`,
    ),
  ],
);

export const savedIdeas = sqliteTable(
  "saved_ideas",
  {
    id: text("id").primaryKey(),
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    cityId: text("city_id").references(() => cities.id, { onDelete: "set null" }),
    preferredDayId: text("preferred_day_id").references(() => tripDays.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    address: text("address"),
    lat: real("lat"),
    lon: real("lon"),
    categories: text("categories", { mode: "json" }).$type<string[]>().notNull(),
    priority: text("priority").$type<IdeaPriority>().notNull(),
    notes: text("notes"),
    imageAssetId: text("image_asset_id").references(() => assets.id, {
      onDelete: "set null",
    }),
    sourceProvider: text("source_provider").$type<ProviderSource>().notNull(),
    sourcePlaceId: text("source_place_id"),
    sourceAttribution: text("source_attribution"),
    sourcePayload: text("source_payload", { mode: "json" }).$type<Record<string, unknown>>(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("saved_ideas_trip_idx").on(table.tripId),
    index("saved_ideas_city_idx").on(table.cityId),
    check(
      "saved_ideas_priority",
      sql`${table.priority} in ('must_do', 'would_like', 'if_time')`,
    ),
    check("saved_ideas_source", sql`${table.sourceProvider} in ('manual', 'geoapify')`),
  ],
);

export const itineraryItems = sqliteTable(
  "itinerary_items",
  {
    id: text("id").primaryKey(),
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    dayId: text("day_id")
      .notNull()
      .references(() => tripDays.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    kind: text("kind").$type<ItineraryItemKind>().notNull(),
    savedIdeaId: text("saved_idea_id").references(() => savedIdeas.id, {
      onDelete: "restrict",
    }),
    placeholderType: text("placeholder_type").$type<PlaceholderType>(),
    scheduleMode: text("schedule_mode").$type<ScheduleMode>().notNull(),
    period: text("period").$type<DayPeriod>(),
    startMinute: integer("start_minute"),
    durationMinutes: integer("duration_minutes").notNull(),
    notes: text("notes"),
    reservationStatus: text("reservation_status")
      .$type<ReservationStatus>()
      .notNull()
      .default("none"),
    links: text("links", { mode: "json" }).$type<string[]>().notNull(),
    costAmountMinor: integer("cost_amount_minor"),
    costCurrency: text("cost_currency", { length: 3 }),
    needsDecision: integer("needs_decision", { mode: "boolean" })
      .notNull()
      .default(false),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("itinerary_items_trip_idx").on(table.tripId),
    index("itinerary_items_day_idx").on(table.dayId),
    uniqueIndex("itinerary_items_idea_idx")
      .on(table.savedIdeaId)
      .where(sql`${table.savedIdeaId} is not null and ${table.deletedAt} is null`),
    uniqueIndex("itinerary_items_active_position_idx")
      .on(table.dayId, table.position)
      .where(sql`${table.deletedAt} is null`),
    check("itinerary_items_kind", sql`${table.kind} in ('activity', 'placeholder')`),
    check(
      "itinerary_items_shape",
      sql`(${table.kind} = 'activity' and ${table.savedIdeaId} is not null and ${table.placeholderType} is null) or (${table.kind} = 'placeholder' and ${table.savedIdeaId} is null and ${table.placeholderType} is not null)`,
    ),
    check(
      "itinerary_items_schedule",
      sql`(${table.scheduleMode} = 'exact' and ${table.startMinute} is not null and ${table.period} is null) or (${table.scheduleMode} = 'period' and ${table.period} is not null and ${table.startMinute} is null)`,
    ),
    check("itinerary_items_duration", sql`${table.durationMinutes} > 0`),
    check(
      "itinerary_items_cost",
      sql`(${table.costAmountMinor} is null and ${table.costCurrency} is null) or (${table.costAmountMinor} >= 0 and length(${table.costCurrency}) = 3)`,
    ),
  ],
);

export const votes = sqliteTable(
  "votes",
  {
    savedIdeaId: text("saved_idea_id")
      .notNull()
      .references(() => savedIdeas.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at"),
  },
  (table) => [primaryKey({ columns: [table.savedIdeaId, table.userId] })],
);

export const reactions = sqliteTable(
  "reactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text("kind").$type<ReactionKind>().notNull(),
    savedIdeaId: text("saved_idea_id").references(() => savedIdeas.id, {
      onDelete: "cascade",
    }),
    itineraryItemId: text("itinerary_item_id").references(() => itineraryItems.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    uniqueIndex("reactions_idea_unique_idx")
      .on(table.userId, table.kind, table.savedIdeaId)
      .where(sql`${table.savedIdeaId} is not null`),
    uniqueIndex("reactions_item_unique_idx")
      .on(table.userId, table.kind, table.itineraryItemId)
      .where(sql`${table.itineraryItemId} is not null`),
    check(
      "reactions_target",
      sql`(${table.savedIdeaId} is not null and ${table.itineraryItemId} is null) or (${table.savedIdeaId} is null and ${table.itineraryItemId} is not null)`,
    ),
    check(
      "reactions_kind",
      sql`${table.kind} in ('heart', 'sparkles', 'thumbs_up', 'eyes')`,
    ),
  ],
);

export const activityEvents = sqliteTable(
  "activity_events",
  {
    id: text("id").primaryKey(),
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    entityKind: text("entity_kind").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),
    before: text("before", { mode: "json" }).$type<Record<string, unknown>>(),
    after: text("after", { mode: "json" }).$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at"),
  },
  (table) => [index("activity_events_trip_created_idx").on(table.tripId, table.createdAt)],
);

export const dismissedWarnings = sqliteTable(
  "dismissed_warnings",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    warningKey: text("warning_key").notNull(),
    warningCode: text("warning_code").notNull(),
    subjectId: text("subject_id").notNull(),
    inputSignature: text("input_signature").notNull(),
    dismissedAt: timestamp("dismissed_at"),
  },
  (table) => [
    primaryKey({
      columns: [
        table.userId,
        table.tripId,
        table.warningKey,
        table.inputSignature,
      ],
    }),
  ],
);

export const deletionTombstones = sqliteTable(
  "deletion_tombstones",
  {
    id: text("id").primaryKey(),
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    targetKind: text("target_kind").$type<DeletableEntity>().notNull(),
    targetId: text("target_id").notNull(),
    deletedBy: text("deleted_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    deletedAt: timestamp("deleted_at"),
    purgeAfter: integer("purge_after", { mode: "timestamp_ms" }).notNull(),
    undoneAt: integer("undone_at", { mode: "timestamp_ms" }),
    purgedAt: integer("purged_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    uniqueIndex("deletion_tombstones_active_target_idx")
      .on(table.targetKind, table.targetId)
      .where(sql`${table.undoneAt} is null and ${table.purgedAt} is null`),
    index("deletion_tombstones_purge_idx").on(table.purgeAfter),
  ],
);

export const providerUsageDaily = sqliteTable(
  "provider_usage_daily",
  {
    provider: text("provider").notNull(),
    operation: text("operation").notNull(),
    utcDate: text("utc_date").notNull(),
    requestCount: integer("request_count").notNull().default(0),
    failureCount: integer("failure_count").notNull().default(0),
    lastRequestAt: integer("last_request_at", { mode: "timestamp_ms" }),
  },
  (table) => [primaryKey({ columns: [table.provider, table.operation, table.utcDate] })],
);
