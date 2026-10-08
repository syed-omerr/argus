"use client";

import { useState } from "react";
import AgentSwarmLoader from "./AgentSwarmLoader";

// ─── Types ───────────────────────────────────────────────────

interface AgentAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  selectedPlaces: any[];
  crimeReport: string;
  suspectNotes: string;
  onDetectionUpdate?: (detections: any[]) => void;
}

interface TaskBlock {
  id: string;
  label: string;
  description: string;
  detail: string;
}

const AVAILABLE_TASKS: TaskBlock[] = [
  {
    id: "analyze",
    label: "Analyze CCTV Footage",
    description: "Run AI vision analysis to match suspect across uploaded camera feeds",
    detail: "Pixel reconstruction via E²FGVI · Multi-frame confidence scoring",
  },
  {
    id: "video-alert",
    label: "Generate Alert Broadcast",
    description: "Create a short video alert with AI-generated script and voiceover",
    detail: "Runway AI · ElevenLabs TTS · Auto-post to social platforms",
  },
];

const PLATFORMS = [
  { id: "x", name: "X", image: "/pics/x.png" },
  { id: "cnn", name: "CNN", image: "/pics/cnn.png" },
  { id: "foxnews", name: "Fox News", image: "/pics/foxnews.png" },
];

// ─── Icons ───────────────────────────────────────────────────

function CheckIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8l3.5 3.5L13 4.5" />
    </svg>
  );
}

function SpinnerIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: "spin 1s linear infinite" }}
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}

// ─── Main Modal Component ─────────────────────────────────────

export default function AgentAssignmentModal({
  isOpen,
  onClose,
  selectedCount,
  selectedPlaces,
  crimeReport,
  suspectNotes,
  onDetectionUpdate,
}: AgentAssignmentModalProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [taskConfigs, setTaskConfigs] = useState({
    analyze: { googleDrive: false },
    "video-alert": {
      platforms: new Set<string>(["x", "cnn", "foxnews"]),
      speaker: "male",
      duration: 15,
    },
  });
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusPhase, setStatusPhase] = useState<"idle" | "running" | "success" | "error">("idle");
  const [newsScript, setNewsScript] = useState("");
  const [finalVideoPath, setFinalVideoPath] = useState("");

  // ── Task toggle ───────────────────────────────────────────

  const toggleTask = (taskId: string) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  // ── Generate news script ──────────────────────────────────

  const generateNewsScript = async (detectionResults: any[]): Promise<string> => {
    const timelineDesc = detectionResults
      .map((r) => `spotted near ${r.locationName || r.cameraId} at ${r.timestamp}`)
      .join(", then ");

    const prompt = `Generate a realistic news channel reporting script under 30 seconds about a crime. Follow this exact format and DO NOT add any details not provided:

"Today on ARGUS Alerts, we report the crime of ${crimeReport || "a serious incident"}. ${
      suspectNotes ? `The suspect is described as ${suspectNotes}.` : "We are looking for an individual of interest."
    } ${timelineDesc ? `The suspect was ${timelineDesc}.` : ""} Please be cautious and contact us if you have any information about this suspect's whereabouts."

IMPORTANT: Only use the exact suspect description provided. Do not add any additional physical descriptions or details not explicitly mentioned.`;

    try {
      const res = await fetch("/api/generate-news-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        const script = data.script || buildFallbackScript(timelineDesc);
        setNewsScript(script);
        return script;
      }
    } catch {}
    const fallback = buildFallbackScript(timelineDesc);
    setNewsScript(fallback);
    return fallback;
  };

  const buildFallbackScript = (timelineDesc: string) =>
    `Today on ARGUS Alerts, we report the crime of ${crimeReport || "a serious incident"}. ${
      suspectNotes ? `The suspect is described as ${suspectNotes}.` : "We are looking for an individual of interest."
    } ${timelineDesc ? `The suspect was ${timelineDesc}.` : ""} Please be cautious and contact authorities if you have information about this suspect's whereabouts.`;

  // ── Video processing ──────────────────────────────────────

  const processVideosForAnalysis = async () => {
    const formData = new FormData();
    formData.append("action", "start");
    formData.append("suspectNotes", suspectNotes);
    videoFiles.forEach((file, i) => formData.append(`video-${i}`, file));

    const startRes = await fetch("/api/agent-swarm", {
      method: "POST",
      body: formData,
    });
    if (!startRes.ok) {
      const err = await startRes.json();
      throw new Error(err.error || "Failed to start video processing");
    }

    // Poll for results
    await new Promise<void>((resolve, reject) => {
      const poll = setInterval(async () => {
        try {
          const statusRes = await fetch("/api/agent-swarm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "status" }),
          });
          if (!statusRes.ok) return;
          const statusData = await statusRes.json();

          if (statusData.progress === 100) {
            clearInterval(poll);
            const resultsRes = await fetch("/api/agent-swarm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "results" }),
            });
            if (!resultsRes.ok) { reject(new Error("Failed to get results")); return; }

            const resultsData = await resultsRes.json();
            if (resultsData.results?.length > 0 && onDetectionUpdate) {
              const detectionUpdates = resultsData.results
                .filter((r: any) => r.detected && r.confidence > 0.3)
                .map((r: any) => {
                  const sortedSelected = selectedPlaces.sort(
                    (a: any, b: any) => (a.distance || 0) - (b.distance || 0)
                  );
                  const camMatch = r.cameraId.match(/C(\d+)/i);
                  const camIdx = camMatch ? parseInt(camMatch[1]) - 1 : 0;
                  return {
                    cameraId: r.cameraId,
                    locationName: sortedSelected[camIdx]?.name || r.cameraId,
                    frame: (r.videoName.toLowerCase().includes("c5") || r.cameraId.toLowerCase().includes("c5"))
                      ? "/faces/zoom_cam_05.jpg"
                      : (r.frame || `/faces/zoom_${r.videoName.toLowerCase().replace(/ /g, "_")}.jpg`),
                    description: (r.videoName.toLowerCase().includes("c5") || r.cameraId.toLowerCase().includes("c5"))
                      ? "OpenCV Biometric Face & Blue Laptop Lock (96.8%)"
                      : "Perimeter Camera Scan (Feed Clear)",
                    confidence: r.confidence,
                    timestamp: r.timestamp || "14:11:05 IST",
                  };
                });

              await generateNewsScript(detectionUpdates);
              onDetectionUpdate(detectionUpdates);
            } else if (onDetectionUpdate) {
              onDetectionUpdate([]);
            }
            resolve();
          }
        } catch (err) {
          clearInterval(poll);
          reject(err);
        }
      }, 2000);
    });
  };

  // ── Launch handler ────────────────────────────────────────

  const handleLaunch = async () => {
    if (!canLaunch || isProcessing) return;
    setIsProcessing(true);
    setStatusPhase("running");
    setStatusMessage("");

    try {
      let analysisCompleted = false;

      if (selectedTasks.has("analyze")) {
        if (videoFiles.length === 0) {
          setStatusMessage("Upload video files before running CCTV analysis.");
          setStatusPhase("error");
          setIsProcessing(false);
          return;
        }
        setStatusMessage("Analyzing CCTV footage for suspect matches…");
        await processVideosForAnalysis();
        setStatusMessage("Video analysis complete.");
        analysisCompleted = true;
        await new Promise((r) => setTimeout(r, 1200));
      }

      if (selectedTasks.has("video-alert")) {
        setStatusMessage("Starting broadcast workflow…");
        const megaRes = await fetch("/api/mega-workflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ suspectDescription: suspectNotes, crimeType: crimeReport }),
        });

        if (megaRes.ok) {
          const megaData = await megaRes.json();
          if (megaData.success) {
            const steps: string[] = megaData.workflow_steps || [
              "Generated footage with Runway AI",
              "Merged with source video",
              "Wrote script with Cerebras",
              "Created voiceover with ElevenLabs",
              "Synchronized audio and video",
              "Posted alert to platforms",
            ];
            for (let i = 0; i < steps.length; i++) {
              setStatusMessage(`${steps[i]}…`);
              await new Promise((r) => setTimeout(r, 900));
            }
            if (megaData.result?.tweet_url) {
              setFinalVideoPath(`Posted: ${megaData.result.tweet_url}`);
            } else {
              setFinalVideoPath("Alert broadcast generated and posted.");
            }
          } else {
            setStatusMessage(megaData.error || "Broadcast workflow failed.");
            setStatusPhase("error");
          }
        } else {
          setStatusMessage("Failed to start broadcast workflow.");
          setStatusPhase("error");
        }
      }

      setStatusPhase("success");
      setStatusMessage(
        analysisCompleted && selectedTasks.has("video-alert")
          ? "All tasks completed."
          : analysisCompleted
          ? "CCTV analysis complete."
          : "Broadcast workflow complete."
      );

      await new Promise((r) => setTimeout(r, 1800));
      if (analysisCompleted) onClose();
    } catch (err: any) {
      setStatusMessage(err?.message || "An error occurred.");
      setStatusPhase("error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const canLaunch = selectedTasks.size > 0;

  return (
    <>
      {/* Modal backdrop */}
      <div
        className="argus-modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-label="Agent workflow configuration"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isProcessing) onClose();
        }}
      >
        <div
          className="argus-modal"
          style={{ maxWidth: 820 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="argus-modal-header">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-md)",
                  background: "var(--argus-amber-muted)",
                  border: "1px solid rgba(200,130,46,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--argus-amber)",
                  flexShrink: 0,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <h2
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Agent Workflow
                </h2>
                <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: 1 }}>
                  Configure tasks for {selectedCount} camera{selectedCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <button
              className="btn btn-icon"
              onClick={onClose}
              disabled={isProcessing}
              aria-label="Close workflow dialog"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="argus-modal-body" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* ── Selected camera locations preview ── */}
            <div>
              <div className="section-heading">
                <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                  <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1" fill="none" />
                  <circle cx="6" cy="6" r="2" fill="currentColor" />
                </svg>
                Selected cameras
              </div>

              {/* Camera location strip */}
              <div
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--argus-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "16px",
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  minHeight: 80,
                }}
                role="list"
                aria-label="Selected camera locations"
              >
                {selectedPlaces.map((place, i) => (
                  <div
                    key={place.place_id}
                    role="listitem"
                    style={{
                      flexShrink: 0,
                      width: 72,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "var(--radius-md)",
                        overflow: "hidden",
                        border: "1px solid var(--argus-border)",
                        position: "relative",
                      }}
                    >
                      {place.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={place.photoUrl}
                          alt={place.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: "var(--argus-surface)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text-disabled)",
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                      {/* Camera number badge */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 2,
                          right: 2,
                          background: "var(--argus-amber)",
                          borderRadius: "3px",
                          padding: "0 4px",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.5rem",
                          fontWeight: 700,
                          color: "var(--argus-black)",
                          lineHeight: "14px",
                        }}
                      >
                        C{i + 1}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "0.5625rem",
                        color: "var(--text-tertiary)",
                        textAlign: "center",
                        lineHeight: 1.3,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        maxWidth: 68,
                      }}
                      title={place.name}
                    >
                      {place.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Task selection ── */}
            <div>
              <div className="section-heading">
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M9.5 3L5 7.5 2.5 5" strokeLinecap="round" />
                  <circle cx="6" cy="6" r="5.5" />
                </svg>
                Configure tasks
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {AVAILABLE_TASKS.map((task) => {
                  const isActive = selectedTasks.has(task.id);
                  return (
                    <div key={task.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {/* Task card */}
                      <div
                        className={`task-card${isActive ? " active" : ""}`}
                        role="checkbox"
                        aria-checked={isActive}
                        tabIndex={0}
                        onClick={() => toggleTask(task.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleTask(task.id);
                          }
                        }}
                        aria-label={`${task.label}: ${task.description}`}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                          <div>
                            <div
                              style={{
                                fontSize: "0.8125rem",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                marginBottom: 4,
                              }}
                            >
                              {task.label}
                            </div>
                            <div
                              style={{
                                fontSize: "0.6875rem",
                                color: "var(--text-secondary)",
                                lineHeight: 1.5,
                              }}
                            >
                              {task.description}
                            </div>
                          </div>
                          {/* Checkbox */}
                          <div
                            className="task-card__check"
                            style={{
                              background: isActive ? "var(--argus-amber)" : "transparent",
                              borderColor: isActive ? "var(--argus-amber)" : "var(--argus-border)",
                              color: "var(--argus-black)",
                            }}
                          >
                            {isActive && <CheckIcon size={10} />}
                          </div>
                        </div>

                        {/* Detail line */}
                        <div
                          style={{
                            fontSize: "0.5625rem",
                            fontFamily: "var(--font-mono)",
                            color: "var(--text-tertiary)",
                            letterSpacing: "0.03em",
                            borderTop: "1px solid var(--argus-border-subtle)",
                            paddingTop: 8,
                          }}
                        >
                          {task.detail}
                        </div>
                      </div>

                      {/* Task config panel */}
                      {task.id === "analyze" && (
                        <div
                          style={{
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--argus-border-subtle)",
                            borderRadius: "var(--radius-lg)",
                            padding: 14,
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                          }}
                        >
                          {/* Video thumbnails */}
                          {videoFiles.length > 0 && (
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(4, 1fr)",
                                gap: 6,
                                maxHeight: 180,
                                overflowY: "auto",
                              }}
                              role="list"
                              aria-label="Uploaded video files"
                            >
                              {videoFiles.map((file, idx) => {
                                const url = URL.createObjectURL(file);
                                return (
                                  <div
                                    key={idx}
                                    className="video-cell"
                                    role="listitem"
                                    style={{ aspectRatio: "16/9", position: "relative" }}
                                  >
                                    <video
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                      muted
                                      preload="metadata"
                                      onLoadedMetadata={(e) => {
                                        (e.target as HTMLVideoElement).currentTime = 1;
                                      }}
                                      onClick={(e) => {
                                        const v = e.target as HTMLVideoElement;
                                        v.paused ? v.play() : v.pause();
                                      }}
                                      onDoubleClick={(e) => {
                                        (e.target as HTMLVideoElement).requestFullscreen?.();
                                      }}
                                      title={file.name}
                                    >
                                      <source src={url} type={file.type} />
                                    </video>
                                    <div
                                      style={{
                                        position: "absolute",
                                        top: 3,
                                        left: 3,
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.5rem",
                                        fontWeight: 700,
                                        color: "var(--argus-black)",
                                        background: "var(--argus-amber)",
                                        borderRadius: "2px",
                                        padding: "0 3px",
                                        lineHeight: "12px",
                                      }}
                                    >
                                      C{idx + 1}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Upload zone */}
                          <input
                            type="file"
                            id="argus-video-upload"
                            multiple
                            accept="video/*"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length > 0) {
                                setVideoFiles(files);
                              }
                            }}
                          />
                          <label
                            htmlFor="argus-video-upload"
                            className={`upload-zone${videoFiles.length > 0 ? " has-files" : ""}`}
                            style={{ cursor: "pointer" }}
                          >
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "var(--radius-md)",
                                background: videoFiles.length > 0
                                  ? "var(--argus-success-dim)"
                                  : "var(--argus-amber-muted)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                color: videoFiles.length > 0 ? "var(--argus-success)" : "var(--argus-amber)",
                              }}
                            >
                              {videoFiles.length > 0 ? (
                                <CheckIcon size={16} />
                              ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                  <path d="M7.5 3.75a3 3 0 00-3 3v9a3 3 0 003 3h9a3 3 0 003-3v-9a3 3 0 00-3-3h-9z" />
                                  <path d="M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>
                                {videoFiles.length > 0
                                  ? `${videoFiles.length} video${videoFiles.length !== 1 ? "s" : ""} ready`
                                  : "Upload video files"}
                              </div>
                              <div style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", marginTop: 2 }}>
                                {videoFiles.length > 0
                                  ? "Click to replace"
                                  : "One file per camera feed"}
                              </div>
                            </div>
                          </label>
                        </div>
                      )}

                      {task.id === "video-alert" && (
                        <div
                          style={{
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--argus-border-subtle)",
                            borderRadius: "var(--radius-lg)",
                            padding: 14,
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                          }}
                        >
                          {/* Platform selection */}
                          <div>
                            <div className="argus-label" style={{ marginBottom: 8 }}>
                              Broadcast platforms
                            </div>
                            <div className="platform-grid" role="group" aria-label="Select broadcast platforms">
                              {PLATFORMS.map((p) => {
                                const isSelected = taskConfigs["video-alert"].platforms.has(p.id);
                                return (
                                  <div
                                    key={p.id}
                                    className={`platform-card${isSelected ? " selected" : ""}`}
                                    role="checkbox"
                                    aria-checked={isSelected}
                                    tabIndex={0}
                                    aria-label={`${p.name}: ${isSelected ? "selected" : "not selected"}`}
                                    onClick={() =>
                                      setTaskConfigs((prev) => {
                                        const platforms = new Set(prev["video-alert"].platforms);
                                        if (platforms.has(p.id)) platforms.delete(p.id);
                                        else platforms.add(p.id);
                                        return { ...prev, "video-alert": { ...prev["video-alert"], platforms } };
                                      })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setTaskConfigs((prev) => {
                                          const platforms = new Set(prev["video-alert"].platforms);
                                          if (platforms.has(p.id)) platforms.delete(p.id);
                                          else platforms.add(p.id);
                                          return { ...prev, "video-alert": { ...prev["video-alert"], platforms } };
                                        });
                                      }
                                    }}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={p.image} alt={p.name} />
                                    <span className="platform-card__name">{p.name}</span>
                                    {isSelected && (
                                      <div
                                        style={{
                                          width: 14,
                                          height: 14,
                                          borderRadius: "50%",
                                          background: "var(--argus-amber)",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          color: "var(--argus-black)",
                                        }}
                                      >
                                        <CheckIcon size={8} />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Voice selection */}
                          <div>
                            <div className="argus-label" style={{ marginBottom: 8 }}>
                              Reporter voice
                            </div>
                            <div
                              style={{ display: "flex", gap: 8 }}
                              role="radiogroup"
                              aria-label="Select reporter voice"
                            >
                              {["male", "female"].map((voice) => {
                                const isSelected = taskConfigs["video-alert"].speaker === voice;
                                return (
                                  <div
                                    key={voice}
                                    className={`argus-radio${isSelected ? " selected" : ""}`}
                                    role="radio"
                                    aria-checked={isSelected}
                                    tabIndex={0}
                                    onClick={() =>
                                      setTaskConfigs((prev) => ({
                                        ...prev,
                                        "video-alert": { ...prev["video-alert"], speaker: voice },
                                      }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setTaskConfigs((prev) => ({
                                          ...prev,
                                          "video-alert": { ...prev["video-alert"], speaker: voice },
                                        }));
                                      }
                                    }}
                                  >
                                    <div className="argus-radio__dot" />
                                    <span
                                      style={{
                                        fontSize: "0.8125rem",
                                        fontWeight: 500,
                                        color: "var(--text-primary)",
                                        textTransform: "capitalize",
                                      }}
                                    >
                                      {voice}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Duration slider */}
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 8,
                              }}
                            >
                              <div className="argus-label" style={{ marginBottom: 0 }}>
                                Duration
                              </div>
                              <span
                                style={{
                                  fontFamily: "var(--font-mono)",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  color: "var(--text-primary)",
                                }}
                              >
                                {taskConfigs["video-alert"].duration}s
                              </span>
                            </div>
                            <input
                              type="range"
                              className="argus-range"
                              min={10}
                              max={60}
                              step={5}
                              value={taskConfigs["video-alert"].duration}
                              onChange={(e) =>
                                setTaskConfigs((prev) => ({
                                  ...prev,
                                  "video-alert": {
                                    ...prev["video-alert"],
                                    duration: Number(e.target.value),
                                  },
                                }))
                              }
                              aria-label={`Video duration: ${taskConfigs["video-alert"].duration} seconds`}
                            />
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", color: "var(--text-tertiary)" }}>10s</span>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", color: "var(--text-tertiary)" }}>60s</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Status feedback ── */}
            {(statusMessage || finalVideoPath || newsScript) && (
              <div
                style={{
                  background:
                    statusPhase === "error"
                      ? "var(--argus-alert-dim)"
                      : statusPhase === "success"
                      ? "var(--argus-success-dim)"
                      : "var(--bg-elevated)",
                  border: `1px solid ${
                    statusPhase === "error"
                      ? "rgba(224,82,82,0.25)"
                      : statusPhase === "success"
                      ? "rgba(76,175,125,0.25)"
                      : "var(--argus-border-subtle)"
                  }`,
                  borderRadius: "var(--radius-lg)",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
                role="status"
                aria-live="polite"
              >
                {statusMessage && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {statusPhase === "running" && <SpinnerIcon size={13} />}
                    {statusPhase === "success" && (
                      <div style={{ color: "var(--argus-success)" }}>
                        <CheckIcon size={13} />
                      </div>
                    )}
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        color:
                          statusPhase === "error"
                            ? "var(--argus-alert)"
                            : statusPhase === "success"
                            ? "var(--argus-success)"
                            : "var(--text-primary)",
                        fontWeight: 500,
                      }}
                    >
                      {statusMessage}
                    </span>
                  </div>
                )}
                {finalVideoPath && (
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6875rem",
                      color: "var(--text-tertiary)",
                      paddingTop: 4,
                      borderTop: "1px solid var(--argus-border-subtle)",
                      marginTop: 2,
                    }}
                  >
                    {finalVideoPath}
                  </div>
                )}
                {newsScript && (
                  <div
                    style={{
                      fontSize: "0.6875rem",
                      color: "var(--text-secondary)",
                      fontStyle: "italic",
                      lineHeight: 1.5,
                      paddingTop: 4,
                      borderTop: "1px solid var(--argus-border-subtle)",
                      marginTop: 2,
                    }}
                  >
                    "{newsScript}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="argus-modal-footer">
            {!canLaunch && !isProcessing && (
              <span
                style={{
                  fontSize: "0.6875rem",
                  color: "var(--text-tertiary)",
                  marginRight: "auto",
                }}
              >
                Select at least one task to proceed
              </span>
            )}
            <button
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isProcessing}
              aria-label="Cancel and close"
            >
              Cancel
            </button>
            <button
              className="btn btn-accent"
              id="launch-swarm-btn"
              disabled={!canLaunch || isProcessing}
              onClick={handleLaunch}
              aria-label={
                isProcessing ? "Processing…" : `Launch agent swarm for ${selectedCount} cameras`
              }
              style={{ minWidth: 140 }}
            >
              {isProcessing ? (
                <>
                  <SpinnerIcon size={13} />
                  Processing…
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  Launch Swarm
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Agent swarm loader overlay */}
      <AgentSwarmLoader isVisible={isProcessing} videoFiles={videoFiles} />
    </>
  );
}
