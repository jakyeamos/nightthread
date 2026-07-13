"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Globe2, Map } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { JourneyMap, type JourneyMapCity, type JourneyMapMode } from "@/components/journey-map";

export function JourneyExperience({ cities, tripId, totalDays, totalNights }: { cities: JourneyMapCity[]; tripId: string; totalDays: number; totalNights: number }) {
  const [mode, setMode] = useState<JourneyMapMode>("journey");
  const [message, setMessage] = useState<string | null>(null);
  const reduced = useReducedMotion();
  const routeCoordinates = useMemo<Array<[number, number]>>(() => cities.map((city) => [city.lon, city.lat]), [cities]);
  const handleNightError = useCallback(() => {
    setMode("journey");
    setMessage("The night imagery is unavailable, so we returned you to the journey map.");
  }, []);

  return <section className="mt-10">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="display text-4xl">See the whole journey</h2><p className="muted mt-1 text-sm">Move through the route, or step back and see it glow.</p></div>
      <div role="radiogroup" aria-label="Map view" className="relative flex rounded-xl bg-[var(--surface-soft)] p-1">
        {(["journey", "night_globe"] as const).map((value) => {
          const selected = mode === value;
          const Icon = value === "journey" ? Map : Globe2;
          return <button key={value} type="button" role="radio" aria-checked={selected} onClick={() => { setMessage(null); setMode(value); }} className={`relative z-10 flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors ${selected ? "text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}>
            {selected && <motion.span layoutId="map-mode" className="absolute inset-0 -z-10 rounded-lg bg-[var(--indigo)]" transition={{ duration: reduced ? 0 : .2, ease: [0.22, 1, 0.36, 1] }} />}
            <Icon size={14} />{value === "journey" ? "Journey" : "Globe at night"}
          </button>;
        })}
      </div>
    </div>
    {message && <p role="status" className="mt-4 rounded-xl bg-[var(--warning-soft)] px-4 py-3 text-sm text-[var(--warning)]">{message}</p>}
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={mode} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduced ? undefined : { opacity: 0 }} transition={{ duration: reduced ? 0 : .2 }} className={`relative mt-5 overflow-hidden rounded-2xl ${mode === "night_globe" ? "night-globe-stage h-[70vh] min-h-[520px]" : "surface h-[430px]"}`}>
        {mode === "night_globe" && <><div className="pointer-events-none absolute left-6 top-5 z-10 text-white"><p className="text-xs font-semibold">{cities.length} cities · {totalDays} days</p><p className="mt-1 text-xs text-white/55">Drag to turn the world</p></div><div className="pointer-events-none absolute bottom-5 right-6 z-10 text-right text-white"><p className="text-xs font-semibold">{totalNights} nights</p><p className="mt-1 text-xs text-white/55">{cities.map((city) => city.name).join(" → ")}</p></div></>}
        <JourneyMap cities={cities} tripId={tripId} mode={mode} routeCoordinates={routeCoordinates} onNightSourceError={handleNightError} />
        <p className={`absolute bottom-2 left-1/2 z-10 -translate-x-1/2 text-[10px] ${mode === "night_globe" ? "text-white/60" : "text-[var(--muted)]"}`}>{mode === "night_globe" ? <>Night imagery: <a className="underline underline-offset-2" href="https://earthdata.nasa.gov/gibs" target="_blank" rel="noreferrer">NASA/GSFC/ESDIS GIBS</a></> : <>Powered by <a className="underline underline-offset-2" href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a> · © OpenMapTiles · © OpenStreetMap contributors</>}</p>
      </motion.div>
    </AnimatePresence>
  </section>;
}
