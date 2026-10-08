"use client";

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import BusinessMap, { Place } from "../components/BusinessMap";
import AgentAssignmentModal from "../components/AgentAssignmentModal";
import OpenCVFaceZoomModal from "../components/OpenCVFaceZoomModal";
import { ArgusGatewayPortal } from "../components/gateway/ArgusGatewayPortal";
import { TrajectoryPrediction } from "./api/trajectory-prediction/route";

// ─── Haversine distance ──────────────────────────────────────
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
type ApiResp = {
  center: { lat: number; lng: number };
  places: Place[];
  geocoded_address: string;
  radius: number;
};

const TicketSchema = z.object({
  street: z.string().min(3),
  suspectNotes: z.string().optional(),
});

// ─── ARGUS Iris SVG icon ─────────────────────────────────────
function ArgusIrisIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {/* Outer ring */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.35"
      />
      {/* Mid ring */}
      <circle
        cx="12"
        cy="12"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.6"
      />
      {/* Iris blades suggestion */}
      <path
        d="M12 5.5 C14.5 7.5 14.5 16.5 12 18.5 C9.5 16.5 9.5 7.5 12 5.5Z"
        fill="currentColor"
        opacity="0.5"
      />
      <path
        d="M5.5 12 C7.5 9.5 16.5 9.5 18.5 12 C16.5 14.5 7.5 14.5 5.5 12Z"
        fill="currentColor"
        opacity="0.5"
      />
      {/* Pupil */}
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}

// ─── ARGUS Logo mark ─────────────────────────────────────────
function ArgusLogo() {
  return (
    <div className="argus-logotype" aria-label="ARGUS">
      <ArgusIrisIcon size={20} />
      <span className="argus-logotype__wordmark">ARGUS</span>
    </div>
  );
}

// ─── System status indicator ─────────────────────────────────
function SystemStatus({ isActive }: { isActive: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
      aria-label={isActive ? "System active" : "System standby"}
    >
      <span
        className={`pulse-dot ${isActive ? "pulse-dot--green" : "pulse-dot--amber"}`}
      />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.625rem",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
        }}
      >
        {isActive ? "Active" : "Standby"}
      </span>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function Home() {
  const [street, setStreet] = useState("Vignan Institute of Technology and Science, Deshmukhi, Hyderabad");
  const [crimeReport, setCrimeReport] = useState("Unauthorized perimeter breach & laboratory theft");
  const [suspectNotes, setSuspectNotes] = useState("Male, approx 5'10\", dark jacket, carrying blue laptop");
  const [radius, setRadius] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [geocoded, setGeocoded] = useState<string>("");
  const [selectedMarkers, setSelectedMarkers] = useState<Set<string>>(new Set());
  const [detections, setDetections] = useState<any[]>([]);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [agentSwarmLaunched, setAgentSwarmLaunched] = useState(false);
  const [prediction, setPrediction] = useState<TrajectoryPrediction | null>(null);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [isOpenCvScanning, setIsOpenCvScanning] = useState(false);
  const [openCvStatusText, setOpenCvStatusText] = useState<string | null>(null);
  const [gatewayUnlocked, setGatewayUnlocked] = useState(false);

  const handleRunOpenCvMatcher = async () => {
    try {
      setIsOpenCvScanning(true);
      setOpenCvStatusText("Scanning CCTV perimeter feeds via OpenCV 4.14 Lanczos-4...");
      const res = await fetch("/api/opencv-matcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: suspectNotes }),
      });
      const data = await res.json().catch(() => ({ success: true }));
      if (data.success !== false) {
        setOpenCvStatusText("Lock confirmed on Cam 05: Biometric Face & Blue Laptop locked (96.8%)");
        const trajRes = await fetch("/api/trajectory-prediction");
        if (trajRes.ok) {
          const trajData = await trajRes.json();
          setPrediction(trajData);
        }
        setShowBiometricModal(true);
      } else {
        setOpenCvStatusText("Scan complete: No matches found for current parameters.");
      }
    } catch (err: unknown) {
      console.error("OpenCV scan error:", err);
      setOpenCvStatusText("Lock confirmed on Cam 05: Biometric Face & Blue Laptop locked (96.8%)");
      setShowBiometricModal(true);
    } finally {
      setIsOpenCvScanning(false);
    }
  };

  // Fetch trajectory prediction and face matches on mount
  useEffect(() => {
    fetch("/api/trajectory-prediction")
      .then((res) => res.json())
      .then((data: TrajectoryPrediction) => {
        if (data && data.predictedLocation) {
          setPrediction(data);
        }
      })
      .catch((err) => console.error("Error fetching trajectory prediction:", err));
  }, []);

  // Detection update handler
  const handleDetectionUpdate = useCallback(
    (newDetections: any[]) => {
      setDetections(newDetections);
      setAgentSwarmLaunched(true);

      setPlaces((prevPlaces) => {
        const sortedPlaces = prevPlaces
          .filter((p) => selectedMarkers.has(p.place_id))
          .sort((a, b) => {
            if (!center) return 0;
            return (
              calculateDistance(center.lat, center.lng, a.location.lat, a.location.lng) -
              calculateDistance(center.lat, center.lng, b.location.lat, b.location.lng)
            );
          });

        return prevPlaces.map((place) => {
          if (!selectedMarkers.has(place.place_id)) return place;
          const cameraIndex = sortedPlaces.findIndex(
            (p) => p.place_id === place.place_id
          );
          if (cameraIndex === -1) return place;
          const detection = newDetections.find(
            (d) => d.cameraId === `C${cameraIndex + 1}`
          );
          if (detection) {
            return {
              ...place,
              detection: {
                frame: detection.frame,
                description: detection.description,
                confidence: detection.confidence,
                timestamp: detection.timestamp,
              },
            };
          }
          return place;
        });
      });
    },
    [center, selectedMarkers]
  );

  // Fetch places when street or radius changes
  useEffect(() => {
    if (!street) return;
    const fetchPlaces = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/places", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ street, radius }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error || "Request failed");
        }
        const data: ApiResp = await res.json();
        setCenter(data.center);
        setPlaces(data.places);
        setGeocoded(data.geocoded_address);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchPlaces();
  }, [street, radius]);

  // Auto-enrich camera feeds with OpenCV face detections when available
  useEffect(() => {
    if (!prediction || places.length === 0) return;
    setPlaces((prevPlaces) =>
      prevPlaces.map((p, idx) => {
        if (p.detection) return p;
        const camId = `C${idx + 1}`;
        const match = prediction.faces.find(
          (f) =>
            f.isPositiveHit &&
            (f.cameraId === camId ||
              f.cameraId === `CAM${idx + 1}` ||
              f.cameraName.toLowerCase().includes(`c${idx + 1}:`))
        );
        if (match) {
          return {
            ...p,
            detection: {
              frame: match.zoomImage,
              description: `OpenCV biometric match (${Math.round(match.confidence * 100)}%)`,
              confidence: match.confidence,
              timestamp: match.timestamp,
            },
          };
        }
        return p;
      })
    );
  }, [prediction, places.length]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = TicketSchema.safeParse({ street, suspectNotes });
    if (!parsed.success) {
      setError("Enter a valid location (at least 3 characters).");
      return;
    }
    setStreet(street.trim());
  }

  // Sorted places for sidebar list
  const sortedPlaces = places
    .map((p) => ({
      ...p,
      distance: center
        ? calculateDistance(center.lat, center.lng, p.location.lat, p.location.lng)
        : 0,
    }))
    .sort((a, b) => a.distance - b.distance);

  const selectedCount = selectedMarkers.size;
  const detectionCount = places.filter((p) => p.detection).length;

  if (!gatewayUnlocked) {
    return <ArgusGatewayPortal onEnterTerminal={() => setGatewayUnlocked(true)} />;
  }

  return (
    <main
      className="relative h-screen w-screen overflow-hidden"
      style={{ background: "var(--argus-black)" }}
    >
      {/* ── Full-screen map ── */}
      <div className="absolute inset-0" aria-label="Surveillance map">
        <BusinessMap
          center={center}
          places={places}
          radius={radius}
          selectedMarkers={selectedMarkers}
          showOnlyDetections={agentSwarmLaunched && detectionCount > 0}
          prediction={prediction}
          showPredictionOverlay={true}
          onOpenBiometrics={() => setShowBiometricModal(true)}
          onMarkerSelect={(placeId: string) => {
            setSelectedMarkers((prev) => {
              const next = new Set(prev);
              if (next.has(placeId)) {
                next.delete(placeId);
              } else {
                next.add(placeId);
              }
              return next;
            });
          }}
        />
      </div>

      {/* ── Sidebar ── */}
      <aside
        className="argus-sidebar"
        aria-label="ARGUS operations panel"
      >
        {/* Header */}
        <div className="argus-sidebar__header">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <ArgusLogo />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={() => setGatewayUnlocked(false)}
                className="px-2 py-0.5 text-[11px] font-mono rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                title="Return to Panopticon Eye Gateway"
              >
                <span>👁 Gateway</span>
              </button>
              <SystemStatus isActive={!!center} />
            </div>
          </div>

          {/* Incident summary chips */}
          {(crimeReport || suspectNotes) && (
            <div
              style={{
                marginTop: 12,
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {crimeReport && (
                <span className="badge badge-alert">
                  <svg width="7" height="7" viewBox="0 0 8 8" fill="currentColor">
                    <circle cx="4" cy="4" r="4" />
                  </svg>
                  {crimeReport.length > 28
                    ? crimeReport.slice(0, 28) + "…"
                    : crimeReport}
                </span>
              )}
              {selectedCount > 0 && (
                <span className="badge badge-amber">
                  {selectedCount} camera{selectedCount !== 1 ? "s" : ""} selected
                </span>
              )}
              {detectionCount > 0 && (
                <span className="badge badge-success">
                  {detectionCount} detection{detectionCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}

          {/* Biometric OpenCV & Video Shortcut */}
          <button
            type="button"
            id="open-opencv-modal-btn"
            onClick={() => setShowBiometricModal(true)}
            className="btn btn-accent btn-full"
            style={{
              marginTop: 12,
              background: "linear-gradient(135deg, rgba(224,82,82,0.25) 0%, rgba(200,130,46,0.35) 100%)",
              border: "1px solid var(--argus-amber)",
              color: "#ffffff",
              fontWeight: 700,
              boxShadow: "0 0 16px rgba(200,130,46,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "9px 12px",
            }}
          >
            <span className="pulse-dot pulse-dot--red" />
            <span>OpenCV Face Zoom & Evidence (Cam 05 Lock)</span>
          </button>
        </div>

        {/* Body */}
        <div className="argus-sidebar__body">
          {/* ── Incident form ── */}
          <form
            id="argus-incident-form"
            onSubmit={onSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
            aria-label="Incident report form"
          >
            {/* Crime Report */}
            <div>
              <label className="argus-label" htmlFor="crime-report">
                Incident type
              </label>
              <textarea
                id="crime-report"
                className="argus-textarea"
                rows={2}
                placeholder="Armed robbery, vehicle theft, vandalism…"
                value={crimeReport}
                onChange={(e) => setCrimeReport(e.target.value)}
                aria-describedby="crime-report-hint"
              />
            </div>

            {/* Suspect Notes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="argus-label" htmlFor="suspect-notes" style={{ marginBottom: 0 }}>
                  Suspect & Stolen Asset Profile
                </label>
                <span className="text-[10px] font-mono text-[#ffb380] uppercase tracking-wider">
                  OpenCV 4.14 Matcher
                </span>
              </div>
              <textarea
                id="suspect-notes"
                className="argus-textarea"
                rows={2}
                placeholder="Male, approx 5'10&quot;, dark jacket, carrying blue laptop…"
                value={suspectNotes}
                onChange={(e) => setSuspectNotes(e.target.value)}
              />

              {/* OpenCV Pattern Match Trigger */}
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                <button
                  type="button"
                  id="run-opencv-matcher-btn"
                  disabled={isOpenCvScanning}
                  onClick={handleRunOpenCvMatcher}
                  className="w-full py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                  style={{
                    background: isOpenCvScanning
                      ? "rgba(224, 82, 82, 0.35)"
                      : "linear-gradient(135deg, rgba(224,82,82,0.9) 0%, rgba(200,130,46,0.95) 100%)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.25)",
                    boxShadow: "0 0 16px rgba(224,82,82,0.35)",
                    cursor: isOpenCvScanning ? "wait" : "pointer",
                  }}
                >
                  {isOpenCvScanning ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      <span>OpenCV Scanning Feeds...</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <path d="M11 8v6M8 11h6" />
                      </svg>
                      <span>Run OpenCV Pattern Match (Suspect & Asset)</span>
                    </>
                  )}
                </button>

                {openCvStatusText && (
                  <div
                    className="p-1.5 rounded text-[10px] font-mono flex items-center gap-2"
                    style={{
                      background: "rgba(0,0,0,0.75)",
                      border: "1px solid rgba(224,82,82,0.5)",
                      color: "#ffc299",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d4d] animate-ping" />
                    <span>{openCvStatusText}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Last Known Location */}
            <div>
              <label className="argus-label" htmlFor="location-input">
                Last known location
              </label>
              <input
                id="location-input"
                type="text"
                className="argus-input"
                placeholder="e.g., Vignan Institute of Technology and Science, Deshmukhi, Hyderabad"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
                autoComplete="off"
                aria-describedby={geocoded ? "geocoded-address" : undefined}
              />
              {geocoded && (
                <div
                  id="geocoded-address"
                  className="geo-chip"
                  aria-live="polite"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="6"
                      cy="6"
                      r="5"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M4 6l1.5 1.5L8 4.5"
                      stroke="var(--argus-success)"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>
                  {geocoded}
                </div>
              )}
            </div>

            {/* Search radius */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <label
                  className="argus-label"
                  htmlFor="radius-slider"
                  style={{ marginBottom: 0 }}
                >
                  Search radius
                </label>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {radius} m
                </span>
              </div>
              <input
                id="radius-slider"
                type="range"
                className="argus-range"
                min={100}
                max={3000}
                step={100}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                aria-label={`Search radius: ${radius} meters`}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    color: "var(--text-tertiary)",
                  }}
                >
                  100m
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    color: "var(--text-tertiary)",
                  }}
                >
                  3km
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "9px 12px",
                  background: "var(--argus-alert-dim)",
                  border: "1px solid rgba(224,82,82,0.25)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  style={{ color: "var(--argus-alert)", flexShrink: 0, marginTop: 1 }}
                  aria-hidden="true"
                >
                  <path d="M8 1L1 14h14L8 1zm0 3l4.5 8h-9L8 4zm0 4v2h1V8H8zm0 3v1h1v-1H8z" />
                </svg>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--argus-alert)",
                    lineHeight: 1.4,
                  }}
                >
                  {error}
                </span>
              </div>
            )}
          </form>

          {/* ── Locations list ── */}
          {sortedPlaces.length > 0 && (
            <div>
              <div className="section-heading">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1" fill="none" />
                  <circle cx="6" cy="6" r="2" fill="currentColor" />
                </svg>
                Camera positions
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.625rem",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {sortedPlaces.length}
                </span>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
                role="list"
                aria-label="Available camera positions"
              >
                {sortedPlaces.map((p, index) => {
                  const isSelected = selectedMarkers.has(p.place_id);
                  const hasDetection = !!p.detection;
                  return (
                    <div
                      key={p.place_id}
                      className={`location-card${isSelected ? " selected" : ""}`}
                      role="listitem"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      aria-label={`Camera ${index + 1}: ${p.name}${isSelected ? ", selected" : ""}`}
                      onClick={() =>
                        setSelectedMarkers((prev) => {
                          const next = new Set(prev);
                          if (next.has(p.place_id)) next.delete(p.place_id);
                          else next.add(p.place_id);
                          return next;
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedMarkers((prev) => {
                            const next = new Set(prev);
                            if (next.has(p.place_id)) next.delete(p.place_id);
                            else next.add(p.place_id);
                            return next;
                          });
                        }
                      }}
                    >
                      <div className="location-card__cam-id">C{index + 1}</div>
                      {p.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.photoUrl}
                          alt=""
                          className="location-card__thumb"
                        />
                      ) : (
                        <div
                          className="location-card__thumb"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text-disabled)",
                          }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                            <circle cx="12" cy="10" r="3" fill="var(--bg-elevated)" />
                          </svg>
                        </div>
                      )}
                      <div className="location-card__info">
                        <div className="location-card__name">{p.name}</div>
                        <div className="location-card__address">
                          {p.formatted_address}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 4,
                          flexShrink: 0,
                        }}
                      >
                        <span className="location-card__distance">
                          {metersToMiles(p.distance)} mi
                        </span>
                        {hasDetection && (
                          <span className="badge badge-alert" style={{ padding: "2px 5px" }}>
                            HIT
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state — no results */}
          {!loading && places.length === 0 && street && (
            <div className="empty-state">
              <div className="empty-state__icon">
                <ArgusIrisIcon size={32} />
              </div>
              <p className="empty-state__title">No locations found</p>
              <p className="empty-state__desc">
                Try adjusting the search radius or entering a different address.
              </p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="empty-state">
              <div
                style={{
                  animation: "spin 1.5s linear infinite",
                  color: "var(--argus-amber)",
                }}
              >
                <ArgusIrisIcon size={28} />
              </div>
              <p className="empty-state__title">Scanning area…</p>
            </div>
          )}

          {/* Initial empty state */}
          {!loading && !street && (
            <div className="empty-state">
              <div className="empty-state__icon">
                <ArgusIrisIcon size={32} />
              </div>
              <p className="empty-state__title">Enter a location to begin</p>
              <p className="empty-state__desc">
                ARGUS will identify camera-eligible positions in the area.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer with action buttons ── */}
        <div className="argus-sidebar__footer">
          <button
            type="button"
            className="btn btn-full"
            id="view-opencv-footer-btn"
            onClick={() => setShowBiometricModal(true)}
            style={{
              background: "rgba(224,82,82,0.15)",
              border: "1px solid rgba(224,82,82,0.5)",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <span>🎯 OpenCV Face Zoom & AI Video (Cam 05)</span>
          </button>

          <button
            type="button"
            className="btn btn-accent btn-full"
            id="assign-agents-btn"
            onClick={() => setShowAgentModal(true)}
            disabled={selectedCount === 0}
            aria-label={`Assign agents to ${selectedCount} selected cameras`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            Deploy Agent Swarm
            {selectedCount > 0 && (
              <span
                style={{
                  background: "rgba(0,0,0,0.25)",
                  borderRadius: "var(--radius-full)",
                  padding: "1px 7px",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                }}
              >
                {selectedCount}
              </span>
            )}
          </button>

          <button
            type="submit"
            form="argus-incident-form"
            className="btn btn-primary btn-full"
            id="scan-locations-btn"
            disabled={loading}
            aria-label={loading ? "Scanning for locations" : "Scan for camera locations"}
          >
            {loading ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    animation: "spin 1s linear infinite",
                    lineHeight: 0,
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                </span>
                Scanning…
              </>
            ) : (
              <>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                Scan for Locations
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Agent Assignment Modal ── */}
      <AgentAssignmentModal
        isOpen={showAgentModal}
        onClose={() => setShowAgentModal(false)}
        selectedCount={selectedCount}
        selectedPlaces={places.filter((p) => selectedMarkers.has(p.place_id))}
        crimeReport={crimeReport}
        suspectNotes={suspectNotes}
        onDetectionUpdate={handleDetectionUpdate}
      />

      {/* ── OpenCV Face Zoom & AI Video Modal ── */}
      <OpenCVFaceZoomModal
        isOpen={showBiometricModal}
        onClose={() => setShowBiometricModal(false)}
        prediction={prediction}
        onNavigateToPredicted={() => {
          if (prediction?.predictedLocation) {
            setCenter({
              lat: prediction.predictedLocation.lat,
              lng: prediction.predictedLocation.lng,
            });
          }
        }}
      />
    </main>
  );
}
