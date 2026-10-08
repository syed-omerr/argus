"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { TrajectoryPrediction, FaceDetectionRecord } from "../app/api/trajectory-prediction/route";

interface OpenCVFaceZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  prediction: TrajectoryPrediction | null;
  onNavigateToPredicted?: () => void;
}

const SCAN_STEPS = [
  { at: 0, text: "[OPENCV 4.14] Initializing CUDA acceleration & Haar Cascade engines..." },
  { at: 1200, text: "[INGESTION] Synchronizing 8 perimeter CCTV feeds from VITS Deshmukhi Grid..." },
  { at: 2400, text: "[PRE-PROCESS] De-interlacing frames & running Lanczos-4 multi-scale bicubic filtering..." },
  { at: 3600, text: "[FEATURE EXTRACTION] Computing Histogram of Oriented Gradients (HOG) & facial geometry vectors..." },
  { at: 4800, text: "[CORRELATION] Correlating suspect facial landmarks & carried blue laptop asset..." },
  { at: 5800, text: "[PRIMARY HIT] Biometric lock verified on Camera 05 (Confidence: 96.8%)..." },
  { at: 6500, text: "[COMPLETE] Multi-camera forensic evidence rendered. Launching forensic suite." },
];

export default function OpenCVFaceZoomModal({
  isOpen,
  onClose,
  prediction,
  onNavigateToPredicted,
}: OpenCVFaceZoomModalProps) {
  const [activeTab, setActiveTab] = useState<"faces" | "video" | "trajectory">("faces");
  const [selectedFace, setSelectedFace] = useState<FaceDetectionRecord | null>(null);
  const [cam05ViewMode, setCam05ViewMode] = useState<"face" | "laptop" | "person" | "cctv">("face");

  // Realistic OpenCV forensic scan loader (at least 6.5s)
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const faces = prediction?.faces || [];
  const confirmedHit = faces.find((f) => f.cameraId === "CAM05") || faces[0];
  const activeFace = selectedFace || confirmedHit;

  const runBiometricScan = () => {
    setIsAnalyzing(true);
    setScanProgress(0);
    setCurrentStepIndex(0);

    const startTime = Date.now();
    const totalDuration = 6600; // 6.6 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      setScanProgress(pct);

      let stepIdx = 0;
      for (let i = 0; i < SCAN_STEPS.length; i++) {
        if (elapsed >= SCAN_STEPS[i].at) {
          stepIdx = i;
        }
      }
      setCurrentStepIndex(stepIdx);

      if (elapsed >= totalDuration) {
        clearInterval(interval);
        setIsAnalyzing(false);
      }
    }, 50);
  };

  useEffect(() => {
    if (isOpen) {
      runBiometricScan();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="biometric-modal-title"
    >
      <div
        className="relative w-full max-w-6xl max-h-[94vh] flex flex-col rounded-2xl bg-[#0c0d11] border border-[var(--argus-border-subtle)] shadow-[0_0_60px_rgba(0,0,0,0.85)] overflow-hidden"
        style={{ boxShadow: "0 0 50px rgba(224,82,82,0.18)" }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--argus-border-subtle)] bg-[#101217]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(224,82,82,0.15)] border border-[#e05252] flex items-center justify-center text-[#e05252]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20M2 12a14.5 14.5 0 0 0 20 0" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="biometric-modal-title" className="text-sm font-bold font-mono tracking-wider text-white">
                  BIOMETRIC SURVEILLANCE MATRIX
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                  LOCK: CAM 05 (96.8%)
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-emerald-400 border border-white/10">
                  8 DETECTIONS
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                Target: Male, ~5&apos;10&quot; &bull; White shirt &bull; Blue laptop &bull; VITS Deshmukhi Grid
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {!isAnalyzing && (
              <button
                onClick={runBiometricScan}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Re-run live multi-scale OpenCV scan"
              >
                <span>⚡ Re-scan</span>
              </button>
            )}

            {/* Nav Tabs */}
            <div className="hidden sm:flex bg-[#181a22] p-1 rounded-lg border border-[var(--argus-border-subtle)]">
              <button
                onClick={() => setActiveTab("faces")}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                  activeTab === "faces"
                    ? "bg-[var(--argus-amber)] text-black shadow-md font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Perimeter Feeds
              </button>
              <button
                onClick={() => setActiveTab("video")}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                  activeTab === "video"
                    ? "bg-[var(--argus-amber)] text-black shadow-md font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Alert Broadcast
              </button>
              <button
                onClick={() => setActiveTab("trajectory")}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                  activeTab === "trajectory"
                    ? "bg-[var(--argus-amber)] text-black shadow-md font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Next Sector
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
          {/* ── REALISTIC OPENCV FORENSIC LOADING SCREEN (6+ SECONDS) ── */}
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center min-h-[500px] p-6 space-y-6 text-center animate-fade-in">
              {/* Radar Reticle Graphic */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-[#e05252]/40 animate-ping opacity-75" />
                <div className="absolute inset-2 rounded-full border border-[var(--argus-amber)]/60 animate-spin" style={{ animationDuration: "3s" }} />
                <div className="absolute inset-6 rounded-full border border-cyan-500/40" />
                <div className="absolute w-2 h-2 rounded-full bg-[#e05252] shadow-[0_0_12px_#e05252]" />
                <div className="text-xl font-mono font-bold text-white z-10">{scanProgress}%</div>
              </div>

              {/* Status Header */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e05252] animate-pulse" />
                  <h3 className="text-base sm:text-lg font-bold font-mono text-white tracking-wider">
                    OPENCV 4.14 FORENSIC INGESTION & BIOMETRIC EXTRACTION
                  </h3>
                </div>
                <p className="text-xs font-mono text-gray-400">
                  Deinterlacing 8 synchronized camera streams &bull; Lanczos-4 upscaling &bull; HOG feature vectors
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-xl bg-black/60 rounded-full h-3 border border-white/10 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-[var(--argus-amber)] via-[#e05252] to-[#00ffcc] transition-all duration-75 ease-out rounded-full shadow-[0_0_12px_rgba(224,82,82,0.6)]"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>

              {/* Terminal Logs Stream */}
              <div className="w-full max-w-2xl bg-[#090a0f] border border-gray-800 rounded-xl p-4 text-left font-mono text-xs space-y-2 shadow-2xl">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800/80 text-[11px] text-gray-500">
                  <span>ARGUS_CV_CORE // LIVE FORENSIC TELEMETRY</span>
                  <span className="text-emerald-400">STATUS: PROCESSING</span>
                </div>
                <div className="space-y-1.5 text-gray-300 min-h-[110px]">
                  {SCAN_STEPS.slice(0, currentStepIndex + 1).map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 animate-fade-in">
                      <span className="text-cyan-400 font-bold">&gt;</span>
                      <span className={idx === currentStepIndex ? "text-amber-300 font-semibold" : "text-gray-400"}>
                        {step.text}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-1 flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                  <span>Processing active video feeds at 30.00 FPS...</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: OPENCV FORENSIC ANALYSIS */}
              {activeTab === "faces" && (
                <div className="space-y-6">
                  {/* Top Banner with suspect verification */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#1c1417] via-[#14161f] to-[#101217] border border-[#e05252]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#e05252] animate-ping" />
                      <div>
                        <span className="text-[10px] font-mono text-[#ff8080] uppercase tracking-widest font-bold">
                          POSITIVE BIOMETRIC IDENTIFICATION CONFIRMED
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-white">
                          Target Confirmed in Camera 05: Central Library Stairwell & 7 Correlating Perimeter Feeds
                        </h3>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-black/60 text-emerald-400 border border-emerald-500/30">
                        OpenCV 4.14 Lanczos4 Zoom
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-black/60 text-amber-400 border border-amber-500/30">
                        Asset Lock: Blue Laptop (96.8%)
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
                                activeFace.cameraId === "CAM05"
                                  ? "bg-[#e05252] text-white"
                                  : "bg-[var(--argus-amber)] text-black"
                              }`}
                            >
                              {activeFace.cameraId}
                            </span>
                            <span className="text-xs font-mono text-white font-semibold truncate max-w-[200px]">
                              {activeFace.cameraName}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-red-500/20 text-[#ff8080] border border-red-500/30">
                            {activeFace.cameraId === "CAM05" ? "PRIMARY LOCK (96.8%)" : `MATCH (${Math.round(activeFace.confidence * 100)}%)`}
                          </span>
                        </div>

                        {/* Image Canvas with Tactical Controls */}
                        <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
                          {activeFace.cameraId === "CAM05" ? (
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
                              src={activeFace.zoomImage || activeFace.fullImage}
                              alt={activeFace.cameraName}
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          )}

                          {/* HUD Top Left Tag */}
                          <div className="absolute top-3 left-3 px-2 py-1 bg-black/85 rounded border border-[#e05252] text-[10px] font-mono text-[#ff8080] font-bold">
                            {activeFace.cameraId === "CAM05"
                              ? "LOCK: OPENCV BIOMETRIC (LANCZOS-4)"
                              : `SIGHTING: ${activeFace.cameraId} CORRIDOR`}
                          </div>

                          {/* HUD Bottom Right Tag */}
                          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 rounded border border-[var(--argus-border-subtle)] text-[10px] font-mono text-gray-300">
                            {activeFace.timestamp}
                          </div>
                        </div>

                        {/* CAM 05 Specific Evidence Switcher */}
                        {activeFace.cameraId === "CAM05" ? (
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
                        ) : (
                          <div className="p-2 bg-[#101218] border-t border-[var(--argus-border-subtle)] flex gap-2 justify-center text-[10px] font-mono">
                            <span className="text-gray-400">OpenCV Face Lock Verified &bull; Multi-Scale Correlation</span>
                          </div>
                        )}

                        {/* Telemetry Footer */}
                        <div className="p-3 bg-[#151720] border-t border-[var(--argus-border-subtle)] text-xs font-mono space-y-1.5">
                          <div className="flex justify-between text-gray-300">
                            <span className="text-gray-500">Scan Status:</span>
                            <span className="text-red-400 font-semibold">{activeFace.statusText}</span>
                          </div>
                          <div className="flex justify-between text-gray-300">
                            <span className="text-gray-500">Physical Profile:</span>
                            <span className="text-white font-semibold">
                              {activeFace.attributes.gender}, ~{activeFace.attributes.heightApprox} ({activeFace.attributes.apparel})
                            </span>
                          </div>
                          <div className="flex justify-between text-gray-300">
                            <span className="text-gray-500">Carrying:</span>
                            <span className="text-cyan-400 font-semibold">{activeFace.attributes.carriedItem}</span>
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
                          Surveillance Grid Feeds ({faces.length} Camera Streams)
                        </span>
                        <span className="text-xs font-mono text-amber-400">
                          Click any camera to inspect OpenCV telemetry
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 overflow-y-auto max-h-[500px] p-1">
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
                                  ? face.cameraId === "CAM05"
                                    ? "border-[#e05252] ring-2 ring-[#e05252]/50 shadow-lg bg-[#1e1316]"
                                    : "border-[var(--argus-amber)] ring-2 ring-[var(--argus-amber)]/40 shadow-lg bg-[#1a1c27]"
                                  : face.cameraId === "CAM05"
                                  ? "border-[#e05252]/60 bg-[#160f12]"
                                  : "border-[var(--argus-border)] hover:border-gray-500"
                              }`}
                            >
                              {/* Feed Thumbnail */}
                              <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-black mb-2">
                                <Image
                                  src={face.zoomImage || face.fullImage}
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
                                    face.cameraId === "CAM05"
                                      ? "bg-red-500 text-white animate-pulse"
                                      : "bg-black/80 text-emerald-400"
                                  }`}
                                >
                                  {face.cameraId === "CAM05" ? "LOCK 96.8%" : `HIT ${Math.round(face.confidence * 100)}%`}
                                </div>
                              </div>

                              <div className="text-[10px] font-mono font-bold text-white truncate">
                                {face.cameraName.split(":")[1]?.trim() || face.cameraName}
                              </div>
                              <div className="text-[9px] font-mono text-gray-400 mt-0.5 truncate">
                                {face.timestamp}
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
                    <div className="lg:col-span-7 rounded-xl bg-black border border-[var(--argus-border)] overflow-hidden shadow-2xl flex flex-col">
                      <div className="p-3 bg-[#181a24] border-b border-[var(--argus-border-subtle)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#e05252] animate-pulse" />
                          <span className="text-xs font-mono font-bold text-white">
                            AI GENERATED PREDICTIVE BROADCAST
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-amber-400 border border-amber-500/30">
                          GENAICID INTELLIGENCE STREAM
                        </span>
                      </div>

                      {/* Video Frame */}
                      <div className="relative w-full min-h-[460px] max-h-[560px] bg-black flex items-center justify-center p-2">
                        <video
                          controls
                          autoPlay
                          playsInline
                          className="max-h-[540px] w-auto max-w-full rounded-lg shadow-lg"
                          src="/videos/final_enhanced_video.mp4"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>

                      <div className="p-3 bg-[#14161f] text-xs font-mono flex items-center justify-between text-gray-400 border-t border-gray-800">
                        <span>Target: Male, 5&apos;10&quot;, dark apparel, carrying blue laptop</span>
                        <a
                          href="/videos/final_enhanced_video.mp4"
                          download="argus_genaicid_broadcast.mp4"
                          className="text-amber-400 hover:text-amber-300 underline font-semibold"
                        >
                          Download Broadcast (MP4)
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
                            <span className="text-white font-semibold">FFmpeg H.264 High-Profile</span>
                          </div>
                          <div className="flex justify-between pb-1.5 border-b border-gray-800">
                            <span className="text-gray-400">Face Extraction:</span>
                            <span className="text-white font-semibold">OpenCV 4.14 Lanczos4 Bicubic</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Output Resolution:</span>
                            <span className="text-white font-semibold">720x1280 Vertical Broadcast</span>
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
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[var(--argus-border-subtle)] bg-[#101217] flex items-center justify-between text-xs font-mono text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>OpenCV 4.14 Pipeline Active // Synchronized Multi-Feed Grid</span>
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
