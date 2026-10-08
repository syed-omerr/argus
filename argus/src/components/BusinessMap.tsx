"use client";

import {
  GoogleMap,
  useLoadScript,
  Marker,
  Polyline,
  Circle,
  OverlayView,
} from "@react-google-maps/api";
import { useMemo, useState, useEffect, useRef } from "react";
import Image from "next/image";

// ─── Utilities ───────────────────────────────────────────────

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function metersToMiles(m: number) {
  return (m * 0.000621371).toFixed(2);
}

// ─── Types ───────────────────────────────────────────────────

export type Place = {
  place_id: string;
  name: string;
  formatted_address: string;
  location: { lat: number; lng: number };
  types: string[];
  icon?: string;
  photoUrl?: string;
  locationNumber?: number;
  distance?: number;
  detection?: {
    frame: string;
    description: string;
    confidence: number;
    timestamp?: string;
  };
};

// ─── Map Styles (ARGUS dark operative theme) ─────────────────

const ARGUS_MAP_STYLES_ACTIVE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#141414" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b6b6b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a0a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#242424" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#2a2a2a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#303030" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#c8822e" }, { weight: 1 }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1820" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#181818" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#2a2a2a" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#111111" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

const ARGUS_MAP_STYLES_DEFAULT: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0f0f0f" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#555555" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a0a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1f1f1f" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#262626" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#c8822e" }, { weight: 0.8 }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a1018" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#141414" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#0d0d0d" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#222222" }] },
];

// ─── SVG Pin Marker ───────────────────────────────────────────

function createCameraPin(
  locationNumber: number,
  isSelected: boolean,
  hasDetection: boolean,
  distanceMiles: string
): string {
  const pinFill = hasDetection ? "#e05252" : isSelected ? "#c8822e" : "#24252a";
  const pinStroke = hasDetection ? "#ffffff" : isSelected ? "#ffffff" : "#444650";
  const innerFill = hasDetection ? "#8c1d1d" : isSelected ? "#1b1c20" : "#121316";
  const textFill = hasDetection ? "#ffffff" : isSelected ? "#f5a623" : "#d0d2d8";

  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='48' height='58' viewBox='0 0 48 58'>
      <!-- Pin drop body -->
      <path d='M24 2 C12.95 2, 4 10.95, 4 22 C4 35, 24 56, 24 56 S44 35, 44 22 C44 10.95, 35.05 2, 24 2 Z'
            fill='${pinFill}' stroke='${pinStroke}' stroke-width='2' stroke-linejoin='round'/>
      <!-- Inner core circular badge -->
      <circle cx='24' cy='22' r='13' fill='${innerFill}' stroke='${pinStroke}' stroke-width='1.5'/>
      <!-- Camera label C1, C2 etc -->
      <text x='24' y='27' text-anchor='middle' font-family='Arial, sans-serif'
            font-size='12' font-weight='800' fill='${textFill}'>C${locationNumber}</text>
      ${hasDetection ? `<circle cx='38' cy='8' r='5' fill='#ffffff' stroke='#e05252' stroke-width='2'/>` : ""}
    </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function createOriginFlag(): string {
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='32' height='52' viewBox='0 0 32 52'>
      <rect x='14' y='4' width='2' height='42' fill='#f5f5f7' rx='1'/>
      <polygon points='16,4 30,12 16,20' fill='#c8822e' stroke='#c8822e' stroke-width='1'/>
      <circle cx='15' cy='48' r='3' fill='#c8822e' opacity='0.6'/>
    </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const STEP_DESCRIPTIONS = [
  "Suspect observed walking away from location, back facing camera",
  "Suspect briefly crossed path in front of premises",
  "Suspect seen loitering near entrance for several moments",
  "Suspect observed walking past at steady pace",
  "Suspect caught approaching from side street",
  "Suspect detected moving through parking area",
];

import { TrajectoryPrediction } from "../app/api/trajectory-prediction/route";

function createPredictiveTargetPin(): string {
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='56' height='68' viewBox='0 0 56 68'>
      <!-- Glow aura -->
      <circle cx='28' cy='28' r='26' fill='#e05252' opacity='0.25'/>
      <!-- Pin drop body -->
      <path d='M28 4 C15 4, 6 15, 6 28 C6 44, 28 66, 28 66 S50 44, 50 28 C50 15, 41 4, 28 4 Z'
            fill='#e05252' stroke='#ffffff' stroke-width='2.5' stroke-linejoin='round'/>
      <!-- Inner core circular badge -->
      <circle cx='28' cy='28' r='14' fill='#7f1d1d' stroke='#ffffff' stroke-width='1.5'/>
      <!-- Target crosshair -->
      <circle cx='28' cy='28' r='7' fill='none' stroke='#ffb3b3' stroke-width='1.5'/>
      <line x1='28' y1='17' x2='28' y2='39' stroke='#ffb3b3' stroke-width='1.5'/>
      <line x1='17' y1='28' x2='39' y2='28' stroke='#ffb3b3' stroke-width='1.5'/>
      <circle cx='28' cy='28' r='2' fill='#ffffff'/>
    </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ─── Component Props ──────────────────────────────────────────

interface BusinessMapProps {
  center: { lat: number; lng: number } | null;
  places: Place[];
  radius: number;
  selectedMarkers?: Set<string>;
  onMarkerSelect?: (placeId: string) => void;
  showOnlyDetections?: boolean;
  prediction?: TrajectoryPrediction | null;
  showPredictionOverlay?: boolean;
  onOpenBiometrics?: () => void;
}

export default function BusinessMap({
  center,
  places,
  radius,
  selectedMarkers = new Set(),
  onMarkerSelect,
  showOnlyDetections = false,
  prediction = null,
  showPredictionOverlay = true,
  onOpenBiometrics,
}: BusinessMapProps) {
  const [expandedDetections, setExpandedDetections] = useState<Set<string>>(new Set());
  const [showTimeline, setShowTimeline] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [useTacticalFallback, setUseTacticalFallback] = useState(false);
  const [tacticalZoom, setTacticalZoom] = useState(1);
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; type: "user" | "bot"; content: string; timestamp?: string }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  // Switch to tactical radar fallback if loadError occurs or timeout triggers
  useEffect(() => {
    if (loadError) {
      setUseTacticalFallback(true);
    }
  }, [loadError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoaded) {
        setUseTacticalFallback(true);
      }
    }, 2800);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  const mapCenter = useMemo(
    () => center || { lat: 17.3685, lng: 78.7565 },
    [center]
  );

  const mapStyles = useMemo(
    () => (center ? ARGUS_MAP_STYLES_ACTIVE : ARGUS_MAP_STYLES_DEFAULT),
    [center]
  );

  const mapOptions = useMemo(
    () => ({
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      zoomControl: true,
      zoomControlOptions: { position: 9 },
      styles: mapStyles,
      zoom: center ? 17 : 11,
      mapTypeId: "roadmap",
      gestureHandling: "greedy",
      backgroundColor: "#0a0a0a",
    }),
    [center, mapStyles]
  );

  // Filter + sort places
  const filteredAndSortedPlaces = useMemo(() => {
    if (!center) return [];
    const filtered = places
      .filter((p) => {
        const d = calculateDistance(center.lat, center.lng, p.location.lat, p.location.lng);
        return d <= radius;
      })
      .map((p) => ({
        ...p,
        distance: calculateDistance(center.lat, center.lng, p.location.lat, p.location.lng),
      }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .map((p, i) => ({ ...p, locationNumber: i + 1 }));

    if (showOnlyDetections && places.some((p) => p.detection)) {
      return filtered.filter((p) => p.detection || selectedMarkers.has(p.place_id));
    }
    return filtered;
  }, [places, center, radius, showOnlyDetections, selectedMarkers]);

  // Tactical movement track connecting detections in chronological order
  const detectionTrackPath = useMemo(() => {
    return filteredAndSortedPlaces
      .filter((p) => p.detection)
      .map((p) => ({
        ...p,
        ts: new Date(`1970-01-01 ${p.detection!.timestamp || "00:00"}`),
      }))
      .sort((a, b) => a.ts.getTime() - b.ts.getTime())
      .map((p) => p.location);
  }, [filteredAndSortedPlaces]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  // Timeline data
  const timelineDetections = filteredAndSortedPlaces
    .filter((p) => p.detection)
    .map((p) => ({
      ...p,
      ts: new Date(`1970-01-01 ${p.detection!.timestamp || "00:00"}`),
    }))
    .sort((a, b) => a.ts.getTime() - b.ts.getTime());

  // Chat submit
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = {
      id: Date.now().toString(),
      type: "user" as const,
      content: chatInput.trim(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    try {
      const ctx = timelineDetections
        .map(
          (d, i) =>
            `Location ${i + 1}: ${d.name} at ${d.detection!.timestamp} — ${
              STEP_DESCRIPTIONS[i % STEP_DESCRIPTIONS.length]
            }`
        )
        .join("\n");

      const res = await fetch("/api/timeline-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg.content, context: ctx }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: "bot",
            content: data.reply || data.answer || "No response received.",
          },
        ]);
      } else {
        throw new Error("Chat request failed");
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: `${timelineDetections.length} sightings recorded. ${
            timelineDetections.length > 1
              ? `Last seen at ${timelineDetections[timelineDetections.length - 1].name}.`
              : ""
          } Tactical telemetry available.`,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-full w-full relative overflow-hidden" style={{ background: "#0a0a0c" }}>
      {/* ── Mode & status badges (top-right) ── */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "flex-end",
        }}
        aria-live="polite"
      >
        {/* Radar fallback badge if active */}
        {useTacticalFallback && (
          <div className="map-badge" role="status" style={{ border: "1px solid rgba(200,130,46,0.3)" }}>
            <span className="pulse-dot pulse-dot--amber" />
            <span style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", color: "var(--argus-amber)" }}>
              TACTICAL RADAR (OFFLINE ENGINE)
            </span>
          </div>
        )}

        {selectedMarkers.size > 0 && (
          <div className="map-badge" role="status">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--argus-amber)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20M2 12a14.5 14.5 0 0 0 20 0" />
              </svg>
              <span>{selectedMarkers.size} camera{selectedMarkers.size !== 1 ? "s" : ""} linked</span>
            </div>
          </div>
        )}

        {timelineDetections.length > 0 && (
          <div className="map-badge" role="status" style={{ border: "1px solid rgba(224,82,82,0.35)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="pulse-dot pulse-dot--red" />
              <span style={{ color: "var(--argus-alert)", fontWeight: 700 }}>
                {timelineDetections.length} sighting{timelineDetections.length !== 1 ? "s" : ""} confirmed
              </span>
            </div>
          </div>
        )}

        {timelineDetections.length > 0 && (
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setShowTimeline((v) => !v)}
              className={`map-badge ${showTimeline ? "active" : ""}`}
              style={{ cursor: "pointer", background: showTimeline ? "var(--bg-elevated)" : undefined }}
            >
              Timeline ({timelineDetections.length})
            </button>
            <button
              onClick={() => setShowChat((v) => !v)}
              className={`map-badge ${showChat ? "active" : ""}`}
              style={{ cursor: "pointer", background: showChat ? "var(--bg-elevated)" : undefined }}
            >
              AI Intel
            </button>
          </div>
        )}



        {/* Predicted Next Sector Pill */}
        {prediction && (
          <div
            className="map-badge"
            role="status"
            style={{
              border: "1px solid rgba(224,82,82,0.6)",
              background: "rgba(18,19,25,0.95)",
              color: "#ff8080",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="text-[10px] font-mono font-bold text-white">NEXT SECTOR:</span>
              <span className="text-[11px] font-mono font-bold text-[#ff9999]">
                Batasingaram NH-65 (89%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Timeline Drawer ── */}
      {showTimeline && timelineDetections.length > 0 && (
        <aside className="timeline-drawer" style={{ zIndex: 40 }}>
          <div className="timeline-drawer__header">
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)" }}>
              CHRONOLOGICAL TRACK ({timelineDetections.length})
            </span>
            <button onClick={() => setShowTimeline(false)} className="btn btn-icon">✕</button>
          </div>
          <div className="timeline-drawer__body">
            {timelineDetections.map((detection, index) => (
              <div key={detection.place_id} className="timeline-item">
                <span className="timeline-item__badge">STEP {index + 1}</span>
                <span className="timeline-item__name">{detection.name}</span>
                <span className="timeline-item__meta">{detection.detection?.timestamp}</span>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* ── Intel Chat Drawer ── */}
      {showChat && (
        <div className="timeline-chat-panel" style={{ zIndex: 40 }}>
          <div className="argus-modal-header p-3 border-b border-[var(--argus-border-subtle)] flex justify-between">
            <span className="text-xs font-mono font-bold text-white">TACTICAL TIMELINE INTEL</span>
            <button onClick={() => setShowChat(false)} className="btn btn-icon">✕</button>
          </div>
          <div className="p-3 max-h-60 overflow-y-auto space-y-2 text-xs font-mono">
            {chatMessages.map((m) => (
              <div key={m.id} className={m.type === "user" ? "text-right text-amber-400" : "text-left text-gray-300"}>
                {m.content}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleChatSubmit} className="p-2 flex gap-2 border-t border-[var(--argus-border-subtle)]">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Query suspect trajectory…"
              className="argus-input text-xs"
            />
            <button type="submit" className="btn btn-accent btn-icon">➤</button>
          </form>
        </div>
      )}

      {/* ── MAIN MAP RENDER (Google Maps OR Tactical Radar Canvas) ── */}
      {isLoaded && !loadError && !useTacticalFallback ? (
        <GoogleMap
          zoom={mapOptions.zoom}
          center={mapCenter}
          mapContainerStyle={{ width: "100%", height: "100%" }}
          options={mapOptions}
        >
          {center && (
            <Circle
              center={center}
              radius={radius}
              options={{
                strokeColor: "#c8822e",
                strokeOpacity: 0.4,
                strokeWeight: 1.5,
                fillColor: "#c8822e",
                fillOpacity: 0.04,
              }}
            />
          )}

          {center && (
            <Marker
              position={center}
              title="Last known location"
              icon={{
                url: createOriginFlag(),
                scaledSize: new google.maps.Size(32, 52),
                anchor: new google.maps.Point(15, 48),
              }}
              zIndex={1000}
            />
          )}

          {filteredAndSortedPlaces.map((p) => {
            const isSelected = selectedMarkers.has(p.place_id);
            const hasDetection = !!p.detection;
            const distMi = metersToMiles(p.distance || 0);
            return (
              <Marker
                key={p.place_id}
                position={p.location}
                title={`C${p.locationNumber}: ${p.name}`}
                icon={{
                  url: createCameraPin(p.locationNumber || 1, isSelected, hasDetection, distMi),
                  scaledSize: new google.maps.Size(36, 44),
                  anchor: new google.maps.Point(18, 44),
                }}
                onClick={() => onMarkerSelect?.(p.place_id)}
                zIndex={hasDetection ? 500 : isSelected ? 300 : 100}
              />
            );
          })}

          {/* Tactical Chronological Movement Track between Camera Sightings */}
          {detectionTrackPath.length > 1 && (
            <Polyline
              path={detectionTrackPath}
              options={{
                strokeColor: "#c8822e",
                strokeOpacity: 0.85,
                strokeWeight: 3,
                geodesic: true,
              }}
            />
          )}

          {/* Predictive Intercept Zone & Vector Overlays */}
          {showPredictionOverlay && prediction?.predictedLocation && (
            <>
              {/* Predicted Next Sector Uncertainty Radius */}
              <Circle
                center={{
                  lat: prediction.predictedLocation.lat,
                  lng: prediction.predictedLocation.lng,
                }}
                radius={prediction.predictedLocation.uncertaintyRadiusMeters}
                options={{
                  strokeColor: "#ff4444",
                  strokeOpacity: 0.9,
                  strokeWeight: 2,
                  fillColor: "#e05252",
                  fillOpacity: 0.22,
                }}
              />

              {/* Predicted Next Location Intercept Pin */}
              <Marker
                position={{
                  lat: prediction.predictedLocation.lat,
                  lng: prediction.predictedLocation.lng,
                }}
                title={`PREDICTED INTERCEPT: ${prediction.predictedLocation.name}`}
                icon={{
                  url: createPredictiveTargetPin(),
                  scaledSize: new google.maps.Size(46, 56),
                  anchor: new google.maps.Point(23, 56),
                }}
                zIndex={2000}
                onClick={onOpenBiometrics}
              />

              {/* Trajectory Vector Arrow from Confirmed Detection (C5) to Predicted Intercept */}
              <Polyline
                path={[
                  prediction.faces.find((f) => f.isPositiveHit)?.location || { lat: 17.3667, lng: 78.7583 },
                  {
                    lat: prediction.predictedLocation.lat,
                    lng: prediction.predictedLocation.lng,
                  },
                ]}
                options={{
                  strokeColor: "#ff4444",
                  strokeOpacity: 0.9,
                  strokeWeight: 3.5,
                  geodesic: true,
                }}
              />
            </>
          )}
        </GoogleMap>
      ) : (
        /* ── Tactical Radar Canvas Fallback (Offset on desktop for sidebar) ── */
        <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden bg-[#0a0a0c] md:pl-[380px]">
          {/* Cybernetic Grid Lines */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(200,130,46,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(200,130,46,0.15) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Radar Concentric Rings */}
          <div className="relative w-[85vmin] h-[85vmin] max-w-[700px] max-h-[700px] flex items-center justify-center">
            {/* Outer Ring */}
            <div
              className="absolute inset-0 rounded-full border border-[rgba(200,130,46,0.25)] flex items-center justify-center"
              style={{ boxShadow: "0 0 50px rgba(200,130,46,0.05)" }}
            >
              <span className="absolute -top-3 text-[10px] font-mono text-[var(--argus-amber)] opacity-60">
                {radius}m PERIMETER
              </span>
            </div>

            {/* Mid Ring */}
            <div className="absolute w-[66%] h-[66%] rounded-full border border-[rgba(200,130,46,0.18)] border-dashed flex items-center justify-center">
              <span className="absolute -top-2.5 text-[9px] font-mono text-gray-500">
                {Math.round(radius * 0.66)}m
              </span>
            </div>

            {/* Inner Ring */}
            <div className="absolute w-[33%] h-[33%] rounded-full border border-[rgba(200,130,46,0.2)] flex items-center justify-center">
              <span className="absolute -top-2.5 text-[9px] font-mono text-gray-500">
                {Math.round(radius * 0.33)}m
              </span>
            </div>

            {/* Crosshairs */}
            <div className="absolute w-full h-[1px] bg-[rgba(200,130,46,0.2)]" />
            <div className="absolute h-full w-[1px] bg-[rgba(200,130,46,0.2)]" />

            {/* Rotating Radar Sweep Beam */}
            <div
              className="absolute w-full h-full rounded-full pointer-events-none"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(200,130,46,0.18) 0deg, transparent 60deg, transparent 360deg)",
                animation: "spin 5s linear infinite",
              }}
            />

            {/* Center Origin Reticle (Epicenter) */}
            <div className="absolute z-20 flex flex-col items-center pointer-events-none">
              <div className="w-5 h-5 rounded-full border border-[var(--argus-amber)] flex items-center justify-center bg-black/60 shadow-lg">
                <div className="w-2 h-2 rounded-full bg-[var(--argus-amber)] animate-ping" />
              </div>
              <span className="mt-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-white border border-[var(--argus-border-subtle)]">
                EPICENTER
              </span>
            </div>

            {/* Camera Position Markers */}
            {center &&
              filteredAndSortedPlaces.map((p, idx) => {
                const isSelected = selectedMarkers.has(p.place_id);
                const hasDetection = !!p.detection;
                const camNum = p.locationNumber || idx + 1;

                // Relative coordinates mapping
                const dLat = p.location.lat - center.lat;
                const dLng = p.location.lng - center.lng;
                const latMeters = dLat * 111320;
                const lngMeters = dLng * 111320 * Math.cos((center.lat * Math.PI) / 180);

                // Normalization to 40% radius radius of container
                const scaleFactor = 42 / Math.max(radius, 200);
                const leftPct = 50 + lngMeters * scaleFactor * tacticalZoom;
                const topPct = 50 - latMeters * scaleFactor * tacticalZoom;

                const isHovered = hoveredPlaceId === p.place_id;

                return (
                  <div
                    key={p.place_id}
                    className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-200 hover:scale-125"
                    style={{
                      left: `${Math.max(6, Math.min(94, leftPct))}%`,
                      top: `${Math.max(6, Math.min(94, topPct))}%`,
                    }}
                    onClick={() => onMarkerSelect?.(p.place_id)}
                    onMouseEnter={() => setHoveredPlaceId(p.place_id)}
                    onMouseLeave={() => setHoveredPlaceId(null)}
                  >
                    <div
                      className={`relative flex items-center justify-center px-2 py-1 rounded-md text-[10px] font-mono font-bold shadow-xl transition-all duration-200 ${
                        hasDetection
                          ? "bg-[#e05252] text-white ring-2 ring-[#e05252]/50 animate-pulse"
                          : isSelected
                          ? "bg-[var(--argus-amber)] text-black ring-2 ring-[var(--argus-amber)]/60"
                          : "bg-[#18191d] text-gray-300 border border-[var(--argus-border)] hover:border-[var(--argus-amber)]"
                      }`}
                    >
                      C{camNum}
                      {hasDetection && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-400 rounded-full border border-black" />
                      )}
                    </div>

                    {/* Hover Telemetry Card */}
                    {isHovered && (
                      <div
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 rounded-lg bg-black/95 border border-[var(--argus-border)] shadow-2xl z-50 whitespace-nowrap pointer-events-none"
                      >
                        <p className="text-[11px] font-mono font-bold text-white">{p.name}</p>
                        <p className="text-[9px] font-mono text-gray-400">{metersToMiles(p.distance || 0)} mi from epicenter</p>
                        <p className="text-[9px] font-mono text-[var(--argus-amber)] mt-0.5">
                          {isSelected ? "✓ SELECTED FOR SWARM" : "Click to select"}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Predictive Target Reticle in Tactical Radar Canvas */}
            {center && prediction?.predictedLocation && (
              (() => {
                const pLoc = prediction.predictedLocation;
                const dLat = pLoc.lat - center.lat;
                const dLng = pLoc.lng - center.lng;
                const latMeters = dLat * 111320;
                const lngMeters = dLng * 111320 * Math.cos((center.lat * Math.PI) / 180);
                const scaleFactor = 42 / Math.max(radius, 200);
                const leftPct = 50 + lngMeters * scaleFactor * tacticalZoom;
                const topPct = 50 - latMeters * scaleFactor * tacticalZoom;

                return (
                  <div
                    className="absolute z-40 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-200 hover:scale-110"
                    style={{
                      left: `${Math.max(8, Math.min(92, leftPct))}%`,
                      top: `${Math.max(8, Math.min(92, topPct))}%`,
                    }}
                    onClick={onOpenBiometrics}
                  >
                    <div className="relative flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#e05252] animate-spin flex items-center justify-center bg-[#e05252]/20">
                        <div className="w-3 h-3 rounded-full bg-[#ff4d4d] animate-ping" />
                      </div>
                      <div className="mt-1 px-2 py-0.5 rounded bg-black/90 border border-[#e05252] shadow-xl flex items-center gap-1.5 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-[#ff4d4d]" />
                        <span className="text-[9px] font-mono font-bold text-[#ff9999]">
                          PREDICTED INTERCEPT: BATASINGARAM NH-65 ({Math.round(prediction.predictedLocation.probability * 100)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* Tactical Zoom & Controls */}
          <div className="absolute bottom-6 right-6 z-20 flex gap-2">
            <button
              onClick={() => setTacticalZoom((z) => Math.min(2.2, z + 0.25))}
              className="btn btn-icon w-9 h-9 bg-black/70 border border-[var(--argus-border-subtle)] text-white hover:bg-[var(--bg-elevated)]"
              aria-label="Zoom in radar"
            >
              +
            </button>
            <button
              onClick={() => setTacticalZoom((z) => Math.max(0.6, z - 0.25))}
              className="btn btn-icon w-9 h-9 bg-black/70 border border-[var(--argus-border-subtle)] text-white hover:bg-[var(--bg-elevated)]"
              aria-label="Zoom out radar"
            >
              −
            </button>
            <button
              onClick={() => setTacticalZoom(1)}
              className="px-2 py-1 bg-black/70 border border-[var(--argus-border-subtle)] rounded text-[10px] font-mono text-gray-300 hover:text-white"
            >
              RESET
            </button>
          </div>

          {/* Tactical HUD Footer */}
          <div className="absolute bottom-6 left-6 md:left-[404px] z-20 flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-black/80 border border-[var(--argus-border-subtle)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--argus-amber)]" />
              <span className="text-[10px] font-mono text-gray-400">
                RADAR SECTOR: {center ? `${center.lat.toFixed(4)}°, ${center.lng.toFixed(4)}°` : "STANDBY"}
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-500">
              {filteredAndSortedPlaces.length} CAMERA NODES DETECTED
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
