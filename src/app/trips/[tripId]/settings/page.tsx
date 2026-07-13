import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ArrowDown, ArrowUp } from "lucide-react";
import { requireTripMember } from "@/auth/access";
import { addCity, assignCityFromDay, createDaysFromTripDates, moveCity, updateTripBasics } from "@/app/trips/[tripId]/actions";
import { DeleteTrip } from "@/components/delete-trip";
import { InvitationLinkControl } from "@/components/invitation-link-control";
import { getDemoTripFixture } from "@/lib/demo-trips";

interface TripSettingsRow {
  name: string;
  startDate: string | null;
  endDate: string | null;
  startingLocation: string | null;
  currency: string;
}

interface CityRow {
  id: string;
  name: string;
  countryCode: string | null;
  timeZone: string;
  firstDay: number | null;
  lastDay: number | null;
}

const field = "mt-2 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--ink)]";

export default async function SettingsPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const fixture = getDemoTripFixture(tripId);
  if (fixture) return <main className="mx-auto max-w-3xl px-6 py-12"><p className="eyebrow">Sample trip</p><h1 className="display mt-2 text-5xl">Trip settings</h1><section className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6"><h2 className="text-lg font-semibold">{fixture.name}</h2><p className="muted mt-2 text-sm">{fixture.dateLabel} · Read-only sample data</p></section></main>;
  await requireTripMember(tripId, "owner");
  const { env } = getCloudflareContext();
  const [trip, cityRows, dayCount, members, invitation] = await Promise.all([
    env.DB.prepare("select name,start_date as startDate,end_date as endDate,starting_location_text as startingLocation,default_currency as currency from trips where id=?1 and deleted_at is null").bind(tripId).first<TripSettingsRow>(),
    env.DB.prepare(`select c.id,c.name,c.country_code as countryCode,c.timezone as timeZone,min(d.ordinal) as firstDay,max(d.ordinal) as lastDay from cities c left join trip_days d on d.city_id=c.id and d.trip_id=c.trip_id where c.trip_id=?1 and c.deleted_at is null group by c.id order by c.position`).bind(tripId).all<CityRow>(),
    env.DB.prepare("select count(*) as count from trip_days where trip_id=?1").bind(tripId).first<{ count: number }>(),
    env.DB.prepare("select u.name,u.email,tm.role from trip_members tm join user u on u.id=tm.user_id where tm.trip_id=?1 order by tm.joined_at").bind(tripId).all<{ name: string; email: string; role: string }>(),
    env.DB.prepare("select expires_at as expiresAt from invitation_links where trip_id=?1 and revoked_at is null order by created_at desc limit 1").bind(tripId).first<{ expiresAt: number }>(),
  ]);
  if (!trip) return null;
  const days = dayCount?.count ?? 0;
  return <main className="mx-auto max-w-3xl px-6 py-12"><p className="eyebrow">Owner controls</p><h1 className="display mt-2 text-5xl">Trip settings</h1>
    <section className="mt-10 border-b border-[var(--line)] pb-9"><h2 className="text-lg font-semibold">The basics</h2><form action={updateTripBasics.bind(null, tripId)} className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm">Trip name<input name="name" required defaultValue={trip.name} className={field} /></label><label className="text-sm">Default currency<input name="currency" required minLength={3} maxLength={3} defaultValue={trip.currency} className={field} /></label><label className="text-sm">Start date<input name="startDate" type="date" defaultValue={trip.startDate ?? ""} className={field} /></label><label className="text-sm">End date<input name="endDate" type="date" defaultValue={trip.endDate ?? ""} className={field} /></label><label className="text-sm md:col-span-2">Starting location<input name="startingLocation" defaultValue={trip.startingLocation ?? ""} className={field} /></label><button className="h-11 rounded-xl bg-[var(--indigo)] px-5 text-sm font-semibold text-white md:col-span-2">Save trip details</button></form></section>
    <section className="border-b border-[var(--line)] py-9"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Route structure</h2><p className="muted mt-2 text-sm">Days keep their ordinals. Adding a city with a starting day assigns that day and every later unrefined day to the new stop.</p></div><span className="rounded-lg bg-[var(--indigo-soft)] px-3 py-2 text-xs font-semibold text-[var(--indigo)]">{days} day{days === 1 ? "" : "s"}</span></div>
      {days === 0 && <form action={createDaysFromTripDates.bind(null, tripId)} className="mt-5 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-5"><p className="text-sm font-semibold">This older trip has no planning days yet.</p><p className="muted mt-1 text-xs">Build them from the saved dates without changing the trip.</p><button className="mt-4 h-10 rounded-lg bg-[var(--indigo)] px-4 text-xs font-semibold text-white">Create trip days</button></form>}
      <div className="mt-5 space-y-2">{cityRows.results.map((city, index) => <article key={city.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4"><div className="min-w-[180px] flex-1"><p className="text-sm font-semibold">{index + 1}. {city.name}{city.countryCode ? `, ${city.countryCode}` : ""}</p><p className="muted mt-1 text-xs">{city.firstDay ? `Days ${city.firstDay}${city.lastDay && city.lastDay !== city.firstDay ? `–${city.lastDay}` : ""}` : "Transfer stop · no assigned day"} · {city.timeZone}</p></div><form action={assignCityFromDay.bind(null, tripId)} className="flex items-center gap-2"><input type="hidden" name="cityId" value={city.id} /><label className="text-[10px] font-semibold text-[var(--muted)]">Starts Day<input aria-label={`Start ${city.name} on day`} name="startDay" type="number" min="1" max={Math.max(days, 1)} defaultValue={city.firstDay ?? ""} className="ml-2 h-9 w-16 rounded-lg border border-[var(--line)] bg-white px-2 text-xs text-[var(--ink)]" /></label><button className="h-9 rounded-lg border border-[var(--line)] px-3 text-xs font-semibold text-[var(--indigo)] hover:bg-[var(--indigo-soft)]">Set days</button></form><form action={moveCity.bind(null, tripId)} className="flex shrink-0 gap-1"><input type="hidden" name="cityId" value={city.id} /><button name="direction" value="up" disabled={index === 0} aria-label={`Move ${city.name} earlier`} className="grid size-9 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)] disabled:opacity-25"><ArrowUp size={15} /></button><button name="direction" value="down" disabled={index === cityRows.results.length - 1} aria-label={`Move ${city.name} later`} className="grid size-9 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)] disabled:opacity-25"><ArrowDown size={15} /></button></form></article>)}</div>
      <details className="mt-4 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-4"><summary className="cursor-pointer text-sm font-semibold">Add a city stop</summary><form action={addCity.bind(null, tripId)} className="mt-4 grid gap-4 md:grid-cols-2"><label className="text-sm">City name<input name="name" required className={field} /></label><label className="text-sm">Country code<input name="countryCode" maxLength={2} placeholder="CZ" className={field} /></label><label className="text-sm">Timezone<input name="timeZone" required placeholder="Europe/Prague" className={field} /></label><label className="text-sm">Starts on Day <span className="muted font-normal">optional for transfer stops</span><input name="startDay" type="number" min="1" max={Math.max(days, 1)} className={field} /></label><label className="text-sm">Latitude <span className="muted font-normal">optional</span><input name="lat" type="number" step="any" className={field} /></label><label className="text-sm">Longitude <span className="muted font-normal">optional</span><input name="lon" type="number" step="any" className={field} /></label><button className="h-11 rounded-xl bg-[var(--indigo)] px-5 text-sm font-semibold text-white md:col-span-2">Add city</button></form></details>
    </section>
    <section id="collaboration" className="scroll-mt-24 border-b border-[var(--line)] py-9"><h2 className="text-lg font-semibold">Collaboration</h2><p className="muted mt-2 text-sm">{members.results.length} trip member{members.results.length === 1 ? "" : "s"}. Invitation links expire after 30 days.</p><div className="mt-4 space-y-2">{members.results.map((member) => <div key={member.email} className="flex items-center justify-between rounded-xl bg-[var(--surface-soft)] px-4 py-3 text-sm"><span><strong>{member.name}</strong><span className="muted ml-2">{member.email}</span></span><span className="eyebrow">{member.role}</span></div>)}</div><InvitationLinkControl tripId={tripId} activeExpiresAt={invitation?.expiresAt ?? null} /></section>
    <section className="py-9"><h2 className="text-lg font-semibold">Danger zone</h2><p className="muted mt-2 mb-5 text-sm">Only the trip owner can delete this trip. There is a ten-second undo window.</p><DeleteTrip tripId={tripId} tripName={trip.name} /></section>
  </main>;
}
