import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ArrowRight, BedDouble, CalendarDays, Moon, Navigation, TrainFront } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JourneyExperience } from "@/components/journey-experience";
import type { JourneyMapCity } from "@/components/journey-map";
import { JourneyStopTimeline } from "@/components/journey-stop-timeline";
import type { StayStatus } from "@/lib/demo-data";
import { getDemoTripFixture } from "@/lib/demo-trips";

interface OverviewCity extends JourneyMapCity {
  image: string | null;
  stayStatus?: StayStatus;
  lodgingName?: string;
}

interface OverviewData {
  name: string;
  startDate: string | null;
  endDate: string | null;
  totalDays: number;
  totalNights: number;
  stayNights: number;
  travelNights: number;
  unresolvedTransfers: number;
  lodgingNeeds?: number;
  cities: OverviewCity[];
  source?: { label: string; url: string };
}

async function loadOverview(tripId: string): Promise<OverviewData | null> {
  const fixture = getDemoTripFixture(tripId);
  if (fixture) {
    const stayNights = fixture.cities.reduce((total, city) => total + city.nights, 0);
    return {
      name: fixture.name,
      startDate: fixture.startDate,
      endDate: fixture.endDate,
      totalDays: fixture.totalDays,
      totalNights: fixture.totalNights,
      stayNights,
      travelNights: Math.max(0, fixture.totalNights - stayNights),
      unresolvedTransfers: fixture.items.filter((item) => item.placeholderType === "travel").length,
      lodgingNeeds: fixture.cities.filter((city) => city.nights > 0 && city.stayStatus !== "booked").length,
      cities: fixture.cities.map((city) => ({ ...city, image: city.image ?? null })),
      source: fixture.source,
    };
  }
  const { env } = getCloudflareContext();
  const trip = await env.DB.prepare("select name,start_date as startDate,end_date as endDate from trips where id=?1 and deleted_at is null").bind(tripId).first<{ name: string; startDate: string | null; endDate: string | null }>();
  if (!trip) return null;
  const [cityRows, dayCount, nightCount, transferCount] = await Promise.all([
    env.DB.prepare(`select c.id,c.name,coalesce(c.country_code,'') as country,c.lat,c.lon,
      (select count(*) from trip_nights n where n.trip_id=c.trip_id and n.kind='stay' and n.stay_city_id=c.id) as nights,
      case when a.source='upload' then '/api/trips/' || c.trip_id || '/assets?id=' || a.id else a.external_url end as image
      from cities c left join assets a on a.id=c.hero_asset_id and a.deleted_at is null
      where c.trip_id=?1 and c.deleted_at is null order by c.position`).bind(tripId).all<{ id: string; name: string; country: string; nights: number; lat: number | null; lon: number | null; image: string | null }>(),
    env.DB.prepare("select count(*) as count from trip_days where trip_id=?1").bind(tripId).first<{ count: number }>(),
    env.DB.prepare("select coalesce(sum(case when kind='stay' then 1 else 0 end),0) as stayNights, coalesce(sum(case when kind='travel' then 1 else 0 end),0) as travelNights from trip_nights where trip_id=?1").bind(tripId).first<{ stayNights: number; travelNights: number }>(),
    env.DB.prepare("select count(*) as count from itinerary_items where trip_id=?1 and placeholder_type='travel' and needs_decision=1 and deleted_at is null").bind(tripId).first<{ count: number }>(),
  ]);
  const cities = cityRows.results.map((city) => ({ ...city, country: city.country || "Destination", lat: city.lat ?? Number.NaN, lon: city.lon ?? Number.NaN }));
  const stayNights = nightCount?.stayNights ?? 0;
  const travelNights = nightCount?.travelNights ?? 0;
  return { ...trip, cities, totalDays: dayCount?.count ?? 0, totalNights: stayNights + travelNights, stayNights, travelNights, unresolvedTransfers: transferCount?.count ?? 0 };
}

function dateLabel(startDate: string | null, endDate: string | null): string {
  if (!startDate) return "Flexible dates";
  return endDate ? `${startDate} — ${endDate}` : startDate;
}

export default async function JourneyOverview({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const overview = await loadOverview(tripId);
  if (!overview) notFound();
  const mappedCities = overview.cities.filter((city) => Number.isFinite(city.lat) && Number.isFinite(city.lon));
  const countryLabel = [...new Set(overview.cities.map((city) => city.country).filter((country) => country !== "Destination"))].join(" · ");

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-10 md:px-10 lg:py-14">
      <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
        <div><p className="eyebrow">{dateLabel(overview.startDate, overview.endDate)}{countryLabel ? ` · ${countryLabel}` : ""}</p><h1 className="display mt-3 text-6xl tracking-[-.035em] text-balance md:text-7xl">{overview.name}</h1><p className="muted mt-4 max-w-xl leading-7">A shared view of every stop, every night, and the coral thread connecting the journey.</p>{overview.source && <a href={overview.source.url} target="_blank" rel="noreferrer" className="muted mt-3 inline-block text-xs underline underline-offset-2">{overview.source.label}</a>}</div>
        <Link href={`/trips/${tripId}/planner`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--indigo)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--indigo-hover)]">Open planner <ArrowRight size={16} /></Link>
      </div>
      <div className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)]">
        {[[String(overview.totalDays),"total days",CalendarDays],[String(overview.totalNights),"nights",Moon],[String(overview.cities.length),"route stops",Navigation]].map(([value,label,Icon]) => <div className="bg-[var(--surface)] p-5 md:p-6" key={String(label)}><Icon className="mb-5 text-[var(--faint)]" size={18} /><strong className="text-2xl font-medium">{String(value)}</strong><span className="muted ml-2 text-sm">{String(label)}</span></div>)}
      </div>
      <JourneyStopTimeline cities={overview.cities} />
      <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Route planning summary">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4"><Moon size={16} className="text-[var(--faint)]" /><strong className="mt-3 block text-lg">{overview.stayNights}</strong><p className="muted mt-1 text-xs">stay nights</p></div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4"><Navigation size={16} className="text-[var(--faint)]" /><strong className="mt-3 block text-lg">{overview.travelNights === 0 ? "None" : overview.travelNights}</strong><p className="muted mt-1 text-xs">{overview.travelNights === 0 ? "overnight travel" : "travel nights"}</p></div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4"><TrainFront size={16} className="text-[var(--thread)]" /><strong className="mt-3 block text-lg">{overview.unresolvedTransfers}</strong><p className="muted mt-1 text-xs">transport choices open</p></div>
        {overview.lodgingNeeds !== undefined && <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4"><BedDouble size={16} className="text-[var(--thread)]" /><strong className="mt-3 block text-lg">{overview.lodgingNeeds}</strong><p className="muted mt-1 text-xs">stays need lodging</p></div>}
      </section>
      {overview.lodgingNeeds !== undefined && <section className="mt-5 rounded-2xl bg-[var(--surface-soft)] p-5" aria-label="Accommodation status"><div className="flex flex-wrap gap-x-6 gap-y-2">{overview.cities.filter((city) => city.nights > 0).map((city) => <p key={city.id} className="flex items-center gap-2 text-xs"><BedDouble size={13} className={city.stayStatus === "booked" ? "text-[var(--positive)]" : "text-[var(--warning)]"} /><strong>{city.name}</strong><span className="muted">{city.stayStatus === "booked" ? city.lodgingName ?? "Booked" : city.stayStatus === "needs_confirmation" ? "Confirm lodging" : "Lodging needed"}</span></p>)}</div></section>}
      {mappedCities.length > 0 ? <JourneyExperience cities={mappedCities} tripId={tripId} totalDays={overview.totalDays} totalNights={overview.totalNights} /> : <section className="surface mt-10 rounded-2xl p-8"><h2 className="display text-4xl">Map the journey</h2><p className="muted mt-2 text-sm">Add coordinates to a city to see the route and night globe.</p></section>}
    </main>
  );
}
