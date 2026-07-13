/* eslint-disable @next/next/no-html-link-for-pages */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ArrowRight, CalendarDays, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/access";
import { Brand } from "@/components/brand";

interface TripRow { id: string; name: string; startDate: string | null; endDate: string | null; role: string }

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const { env } = getCloudflareContext();
  const rows = await env.DB.prepare(`select t.id, t.name, t.start_date as startDate, t.end_date as endDate, tm.role from trips t join trip_members tm on tm.trip_id = t.id where tm.user_id = ?1 and t.deleted_at is null order by t.updated_at desc`).bind(user.id).all<TripRow>();
  return <main className="min-h-screen"><header className="flex h-16 items-center border-b border-[var(--line)] px-6 md:px-10"><Brand /><span className="muted ml-auto text-sm">{user.name}</span></header><div className="mx-auto max-w-6xl px-6 py-12 md:px-10"><div className="flex items-end justify-between"><div><p className="eyebrow">Your private journeys</p><h1 className="display mt-2 text-5xl">Trips</h1></div><a href="/trips/new" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--night)]"><Plus size={16} />New trip</a></div>{rows.results.length === 0 ? <section className="mt-12 rounded-2xl border border-dashed border-[var(--line)] py-20 text-center"><CalendarDays className="mx-auto text-[var(--faint)]" /><h2 className="mt-5 text-lg font-semibold">Start your first thread</h2><p className="muted mx-auto mt-2 max-w-sm text-sm leading-6">Create a trip, invite your people, and bring all those saved places into one shared plan.</p></section> : <div className="mt-10 grid gap-4 md:grid-cols-2">{rows.results.map((trip) => <a href={`/trips/${trip.id}`} key={trip.id} className="surface group rounded-2xl p-6 transition-colors hover:bg-[var(--night-soft)]"><span className="eyebrow">{trip.role}</span><h2 className="display mt-3 text-4xl">{trip.name}</h2><p className="muted mt-3 text-sm">{trip.startDate ?? "Flexible dates"}{trip.endDate ? ` — ${trip.endDate}` : ""}</p><ArrowRight className="ml-auto mt-8 text-[var(--faint)] transition-transform group-hover:translate-x-1 group-hover:text-white" size={18} /></a>)}</div>}</div></main>;
}
