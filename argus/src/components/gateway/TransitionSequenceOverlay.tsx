import React, { useEffect, useState } from 'react';
import { Eye, Shield, Activity } from 'lucide-react';

interface TransitionSequenceOverlayProps {
  onComplete: () => void;
}

export const TransitionSequenceOverlay: React.FC<TransitionSequenceOverlayProps> = ({
  onComplete,
}) => {
  const [phase, setPhase] = useState<number>(1);
  const [syncedCount, setSyncedCount] = useState<number>(0);

  useEffect(() => {
    // Phase 1: Aperture opening & counter ramp (0 - 800ms)
    const countInterval = setInterval(() => {
      setSyncedCount((prev) => {
        if (prev >= 22) {
          clearInterval(countInterval);
          return 22;
        }
        return prev + 2;
      });
    }, 45);

    // Phase 2: System lock (800ms)
    const t1 = setTimeout(() => {
      setPhase(2);
    }, 750);

    // Phase 3: Final zoom & transition handover (1700ms)
    const t2 = setTimeout(() => {
      setPhase(3);
    }, 1500);

    const t3 = setTimeout(() => {
      onComplete();
    }, 2100);

    return () => {
      clearInterval(countInterval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden">
      {/* High-speed optic laser sweep */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/15 to-transparent h-24 animate-[bounce_1.5s_infinite] w-full" />

      {/* Radial dilation vignette */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 bg-black/40 backdrop-blur-[2px] ${
          phase >= 2 ? 'opacity-90' : 'opacity-40'
        }`}
      />

      {/* Central Targeting Reticle & Status Banner */}
      <div
        className={`relative z-10 flex flex-col items-center text-center p-6 transition-all duration-500 ${
          phase === 1
            ? 'scale-100 opacity-100'
            : phase === 2
            ? 'scale-110 opacity-100'
            : 'scale-125 opacity-0'
        }`}
      >
        {/* Pulsing Iris Ring */}
        <div className="relative w-32 h-32 flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full border border-red-500/40 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-dashed border-red-500/80 animate-[spin_4s_linear_infinite]" />
          <div className="absolute inset-6 rounded-full border border-red-400/60" />
          <div className="w-14 h-14 rounded-full bg-red-600/30 border border-red-500 flex items-center justify-center">
            <Eye className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>

        {/* Tactical Title */}
        <div className="font-cinzel text-2xl sm:text-4xl font-black text-white tracking-[0.3em] uppercase drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
          ARGUS AWAKENED
        </div>

        {/* Live sync readout */}
        <div className="flex items-center gap-3 mt-3 font-mono text-xs sm:text-sm text-red-300">
          <Activity className="w-4 h-4 text-red-400 animate-spin" />
          <span className="tracking-widest">
            {phase === 1
              ? `AWAKENING RETINAE: [${syncedCount}/22] SYNCHRONIZED`
              : 'OPTICAL MATRIX LOCKED — ENTERING TERMINAL'}
          </span>
          <span className="tabular-nums font-bold text-white">100.0%</span>
        </div>

        {/* Secondary security banner */}
        <div className="mt-4 px-4 py-1.5 rounded bg-red-950/70 border border-red-600/40 font-mono text-[11px] text-red-200 tracking-wider flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-red-400" />
          <span>ALL-SEEING SURVEILLANCE PROTOCOL ACTIVE</span>
        </div>
      </div>
    </div>
  );
};
