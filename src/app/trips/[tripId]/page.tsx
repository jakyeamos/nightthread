/* eslint-disable @next/next/no-img-element -- Unsplash assets must remain hotlinked. */
import { ArrowRight, CalendarDays, Moon, Navigation } from "lucide-react";
import { JourneyMap } from "@/components/journey-map";
import { demoCities } from "@/lib/demo-data";

export default async function JourneyOverview({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return (
    <main className="mx-auto max-w-[1440px] px-5 py-10 md:px-10 lg:py-14">
      <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
        <div><p className="eyebrow">October 12–21, 2026 · Japan</p><h1 className="display mt-3 text-6xl tracking-[-.035em] md:text-7xl">Tokyo after dark</h1><p className="muted mt-4 max-w-xl leading-7">Nine nights moving from Tokyo’s electric evenings to quiet Kyoto paths and Osaka after-hours.</p></div>
        <a href={`/trips/${tripId}/planner`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--night)]">Open planner <ArrowRight size={16} /></a>
      </div>
      <div className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)]">
        {[['10','total days',CalendarDays],['9','nights',Moon],['3','cities',Navigation]].map(([value,label,Icon]) => <div className="bg-[var(--night-raised)] p-5 md:p-6" key={String(label)}><Icon className="mb-5 text-[var(--faint)]" size={18} /><strong className="text-2xl font-medium">{String(value)}</strong><span className="muted ml-2 text-sm">{String(label)}</span></div>)}
      </div>
      <section className="mt-10 grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
        <div><p className="eyebrow mb-5">The journey</p><div className="space-y-3">{demoCities.map((city,index) => <article key={city.id} className="group grid grid-cols-[74px_1fr_auto] items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-[var(--night-raised)]"><img src={city.image} alt="" className="h-16 w-[74px] rounded-xl object-cover" /><div><span className="text-xs text-[var(--yarn)]">0{index+1}</span><h2 className="display text-3xl">{city.name}</h2><p className="muted text-xs">{city.country}</p></div><span className="muted pr-3 text-sm">{city.nights} nights</span></article>)}</div></div>
        <div className="surface min-h-[430px] overflow-hidden rounded-2xl"><JourneyMap /></div>
      </section>
    </main>
  );
}
