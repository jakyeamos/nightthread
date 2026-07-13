"use client";

import bezierSpline from "@turf/bezier-spline";
import { lineString } from "@turf/helpers";
import { LocateFixed } from "lucide-react";
import maplibregl, { type LngLatBoundsLike, type StyleSpecification } from "maplibre-gl";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { stopStayLabel } from "@/lib/trip-display";
import "maplibre-gl/dist/maplibre-gl.css";

export type JourneyMapMode = "journey" | "night_globe";

export interface JourneyMapCity {
  id: string;
  name: string;
  country: string;
  nights: number;
  lat: number;
  lon: number;
}

interface JourneyMapProps {
  cities: JourneyMapCity[];
  tripId: string;
  mode?: JourneyMapMode;
  compact?: boolean;
  onNightSourceError?: () => void;
  routeCoordinates?: Array<[number, number]>;
}

export const NIGHT_GLOBE_TILES = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png";

export function createJourneyMapStyle(mode: JourneyMapMode, tripId: string): StyleSpecification {
  if (mode === "night_globe") {
    return {
      version: 8,
      projection: { type: "globe" },
      sources: { earthAtNight: { type: "raster", tiles: [NIGHT_GLOBE_TILES], tileSize: 256, maxzoom: 8, attribution: "NASA/GSFC/ESDIS GIBS" } },
      layers: [
        { id: "space", type: "background", paint: { "background-color": "#070a12" } },
        { id: "earth-at-night", type: "raster", source: "earthAtNight", paint: { "raster-brightness-min": 0.02, "raster-brightness-max": 0.9, "raster-contrast": 0.16, "raster-saturation": -0.12 } },
      ],
      sky: { "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 5, 1, 7, 0] },
    };
  }
  return {
    version: 8,
    sources: { atlas: { type: "raster", tiles: [`/api/trips/${encodeURIComponent(tripId)}/map-tiles/{z}/{x}/{y}`], tileSize: 256, attribution: "Powered by Geoapify · © OpenMapTiles · © OpenStreetMap contributors" } },
    layers: [
      { id: "sky-canvas", type: "background", paint: { "background-color": "#eaf4fa" } },
      { id: "atlas", type: "raster", source: "atlas", paint: { "raster-saturation": -0.38, "raster-opacity": 0.82, "raster-brightness-max": 1 } },
    ],
  };
}

export function JourneyMap({ cities, tripId, mode = "journey", compact = false, onNightSourceError, routeCoordinates }: JourneyMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [selectedCity, setSelectedCity] = useState<JourneyMapCity | null>(null);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!container.current || cities.length === 0) return;
    let nightErrors = 0;
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: container.current,
        style: createJourneyMapStyle(mode, tripId),
        center: [cities[0].lon, cities[0].lat],
        zoom: mode === "night_globe" ? 1.45 : 5.3,
        interactive: !compact,
        attributionControl: false,
        cooperativeGestures: false,
        canvasContextAttributes: { antialias: true },
      });
    } catch {
      if (mode === "night_globe") onNightSourceError?.();
      else queueMicrotask(() => setMapUnavailable(true));
      return;
    }
    mapRef.current = map;
    map.on("error", (event) => {
      const sourceId = (event as typeof event & { sourceId?: string }).sourceId;
      if (mode !== "night_globe" || !event.error || sourceId !== "earthAtNight") return;
      nightErrors += 1;
      if (nightErrors === 3) onNightSourceError?.();
    });
    const canvas = map.getCanvas();
    const handleContextLost = (event: Event): void => {
      event.preventDefault();
      if (mode === "night_globe") onNightSourceError?.();
      else setMapUnavailable(true);
    };
    canvas.addEventListener("webglcontextlost", handleContextLost);
    map.on("load", () => {
      const yarnCanvas = document.createElement("canvas");
      yarnCanvas.width = 16;
      yarnCanvas.height = 8;
      const yarnContext = yarnCanvas.getContext("2d");
      if (yarnContext) {
        yarnContext.fillStyle = mode === "night_globe" ? "#ff7181" : "#d64f65";
        yarnContext.fillRect(0, 0, 16, 8);
        yarnContext.strokeStyle = "rgba(255, 220, 220, .72)";
        yarnContext.lineWidth = 1;
        yarnContext.beginPath();
        yarnContext.moveTo(0, 6);
        yarnContext.lineTo(16, 2);
        yarnContext.stroke();
        map.addImage("yarn", yarnContext.getImageData(0, 0, 16, 8), { pixelRatio: 2 });
      }
      const points = routeCoordinates ?? cities.map((city) => [city.lon, city.lat] as [number, number]);
      if (points.length > 1) {
        const route = bezierSpline(lineString(points), { sharpness: .68 });
        map.addSource("route", { type: "geojson", data: route });
        map.addLayer({ id: "route-under", type: "line", source: "route", paint: { "line-color": mode === "night_globe" ? "#541c2c" : "#f2cbd0", "line-width": mode === "night_globe" ? 8 : 7, "line-opacity": .9 } });
        map.addLayer({ id: "route", type: "line", source: "route", paint: yarnContext ? { "line-pattern": "yarn", "line-width": 4, "line-opacity": 1 } : { "line-color": "#d64f65", "line-width": 3 }, layout: { "line-cap": "round", "line-join": "round" } });
      }
      cities.forEach((city, index) => {
        const marker = document.createElement("button");
        marker.type = "button";
        marker.setAttribute("aria-label", `${index + 1}. ${city.name}, ${stopStayLabel(city.nights)}`);
        marker.className = mode === "night_globe"
          ? "grid size-8 place-items-center rounded-full border-2 border-[#ff7181] bg-[#0a0d17] text-[10px] font-bold text-white shadow-[0_0_14px_rgba(255,113,129,.7)]"
          : "grid size-8 place-items-center rounded-full border-2 border-[#d64f65] bg-white text-[10px] font-bold text-[#29364a] shadow-[0_2px_6px_rgba(34,51,74,.18)]";
        marker.textContent = String(index + 1);
        marker.addEventListener("click", () => setSelectedCity(city));
        new maplibregl.Marker({ element: marker }).setLngLat([city.lon, city.lat]).addTo(map);
      });
      const bounds = cities.reduce((current, city) => current.extend([city.lon, city.lat]), new maplibregl.LngLatBounds([cities[0].lon, cities[0].lat], [cities[0].lon, cities[0].lat]));
      map.fitBounds(bounds as LngLatBoundsLike, {
        padding: compact ? 32 : mode === "night_globe" ? 110 : 70,
        duration: reduced ? 0 : 200,
        maxZoom: mode === "night_globe" ? 2.2 : 7,
      });
    });
    return () => { canvas.removeEventListener("webglcontextlost", handleContextLost); mapRef.current = null; map.remove(); };
  }, [cities, compact, mode, onNightSourceError, reduced, routeCoordinates, tripId]);

  function recenter(): void {
    const map = mapRef.current;
    if (!map) return;
    const bounds = cities.reduce((current, city) => current.extend([city.lon, city.lat]), new maplibregl.LngLatBounds([cities[0].lon, cities[0].lat], [cities[0].lon, cities[0].lat]));
    map.fitBounds(bounds as LngLatBoundsLike, { padding: mode === "night_globe" ? 110 : 70, duration: reduced ? 0 : 200, maxZoom: mode === "night_globe" ? 2.2 : 7 });
  }

  return <div data-map-mode={mode} data-map-projection={mode === "night_globe" ? "globe" : "mercator"} className="relative h-full min-h-56 w-full overflow-hidden rounded-[inherit]">
    <div ref={container} aria-label={`Route map from ${cities.map((city) => city.name).join(" to ")}`} className="absolute inset-0" />
    {mapUnavailable && <div role="status" className="absolute inset-0 grid place-items-center bg-[var(--surface-soft)] px-8 text-center"><div><p className="text-sm font-semibold">The interactive map is unavailable.</p><p className="muted mt-2 text-xs">Your city sequence remains available above.</p></div></div>}
    {!compact && <button type="button" onClick={recenter} className={`absolute right-4 top-4 flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold ${mode === "night_globe" ? "bg-white/12 text-white hover:bg-white/20" : "bg-white text-[var(--ink)] shadow-[0_2px_8px_oklch(0.35_0.04_245/.14)]"}`}><LocateFixed size={15} />Recenter journey</button>}
    {selectedCity && !compact && <div className={`absolute bottom-5 left-5 ${mode === "night_globe" ? "text-white" : "text-[var(--ink)]"}`}><p className="text-xs font-semibold">{selectedCity.name}, {selectedCity.country}</p><p className={`mt-1 text-xs ${mode === "night_globe" ? "text-white/65" : "text-[var(--muted)]"}`}>{stopStayLabel(selectedCity.nights)} · Stop {cities.findIndex((city) => city.id === selectedCity.id) + 1} of {cities.length}</p></div>}
  </div>;
}
