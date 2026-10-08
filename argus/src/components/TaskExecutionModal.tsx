"use client";

import React, { useState, useEffect, useCallback } from "react";
import ResultsGallery from "./ResultsGallery";

interface TaskExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  videoFiles: File[];
  suspectNotes: string;
}

export default function TaskExecutionModal({
  isOpen,
  onClose,
  selectedCount,
  videoFiles,
  suspectNotes,
}: TaskExecutionModalProps) {
  const [progress, setProgress] = useState(0);
  const [currentStatusText, setCurrentStatusText] = useState("");
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [scanningVideo, setScanningVideo] = useState(0);
  const [completedVideos, setCompletedVideos] = useState<Set<number>>(new Set());

  const phases = [
    "Initializing Neural Vision Pipeline…",
    "Invoking Vision Language Model (VLM)…",
    "Running Cross-Camera Semantic Match…",
    "Analyzing Facial Biometrics & Apparel…",
    "Reconstructing Pixels via E²FGVI Algorithm…",
    "Synthesizing Multi-Camera Temporal Matrix…",
    "Computing Confidence Distributions…",
    "Finalizing Surveillance Intel…",
  ];

  const startAgentSwarm = useCallback(async () => {
    try {
      const formData = new FormData();
      formData.append("action", "start");
      formData.append("suspectNotes", suspectNotes);

      videoFiles.forEach((file, index) => {
        formData.append(`video-${index}`, file);
      });

      const response = await fetch("/api/agent-swarm", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to start agent swarm");
      }

      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch("/api/agent-swarm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "status" }),
          });

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            setProgress(statusData.progress);

            if (statusData.progress < 100) {
              if (currentPhase < phases.length - 1) {
                setCurrentStatusText(phases[currentPhase]);
              } else {
                setCurrentStatusText("Finalizing neural network analysis…");
              }
            } else {
              setCurrentStatusText("Surveillance analysis complete.");
              setIsAnalysisComplete(true);
              clearInterval(pollInterval);
            }
          }
        } catch (error) {
          console.error("Error polling status:", error);
        }
      }, 1000);

      return () => clearInterval(pollInterval);
    } catch (error) {
      console.error("Error starting agent swarm:", error);
      setCurrentStatusText("Analysis initialization failed");
    }
  }, [videoFiles, suspectNotes, currentPhase, phases]);

  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      setCurrentStatusText(phases[0]);
      setCurrentPhase(0);
      setScanningVideo(0);
      setCompletedVideos(new Set());

      const phaseInterval = setInterval(() => {
        setCurrentPhase((prev) => {
          const next = prev + 1;
          if (next < phases.length) {
            setCurrentStatusText(phases[next]);
            return next;
          } else {
            clearInterval(phaseInterval);
            return prev;
          }
        });
      }, 2200);

      let currentVideoIndex = 0;
      const videoInterval = setInterval(() => {
        if (currentVideoIndex < videoFiles.length) {
          setScanningVideo(currentVideoIndex);
          if (currentVideoIndex > 0) {
            setCompletedVideos((prev) => new Set([...prev, currentVideoIndex - 1]));
          }
          currentVideoIndex++;
        } else {
          setCompletedVideos((prev) => new Set([...prev, currentVideoIndex - 1]));
          clearInterval(videoInterval);
        }
      }, 1400);

      setIsAnalysisComplete(false);
      startAgentSwarm();

      return () => {
        clearInterval(phaseInterval);
        clearInterval(videoInterval);
      };
    }
  }, [isOpen, selectedCount, videoFiles, suspectNotes, startAgentSwarm]);

  if (!isOpen) return null;

  return (
    <div
      className="argus-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="ARGUS Surveillance Execution Matrix"
    >
      <div
        className="argus-modal w-[94vw] max-w-6xl max-h-[92vh] flex flex-col"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--argus-border)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.8), 0 0 1px 1px rgba(255,255,255,0.06)",
        }}
      >
        {/* Header */}
        <div
          className="argus-modal-header px-6 py-4 border-b shrink-0 flex items-center justify-between"
          style={{ borderColor: "var(--argus-border-subtle)" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "var(--argus-amber-muted)",
                border: "1px solid rgba(200, 130, 46, 0.35)",
                color: "var(--argus-amber)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" opacity="0.35" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  className="text-base font-bold tracking-wider uppercase font-mono"
                  style={{ color: "var(--text-primary)" }}
                >
                  ARGUS Operations Matrix
                </h2>
                <span className="badge badge-amber text-[10px]">
                  <span className="pulse-dot pulse-dot--amber mr-1" />
                  ACTIVE SWARM
                </span>
              </div>
              <p
                className="text-xs font-mono"
                style={{ color: "var(--text-tertiary)" }}
              >
                {videoFiles.length} Camera Feed{videoFiles.length !== 1 ? "s" : ""} · {selectedCount} Surveillance Node{selectedCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-icon"
            aria-label="Close operations matrix"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Progress / Status Strip */}
          <div
            className="p-4 rounded-xl flex items-center justify-between"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--argus-border-subtle)",
            }}
          >
            <div className="flex items-center gap-3">
              <span className="pulse-dot pulse-dot--amber" />
              <div>
                <span
                  className="text-xs font-mono font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {currentStatusText || "Executing swarm protocol…"}
                </span>
                <p
                  className="text-[10px] font-mono"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Phase {currentPhase + 1} of {phases.length}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span
                className="text-lg font-mono font-bold"
                style={{ color: "var(--argus-amber)" }}
              >
                {Math.round(progress)}%
              </span>
              <p
                className="text-[10px] uppercase font-mono tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                {isAnalysisComplete ? "COMPLETE" : "SYNCHRONIZING"}
              </p>
            </div>
          </div>

          {/* Video Scanning Grid */}
          {!isAnalysisComplete && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-mono uppercase tracking-wider font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  LIVE SURVEILLANCE FEEDS ({videoFiles.length})
                </span>
                <span
                  className="text-[10px] font-mono"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Click feed to inspect
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {videoFiles.map((file, index) => {
                  const videoUrl = (file as any).publicPath || `/videos/${file.name}`;
                  const isCurrentlyScanning = index === scanningVideo;
                  const isCompleted = completedVideos.has(index);
                  const fileName = file.name.split("/").pop()?.replace(/\.[^/.]+$/, "") || file.name;

                  return (
                    <div
                      key={index}
                      className="group relative rounded-xl overflow-hidden transition-all duration-300"
                      style={{
                        background: "var(--bg-elevated)",
                        border: isCurrentlyScanning
                          ? "1.5px solid var(--argus-amber)"
                          : isCompleted
                          ? "1.5px solid var(--argus-success)"
                          : "1px solid var(--argus-border-subtle)",
                        boxShadow: isCurrentlyScanning
                          ? "0 0 15px rgba(200, 130, 46, 0.3)"
                          : "none",
                      }}
                    >
                      <div className="relative aspect-video bg-black/60 overflow-hidden">
                        <video
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                          poster={`${videoUrl}#t=1`}
                          onClick={(e) => {
                            const video = e.target as HTMLVideoElement;
                            if (video.paused) video.play();
                            else video.pause();
                          }}
                        >
                          <source src={videoUrl} type="video/mp4" />
                        </video>

                        {/* Scanner HUD Overlay */}
                        {isCurrentlyScanning && (
                          <div className="absolute inset-0 pointer-events-none">
                            <div
                              className="absolute w-full h-0.5 bg-amber-400 opacity-80"
                              style={{
                                top: "50%",
                                animation: "scanline 1.8s ease-in-out infinite alternate",
                                boxShadow: "0 0 8px #c8822e",
                              }}
                            />
                            <div className="absolute top-1 left-1 w-2.5 h-2.5 border-l-2 border-t-2 border-amber-400" />
                            <div className="absolute top-1 right-1 w-2.5 h-2.5 border-r-2 border-t-2 border-amber-400" />
                            <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-l-2 border-b-2 border-amber-400" />
                            <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-r-2 border-b-2 border-amber-400" />
                          </div>
                        )}

                        {/* Status badge */}
                        <div className="absolute top-1.5 left-1.5">
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase"
                            style={{
                              background: isCurrentlyScanning
                                ? "rgba(200, 130, 46, 0.9)"
                                : isCompleted
                                ? "rgba(46, 160, 67, 0.9)"
                                : "rgba(0, 0, 0, 0.65)",
                              color: "#fff",
                            }}
                          >
                            {isCurrentlyScanning ? "SCANNING" : isCompleted ? "PARSED" : "QUEUED"}
                          </span>
                        </div>
                      </div>

                      {/* Card label */}
                      <div className="p-2 flex items-center justify-between">
                        <span
                          className="text-[11px] font-mono font-medium truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {fileName}
                        </span>
                        <span
                          className="text-[9px] font-mono"
                          style={{
                            color: isCurrentlyScanning
                              ? "var(--argus-amber)"
                              : isCompleted
                              ? "var(--argus-success)"
                              : "var(--text-tertiary)",
                          }}
                        >
                          {isCurrentlyScanning ? "BUSY" : isCompleted ? "OK" : "IDLE"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Results Gallery Component */}
          {isAnalysisComplete && (
            <div className="pt-2">
              <ResultsGallery suspectNotes={suspectNotes} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="argus-modal-footer px-6 py-3 border-t shrink-0 flex items-center justify-between"
          style={{ borderColor: "var(--argus-border-subtle)" }}
        >
          <span
            className="text-xs font-mono"
            style={{ color: "var(--text-tertiary)" }}
          >
            {isAnalysisComplete ? "Analysis complete · Telemetry stored" : "Neural models processing stream chunks…"}
          </span>

          <button
            className="btn btn-primary"
            onClick={onClose}
          >
            {isAnalysisComplete ? "Close Intel View" : "Minimize to Background"}
          </button>
        </div>
      </div>
    </div>
  );
}
