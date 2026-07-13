"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import bezierSpline from "@turf/bezier-spline";
import { lineString } from "@turf/helpers";
import "maplibre-gl/dist/maplibre-gl.css";
import { demoCities } from "@/lib/demo-data";

export function JourneyMap({ compact = false }: { compact?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!container.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      style: { version: 8, sources: {}, layers: [{ id: "background", type: "background", paint: { "background-color": "#15131c" } }] },
      center: [137.5, 35.25], zoom: 5.7, interactive: !compact, attributionControl: false,
    });
    map.on("load", () => {
      const yarnCanvas = document.createElement("canvas");
      yarnCanvas.width = 16;
      yarnCanvas.height = 8;
      const yarnContext = yarnCanvas.getContext("2d");
      if (yarnContext) {
        yarnContext.fillStyle = "#e05367";
        yarnContext.fillRect(0, 0, 16, 8);
        yarnContext.strokeStyle = "rgba(255, 190, 195, .55)";
        yarnContext.lineWidth = 1;
        yarnContext.beginPath();
        yarnContext.moveTo(0, 6);
        yarnContext.lineTo(16, 2);
        yarnContext.stroke();
        map.addImage("yarn", yarnContext.getImageData(0, 0, 16, 8), { pixelRatio: 2 });
      }
      const route = bezierSpline(lineString(demoCities.map((city) => [city.lon, city.lat])), { sharpness: .68 });
      map.addSource("route", { type: "geojson", data: route });
      map.addLayer({ id: "route-under", type: "line", source: "route", paint: { "line-color": "#3b1722", "line-width": 8, "line-opacity": .85 } });
      map.addLayer({ id: "route", type: "line", source: "route", paint: yarnContext ? { "line-pattern": "yarn", "line-width": 4, "line-opacity": .95 } : { "line-color": "#e05367", "line-width": 3, "line-opacity": .95 }, layout: { "line-cap": "round", "line-join": "round" } });
      demoCities.forEach((city, index) => {
        const marker = document.createElement("div");
        marker.className = "grid size-7 place-items-center rounded-full border-2 border-[#e05367] bg-[#17151e] text-[10px] font-bold text-white shadow-lg";
        marker.textContent = String(index + 1);
        new maplibregl.Marker({ element: marker }).setLngLat([city.lon, city.lat]).addTo(map);
      });
    });
    return () => map.remove();
  }, [compact]);
  return <div ref={container} aria-label="Route map from Tokyo to Kyoto to Osaka" className="h-full min-h-56 w-full overflow-hidden rounded-[inherit]" />;
}
