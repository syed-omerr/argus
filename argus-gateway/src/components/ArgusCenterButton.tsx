import React from 'react';
import { Eye, ShieldAlert, Radio } from 'lucide-react';
import { ArgusState } from '../types.ts';

interface ArgusCenterButtonProps {
  state: ArgusState;
  onEnter: () => void;
  disabled?: boolean;
}

export const ArgusCenterButton: React.FC<ArgusCenterButtonProps> = ({
  state,
  onEnter,
  disabled = false,
}) => {
  const isAwakening = state === 'awakening';
  const isActive = state === 'active';

  return (
    <div className="relative z-30 flex flex-col items-center justify-center">
      {/* Outer Tactical Crosshair Framing */}
      <div className="relative group">
        {/* Subtle pulsing background glow */}
        <div
          className={`absolute -inset-4 rounded-2xl bg-gradient-to-r from-red-600/30 via-red-500/20 to-red-600/30 blur-xl transition-opacity duration-500 ${
            isAwakening ? 'opacity-100 scale-110 animate-pulse' : 'opacity-40 group-hover:opacity-80'
          }`}
        />

        {/* Tactical Corner Brackets */}
        <div className="absolute -top-3 -left-3 w-4 h-4 border-t-2 border-l-2 border-red-500/80 pointer-events-none transition-transform duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1" />
        <div className="absolute -top-3 -right-3 w-4 h-4 border-t-2 border-r-2 border-red-500/80 pointer-events-none transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
        <div className="absolute -bottom-3 -left-3 w-4 h-4 border-b-2 border-l-2 border-red-500/80 pointer-events-none transition-transform duration-300 group-hover:-translate-x-1 group-hover:translate-y-1" />
        <div className="absolute -bottom-3 -right-3 w-4 h-4 border-b-2 border-r-2 border-red-500/80 pointer-events-none transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1" />

        {/* PRIMARY "ENTER ARGUS" BUTTON */}
        <button
          onClick={onEnter}
          disabled={disabled || isAwakening}
          aria-label="Enter ARGUS All-Seeing Intelligence System"
          className={`relative px-8 py-4 sm:px-10 sm:py-5 bg-gradient-to-b from-zinc-900 to-black text-white rounded-lg border border-red-600/60 shadow-[0_0_30px_rgba(220,38,38,0.35)] transition-all duration-300 active:scale-95 disabled:pointer-events-none cursor-pointer flex items-center gap-4 ${
            isAwakening
              ? 'border-red-500 bg-red-950/60 ring-2 ring-red-500/80'
              : 'hover:border-red-500 hover:shadow-[0_0_45px_rgba(239,68,68,0.55)] hover:scale-105'
          }`}
        >
          {/* Animated surveillance indicator dot */}
          <div className="relative flex items-center justify-center w-3 h-3">
            <span
              className={`absolute w-full h-full rounded-full bg-red-500 ${
                isAwakening ? 'animate-ping' : 'animate-pulse'
              }`}
            />
            <span className="relative w-2 h-2 rounded-full bg-red-400" />
          </div>

          {/* Core Button Content */}
          <div className="flex flex-col items-start text-left">
            <span className="font-cinzel text-lg sm:text-2xl font-black tracking-[0.25em] text-white flex items-center gap-2">
              {isAwakening ? (
                <>
                  <Eye className="w-5 h-5 text-red-400 animate-spin" />
                  AWAKENING...
                </>
              ) : isActive ? (
                <>
                  <Radio className="w-5 h-5 text-red-400" />
                  ARGUS ONLINE
                </>
              ) : (
                'ENTER ARGUS'
              )}
            </span>
            <span className="font-mono text-[10px] sm:text-xs text-red-300/80 tracking-widest uppercase mt-0.5">
              {isAwakening
                ? 'Synching 22 Panoptic Nodes'
                : 'Click to open all-seeing eyes'}
            </span>
          </div>

          {/* Right Icon Affordance */}
          <div className="pl-2 border-l border-red-800/60 text-red-400">
            {isAwakening ? (
              <ShieldAlert className="w-5 h-5 animate-bounce text-red-400" />
            ) : (
              <Eye className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 group-hover:text-red-300" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
};
