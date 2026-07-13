/* eslint-disable @next/next/no-img-element -- attributed provider assets remain hotlinked. */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ArrowRight, CalendarDays, Moon, Navigation } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JourneyExperience } from "@/components/journey-experience";
import type { JourneyMapCity } from "@/components/journey-map";
import { demoCities } from "@/lib/demo-data";

interface OverviewCity extends JourneyMapCity {
  image: string | null;
}

interface OverviewData {
  name: string;
  startDate: string | null;
  endDate: string | null;
  totalDays: number;
  totalNights: number;
  cities: OverviewCity[];
}

async function loadOverview(tripId: string): Promise<OverviewData | null> {
  if (tripId === "demo") return { name: "Tokyo after dark", startDate: "2026-10-12", endDate: "2026-10-21", totalDays: 10, totalNights: 9, cities: demoCities };
  const { env } = getCloudflareContext();
  const trip = await env.DB.prepare("select name,start_date as startDate,end_date as endDate from trips where id=?1 and deleted_at is null").bind(tripId).first<{ name: string; startDate: string | null; endDate: string | null }>();
  if (!trip) return null;
  const [cityRows, dayCount, nightCount] = await Promise.all([
    env.DB.prepare(`select c.id,c.name,coalesce(c.country_code,'') as country,c.lat,c.lon,
      (select count(*) from trip_nights n where n.trip_id=c.trip_id and n.kind='stay' and n.stay_city_id=c.id) as nights,
      case when a.source='upload' then '/api/trips/' || c.trip_id || '/assets?id=' || a.id else a.external_url end as image
      from cities c left join assets a on a.id=c.hero_asset_id and a.deleted_at is null
      where c.trip_id=?1 and c.deleted_at is null order by c.position`).bind(tripId).all<{ id: string; name: string; country: string; nights: number; lat: number | null; lon: number | null; image: string | null }>(),
    env.DB.prepare("select count(*) as count from trip_days where trip_id=?1").bind(tripId).first<{ count: number }>(),
    env.DB.prepare("select count(*) as count from trip_nights where trip_id=?1").bind(tripId).first<{ count: number }>(),
  ]);
  const cities = cityRows.results.map((city) => ({ ...city, country: city.country || "Destination", lat: city.lat ?? Number.NaN, lon: city.lon ?? Number.NaN }));
  return { ...trip, cities, totalDays: dayCount?.count ?? 0, totalNights: nightCount?.count ?? 0 };
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
        <div><p className="eyebrow">{dateLabel(overview.startDate, overview.endDate)}{countryLabel ? ` · ${countryLabel}` : ""}</p><h1 className="display mt-3 text-6xl tracking-[-.035em] text-balance md:text-7xl">{overview.name}</h1><p className="muted mt-4 max-w-xl leading-7">A shared view of every stop, every night, and the coral thread connecting the journey.</p></div>
        <Link href={`/trips/${tripId}/planner`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--indigo)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--indigo-hover)]">Open planner <ArrowRight size={16} /></Link>
      </div>
      <div className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)]">
        {[[String(overview.totalDays),"total days",CalendarDays],[String(overview.totalNights),"nights",Moon],[String(overview.cities.length),"cities",Navigation]].map(([value,label,Icon]) => <div className="bg-[var(--surface)] p-5 md:p-6" key={String(label)}><Icon className="mb-5 text-[var(--faint)]" size={18} /><strong className="text-2xl font-medium">{String(value)}</strong><span className="muted ml-2 text-sm">{String(label)}</span></div>)}
      </div>
      <section className="mt-12"><h2 className="display text-4xl">The route ahead</h2><div className="mt-5 flex gap-3 overflow-x-auto pb-2">{overview.cities.map((city,index) => <article key={city.id} className="grid min-w-[290px] flex-1 grid-cols-[82px_1fr] items-center gap-4 rounded-2xl bg-[var(--surface)] p-3">{city.image ? <img src={city.image} alt="" className="h-20 w-[82px] rounded-xl object-cover" /> : <div className="grid h-20 w-[82px] place-items-center rounded-xl bg-[var(--surface-soft)] text-lg font-semibold text-[var(--indigo)]">{index + 1}</div>}<div><span className="text-xs font-semibold text-[var(--thread-hover)]">Stop {index+1}</span><h3 className="display mt-1 text-3xl">{city.name}</h3><p className="muted text-xs">{city.country} · {city.nights} nights</p></div></article>)}</div></section>
      {mappedCities.length > 0 ? <JourneyExperience cities={mappedCities} tripId={tripId} totalDays={overview.totalDays} totalNights={overview.totalNights} /> : <section className="surface mt-10 rounded-2xl p-8"><h2 className="display text-4xl">Map the journey</h2><p className="muted mt-2 text-sm">Add coordinates to a city to see the route and night globe.</p></section>}
    </main>
  );
}
