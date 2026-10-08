"use client";

import { useState } from "react";
import Image from "next/image";
import { TrajectoryPrediction, FaceDetectionRecord } from "../app/api/trajectory-prediction/route";

interface OpenCVFaceZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  prediction: TrajectoryPrediction | null;
  onNavigateToPredicted?: () => void;
}

export default function OpenCVFaceZoomModal({
  isOpen,
  onClose,
  prediction,
  onNavigateToPredicted,
}: OpenCVFaceZoomModalProps) {
  const [activeTab, setActiveTab] = useState<"faces" | "video" | "trajectory">("faces");
  const [selectedFace, setSelectedFace] = useState<FaceDetectionRecord | null>(null);
  const [cam05ViewMode, setCam05ViewMode] = useState<"face" | "laptop" | "person" | "cctv">("face");

  if (!isOpen) return null;

  const faces = prediction?.faces || [];
  // Default to the confirmed hit (CAM 05)
  const confirmedHit = faces.find((f) => f.isPositiveHit) || faces[0];
  const activeFace = selectedFace || confirmedHit;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="biometric-modal-title"
    >
      <div
        className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0c0d11] border border-[var(--argus-border-subtle)] shadow-[0_0_60px_rgba(0,0,0,0.85)] overflow-hidden"
        style={{ boxShadow: "0 0 50px rgba(224,82,82,0.18)" }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--argus-border-subtle)] bg-[#101217]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(224,82,82,0.15)] border border-[#e05252] flex items-center justify-center text-[#e05252]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20M2 12a14.5 14.5 0 0 0 20 0" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="biometric-modal-title" className="text-sm sm:text-base font-bold font-mono tracking-wider text-white">
                  ARGUS BIOMETRIC INTEL // OPENCV FORENSIC ANALYSIS
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#e05252]/25 text-[#ff6b6b] border border-[#e05252]/50 animate-pulse">
                  1 CONFIRMED HIT (CAM 05)
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-gray-400 border border-white/10">
                  7 CLEAR PERIMETER FEEDS
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Target Profile: Male, approx 5&apos;10&quot; &bull; Light shirt, dark pants &bull; Carrying blue laptop &bull; VITS Deshmukhi Grid
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Nav Tabs */}
            <div className="hidden sm:flex bg-[#181a22] p-1 rounded-lg border border-[var(--argus-border-subtle)]">
              <button
                onClick={() => setActiveTab("faces")}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all ${
                  activeTab === "faces"
                    ? "bg-[var(--argus-amber)] text-black shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                OpenCV Face & Feeds
              </button>
              <button
                onClick={() => setActiveTab("video")}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all ${
                  activeTab === "video"
                    ? "bg-[var(--argus-amber)] text-black shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                AI Alert Video
              </button>
              <button
                onClick={() => setActiveTab("trajectory")}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all ${
                  activeTab === "trajectory"
                    ? "bg-[var(--argus-amber)] text-black shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Predicted Next Sector
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: OPENCV FORENSIC ANALYSIS */}
          {activeTab === "faces" && (
            <div className="space-y-6">
              {/* Top Banner with suspect verification */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#1c1417] via-[#14161f] to-[#101217] border border-[#e05252]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#e05252] animate-ping" />
                  <div>
                    <span className="text-[10px] font-mono text-[#ff8080] uppercase tracking-widest font-bold">
                      POSITIVE BIOMETRIC IDENTIFICATION
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Target Identified in Camera 05: Central Library & Computer Labs Stairwell
                    </h3>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-black/60 text-emerald-400 border border-emerald-500/30">
                    OpenCV 4.14 Lanczos4 Zoom
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-black/60 text-amber-400 border border-amber-500/30">
                    Asset Match: Blue Laptop
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-black/60 text-cyan-400 border border-cyan-500/30">
                    Timestamp: 14:11:05 IST
                  </span>
                </div>
              </div>

              {/* Main Forensic Inspection Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left/Main: Selected Camera View */}
                {activeFace && (
                  <div className="lg:col-span-5 flex flex-col rounded-xl bg-[#12141a] border border-[var(--argus-border)] overflow-hidden">
                    <div className="p-3 bg-[#181a24] border-b border-[var(--argus-border-subtle)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                            activeFace.isPositiveHit
                              ? "bg-[#e05252] text-white"
                              : "bg-gray-800 text-gray-300 border border-gray-700"
                          }`}
                        >
                          {activeFace.cameraId}
                        </span>
                        <span className="text-xs font-mono text-white font-semibold truncate max-w-[200px]">
                          {activeFace.cameraName}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          activeFace.isPositiveHit
                            ? "bg-red-500/20 text-[#ff8080] border border-red-500/30"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {activeFace.isPositiveHit ? "CONFIRMED HIT (96%)" : "FEED CLEAR (0 MATCHES)"}
                      </span>
                    </div>

                    {/* Image Canvas with Tactical Controls */}
                    <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
                      {/* Select which image to render for activeFace */}
                      {activeFace.isPositiveHit ? (
                        <Image
                          src={
                            cam05ViewMode === "face"
                              ? "/faces/zoom_cam_05.jpg"
                              : cam05ViewMode === "laptop"
                              ? "/faces/cam05_laptop_zoom.jpg"
                              : cam05ViewMode === "person"
                              ? "/faces/cam05_person_crop.jpg"
                              : "/faces/full_cam_05.jpg"
                          }
                          alt={activeFace.cameraName}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      ) : (
                        <Image
                          src={activeFace.fullImage}
                          alt={activeFace.cameraName}
                          fill
                          className="object-contain opacity-80"
                          unoptimized
                        />
                      )}

                      {/* HUD Overlay for Clear Feeds */}
                      {!activeFace.isPositiveHit && (
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                          <div className="w-10 h-10 rounded-full border border-emerald-500/60 flex items-center justify-center mb-2 bg-black/60">
                            <span className="text-emerald-400 text-lg">✓</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                            OPENCV SCAN: NO SUSPECT IN FEED
                          </span>
                          <p className="text-[10px] font-mono text-gray-400 mt-1 max-w-[240px]">
                            Multi-scale analysis scanned all frames. Zero biometric correlation to target profile.
                          </p>
                        </div>
                      )}

                      {/* HUD Top Left Tag */}
                      {activeFace.isPositiveHit && (
                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/85 rounded border border-[#e05252] text-[10px] font-mono text-[#ff8080] font-bold">
                          LOCK: OPENCV FACE ENHANCEMENT (LANCZOS4)
                        </div>
                      )}

                      {/* HUD Bottom Right Tag */}
                      <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 rounded border border-[var(--argus-border-subtle)] text-[10px] font-mono text-gray-300">
                        {activeFace.timestamp}
                      </div>
                    </div>

                    {/* CAM 05 Evidence Switcher */}
                    {activeFace.isPositiveHit && (
                      <div className="p-2 bg-[#101218] border-t border-[var(--argus-border-subtle)] flex gap-1 justify-around text-[10px] font-mono">
                        <button
                          onClick={() => setCam05ViewMode("face")}
                          className={`px-2 py-1 rounded transition-colors ${
                            cam05ViewMode === "face"
                              ? "bg-[var(--argus-amber)] text-black font-bold"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Face Reticle
                        </button>
                        <button
                          onClick={() => setCam05ViewMode("laptop")}
                          className={`px-2 py-1 rounded transition-colors ${
                            cam05ViewMode === "laptop"
                              ? "bg-[var(--argus-amber)] text-black font-bold"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Blue Laptop Asset
                        </button>
                        <button
                          onClick={() => setCam05ViewMode("person")}
                          className={`px-2 py-1 rounded transition-colors ${
                            cam05ViewMode === "person"
                              ? "bg-[var(--argus-amber)] text-black font-bold"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Body Silhouette
                        </button>
                        <button
                          onClick={() => setCam05ViewMode("cctv")}
                          className={`px-2 py-1 rounded transition-colors ${
                            cam05ViewMode === "cctv"
                              ? "bg-[var(--argus-amber)] text-black font-bold"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Full CCTV
                        </button>
                      </div>
                    )}

                    {/* Telemetry Footer */}
                    <div className="p-3 bg-[#151720] border-t border-[var(--argus-border-subtle)] text-xs font-mono space-y-1.5">
                      <div className="flex justify-between text-gray-300">
                        <span className="text-gray-500">Scan Status:</span>
                        <span
                          className={`font-semibold ${
                            activeFace.isPositiveHit ? "text-red-400" : "text-emerald-400"
                          }`}
                        >
                          {activeFace.statusText}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span className="text-gray-500">Physical Profile:</span>
                        <span className="text-white font-semibold">
                          {activeFace.isPositiveHit
                            ? `${activeFace.attributes.gender}, ~${activeFace.attributes.heightApprox}`
                            : "No target detected"}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span className="text-gray-500">Carrying:</span>
                        <span className={activeFace.isPositiveHit ? "text-cyan-400 font-semibold" : "text-gray-400"}>
                          {activeFace.isPositiveHit ? activeFace.attributes.carriedItem : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span className="text-gray-500">Camera Coords:</span>
                        <span className="text-gray-400">
                          {activeFace.location.lat.toFixed(4)}°N, {activeFace.location.lng.toFixed(4)}°E
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Right: Camera Grid Inspection */}
                <div className="lg:col-span-7 flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                      Surveillance Grid Feeds ({faces.length})
                    </span>
                    <span className="text-xs font-mono text-gray-500">
                      Click any feed to verify OpenCV scan
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 overflow-y-auto max-h-[480px] p-1">
                    {faces.map((face) => {
                      const isSelected = activeFace?.cameraId === face.cameraId;
                      return (
                        <div
                          key={face.cameraId}
                          onClick={() => {
                            setSelectedFace(face);
                          }}
                          className={`group relative rounded-xl bg-[#14161f] border p-2 cursor-pointer transition-all hover:scale-[1.02] ${
                            isSelected
                              ? face.isPositiveHit
                                ? "border-[#e05252] ring-2 ring-[#e05252]/50 shadow-lg bg-[#1e1316]"
                                : "border-[var(--argus-amber)] ring-2 ring-[var(--argus-amber)]/40 shadow-lg bg-[#1a1c27]"
                              : face.isPositiveHit
                              ? "border-[#e05252]/60 bg-[#160f12]"
                              : "border-[var(--argus-border)] hover:border-gray-500"
                          }`}
                        >
                          {/* Feed Thumbnail */}
                          <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-black mb-2">
                            <Image
                              src={face.isPositiveHit ? "/faces/zoom_cam_05.jpg" : face.fullImage}
                              alt={face.cameraName}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              unoptimized
                            />
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-white">
                              {face.cameraId}
                            </div>
                            <div
                              className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${
                                face.isPositiveHit
                                  ? "bg-red-500 text-white animate-pulse"
                                  : "bg-black/80 text-emerald-400"
                              }`}
                            >
                              {face.isPositiveHit ? "HIT 96%" : "CLEAR"}
                            </div>
                          </div>

                          <div className="text-[10px] font-mono font-bold text-white truncate">
                            {face.cameraName.split(":")[1]?.trim() || face.cameraName}
                          </div>
                          <div className="text-[9px] font-mono text-gray-400 mt-0.5">
                            {face.isPositiveHit ? "SUSPECT MATCHED" : "No suspect in feed"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI ALERT VIDEO */}
          {activeTab === "video" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Video Player */}
                <div className="lg:col-span-7 rounded-xl bg-black border border-[var(--argus-border)] overflow-hidden shadow-2xl">
                  <div className="p-3 bg-[#181a24] border-b border-[var(--argus-border-subtle)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#e05252] animate-pulse" />
                      <span className="text-xs font-mono font-bold text-white">
                        AI GENERATED PREDICTIVE BROADCAST
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-amber-400 border border-amber-500/30">
                      CEREBRAS + ELEVENLABS + MOVIEPY
                    </span>
                  </div>

                  <div className="relative aspect-video w-full bg-black">
                    <video
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                      src={prediction?.predictiveVideoUrl || "/videos/final_enhanced_video.mp4"}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>

                  <div className="p-3 bg-[#14161f] text-xs font-mono flex items-center justify-between text-gray-400">
                    <span>Target: Male, 5&apos;10&quot;, light shirt, carrying blue laptop</span>
                    <a
                      href={prediction?.predictiveVideoUrl || "/videos/final_enhanced_video.mp4"}
                      download="argus_predictive_alert.mp4"
                      className="text-amber-400 hover:text-amber-300 underline"
                    >
                      Download Video (MP4)
                    </a>
                  </div>
                </div>

                {/* Synthesis Telemetry and Script */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-4 rounded-xl bg-[#14161f] border border-[var(--argus-border-subtle)] space-y-3">
                    <h4 className="text-xs font-mono font-bold text-[var(--argus-amber)] uppercase tracking-wider">
                      Intelligence Synthesis Pipeline
                    </h4>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between pb-1.5 border-b border-gray-800">
                        <span className="text-gray-400">Script Engine:</span>
                        <span className="text-white font-semibold">Cerebras Qwen-2.5-72b</span>
                      </div>
                      <div className="flex justify-between pb-1.5 border-b border-gray-800">
                        <span className="text-gray-400">Voiceover Voice:</span>
                        <span className="text-white font-semibold">ElevenLabs Adam (Broadcast)</span>
                      </div>
                      <div className="flex justify-between pb-1.5 border-b border-gray-800">
                        <span className="text-gray-400">Video Stitcher:</span>
                        <span className="text-white font-semibold">MoviePy 1.0.3 + FFmpeg Static</span>
                      </div>
                      <div className="flex justify-between pb-1.5 border-b border-gray-800">
                        <span className="text-gray-400">Face Extraction:</span>
                        <span className="text-white font-semibold">OpenCV 4.14 Lanczos4 Bicubic</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Output Resolution:</span>
                        <span className="text-white font-semibold">1280x720 H.264 AAC</span>
                      </div>
                    </div>
                  </div>

                  {/* Broadcast Narration Box */}
                  <div className="p-4 rounded-xl bg-[#14161f] border border-[var(--argus-border-subtle)] space-y-2">
                    <h4 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">
                      Broadcast Alert Script
                    </h4>
                    <p className="text-xs text-gray-300 font-sans leading-relaxed italic bg-black/40 p-3 rounded-lg border border-gray-800">
                      &quot;Today on ARGUS Alerts, we report a critical security incident at Vignan Institute of Technology and Science, Deshmukhi. The suspect was captured on Camera 05 leaving the library stairwell, carrying a blue laptop. Movement tracking projects the individual heading south-east towards the Batasingaram Highway Corridor. Please exercise caution and report any sightings immediately.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PREDICTED NEXT SECTOR */}
          {activeTab === "trajectory" && prediction && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#14161f] border border-[#e05252]/40">
                  <div className="text-[10px] font-mono text-[#ff8080] uppercase font-bold">Confirmed Sighting (CAM 05)</div>
                  <div className="text-base font-bold text-white mt-1">{prediction.lastSeenCamera}</div>
                  <div className="text-xs font-mono text-amber-400 mt-1">{prediction.lastSeenTime}</div>
                </div>

                <div className="p-4 rounded-xl bg-[#14161f] border border-[var(--argus-border)]">
                  <div className="text-[10px] font-mono text-gray-400 uppercase">Movement Vector</div>
                  <div className="text-base font-bold text-white mt-1">Heading {prediction.trajectoryHeadingDegrees}° (South-East)</div>
                  <div className="text-xs font-mono text-gray-300 mt-1">Velocity: ~{prediction.speedMps} m/s (Brisk walk)</div>
                </div>

                <div className="p-4 rounded-xl bg-[#14161f] border border-[var(--argus-border)] border-[#e05252]/50 shadow-[0_0_20px_rgba(224,82,82,0.15)]">
                  <div className="text-[10px] font-mono text-[#e05252] font-bold uppercase">Intercept Probability</div>
                  <div className="text-2xl font-bold text-[#e05252] mt-1">{Math.round(prediction.predictedLocation.probability * 100)}%</div>
                  <div className="text-xs font-mono text-gray-300 mt-1">ETA: {prediction.predictedLocation.etaMinutes} minutes</div>
                </div>
              </div>

              {/* Next Sector Details Card */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-[#161822] to-[#0f1015] border border-[var(--argus-border)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono text-[var(--argus-amber)] font-bold tracking-widest uppercase">
                      PREDICTED NEXT INTERCEPT ZONE
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                      {prediction.predictedLocation.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded bg-[#e05252]/20 text-[#e05252] font-mono font-bold text-xs border border-[#e05252]/40">
                      RADIUS: {prediction.predictedLocation.uncertaintyRadiusMeters}m
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-300 leading-relaxed">
                  {prediction.predictedLocation.sectorDescription}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-black/50 border border-gray-800">
                    <div className="text-gray-500">Target Coordinates</div>
                    <div className="text-white font-bold mt-0.5">
                      {prediction.predictedLocation.lat.toFixed(4)}°N, {prediction.predictedLocation.lng.toFixed(4)}°E
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-black/50 border border-gray-800">
                    <div className="text-gray-500">Jurisdiction Mandal</div>
                    <div className="text-white font-bold mt-0.5">Pochampally / Batasingaram</div>
                  </div>
                  <div className="p-3 rounded-lg bg-black/50 border border-gray-800">
                    <div className="text-gray-500">Primary Highway</div>
                    <div className="text-white font-bold mt-0.5">NH-65 (Hyderabad-Vijayawada)</div>
                  </div>
                  <div className="p-3 rounded-lg bg-black/50 border border-gray-800">
                    <div className="text-gray-500">Recommended Action</div>
                    <div className="text-amber-400 font-bold mt-0.5">Deploy Batasingaram Checkpoint</div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToPredicted?.();
                    }}
                    className="btn btn-accent px-5 py-2.5 text-xs font-mono font-bold flex items-center gap-2"
                  >
                    <span>View Predictive Sector on Tactical Map</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[var(--argus-border-subtle)] bg-[#101217] flex items-center justify-between text-xs font-mono text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>OpenCV 4.14 Pipeline Active // True Multi-Camera Analysis</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
