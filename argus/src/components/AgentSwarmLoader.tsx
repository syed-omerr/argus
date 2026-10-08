"use client";

import { useState, useEffect } from "react";

interface AgentSwarmLoaderProps {
  isVisible: boolean;
  videoFiles: File[];
}

const PROCESSING_STEPS = [
  "Initialising vision pipeline…",
  "Invoking Vision Language Model…",
  "Reconstructing pixels with E²FGVI…",
  "Scoring confidence across frames…",
  "Generating alert broadcast…",
  "Finalising output…",
];

export default function AgentSwarmLoader({
  isVisible,
  videoFiles,
}: AgentSwarmLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [agentProgress, setAgentProgress] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setAgentProgress({});
      return;
    }

    // Initialise progress for each agent
    const initial: { [key: string]: number } = {};
    videoFiles.forEach((_, i) => {
      initial[`agent${i + 1}`] = 0;
    });
    setAgentProgress(initial);

    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % PROCESSING_STEPS.length);
    }, 2200);

    const progressTimer = setInterval(() => {
      setAgentProgress((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (next[k] < 100) {
            next[k] = Math.min(100, next[k] + Math.random() * 10 + 4);
          }
        });
        return next;
      });
    }, 350);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
    };
  }, [isVisible, videoFiles]);

  if (!isVisible) return null;

  const overallProgress =
    videoFiles.length > 0
      ? Math.round(
          Object.values(agentProgress).reduce((s, v) => s + v, 0) / videoFiles.length
        )
      : 0;

  const colCount =
    videoFiles.length <= 2 ? 2 :
    videoFiles.length <= 4 ? 2 :
    videoFiles.length <= 6 ? 3 : 4;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "fade-in 200ms ease",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Agent swarm processing"
      aria-live="polite"
    >
      <div
        className="agent-loader"
        style={{ width: "100%", maxWidth: 680, maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div className="agent-loader__header">
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
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.01em",
                }}
              >
                Agent Swarm Processing
              </div>
              <div style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", marginTop: 1 }}>
                Analysing {videoFiles.length} video feed{videoFiles.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Step indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg-elevated)",
              border: "1px solid var(--argus-border)",
              borderRadius: "var(--radius-full)",
              padding: "6px 12px",
              maxWidth: 280,
            }}
            aria-label={`Current step: ${PROCESSING_STEPS[currentStep]}`}
          >
            <span className="pulse-dot pulse-dot--amber" />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                color: "var(--text-secondary)",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {PROCESSING_STEPS[currentStep]}
            </span>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: "hidden auto",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Overall progress */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                flex: 1,
                height: 3,
                background: "var(--argus-border)",
                borderRadius: "var(--radius-full)",
                overflow: "hidden",
              }}
              role="progressbar"
              aria-valuenow={overallProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Overall processing progress"
            >
              <div
                style={{
                  height: "100%",
                  width: `${overallProgress}%`,
                  background: "var(--argus-amber)",
                  borderRadius: "var(--radius-full)",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                flexShrink: 0,
                minWidth: 38,
                textAlign: "right",
              }}
            >
              {overallProgress}%
            </span>
          </div>

          {/* Video grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${colCount}, 1fr)`,
              gap: 10,
            }}
            role="list"
            aria-label="Individual agent progress"
          >
            {videoFiles.map((file, idx) => {
              const key = `agent${idx + 1}`;
              const progress = agentProgress[key] || 0;
              const isDone = progress >= 100;

              return (
                <div
                  key={idx}
                  className="video-cell"
                  role="listitem"
                  aria-label={`Agent ${idx + 1}: ${file.name}, ${Math.round(progress)}% complete`}
                >
                  {/* Video thumbnail */}
                  <div style={{ aspectRatio: "16/9", position: "relative" }}>
                    <video
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      muted
                      preload="metadata"
                      onLoadedMetadata={(e) => {
                        (e.target as HTMLVideoElement).currentTime = 1;
                      }}
                    >
                      <source src={URL.createObjectURL(file)} type={file.type} />
                    </video>

                    {/* Progress overlay */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {/* Circular progress */}
                      <div style={{ position: "relative", width: 40, height: 40 }}>
                        <svg
                          width="40"
                          height="40"
                          viewBox="0 0 40 40"
                          style={{ transform: "rotate(-90deg)" }}
                          aria-hidden="true"
                        >
                          <circle
                            cx="20"
                            cy="20"
                            r="16"
                            fill="none"
                            stroke="rgba(255,255,255,0.12)"
                            strokeWidth="3"
                          />
                          <circle
                            cx="20"
                            cy="20"
                            r="16"
                            fill="none"
                            stroke={isDone ? "var(--argus-success)" : "var(--argus-amber)"}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={`${(progress / 100) * 100.5} 100.5`}
                            style={{ transition: "stroke-dasharray 0.5s ease" }}
                          />
                        </svg>
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isDone ? (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="var(--argus-success)"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              aria-hidden="true"
                            >
                              <path d="M3 8l3.5 3.5L13 4.5" />
                            </svg>
                          ) : (
                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.5625rem",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                              }}
                            >
                              {Math.round(progress)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Agent number badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: 5,
                        left: 5,
                        background: "var(--argus-amber)",
                        color: "var(--argus-black)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.5rem",
                        fontWeight: 700,
                        borderRadius: "3px",
                        padding: "1px 5px",
                        lineHeight: "13px",
                      }}
                    >
                      C{idx + 1}
                    </div>

                    {/* Processing pulse / done indicator */}
                    <div
                      style={{
                        position: "absolute",
                        top: 5,
                        right: 5,
                      }}
                    >
                      {isDone ? (
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "var(--argus-success)",
                          }}
                          aria-label="Processing complete"
                        />
                      ) : (
                        <span className="pulse-dot pulse-dot--amber" />
                      )}
                    </div>
                  </div>

                  {/* File info + bar */}
                  <div style={{ padding: "8px 10px 4px" }}>
                    <div
                      style={{
                        fontSize: "0.625rem",
                        color: "var(--text-secondary)",
                        fontWeight: 500,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        marginBottom: 6,
                      }}
                      title={file.name}
                    >
                      {file.name.replace(/\.[^/.]+$/, "")}
                    </div>
                  </div>

                  {/* Progress bar at bottom */}
                  <div
                    style={{
                      height: 2,
                      background: "var(--argus-border)",
                    }}
                    role="progressbar"
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Agent ${idx + 1} progress`}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${progress}%`,
                        background: isDone ? "var(--argus-success)" : "var(--argus-amber)",
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
