"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/auth/access";
import { buildInitialTripStructure } from "@/domain/itinerary";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  startingLocation: z.string().trim().max(160).optional(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
  firstCity: z.string().trim().min(2).max(100),
  timezone: z.string().trim().min(1).default("UTC"),
});

export async function createTrip(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const input = schema.parse(Object.fromEntries(formData));
  const tripId = crypto.randomUUID();
  const cityId = crypto.randomUUID();
  const now = Date.now();
  const { env } = getCloudflareContext();
  const startDate = input.startDate || null;
  const endDate = input.endDate || null;
  const structure = buildInitialTripStructure(startDate, endDate);
  const statements = [
    env.DB.prepare(`insert into trips (id,name,start_date,end_date,starting_location_text,default_currency,version,created_at,updated_at) values (?1,?2,?3,?4,?5,?6,1,?7,?7)`).bind(tripId, input.name, input.startDate || null, input.endDate || null, input.startingLocation || null, input.currency, now),
    env.DB.prepare(`insert into trip_members (trip_id,user_id,role,joined_at) values (?1,?2,'owner',?3)`).bind(tripId, user.id, now),
    env.DB.prepare(`insert into cities (id,trip_id,position,name,timezone,source_provider,version,created_at,updated_at) values (?1,?2,0,?3,?4,'manual',1,?5,?5)`).bind(cityId, tripId, input.firstCity, input.timezone, now),
    ...structure.days.map((day) => env.DB.prepare(`insert into trip_days (id,trip_id,city_id,ordinal,calendar_date,version,created_at,updated_at) values (?1,?2,?3,?4,?5,1,?6,?6)`).bind(day.id, tripId, cityId, day.ordinal, day.calendarDate, now)),
    ...structure.nights.map((night) => env.DB.prepare(`insert into trip_nights (id,trip_id,after_day_id,kind,stay_city_id,calendar_date) values (?1,?2,?3,'stay',?4,?5)`).bind(night.id, tripId, night.afterDayId, cityId, night.calendarDate)),
    env.DB.prepare(`insert into activity_events (id,trip_id,actor_user_id,entity_kind,entity_id,action,after,created_at) values (?1,?2,?3,'trip',?2,'created',?4,?5)`).bind(crypto.randomUUID(), tripId, user.id, JSON.stringify({ name: input.name }), now),
  ];
  await env.DB.batch(statements);
  redirect(`/trips/${tripId}`);
}
