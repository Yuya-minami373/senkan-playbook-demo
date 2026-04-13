"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Station {
  id: number;
  no: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  voting_area: string | null;
  accessibility: string | null;
  type: "polling" | "poster" | "early";
}

interface Props {
  stations: Station[];
  selectedStation: Station | null;
  onSelectStation: (s: Station) => void;
}

function createMarkerIcon(type: "polling" | "poster" | "early", no: number, isSelected: boolean) {
  const color = type === "polling" ? "#2563eb" : type === "early" ? "#10b981" : "#f97316";
  const size = isSelected ? 32 : 26;
  const fontSize = isSelected ? 12 : 10;
  const borderWidth = isSelected ? 3 : 2;

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:${borderWidth}px solid white;
      border-radius:8px;
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:700;font-size:${fontSize}px;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      transition:all 0.15s;
      font-family:Inter,sans-serif;
    ">${no}</div>`,
  });
}

/** 市原市の境界GeoJSON（MultiPolygon）から外側をマスクするポリゴンを生成 */
function buildMaskCoords(geometry: GeoJSON.MultiPolygon | GeoJSON.Polygon): L.LatLngExpression[][] {
  // 世界全体を覆う外枠（反時計回り）
  const world: L.LatLngExpression[] = [
    [-90, -180], [-90, 180], [90, 180], [90, -180], [-90, -180],
  ];

  // 市原市の境界を穴として追加（時計回り = GeoJSON座標を[lng,lat]→[lat,lng]変換）
  const holes: L.LatLngExpression[][] = [];
  const polys = geometry.type === "MultiPolygon" ? geometry.coordinates : [geometry.coordinates];
  for (const poly of polys) {
    for (const ring of poly) {
      holes.push(ring.map(([lng, lat]) => [lat, lng] as L.LatLngExpression));
    }
  }

  return [world, ...holes];
}

export default function MapView({ stations, selectedStation, onSelectStation }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // 市原市の範囲
    const ichiharaBounds = L.latLngBounds(
      [35.23, 139.95],
      [35.58, 140.27],
    );

    const map = L.map(containerRef.current, {
      zoomControl: false,
      maxBounds: ichiharaBounds.pad(0.05),
      maxBoundsViscosity: 1.0,
      minZoom: 10,
    }).fitBounds(ichiharaBounds);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    // 市原市の境界を読み込み、外側をマスク
    fetch("/ichihara-boundary.geojson")
      .then(r => r.json())
      .then((feature: GeoJSON.Feature) => {
        const geom = feature.geometry as GeoJSON.MultiPolygon | GeoJSON.Polygon;

        // マスク（市原市以外を半透明白で塗りつぶし）
        const maskCoords = buildMaskCoords(geom);
        L.polygon(maskCoords, {
          color: "transparent",
          fillColor: "#ffffff",
          fillOpacity: 0.75,
          interactive: false,
        }).addTo(map);

        // 市原市の境界線
        L.geoJSON(feature as GeoJSON.Feature, {
          style: {
            color: "#2563eb",
            weight: 2.5,
            opacity: 0.6,
            fillColor: "transparent",
            fillOpacity: 0,
          },
          interactive: false,
        }).addTo(map);
      });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    stations.forEach(s => {
      const isSelected = selectedStation?.id === s.id;
      const marker = L.marker([s.lat, s.lng], {
        icon: createMarkerIcon(s.type, s.no, isSelected),
        zIndexOffset: isSelected ? 1000 : s.type === "early" ? 200 : s.type === "polling" ? 100 : 0,
      });

      marker.on("click", () => onSelectStation(s));
      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [stations, selectedStation, onSelectStation]);

  // Pan to selected
  useEffect(() => {
    if (selectedStation && mapRef.current) {
      mapRef.current.setView([selectedStation.lat, selectedStation.lng], Math.max(mapRef.current.getZoom(), 14), {
        animate: true,
      });
    }
  }, [selectedStation]);

  return <div ref={containerRef} className="w-full h-full" />;
}
