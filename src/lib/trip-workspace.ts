import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { AuthenticatedUser } from "@/auth/access";
import type { IdeaPriority, PlaceholderType, ReservationStatus } from "@/domain/types";
import type { WorkspaceCity, WorkspaceDay, WorkspaceIdea, WorkspaceItem } from "@/lib/demo-data";
import { getDemoTripFixture, type TripWorkspace } from "@/lib/demo-trips";

interface TripRow {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
}

interface CityRow {
  id: string;
  name: string;
  country: string | null;
  timeZone: string;
  lat: number | null;
  lon: number | null;
  nights: number;
  image: string | null;
}

interface DayRow {
  id: string;
  ordinal: number;
  calendarDate: string | null;
  cityId: string;
  label: string | null;
}

interface IdeaRow {
  id: string;
  name: string;
  address: string | null;
  notes: string | null;
  cityId: string | null;
  priority: IdeaPriority;
  voteCount: number;
  userVoted: number;
  scheduled: number;
  lat: number | null;
  lon: number | null;
  image: string | null;
  attribution: string | null;
}

interface ItemRow {
  id: string;
  dayId: string;
  kind: "activity" | "placeholder";
  ideaId: string | null;
  ideaName: string | null;
  address: string | null;
  placeholderType: PlaceholderType | null;
  scheduleMode: "exact" | "period";
  period: string | null;
  startMinute: number | null;
  duration: number;
  notes: string | null;
  reservation: ReservationStatus;
  costAmountMinor: number | null;
  costCurrency: string | null;
}

function readableDate(value: string | null): string {
  if (!value) return "Flexible date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00.000Z`));
}

function tripDateLabel(startDate: string | null, endDate: string | null): string {
  if (!startDate) return "Flexible dates";
  return endDate ? `${readableDate(startDate)}–${readableDate(endDate)}` : readableDate(startDate);
}

function itemStart(row: ItemRow): string | undefined {
  if (row.scheduleMode === "period") return row.period ? row.period[0].toUpperCase() + row.period.slice(1) : undefined;
  if (row.startMinute === null) return undefined;
  return `${String(Math.floor(row.startMinute / 60)).padStart(2, "0")}:${String(row.startMinute % 60).padStart(2, "0")}`;
}

function itemCost(row: ItemRow): string | undefined {
  if (row.costAmountMinor === null || !row.costCurrency) return undefined;
  return new Intl.NumberFormat("en", { style: "currency", currency: row.costCurrency }).format(row.costAmountMinor / 100);
}

function placeholderTitle(type: PlaceholderType | null): string {
  const labels: Record<PlaceholderType, string> = {
    eat: "Choose somewhere to eat",
    travel: "Plan this transfer",
    rest: "Rest and reset",
    coffee: "Find a coffee stop",
    explore: "Room to explore",
    buffer: "Room to drift",
  };
  return type ? labels[type] : "Open decision";
}

export async function loadTripWorkspace(tripId: string, user: AuthenticatedUser): Promise<TripWorkspace | null> {
  const fixture = getDemoTripFixture(tripId);
  if (fixture) return fixture;
  const { env } = getCloudflareContext();
  const trip = await env.DB.prepare("select id,name,start_date as startDate,end_date as endDate from trips where id=?1 and deleted_at is null").bind(tripId).first<TripRow>();
  if (!trip) return null;
  const [cityRows, dayRows, ideaRows, itemRows, nightCount] = await Promise.all([
    env.DB.prepare(`select c.id,c.name,c.country_code as country,c.timezone as timeZone,c.lat,c.lon,
      (select count(*) from trip_nights n where n.trip_id=c.trip_id and n.kind='stay' and n.stay_city_id=c.id) as nights,
      case when a.source='upload' then '/api/trips/' || c.trip_id || '/assets?id=' || a.id else a.external_url end as image
      from cities c left join assets a on a.id=c.hero_asset_id and a.deleted_at is null
      where c.trip_id=?1 and c.deleted_at is null order by c.position`).bind(tripId).all<CityRow>(),
    env.DB.prepare("select id,ordinal,calendar_date as calendarDate,city_id as cityId,label from trip_days where trip_id=?1 order by ordinal").bind(tripId).all<DayRow>(),
    env.DB.prepare(`select i.id,i.name,i.address,i.notes,i.city_id as cityId,i.priority,i.lat,i.lon,
      (select count(*) from votes v where v.saved_idea_id=i.id) as voteCount,
      exists(select 1 from votes v where v.saved_idea_id=i.id and v.user_id=?2) as userVoted,
      exists(select 1 from itinerary_items x where x.saved_idea_id=i.id and x.deleted_at is null) as scheduled,
      case when a.source='upload' then '/api/trips/' || i.trip_id || '/assets?id=' || a.id else a.external_url end as image,
      coalesce(a.attribution_text,i.source_attribution) as attribution
      from saved_ideas i left join assets a on a.id=i.image_asset_id and a.deleted_at is null
      where i.trip_id=?1 and i.deleted_at is null order by i.created_at desc`).bind(tripId, user.id).all<IdeaRow>(),
    env.DB.prepare(`select x.id,x.day_id as dayId,x.kind,x.saved_idea_id as ideaId,i.name as ideaName,i.address,
      x.placeholder_type as placeholderType,x.schedule_mode as scheduleMode,x.period,x.start_minute as startMinute,
      x.duration_minutes as duration,x.notes,x.reservation_status as reservation,
      x.cost_amount_minor as costAmountMinor,x.cost_currency as costCurrency
      from itinerary_items x left join saved_ideas i on i.id=x.saved_idea_id
      join trip_days d on d.id=x.day_id and d.trip_id=x.trip_id
      where x.trip_id=?1 and x.deleted_at is null order by d.ordinal,x.position`).bind(tripId).all<ItemRow>(),
    env.DB.prepare("select count(*) as count from trip_nights where trip_id=?1").bind(tripId).first<{ count: number }>(),
  ]);

  const cities: WorkspaceCity[] = cityRows.results.map((row) => ({
    id: row.id,
    name: row.name,
    country: row.country || "Destination",
    nights: row.nights,
    timeZone: row.timeZone,
    lat: row.lat ?? Number.NaN,
    lon: row.lon ?? Number.NaN,
    image: row.image ?? undefined,
  }));
  const days: WorkspaceDay[] = dayRows.results.map((row) => ({
    id: row.id,
    ordinal: row.ordinal,
    date: readableDate(row.calendarDate),
    cityId: row.cityId,
    title: row.label || "Open day",
  }));
  const ideas: WorkspaceIdea[] = ideaRows.results.map((row) => ({
    id: row.id,
    name: row.name,
    detail: row.address || row.notes || "Manual idea",
    cityId: row.cityId ?? "",
    priority: row.priority,
    votes: row.voteCount,
    userVoted: Boolean(row.userVoted),
    image: row.image ?? undefined,
    imageAttribution: row.image && row.attribution ? { label: row.attribution, url: row.image } : undefined,
    scheduled: Boolean(row.scheduled),
    lat: row.lat ?? Number.NaN,
    lon: row.lon ?? Number.NaN,
  }));
  const items: WorkspaceItem[] = itemRows.results.map((row) => ({
    id: row.id,
    dayId: row.dayId,
    title: row.kind === "activity" ? row.ideaName ?? "Activity" : placeholderTitle(row.placeholderType),
    subtitle: row.kind === "activity" ? row.address || row.notes || "Saved idea" : row.notes || "Needs a decision",
    start: itemStart(row),
    duration: row.duration,
    durationSource: "confirmed",
    kind: row.kind,
    placeholderType: row.placeholderType ?? undefined,
    reservation: row.reservation,
    cost: itemCost(row),
    ideaId: row.ideaId ?? undefined,
  }));
  return {
    id: trip.id,
    name: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    dateLabel: tripDateLabel(trip.startDate, trip.endDate),
    timeZoneLabel: "Local time changes by city",
    totalDays: days.length,
    totalNights: nightCount?.count ?? 0,
    cities,
    days,
    ideas,
    items,
    persistence: "d1",
  };
}
