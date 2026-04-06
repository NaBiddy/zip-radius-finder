"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Circle, CircleMarker, Tooltip, useMap } from "react-leaflet";
import type { InputZipCoord } from "@/lib/zipProcessor";
import "leaflet/dist/leaflet.css";

const MILES_TO_METERS = 1609.344;
// Cap markers to keep rendering snappy; most ad campaigns have far fewer inputs
const MAX_MAP_MARKERS = 500;

interface Props {
  inputCoords: InputZipCoord[];
  radiusMiles: number;
}

function FitBounds({ coords }: { coords: InputZipCoord[] }) {
  const map = useMap();
  useEffect(() => {
    if (!coords.length) return;
    if (coords.length === 1) {
      map.setView([coords[0].lat, coords[0].lng], 11);
      return;
    }
    const lats = coords.map((c) => c.lat);
    const lngs = coords.map((c) => c.lng);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { padding: [48, 48], maxZoom: 13 }
    );
  }, [coords, map]);
  return null;
}

export default function ResultsMap({ inputCoords, radiusMiles }: Props) {
  const radiusMeters = radiusMiles * MILES_TO_METERS;
  const displayCoords = inputCoords.slice(0, MAX_MAP_MARKERS);
  const truncated = inputCoords.length - displayCoords.length;

  return (
    <div className="space-y-2">
      <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 420 }}>
        <MapContainer
          center={[39.5, -98.35]}
          zoom={4}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds coords={displayCoords} />

          {displayCoords.map(({ zip, lat, lng }) => (
            <Circle
              key={`r-${zip}`}
              center={[lat, lng]}
              radius={radiusMeters}
              pathOptions={{
                color: "#1D9E75",
                fillColor: "#1D9E75",
                fillOpacity: 0.12,
                weight: 1.5,
                opacity: 0.6,
              }}
            />
          ))}

          {displayCoords.map(({ zip, lat, lng }) => (
            <CircleMarker
              key={`d-${zip}`}
              center={[lat, lng]}
              radius={5}
              pathOptions={{
                color: "#fff",
                fillColor: "#1D9E75",
                fillOpacity: 1,
                weight: 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <span className="font-mono text-xs font-semibold">{zip}</span>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <span>
          {displayCoords.length.toLocaleString()} input zip{displayCoords.length !== 1 ? "s" : ""} shown
          {truncated > 0 && ` (${truncated.toLocaleString()} not shown — map capped at ${MAX_MAP_MARKERS})`}
          {" "}· {radiusMiles} mi radius per zip
        </span>
        <span>Scroll to zoom · Click markers for zip code</span>
      </div>
    </div>
  );
}
