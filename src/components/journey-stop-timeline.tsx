"use client";
/* eslint-disable @next/next/no-img-element -- provider imagery remains hotlinked. */

import { ArrowLeft, ArrowRight, BedDouble, Bus } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { stopStayLabel } from "@/lib/trip-display";

interface TimelineCity {
  id: string;
  name: string;
  nights: number;
  image: string | null;
}

export function JourneyStopTimeline({ cities }: { cities: TimelineCity[] }) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [canPrevious, setCanPrevious] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const reduced = useReducedMotion();

  const updateControls = useCallback((): void => {
    const rail = railRef.current;
    if (!rail) return;
    setCanPrevious(rail.scrollLeft > 2);
    setCanNext(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    updateControls();
    const observer = new ResizeObserver(updateControls);
    observer.observe(rail);
    rail.addEventListener("scroll", updateControls, { passive: true });
    return () => { observer.disconnect(); rail.removeEventListener("scroll", updateControls); };
  }, [updateControls]);

  function move(direction: -1 | 1): void {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.72, behavior: reduced ? "auto" : "smooth" });
  }

  return <section className="mt-12" aria-labelledby="route-ahead-heading">
    <div className="flex items-end justify-between gap-4"><div><h2 id="route-ahead-heading" className="display text-4xl">The route ahead</h2><p className="muted mt-1 text-sm">Ordered stops, stays, and transfer points.</p></div><div className="flex gap-2"><button type="button" aria-label="Previous route stops" disabled={!canPrevious} onClick={() => move(-1)} className="grid size-10 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-soft)] disabled:cursor-default disabled:opacity-35"><ArrowLeft size={16} /></button><button type="button" aria-label="Next route stops" disabled={!canNext} onClick={() => move(1)} className="grid size-10 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-soft)] disabled:cursor-default disabled:opacity-35"><ArrowRight size={16} /></button></div></div>
    <div ref={railRef} data-testid="route-stop-rail" role="list" className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3">
      {cities.map((city, index) => <article role="listitem" key={city.id} data-stop-id={city.id} className="grid w-[220px] shrink-0 snap-start grid-cols-[58px_1fr] items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
        {city.image ? <img src={city.image} alt="" className="size-[58px] rounded-lg object-cover" /> : <div className="grid size-[58px] place-items-center rounded-lg bg-[var(--surface-soft)] text-lg font-semibold text-[var(--indigo)]">{index + 1}</div>}
        <div className="min-w-0"><span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--thread-hover)]">Stop {index + 1}</span><h3 className="mt-0.5 truncate text-base font-semibold">{city.name}</h3><p className="muted mt-1 flex items-center gap-1 text-[11px]">{city.nights === 0 ? <Bus size={11} /> : <BedDouble size={11} />}{stopStayLabel(city.nights)}</p></div>
      </article>)}
    </div>
  </section>;
}
