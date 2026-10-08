/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ArgusState, EyeCoordinate } from './types.ts';
import { ArgusEyeGlobe } from './components/ArgusEyeGlobe.tsx';
import { ArgusCenterButton } from './components/ArgusCenterButton.tsx';
import { TransitionSequenceOverlay } from './components/TransitionSequenceOverlay.tsx';
import { ArgusTerminalPage } from './components/ArgusTerminalPage.tsx';
import { CustomImageUploadModal } from './components/CustomImageUploadModal.tsx';
import { argusAudio } from './utils/audio.ts';
import { 
  Volume2, 
  VolumeX, 
  SlidersHorizontal, 
  Eye, 
  ShieldAlert, 
  Sparkles,
  Info
} from 'lucide-react';

export default function App() {
  const [argusState, setArgusState] = useState<ArgusState>('dormant');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [customClosedImage, setCustomClosedImage] = useState<string | null>(null);
  const [customOpenImage, setCustomOpenImage] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedEyePreview, setSelectedEyePreview] = useState<EyeCoordinate | null>(null);

  // Mouse tracking for dynamic pupil orientation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Keyboard shortcut: Press Enter or Space to trigger "ENTER ARGUS"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && argusState === 'dormant') {
        e.preventDefault();
        handleEnterArgus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [argusState]);

  // Audio mute toggle
  const toggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    argusAudio.enabled = next;
    if (next) {
      argusAudio.playClick();
    }
  };

  // Trigger awakening transition
  const handleEnterArgus = useCallback(() => {
    if (argusState !== 'dormant') return;

    // 1. Play audio swell & biometric riser
    argusAudio.playAwakeningSwell();

    // 2. Set state to awakening (eyes immediately start to flutter and open)
    setArgusState('awakening');
  }, [argusState]);

  // Transition completes -> switch to active terminal page
  const handleTransitionComplete = () => {
    setArgusState('active');
  };

  // Return to dormant state
  const handleReturnToDormant = () => {
    argusAudio.playClick();
    setArgusState('dormant');
  };

  // If already in active terminal mode, render the transitioned command center page
  if (argusState === 'active') {
    return (
      <ArgusTerminalPage
        onReturnToDormant={handleReturnToDormant}
        audioEnabled={audioEnabled}
        onToggleAudio={toggleAudio}
      />
    );
  }

  // Gateway Page: Closed eyes (or currently awakening into open eyes)
  return (
    <div className="relative min-h-screen w-full bg-[#070709] text-zinc-100 flex flex-col justify-between overflow-hidden selection:bg-red-800 selection:text-white surveillance-grid">
      {/* Scanline CRT overlay */}
      <div className="fixed inset-0 scanline-overlay pointer-events-none z-20 opacity-70" />

      {/* TOP HEADER BAR */}
      <header className="relative z-30 flex items-center justify-between px-6 py-5 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          <span className="font-cinzel text-base sm:text-xl font-bold tracking-[0.2em] text-white">
            ARGUS
          </span>
          <span className="hidden sm:inline-block text-xs font-mono text-zinc-500 tracking-wider">
            · PANOPTICON PORTAL
          </span>
        </div>

        {/* Top Control Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3 py-1.5 text-xs font-mono text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
            title="Configure custom uploaded closed and open image files"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Image Mode</span>
          </button>

          <button
            onClick={toggleAudio}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
            title={audioEnabled ? 'Sound is ON (Click to mute)' : 'Sound is OFF (Click to unmute)'}
            aria-label="Toggle audio"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-red-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>
        </div>
      </header>

      {/* CENTER STAGE: THE ARGUS GLOBE & CENTRAL "ENTER ARGUS" BUTTON */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6">
        
        {/* Globe Container with relative centering */}
        <div className="relative w-full max-w-[820px] aspect-square flex items-center justify-center">
          
          {/* THE ARGUS EYE GLOBE (Renders closed eyes in dormant, open eyes in awakening) */}
          <ArgusEyeGlobe
            state={argusState}
            customClosedImage={customClosedImage}
            customOpenImage={customOpenImage}
            mousePos={mousePos}
            activeEyeId={selectedEyePreview?.id}
            onEyeClick={(eye) => {
              argusAudio.playClick();
              setSelectedEyePreview(eye);
            }}
          />

          {/* THE "ENTER ARGUS" BUTTON IN THE EXACT CENTER OF THE UI */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <ArgusCenterButton
                state={argusState}
                onEnter={handleEnterArgus}
              />
            </div>
          </div>
        </div>

        {/* Selected Eye Station Callout (if clicked while exploring dormant state) */}
        {selectedEyePreview && argusState === 'dormant' && (
          <div className="mt-4 px-4 py-2 bg-zinc-950/90 border border-red-900/60 rounded-lg text-xs font-mono text-zinc-300 flex items-center gap-3 animate-fade-in">
            <span className="text-red-400 font-bold">{selectedEyePreview.label}</span>
            <span className="text-zinc-500">·</span>
            <span>{selectedEyePreview.region} (DORMANT)</span>
            <button
              onClick={() => setSelectedEyePreview(null)}
              className="text-zinc-500 hover:text-white ml-2 text-[10px]"
            >
              ✕
            </button>
          </div>
        )}
      </main>

      {/* FOOTER BAR */}
      <footer className="relative z-30 px-6 py-4 max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-500 gap-3 border-t border-zinc-900/80">
        <div className="flex items-center gap-2 text-zinc-400">
          <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
          <span>STATUS: ALL 22 EYES ASLEEP // READY TO INITIALIZE</span>
        </div>

        <div className="flex items-center gap-4 text-zinc-400">
          <span>PRESS [ENTER] OR CLICK CENTER TO AWAKEN</span>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <span className="hidden sm:inline">GLOBAL WATCHPOINT NETWORK</span>
        </div>
      </footer>

      {/* CINEMATIC TRANSITION SEQUENCE OVERLAY */}
      {argusState === 'awakening' && (
        <TransitionSequenceOverlay
          onComplete={handleTransitionComplete}
        />
      )}

      {/* CUSTOM IMAGE UPLOAD MODAL */}
      <CustomImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        customClosedImage={customClosedImage}
        customOpenImage={customOpenImage}
        onSetImages={(closedImg, openImg) => {
          setCustomClosedImage(closedImg);
          setCustomOpenImage(openImg);
        }}
      />
    </div>
  );
}
