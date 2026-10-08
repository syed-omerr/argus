"use client";

import React, { useState, useEffect } from "react";

interface ResultsGalleryProps {
  suspectNotes: string;
}

interface DetectionResult {
  videoName: string;
  detected: boolean;
  confidence: number;
  videoSnippet?: string;
  matchingFrames?: string[];
  cameraId?: string;
  timestamp?: string;
  locationName?: string;
}

export default function ResultsGallery({ suspectNotes }: ResultsGalleryProps) {
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<number | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await fetch("/api/agent-swarm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "results" }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--argus-border-subtle)",
        }}
        aria-live="polite"
      >
        <div
          className="w-10 h-10 border-2 rounded-full border-t-transparent animate-spin mb-4"
          style={{
            borderColor: "var(--argus-amber)",
            borderTopColor: "transparent",
          }}
        />
        <p
          className="text-xs uppercase tracking-wider font-mono font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Aggregating Target Matches…
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div
        className="text-center py-12 px-6 rounded-2xl"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--argus-border-subtle)",
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--argus-border-subtle)",
            color: "var(--text-tertiary)",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </div>
        <h3
          className="text-sm font-semibold tracking-wide uppercase mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          No Suspect Matches Detected
        </h3>
        <p
          className="text-xs max-w-md mx-auto"
          style={{ color: "var(--text-tertiary)" }}
        >
          Neural analysis completed across feeds with zero high-confidence matches for: &ldquo;{suspectNotes}&rdquo;
        </p>
      </div>
    );
  }

  const detectedMatches = results.filter((r) => r.detected);

  return (
    <div className="space-y-6">
      {/* Detection Banner */}
      <div
        className="p-4 rounded-xl flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, rgba(224, 82, 82, 0.12), rgba(200, 130, 46, 0.08))",
          border: "1px solid rgba(224, 82, 82, 0.35)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "var(--argus-alert)",
              color: "#fff",
              boxShadow: "0 0 16px rgba(224, 82, 82, 0.4)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-white">
              Target Match Identified across {detectedMatches.length} Feed{detectedMatches.length === 1 ? "" : "s"}
            </h3>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              VLM visual scoring threshold exceeded with verifiable telemetry.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge badge-alert">
            <span className="pulse-dot pulse-dot--red mr-1" />
            LIVE TELEMETRY
          </span>
        </div>
      </div>

      {/* Grid of Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((result, index) => {
          const confidencePct = Math.round(result.confidence > 1 ? result.confidence : result.confidence * 100);
          const isHighConf = confidencePct >= 75;
          const isMidConf = confidencePct >= 40 && confidencePct < 75;

          return (
            <div
              key={index}
              className="group relative rounded-xl overflow-hidden transition-all duration-300"
              style={{
                background: "var(--bg-card)",
                border: result.detected
                  ? "1px solid rgba(224, 82, 82, 0.45)"
                  : "1px solid var(--argus-border-subtle)",
                boxShadow: result.detected
                  ? "0 4px 20px rgba(224, 82, 82, 0.15)"
                  : "none",
              }}
            >
              {/* Video container */}
              <div className="relative aspect-video bg-black/60 overflow-hidden">
                {result.videoSnippet ? (
                  <video
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                    muted
                    preload="metadata"
                    onPlay={() => setActiveVideo(index)}
                  >
                    <source
                      src={`data:video/mp4;base64,${result.videoSnippet}`}
                      type="video/mp4"
                    />
                    Your browser does not support HTML5 video.
                  </video>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      style={{ color: "var(--text-disabled)", marginBottom: 6 }}
                    >
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                    <span
                      className="text-xs font-mono"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Snippet Pending
                    </span>
                  </div>
                )}

                {/* Tactical HUD Overlay elements */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
                  {result.detected ? (
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase"
                      style={{
                        background: "rgba(224, 82, 82, 0.9)",
                        color: "#fff",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      MATCH DETECTED
                    </span>
                  ) : (
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase"
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        color: "var(--text-secondary)",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      NEGATIVE
                    </span>
                  )}
                </div>

                <div className="absolute top-2.5 right-2.5 pointer-events-none">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                    style={{
                      background: isHighConf
                        ? "rgba(224, 82, 82, 0.85)"
                        : isMidConf
                        ? "rgba(200, 130, 46, 0.85)"
                        : "rgba(0, 0, 0, 0.75)",
                      color: "#fff",
                      backdropFilter: "blur(4px)",
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    {confidencePct}% CONF
                  </span>
                </div>

                {/* Scanline line overlay */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    background:
                      "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.6) 2px, rgba(0,0,0,0.6) 4px)",
                  }}
                />
              </div>

              {/* Card Meta Footer */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-mono font-semibold truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {result.videoName}
                  </span>
                  {result.cameraId && (
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--argus-amber)",
                        border: "1px solid var(--argus-border-subtle)",
                      }}
                    >
                      {result.cameraId}
                    </span>
                  )}
                </div>

                {/* Confidence Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>
                    <span>Vector Similarity</span>
                    <span>{confidencePct}%</span>
                  </div>
                  <div
                    className="w-full h-1 rounded-full overflow-hidden"
                    style={{ background: "rgba(255, 255, 255, 0.08)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${confidencePct}%`,
                        background: isHighConf
                          ? "var(--argus-alert)"
                          : isMidConf
                          ? "var(--argus-amber)"
                          : "var(--text-tertiary)",
                      }}
                    />
                  </div>
                </div>

                {/* Additional frames thumbnails if available */}
                {result.matchingFrames && result.matchingFrames.length > 0 && (
                  <div className="pt-2 border-t border-[var(--argus-border-subtle)]">
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)] block mb-1">
                      EXTRACTED KEYFRAMES ({result.matchingFrames.length})
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {result.matchingFrames.map((frame, fIdx) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={fIdx}
                          src={frame}
                          alt={`Keyframe ${fIdx + 1}`}
                          className="h-10 w-14 object-cover rounded border border-[var(--argus-border-subtle)] shrink-0 hover:scale-105 transition-transform"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
