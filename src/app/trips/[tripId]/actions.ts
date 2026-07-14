"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTripMember } from "@/auth/access";
import { buildInitialTripStructure, calendarDateForOrdinal, tripLengthInDays } from "@/domain/itinerary";

const tripBasicsSchema = z.object({
  name: z.string().trim().min(2).max(100),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  startingLocation: z.string().trim().max(160).optional(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
});

const citySchema = z.object({
  name: z.string().trim().min(2).max(100),
  countryCode: z.string().trim().max(2).transform((value) => value.toUpperCase()).optional(),
  timeZone: z.string().trim().min(1).max(80),
  startDay: z.coerce.number().int().positive().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
});

const ideaSchema = z.object({
  name: z.string().trim().min(2).max(160),
  cityId: z.string().uuid().optional(),
  address: z.string().trim().max(240).optional(),
  notes: z.string().trim().max(2000).optional(),
  priority: z.enum(["must_do", "would_like", "if_time"]),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
});

const placeholderSchema = z.object({
  dayId: z.string().uuid(),
  placeholderType: z.enum(["eat", "travel", "rest", "coffee", "explore", "buffer"]),
  period: z.enum(["morning", "afternoon", "evening"]),
  exactTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  duration: z.coerce.number().int().min(15).max(1440),
  fromCityId: z.string().uuid().optional(),
  toCityId: z.string().uuid().optional(),
  notes: z.string().trim().max(1000).optional(),
});

const tripNightSchema = z.discriminatedUnion("nightKind", [
  z.object({ dayId: z.string().uuid(), nightKind: z.literal("stay"), stayCityId: z.string().uuid(), notes: z.string().trim().max(1000).optional() }),
  z.object({ dayId: z.string().uuid(), nightKind: z.literal("travel"), fromCityId: z.string().uuid(), toCityId: z.string().uuid(), notes: z.string().trim().max(1000).optional() }),
]).refine((input) => input.nightKind === "stay" || input.fromCityId !== input.toCityId, "Travel nights must connect two different cities");

const manualActivitySchema = z.object({
  dayId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  address: z.string().trim().max(240).optional(),
  priority: z.enum(["must_do", "would_like", "if_time"]),
  period: z.enum(["morning", "afternoon", "evening"]),
  exactTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  duration: z.coerce.number().int().min(1).max(1440),
  notes: z.string().trim().max(1000).optional(),
});

const dayLabelSchema = z.object({
  dayId: z.string().uuid(),
  label: z.string().trim().min(2).max(120),
});

const moveCitySchema = z.object({
  cityId: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

const assignCitySchema = z.object({
  cityId: z.string().uuid(),
  startDay: z.coerce.number().int().positive(),
});

const cityDetailsSchema = citySchema.omit({ startDay: true }).extend({
  cityId: z.string().uuid(),
});

function values(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries([...formData.entries()].filter(([, value]) => value !== ""));
}

function refreshTrip(tripId: string): void {
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/planner`);
  revalidatePath(`/trips/${tripId}/ideas`);
  revalidatePath(`/trips/${tripId}/activity`);
  revalidatePath(`/trips/${tripId}/settings`);
  revalidatePath("/trips");
}

export async function createDaysFromTripDates(tripId: string): Promise<void> {
  const { user } = await requireTripMember(tripId);
  const { env } = getCloudflareContext();
  const [trip, firstCity, current] = await Promise.all([
    env.DB.prepare("select start_date as startDate,end_date as endDate from trips where id=?1 and deleted_at is null").bind(tripId).first<{ startDate: string | null; endDate: string | null }>(),
    env.DB.prepare("select id from cities where trip_id=?1 and deleted_at is null order by position limit 1").bind(tripId).first<{ id: string }>(),
    env.DB.prepare("select count(*) as count from trip_days where trip_id=?1").bind(tripId).first<{ count: number }>(),
  ]);
  if (!trip || !firstCity) throw new Error("TRIP_STRUCTURE_MISSING");
  if ((current?.count ?? 0) > 0) return;
  const structure = buildInitialTripStructure(trip.startDate, trip.endDate);
  const now = Date.now();
  await env.DB.batch([
    ...structure.days.map((day) => env.DB.prepare("insert into trip_days (id,trip_id,city_id,ordinal,calendar_date,version,created_at,updated_at) values (?1,?2,?3,?4,?5,1,?6,?6)").bind(day.id, tripId, firstCity.id, day.ordinal, day.calendarDate, now)),
    ...structure.nights.map((night) => env.DB.prepare("insert into trip_nights (id,trip_id,after_day_id,kind,stay_city_id,calendar_date) values (?1,?2,?3,'stay',?4,?5)").bind(night.id, tripId, night.afterDayId, firstCity.id, night.calendarDate)),
    env.DB.prepare("insert into activity_events (id,trip_id,actor_user_id,entity_kind,entity_id,action,after,created_at) values (?1,?2,?3,'trip',?2,'days_created',?4,?5)").bind(crypto.randomUUID(), tripId, user.id, JSON.stringify({ dayCount: structure.days.length }), now),
  ]);
  refreshTrip(tripId);
}

export async function addCity(tripId: string, formData: FormData): Promise<void> {
  const { user } = await requireTripMember(tripId);
  const input = citySchema.parse(values(formData));
  const { env } = getCloudflareContext();
  const [positionRow, days] = await Promise.all([
    env.DB.prepare("select coalesce(max(position),-1)+1 as position from cities where trip_id=?1 and deleted_at is null").bind(tripId).first<{ position: number }>(),
    env.DB.prepare("select id,ordinal,city_id as cityId,calendar_date as calendarDate from trip_days where trip_id=?1 order by ordinal").bind(tripId).all<{ id: string; ordinal: number; cityId: string; calendarDate: string | null }>(),
  ]);
  const cityId = crypto.randomUUID();
  const now = Date.now();
  const reassigned = days.results.map((day) => input.startDay && day.ordinal >= input.startDay ? { ...day, cityId } : day);
  const statements = [
    env.DB.prepare("insert into cities (id,trip_id,position,name,country_code,timezone,lat,lon,source_provider,version,created_at,updated_at) values (?1,?2,?3,?4,?5,?6,?7,?8,'manual',1,?9,?9)").bind(cityId, tripId, positionRow?.position ?? 0, input.name, input.countryCode || null, input.timeZone, input.lat ?? null, input.lon ?? null, now),
    ...(input.startDay ? days.results.filter((day) => day.ordinal >= input.startDay!).map((day) => env.DB.prepare("update trip_days set city_id=?1,version=version+1,updated_at=?2 where id=?3 and trip_id=?4").bind(cityId, now, day.id, tripId)) : []),
    ...(input.startDay && days.results.length > 1 ? [env.DB.prepare("delete from trip_nights where trip_id=?1").bind(tripId), ...reassigned.slice(0, -1).map((day) => env.DB.prepare("insert into trip_nights (id,trip_id,after_day_id,kind,stay_city_id,calendar_date) values (?1,?2,?3,'stay',?4,?5)").bind(crypto.randomUUID(), tripId, day.id, day.cityId, day.calendarDate))] : []),
    env.DB.prepare("insert into activity_events (id,trip_id,actor_user_id,entity_kind,entity_id,action,after,created_at) values (?1,?2,?3,'city',?4,'created',?5,?6)").bind(crypto.randomUUID(), tripId, user.id, cityId, JSON.stringify({ name: input.name, startDay: input.startDay ?? null }), now),
  ];
  await env.DB.batch(statements);
  refreshTrip(tripId);
}

export async function updateCity(tripId: string, formData: FormData): Promise<void> {
  const { user } = await requireTripMember(tripId);
  const input = cityDetailsSchema.parse(values(formData));
  const { env } = getCloudflareContext();
  const city = await env.DB.prepare("select name,country_code as countryCode,timezone as timeZone,lat,lon from cities where id=?1 and trip_id=?2 and deleted_at is null").bind(input.cityId, tripId).first<Record<string, unknown>>();
  if (!city) throw new Error("CITY_NOT_IN_TRIP");
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("update cities set name=?1,country_code=?2,timezone=?3,lat=?4,lon=?5,version=version+1,updated_at=?6 where id=?7 and trip_id=?8").bind(input.name, input.countryCode || null, input.timeZone, input.lat ?? null, input.lon ?? null, now, input.cityId, tripId),
    env.DB.prepare("insert into activity_events (id,trip_id,actor_user_id,entity_kind,entity_id,action,before,after,created_at) values (?1,?2,?3,'city',?4,'city_updated',?5,?6,?7)").bind(crypto.randomUUID(), tripId, user.id, input.cityId, JSON.stringify(city), JSON.stringify({ name: input.name, countryCode: input.countryCode, timeZone: input.timeZone, lat: input.lat, lon: input.lon }), now),
  ]);
  refreshTrip(tripId);
}

export async function moveCity(tripId: string, formData: FormData): Promise<void> {
  const { user } = await requireTripMember(tripId);
  const input = moveCitySchema.parse(values(formData));
  const { env } = getCloudflareContext();
  const city = await env.DB.prepare("select id,name,position from cities where id=?1 and trip_id=?2 and deleted_at is null").bind(input.cityId, tripId).first<{ id: string; name: string; position: number }>();
  if (!city) throw new Error("CITY_NOT_IN_TRIP");
  const operator = input.direction === "up" ? "<" : ">";
  const order = input.direction === "up" ? "desc" : "asc";
  const neighbor = await env.DB.prepare(`select id,position from cities where trip_id=?1 and deleted_at is null and position ${operator} ?2 order by position ${order} limit 1`).bind(tripId, city.position).first<{ id: string; position: number }>();
  if (!neighbor) return;
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("update cities set position=-1,version=version+1,updated_at=?1 where id=?2 and trip_id=?3").bind(now, city.id, tripId),
    env.DB.prepare("update cities set position=?1,version=version+1,updated_at=?2 where id=?3 and trip_id=?4").bind(city.position, now, neighbor.id, tripId),
    env.DB.prepare("update cities set position=?1,version=version+1,updated_at=?2 where id=?3 and trip_id=?4").bind(neighbor.position, now, city.id, tripId),
    env.DB.prepare("insert into activity_events (id,trip_id,actor_user_id,entity_kind,entity_id,action,after,created_at) values (?1,?2,?3,'city',?4,'moved',?5,?6)").bind(crypto.randomUUID(), tripId, user.id, city.id, JSON.stringify({ name: city.name, direction: input.direction, position: neighbor.position }), now),
  ]);
  refreshTrip(tripId);
}

export async function assignCityFromDay(tripId: string, formData: FormData): Promise<void> {
  const { user } = await requireTripMember(tripId);
  const input = assignCitySchema.parse(values(formData));
  const { env } = getCloudflareContext();
  const [city, days] = await Promise.all([
    env.DB.prepare("select id,name from cities where id=?1 and trip_id=?2 and deleted_at is null").bind(input.cityId, tripId).first<{ id: string; name: string }>(),
    env.DB.prepare("select id,ordinal,city_id as cityId,calendar_date as calendarDate from trip_days where trip_id=?1 order by ordinal").bind(tripId).all<{ id: string; ordinal: number; cityId: string; calendarDate: string | null }>(),
  ]);
  if (!city || !days.results.some((day) => day.ordinal === input.startDay)) throw new Error("CITY_OR_DAY_NOT_IN_TRIP");
  const reassigned = days.results.map((day) => day.ordinal >= input.startDay ? { ...day, cityId: city.id } : day);
  const now = Date.now();
  await env.DB.batch([
    ...days.results.filter((day) => day.ordinal >= input.startDay).map((day) => env.DB.prepare("update trip_days set city_id=?1,version=version+1,updated_at=?2 where id=?3 and trip_id=?4").bind(city.id, now, day.id, tripId)),
    env.DB.prepare("delete from trip_nights where trip_id=?1").bind(tripId),
    ...reassigned.slice(0, -1).map((day) => env.DB.prepare("insert into trip_nights (id,trip_id,after_day_id,kind,stay_city_id,calendar_date) values (?1,?2,?3,'stay',?4,?5)").bind(crypto.randomUUID(), tripId, day.id, day.cityId, day.calendarDate)),
    env.DB.prepare("insert into activity_events (id,trip_id,actor_user_id,entity_kind,entity_id,action,after,created_at) values (?1,?2,?3,'city',?4,'days_assigned',?5,?6)").bind(crypto.randomUUID(), tripId, user.id, city.id, JSON.stringify({ name: city.name, startDay: input.startDay }), now),
  ]);
  refreshTrip(tripId);
}

export async function createManualIdea(tripId: string, formData: FormData): Promise<void> {
  const { user } = await requireTripMember(tripId);
  const input = ideaSchema.parse(values(formData));
  const { env } = getCloudflareContext();
  if (input.cityId) {
    const city = await env.DB.prepare("select 1 from cities where id=?1 and trip_id=?2 and deleted_at is null").bind(input.cityId, tripId).first();
    if (!city) throw new Error("CITY_NOT_IN_TRIP");
  }
  const ideaId = crypto.randomUUID();
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("insert into saved_ideas (id,trip_id,city_id,name,address,lat,lon,categories,priority,notes,source_provider,created_by,version,created_at,updated_at) values (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,'manual',?11,1,?12,?12)").bind(ideaId, tripId, input.cityId ?? null, input.name, input.address || null, input.lat ?? null, input.lon ?? null, JSON.stringify([]), input.priority, input.notes || null, user.id, now),
    env.DB.prepare("insert into activity_events (id,trip_id,actor_user_id,entity_kind,entity_id,action,after,created_at) values (?1,?2,?3,'saved_idea',?4,'created',?5,?6)").bind(crypto.randomUUID(), tripId, user.id, ideaId, JSON.stringify({ name: input.name, priority: input.priority }), now),
  ]);
  refreshTrip(tripId);
}

export async function scheduleIdea(tripId: string, ideaId: string, dayId: string): Promise<void> {
  const { user } = await requireTripMember(tripId);
  const { env } = getCloudflareContext();
  const [idea, day, position] = await Promise.all([
    env.DB.prepare("select name from saved_ideas where id=?1 and trip_id=?2 and deleted_at is null").bind(ideaId, tripId).first<{ name: string }>(),
    env.DB.prepare("select ordinal from trip_days where id=?1 and trip_id=?2").bind(dayId, tripId).first<{ ordinal: number }>(),
    env.DB.prepare("select coalesce(max(position),-1)+1 as position from itinerary_items where day_id=?1 and deleted_at is null").bind(dayId).first<{ position: number }>(),
  ]);
  if (!idea || !day) throw new Error("IDEA_OR_DAY_NOT_IN_TRIP");
  const itemId = crypto.randomUUID();
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("insert into itinerary_items (id,trip_id,day_id,position,kind,saved_idea_id,schedule_mode,period,duration_minutes,reservation_status,links,needs_decision,version,created_at,updated_at) values (?1,?2,?3,?4,'activity',?5,'period','afternoon',90,'none',?6,0,1,?7,?7)").bind(itemId, tripId, dayId, position?.position ?? 0, ideaId, JSON.stringify([]), now),
    env.DB.prepare("insert into activity_events (id,trip_id,actor_user_id,entity_kind,entity_id,action,after,created_at) values (?1,?2,?3,'itinerary_item',?4,'scheduled',?5,?6)").bind(crypto.randomUUID(), tripId, user.id, itemId, JSON.stringify({ ideaId, name: idea.name, dayOrdinal: day.ordinal }), now),
  ]);
  refreshTrip(tripId);
}

export async function replacePlaceholderWithIdea(tripId: string, itemId: string, ideaId: string): Promise<void> {
  const { user } = await requireTripMember(tripId);
  const { env } = getCloudflareContext();
  const [item, idea] = await Promise.all([
    env.DB.prepare("select id,placeholder_type as placeholderType from itinerary_items where id=?1 and trip_id=?2 and kind='placeholder' and deleted_at is null").bind(itemId, tripId).first<{ id: string; placeholderType: string }>(),
    env.DB.prepare("select name from saved_ideas where id=?1 and trip_id=?2 and deleted_at is null").bind(ideaId, tripId).first<{ name: string }>(),
  ]);
  if (!item || !idea) throw new Error("PLACEHOLDER_OR_IDEA_NOT_IN_TRIP");
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("update itinerary_items set kind='activity',saved_idea_id=?1,placeholder_type=null,needs_decision=0,version=version+1,updated_at=?2 where id=?3 and trip_id=?4").bind(ideaId, now, itemId, tripId),
    env.DB.prepare("insert into activity_events (id,trip_id,actor_user_id,entity_kind,entity_id,action,before,after,created_at) values (?1,?2,?3,'itinerary_item',?4,'placeholder_replaced',?5,?6,?7)").bind(crypto.randomUUID(), tripId, user.id, itemId, JSON.stringify({ placeholderType: item.placeholderType }), JSON.stringify({ ideaId, name: idea.name }), now),
  ]);
  refreshTrip(tripId);
}

export async function createPlaceholder(tripId: string, formData: FormData): Promise<void> {
  const { user } = await requireTripMember(tripId);
  const input = placeholderSchema.parse(values(formData));
  const { env } = getCloudflareContext();
  const [day, position] = await Promise.all([
    env.DB.prepare("select ordinal from trip_days where id=?1 and trip_id=?2").bind(input.dayId, tripId).first<{ ordinal: number }>(),
    env.DB.prepare("select coalesce(max(position),-1)+1 as position from itinerary_items where day_id=?1 and deleted_at is null").bind(input.dayId).first<{ position: number }>(),
  ]);
  if (!day) throw new Error("DAY_NOT_IN_TRIP");
  let notes = input.notes || null;
  let travelMetadata: Record<string, unknown> = {};
  if (input.placeholderType === "travel") {
    if (!input.fromCityId || !input.toCityId || input.fromCityId === input.toCityId) throw new Error("TRAVEL_ROUTE_REQUIRED");
    const cityRows = await env.DB.prepare("select id,name from cities where trip_id=?1 and deleted_at is null and id in (?2,?3)").bind(tripId, input.fromCityId, input.toCityId).all<{ id: string; name: string }>();
    const cityNames = new Map(cityRows.results.map((city) => [city.id, city.name]));
    const fromCityName = cityNames.get(input.fromCityId);
    const toCityName = cityNames.get(input.toCityId);
    if (!fromCityName || !toCityName) throw new Error("CITY_NOT_IN_TRIP");
    notes = `${fromCityName} → ${toCityName}${input.notes ? ` · ${input.notes}` : ""}`;
    travelMetadata = { fromCityId: input.fromCityId, fromCityName, toCityId: input.toCityId, toCityName };
  }
  const scheduleMode = input.exactTime ? "exact" : "period";
  const startMinute = input.exactTime ? Number(input.exactTime.slice(0, 2)) * 60 + Number(input.exactTime.slice(3, 5)) : null;
  const itemId = crypto.randomUUID();
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("insert into itinerary_items (id,trip_id,day_id,position,kind,placeholder_type,schedule_mode,period,start_minute,duration_minutes,notes,reservation_status,links,needs_decision,version,created_at,updated_at) values (?1,?2,?3,?4,'placeholder',?5,?6,?7,?8,?9,?10,'none',?11,1,1,?12,?12)").bind(itemId, tripId, input.dayId, position?.position ?? 0, input.placeholderType, scheduleMode, input.exactTime ? null : input.period, startMinute, input.duration, notes, JSON.stringify([]), now),
    env.DB.prepare("insert into activity_events (id,trip_id,actor_user_id,entity_kind,entity_id,action,after,created_at) values (?1,?2,?3,'itinerary_item',?4,'placeholder_created',?5,?6)").bind(crypto.randomUUID(), tripId, user.id, itemId, JSON.stringify({ placeholderType: input.placeholderType, dayOrdinal: day.ordinal, ...travelMetadata }), now),
  ]);
  refreshTrip(tripId);
}

export async function saveTripNight(tripId: string, formData: FormData): Promise<void> {
  const { user } = await requireTripMember(tripId);
  const input = tripNightSchema.parse(values(formData));
  const { env } = getCloudflareContext();
  const day = await env.DB.prepare("select id,ordinal,calendar_date as calendarDate from trip_days where id=?1 and trip_id=?2").bind(input.dayId, tripId).first<{ id: string; ordinal: number; calendarDate: string | null }>();
  if (!day) throw new Error("DAY_NOT_IN_TRIP");
  const [nextDay, cityRows, existing] = await Promise.all([
    env.DB.prepare("select id from trip_days where trip_id=?1 and ordinal>?2 order by ordinal limit 1").bind(tripId, day.ordinal).first<{ id: string }>(),
    env.DB.prepare("select id,name from cities where trip_id=?1 and deleted_at is null").bind(tripId).all<{ id: string; name: string }>(),
    env.DB.prepare("select kind,stay_city_id as stayCityId,from_city_id as fromCityId,to_city_id as toCityId,notes from trip_nights where trip_id=?1 and after_day_id=?2").bind(tripId, day.id).first<Record<string, unknown>>(),
  ]);
  if (!nextDay) throw new Error("FINAL_DAY_HAS_NO_NIGHT");
  const cityNames = new Map(cityRows.results.map((city) => [city.id, city.name]));
  const referencedCityIds = input.nightKind === "stay" ? [input.stayCityId] : [input.fromCityId, input.toCityId];
  if (referencedCityIds.some((cityId) => !cityNames.has(cityId))) throw new Error("CITY_NOT_IN_TRIP");
  const nightId = crypto.randomUUID();
  const now = Date.now();
  const after = input.nightKind === "stay"
    ? { kind: input.nightKind, dayOrdinal: day.ordinal, cityId: input.stayCityId, cityName: cityNames.get(input.stayCityId), notes: input.notes ?? null }
    : { kind: input.nightKind, dayOrdinal: day.ordinal, fromCityId: input.fromCityId, fromCityName: cityNames.get(input.fromCityId), toCityId: input.toCityId, toCityName: cityNames.get(input.toCityId), notes: input.notes ?? null };
  const insert = input.nightKind === "stay"
    ? env.DB.prepare("insert into trip_nights (id,trip_id,after_day_id,kind,stay_city_id,calendar_date,notes) values (?1,?2,?3,'stay',?4,?5,?6)").bind(nightId, tripId, day.id, input.stayCityId, day.calendarDate, input.notes || null)
    : env.DB.prepare("insert into trip_nights (id,trip_id,after_day_id,kind,from_city_id,to_city_id,calendar_date,notes) values (?1,?2,?3,'travel',?4,?5,?6,?7)").bind(nightId, tripId, day.id, input.fromCityId, input.toCityId, day.calendarDate, input.notes || null);
  await env.DB.batch([
    env.DB.prepare("delete from trip_nights where trip_id=?1 and after_day_id=?2").bind(tripId, day.id),
    insert,
    env.DB.prepare("insert into activity_events (id,trip_id,actor_user_id,entity_kind,entity_id,action,before,after,created_at) values (?1,?2,?3,'trip_night',?4,'night_saved',?5,?6,?7)").bind(crypto.randomUUID(), tripId, user.id, nightId, existing ? JSON.stringify(existing) : null, JSON.stringify(after), now),
  ]);
  refreshTrip(tripId);
}

export async function createManualActivity(tripId: string, formData: FormData): Promise<void> {
  const { user } = await requireTripMember(tripId);
  const input = manualActivitySchema.parse(values(formData));
  const { env } = getCloudflareContext();
  const [day, position] = await Promise.all([
    env.DB.prepare("select ordinal,city_id as cityId from trip_days where id=?1 and trip_id=?2").bind(input.dayId, tripId).first<{ ordinal: number; cityId: string }>(),
    env.DB.prepare("select coalesce(max(position),-1)+1 as position from itinerary_items where day_id=?1 and deleted_at is null").bind(input.dayId).first<{ position: number }>(),
  ]);
  if (!day) throw new Error("DAY_NOT_IN_TRIP");
  const ideaId = crypto.randomUUID();
  const itemId = crypto.randomUUID();
  const scheduleMode = input.exactTime ? "exact" : "period";
  const startMinute = input.exactTime ? Number(input.exactTime.slice(0, 2)) * 60 + Number(input.exactTime.slice(3, 5)) : null;
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("insert into saved_ideas (id,trip_id,city_id,name,address,categories,priority,notes,source_provider,created_by,version,created_at,updated_at) values (?1,?2,?3,?4,?5,?6,?7,?8,'manual',?9,1,?10,?10)").bind(ideaId, tripId, day.cityId, input.name, input.address || null, JSON.stringify([]), input.priority, input.notes || null, user.id, now),
    env.DB.prepare("insert into itinerary_items (id,trip_id,day_id,position,kind,saved_idea_id,schedule_mode,period,start_minute,duration_minutes,notes,reservation_status,links,needs_decision,version,created_at,updated_at) values (?1,?2,?3,?4,'activity',?5,?6,?7,?8,?9,?10,'none',?11,0,1,?12,?12)").bind(itemId, tripId, input.dayId, position?.position ?? 0, ideaId, scheduleMode, input.exactTime ? null : input.period, startMinute, input.duration, input.notes || null, JSON.stringify([]), now),
    env.DB.prepare("insert into activity_events (id,trip_id,actor_user_id,entity_kind,entity_id,action,after,created_at) values (?1,?2,?3,'itinerary_item',?4,'manual_activity_created',?5,?6)").bind(crypto.randomUUID(), tripId, user.id, itemId, JSON.stringify({ name: input.name, dayOrdinal: day.ordinal }), now),
  ]);
  refreshTrip(tripId);
}

export async function updateDayLabel(tripId: string, formData: FormData): Promise<void> {
  const { user } = await requireTripMember(tripId);
  const input = dayLabelSchema.parse(values(formData));
  const { env } = getCloudflareContext();
  const day = await env.DB.prepare("select ordinal,label from trip_days where id=?1 and trip_id=?2").bind(input.dayId, tripId).first<{ ordinal: number; label: string | null }>();
  if (!day) throw new Error("DAY_NOT_IN_TRIP");
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("update trip_days set label=?1,version=version+1,updated_at=?2 where id=?3 and trip_id=?4").bind(input.label, now, input.dayId, tripId),
    env.DB.prepare("insert into activity_events (id,trip_id,actor_user_id,entity_kind,entity_id,action,before,after,created_at) values (?1,?2,?3,'trip_day',?4,'day_updated',?5,?6,?7)").bind(crypto.randomUUID(), tripId, user.id, input.dayId, JSON.stringify({ label: day.label }), JSON.stringify({ name: input.label, dayOrdinal: day.ordinal }), now),
  ]);
  refreshTrip(tripId);
}

export async function updateTripBasics(tripId: string, formData: FormData): Promise<void> {
  const { user } = await requireTripMember(tripId, "owner");
  const input = tripBasicsSchema.parse(values(formData));
  tripLengthInDays(input.startDate || null, input.endDate || null);
  const { env } = getCloudflareContext();
  const [before, days] = await Promise.all([
    env.DB.prepare("select name,start_date as startDate,end_date as endDate,default_currency as currency from trips where id=?1 and deleted_at is null").bind(tripId).first<Record<string, unknown>>(),
    env.DB.prepare("select id,ordinal from trip_days where trip_id=?1 order by ordinal").bind(tripId).all<{ id: string; ordinal: number }>(),
  ]);
  if (!before) throw new Error("TRIP_NOT_FOUND");
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("update trips set name=?1,start_date=?2,end_date=?3,starting_location_text=?4,default_currency=?5,version=version+1,updated_at=?6 where id=?7").bind(input.name, input.startDate || null, input.endDate || null, input.startingLocation || null, input.currency, now, tripId),
    ...days.results.map((day) => env.DB.prepare("update trip_days set calendar_date=?1,version=version+1,updated_at=?2 where id=?3 and trip_id=?4").bind(calendarDateForOrdinal(input.startDate || null, day.ordinal), now, day.id, tripId)),
    env.DB.prepare("insert into activity_events (id,trip_id,actor_user_id,entity_kind,entity_id,action,before,after,created_at) values (?1,?2,?3,'trip',?2,'updated',?4,?5,?6)").bind(crypto.randomUUID(), tripId, user.id, JSON.stringify(before), JSON.stringify({ name: input.name, startDate: input.startDate || null, endDate: input.endDate || null, currency: input.currency }), now),
  ]);
  refreshTrip(tripId);
}
