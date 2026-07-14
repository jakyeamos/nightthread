"use client";

import bezierSpline from "@turf/bezier-spline";
import { lineString } from "@turf/helpers";
import { LocateFixed } from "lucide-react";
import maplibregl, { type LngLatBoundsLike, type StyleSpecification } from "maplibre-gl";
import { useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
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

interface ProjectedMarker {
  id: string;
  anchorX: number;
  anchorY: number;
  x: number;
  y: number;
}

interface RetainedMapFrame {
  image: string;
  markers: ProjectedMarker[];
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

function layoutProjectedMarkers(anchors: Array<{ id: string; x: number; y: number }>, width: number, height: number): ProjectedMarker[] {
  const placed: ProjectedMarker[] = [];
  const rings = [0, 30, 46, 62];
  const angles = [-90, -45, 0, 45, 90, 135, 180, 225];
  for (const anchor of anchors) {
    const candidates = rings.flatMap((radius) => radius === 0
      ? [{ x: anchor.x, y: anchor.y }]
      : angles.map((angle) => {
        const radians = angle * Math.PI / 180;
        return { x: anchor.x + Math.cos(radians) * radius, y: anchor.y + Math.sin(radians) * radius };
      }));
    const label = candidates.find((candidate) => candidate.x >= 18 && candidate.x <= width - 18 && candidate.y >= 18 && candidate.y <= height - 18
      && placed.every((marker) => Math.hypot(marker.x - candidate.x, marker.y - candidate.y) >= 31)) ?? candidates[0];
    placed.push({ id: anchor.id, anchorX: anchor.x, anchorY: anchor.y, x: label.x, y: label.y });
  }
  return placed;
}

function nightGlobeZoom(cities: JourneyMapCity[]): number {
  const latitudes = cities.map((city) => city.lat);
  const longitudes = cities.map((city) => city.lon);
  const span = Math.max(Math.max(...latitudes) - Math.min(...latitudes), Math.max(...longitudes) - Math.min(...longitudes));
  if (span > 120) return .75;
  if (span > 60) return 1.05;
  if (span > 30) return 1.5;
  if (span > 15) return 2.1;
  return 3;
}

function recenterMap(map: maplibregl.Map, cities: JourneyMapCity[], mode: JourneyMapMode, compact: boolean, reduced: boolean): void {
  const bounds = cities.reduce((current, city) => current.extend([city.lon, city.lat]), new maplibregl.LngLatBounds([cities[0].lon, cities[0].lat], [cities[0].lon, cities[0].lat]));
  if (mode === "night_globe") {
    map.easeTo({ center: bounds.getCenter(), zoom: nightGlobeZoom(cities), duration: reduced ? 0 : 200 });
    return;
  }
  map.fitBounds(bounds as LngLatBoundsLike, { padding: compact ? 32 : 70, duration: reduced ? 0 : 200, maxZoom: 7 });
}

function fallbackRoutePoints(cities: JourneyMapCity[], mode: JourneyMapMode): Array<{ x: number; y: number }> {
  const minLat = Math.min(...cities.map((city) => city.lat));
  const maxLat = Math.max(...cities.map((city) => city.lat));
  const minLon = Math.min(...cities.map((city) => city.lon));
  const maxLon = Math.max(...cities.map((city) => city.lon));
  const latRange = Math.max(maxLat - minLat, 1);
  const lonRange = Math.max(maxLon - minLon, 1);
  const bounds = mode === "night_globe" ? { left: 285, top: 120, width: 430, height: 280 } : { left: 80, top: 72, width: 840, height: 350 };
  return cities.map((city) => ({
    x: bounds.left + ((city.lon - minLon) / lonRange) * bounds.width,
    y: bounds.top + ((maxLat - city.lat) / latRange) * bounds.height,
  }));
}

function MapFallbackBackdrop({ cities, mode }: { cities: JourneyMapCity[]; mode: JourneyMapMode }) {
  const id = useId().replaceAll(":", "");
  const points = fallbackRoutePoints(cities, mode);
  const route = points.map((point) => `${point.x},${point.y}`).join(" ");
  if (mode === "night_globe") return <svg aria-hidden="true" viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full bg-[#05070d]">
    <defs><radialGradient id={`earth-${id}`} cx="42%" cy="35%"><stop offset="0" stopColor="#23314a" /><stop offset=".62" stopColor="#101827" /><stop offset="1" stopColor="#050811" /></radialGradient><filter id={`glow-${id}`}><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
    <g fill="#b9d8ef" opacity=".45">{[[92,84],[178,156],[826,94],[904,188],[118,402],[866,414],[775,55],[222,466],[948,330],[56,270]].map(([x,y], index) => <circle key={index} cx={x} cy={y} r={index % 3 === 0 ? 1.8 : 1.1} />)}</g>
    <circle cx="500" cy="260" r="226" fill={`url(#earth-${id})`} stroke="#34415b" strokeWidth="2" />
    <path d="M315 184c78-70 222-100 360-36M298 294c118 58 276 78 408 24M410 48c-42 118-46 286 10 414M584 42c48 126 48 294-8 434" fill="none" stroke="#71819a" strokeOpacity=".18" strokeWidth="1.5" />
    <g fill="#f3dca0" filter={`url(#glow-${id})`} opacity=".82">{[[345,173],[378,198],[416,162],[458,208],[492,184],[530,232],[562,194],[598,250],[625,216],[654,270],[690,238],[400,264],[445,292],[500,278],[550,318],[610,300],[672,332]].map(([x,y], index) => <circle key={index} cx={x} cy={y} r={index % 4 === 0 ? 3.2 : 2.1} />)}</g>
    <polyline points={route} fill="none" stroke="#491b27" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" /><polyline points={route} fill="none" stroke="#ff7181" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    {points.map((point, index) => <g key={cities[index].id} transform={`translate(${point.x} ${point.y})`}><circle r="17" fill="#080c15" stroke="#ff7181" strokeWidth="3" /><text y="4" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">{index + 1}</text></g>)}
  </svg>;
  return <svg aria-hidden="true" viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full bg-[#eaf4fa]">
    <g fill="none" stroke="#bfd6e4" strokeWidth="1" opacity=".6">{[120,220,320,420].map((y) => <path key={y} d={`M0 ${y} C240 ${y - 34} 710 ${y + 32} 1000 ${y - 8}`} />)}{[180,380,580,780].map((x) => <path key={x} d={`M${x} 0 C${x - 45} 180 ${x + 50} 360 ${x} 520`} />)}</g>
    <path d="M45 355c130-90 214-58 300-108 96-56 122-130 238-112 99 15 132 104 208 111 62 6 97-28 164-11v185H45z" fill="#dbeaf1" opacity=".72" />
    <polyline points={route} fill="none" stroke="#f2cbd0" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" /><polyline points={route} fill="none" stroke="#d64f65" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    {points.map((point, index) => <g key={cities[index].id} transform={`translate(${point.x} ${point.y})`}><circle r="17" fill="white" stroke="#d64f65" strokeWidth="3" /><text y="4" textAnchor="middle" fill="#29364a" fontSize="11" fontWeight="700">{index + 1}</text><text y="34" textAnchor="middle" fill="#33465c" fontSize="11" fontWeight="650">{cities[index].name}</text></g>)}
  </svg>;
}

export function JourneyMap({ cities, tripId, mode = "journey", compact = false, onNightSourceError, routeCoordinates }: JourneyMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [selectedCity, setSelectedCity] = useState<JourneyMapCity | null>(null);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [retainedFrame, setRetainedFrame] = useState<RetainedMapFrame | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (!container.current || cities.length === 0) return;
    setMapUnavailable(false);
    setRetainedFrame(null);
    const mapContainer = container.current;
    let nightErrors = 0;
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: mapContainer,
        style: createJourneyMapStyle(mode, tripId),
        center: [cities[0].lon, cities[0].lat],
        zoom: mode === "night_globe" ? 1.45 : 5.3,
        interactive: !compact,
        attributionControl: false,
        cooperativeGestures: false,
        canvasContextAttributes: { antialias: true, preserveDrawingBuffer: true, powerPreference: "low-power", desynchronized: false },
      });
    } catch {
      if (mode === "night_globe") onNightSourceError?.();
      else queueMicrotask(() => setMapUnavailable(true));
      return;
    }
    mapRef.current = map;
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(mapContainer);
    const resizeFrame = window.requestAnimationFrame(() => map.resize());
    map.on("error", (event) => {
      const sourceId = (event as typeof event & { sourceId?: string }).sourceId;
      if (mode !== "night_globe" || !event.error || sourceId !== "earthAtNight") return;
      nightErrors += 1;
      if (nightErrors === 3) onNightSourceError?.();
    });
    const canvas = map.getCanvas();
    canvas.style.opacity = "0";
    const handleContextLost = (event: Event): void => {
      event.preventDefault();
      if (mode === "night_globe") onNightSourceError?.();
      else setMapUnavailable(true);
    };
    canvas.addEventListener("webglcontextlost", handleContextLost);
    const projectedMarkers = (): ProjectedMarker[] => {
      const anchors = cities.map((city) => {
        const point = map.project([city.lon, city.lat]);
        return { id: city.id, x: point.x, y: point.y };
      });
      return layoutProjectedMarkers(anchors, mapContainer.clientWidth, mapContainer.clientHeight);
    };
    let captureVersion = 0;
    const captureRenderedFrame = (): void => {
      try {
        const image = canvas.toDataURL("image/png");
        const markers = projectedMarkers();
        const version = ++captureVersion;
        const preloaded = new window.Image();
        preloaded.onload = () => {
          if (version === captureVersion) setRetainedFrame({ image, markers });
        };
        preloaded.src = image;
      } catch {
        setRetainedFrame(null);
      }
    };
    let scheduledCapture: number | null = null;
    let lastCapture = 0;
    const synchronizeRenderedFrame = (): void => {
      if (scheduledCapture !== null || performance.now() - lastCapture < 80) return;
      scheduledCapture = window.requestAnimationFrame(() => {
        scheduledCapture = null;
        lastCapture = performance.now();
        captureRenderedFrame();
      });
    };
    const captureFinalFrame = (): void => {
      if (scheduledCapture !== null) window.cancelAnimationFrame(scheduledCapture);
      scheduledCapture = null;
      lastCapture = performance.now();
      captureRenderedFrame();
    };
    map.on("render", synchronizeRenderedFrame);
    map.on("idle", captureFinalFrame);
    map.on("moveend", captureFinalFrame);
    let recenterTimer = 0;
    map.on("load", () => {
      map.resize();
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
      recenterMap(map, cities, mode, compact, reduced);
      recenterTimer = window.setTimeout(() => recenterMap(map, cities, mode, compact, reduced), 240);
    });
    return () => { captureVersion += 1; window.cancelAnimationFrame(resizeFrame); if (scheduledCapture !== null) window.cancelAnimationFrame(scheduledCapture); window.clearTimeout(recenterTimer); resizeObserver.disconnect(); canvas.removeEventListener("webglcontextlost", handleContextLost); map.off("render", synchronizeRenderedFrame); map.off("idle", captureFinalFrame); map.off("moveend", captureFinalFrame); mapRef.current = null; map.remove(); };
  }, [cities, compact, mode, onNightSourceError, reduced, routeCoordinates, tripId]);

  function recenter(): void {
    const map = mapRef.current;
    if (!map) return;
    recenterMap(map, cities, mode, compact, reduced);
  }

  const markerPositions = retainedFrame?.markers ?? [];

  return <div data-map-mode={mode} data-map-projection={mode === "night_globe" ? "globe" : "mercator"} data-render-frame={retainedFrame ? "ready" : "pending"} className="relative h-full min-h-56 w-full overflow-hidden rounded-[inherit]">
    {!retainedFrame && <MapFallbackBackdrop cities={cities} mode={mode} />}
    {retainedFrame && <div data-map-frame aria-hidden="true" style={{ backgroundImage: `url(${retainedFrame.image})` }} className="pointer-events-none absolute inset-0 z-[1] bg-[length:100%_100%] bg-no-repeat" />}
    <div data-map-viewport className="absolute inset-0 z-[2]">
      <div ref={container} aria-label={`Route map from ${cities.map((city) => city.name).join(" to ")}`} className="h-full w-full" />
    </div>
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3] h-full w-full">
      {markerPositions.map((position) => <g key={position.id}>
        {Math.hypot(position.x - position.anchorX, position.y - position.anchorY) > 4 && <line x1={position.anchorX} y1={position.anchorY} x2={position.x} y2={position.y} stroke={mode === "night_globe" ? "#ff8a96" : "#b74358"} strokeWidth="1.5" strokeOpacity=".78" />}
        <circle cx={position.anchorX} cy={position.anchorY} r="4" fill={mode === "night_globe" ? "#ff7181" : "#d64f65"} stroke={mode === "night_globe" ? "#120b13" : "white"} strokeWidth="2" />
      </g>)}
    </svg>
    {markerPositions.map((position, index) => {
      const city = cities.find((candidate) => candidate.id === position.id);
      if (!city) return null;
      return <button key={city.id} type="button" data-journey-pin={city.id} aria-label={`${index + 1}. ${city.name}, ${stopStayLabel(city.nights)}`} onClick={() => setSelectedCity(city)} style={{ left: position.x, top: position.y, transform: "translate(-50%, -50%)" }} className={`absolute z-[4] grid size-7 place-items-center rounded-full border text-[10px] font-bold ${mode === "night_globe" ? "border-[#ff7181] bg-[#0a0d17] text-white shadow-[0_0_10px_rgba(255,113,129,.58)]" : "border-[#d64f65] bg-white text-[#29364a] shadow-[0_2px_6px_rgba(34,51,74,.18)]"}`}>{index + 1}</button>;
    })}
    {mapUnavailable && <div role="status" className="absolute inset-0 z-20 grid place-items-center bg-[var(--surface-soft)] px-8 text-center"><div><p className="text-sm font-semibold">The interactive map is unavailable.</p><p className="muted mt-2 text-xs">Your city sequence remains available above.</p></div></div>}
    {!compact && <button type="button" onClick={recenter} className={`absolute right-4 top-4 z-10 flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold ${mode === "night_globe" ? "bg-white/12 text-white hover:bg-white/20" : "bg-white text-[var(--ink)] shadow-[0_2px_8px_oklch(0.35_0.04_245/.14)]"}`}><LocateFixed size={15} />Recenter journey</button>}
    {selectedCity && !compact && <div className={`absolute bottom-5 left-5 z-10 ${mode === "night_globe" ? "text-white" : "text-[var(--ink)]"}`}><p className="text-xs font-semibold">{selectedCity.name}, {selectedCity.country}</p><p className={`mt-1 text-xs ${mode === "night_globe" ? "text-white/65" : "text-[var(--muted)]"}`}>{stopStayLabel(selectedCity.nights)} · Stop {cities.findIndex((city) => city.id === selectedCity.id) + 1} of {cities.length}</p></div>}
  </div>;
}
