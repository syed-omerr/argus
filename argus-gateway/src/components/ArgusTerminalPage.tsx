import React, { useState } from 'react';
import { 
  Eye, 
  Radio, 
  ShieldAlert, 
  RefreshCw, 
  MapPin, 
  Maximize2, 
  Compass, 
  Activity,
  Lock,
  ArrowLeft,
  Volume2,
  VolumeX
} from 'lucide-react';
import { EYE_COORDINATES, SURVEILLANCE_NODES, INITIAL_SYSTEM_LOGS } from '../data/argusData.ts';
import { EyeCoordinate, SurveillanceNode, SystemLog } from '../types.ts';
import { argusAudio } from '../utils/audio.ts';

interface ArgusTerminalPageProps {
  onReturnToDormant: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
}

export const ArgusTerminalPage: React.FC<ArgusTerminalPageProps> = ({
  onReturnToDormant,
  audioEnabled,
  onToggleAudio,
}) => {
  const [selectedNode, setSelectedNode] = useState<SurveillanceNode>(SURVEILLANCE_NODES[0]);
  const [selectedEye, setSelectedEye] = useState<EyeCoordinate>(EYE_COORDINATES[6]); // Node 07
  const [filterMode, setFilterMode] = useState<'all' | 'optical' | 'radar' | 'intercept'>('all');
  const [irMode, setIrMode] = useState<boolean>(false);
  const [logs] = useState<SystemLog[]>(INITIAL_SYSTEM_LOGS);

  const handleSelectEye = (eye: EyeCoordinate) => {
    setSelectedEye(eye);
    argusAudio.playClick();
    // Match corresponding node if exists
    const matchingNode = SURVEILLANCE_NODES.find((n) => n.id === `node-${String(eye.id).padStart(2, '0')}`);
    if (matchingNode) {
      setSelectedNode(matchingNode);
    }
  };

  const filteredEyes = EYE_COORDINATES.filter((eye) => {
    if (filterMode === 'all') return true;
    if (filterMode === 'optical') return eye.feedType === 'Optical';
    if (filterMode === 'radar') return eye.feedType === 'Synthetic Aperture Radar';
    if (filterMode === 'intercept') return eye.feedType === 'SigInt Intercept';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-200 flex flex-col font-sans surveillance-grid relative selection:bg-red-900 selection:text-white">
      {/* Scanline atmospheric overlay */}
      <div className="fixed inset-0 scanline-overlay pointer-events-none z-40 opacity-70" />

      {/* TOP BAR CONTRACT: Exactly 3 Zones */}
      <header className="relative z-30 flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-black/60 backdrop-blur-md">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="font-cinzel text-lg sm:text-xl font-bold tracking-[0.2em] text-white">
            ARGUS INTELLIGENCE
          </span>
        </div>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-zinc-400">
          <a href="#panopticon" className="hover:text-white transition-colors">
            Panopticon Matrix
          </a>
          <a href="#feed" className="hover:text-white transition-colors">
            Optical Feeds
          </a>
          <a href="#nodes" className="hover:text-white transition-colors">
            Surveillance Nodes
          </a>
          <a href="#telemetry" className="hover:text-white transition-colors">
            Signal Intercepts
          </a>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleAudio}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
            title={audioEnabled ? 'Mute audio' : 'Unmute audio'}
            aria-label="Toggle audio"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-red-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={onReturnToDormant}
            className="px-4 py-2 text-xs font-medium text-white bg-red-950/80 hover:bg-red-900 border border-red-700/60 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(220,38,38,0.2)]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Slumber</span>
          </button>
        </div>
      </header>

      {/* SUB-HEADER STATUS BAR */}
      <div className="border-b border-zinc-800/60 bg-zinc-950/40 px-6 py-2.5 flex flex-wrap items-center justify-between text-xs font-mono text-zinc-400 gap-4">
        <div className="flex items-center gap-3">
          <span className="text-red-400 flex items-center gap-1.5 font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            STATUS: PANOPTICON AWAKENED
          </span>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span>ACTIVE RETINAE: 22/22</span>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span>GLOBAL COVERAGE: 99.98%</span>
        </div>

        <div className="flex items-center gap-3 text-zinc-500">
          <span>LATENCY: 14ms (ORBITAL SYNC)</span>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span>PROTOCOL: ARGUS-OMEGA-5</span>
        </div>
      </div>

      {/* MAIN INTELLIGENCE DASHBOARD */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* HERO BANNER: The All-Seeing Eye Active Surveillance */}
        <section className="relative rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-6 sm:p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-950/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Context & Global Status */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-red-400 bg-red-950/60 border border-red-800/40 px-3 py-1 rounded">
                <Eye className="w-3.5 h-3.5" />
                <span>ALL 22 RETINAL NODES ONLINE</span>
              </div>

              <h1 className="font-cinzel text-3xl sm:text-5xl font-black text-white tracking-wide">
                THE ARGUS INITIATIVE
              </h1>

              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl">
                The mythical hundred-eyed giant reincarnated into a distributed global reconnaissance network. 
                Every ocular station continuously correlates optical, radar, and electromagnetic signals across all seven continents.
              </p>

              {/* Functional Interactive Filter Tabs */}
              <div className="pt-2 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-zinc-500 mr-2">FILTER MATRIX:</span>
                <div className="inline-flex p-1 bg-zinc-900/80 border border-zinc-800 rounded-lg">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      filterMode === 'all'
                        ? 'bg-red-950 text-white border border-red-700/60 shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    All Feeds ({EYE_COORDINATES.length})
                  </button>
                  <button
                    onClick={() => setFilterMode('optical')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      filterMode === 'optical'
                        ? 'bg-red-950 text-white border border-red-700/60 shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Optical
                  </button>
                  <button
                    onClick={() => setFilterMode('radar')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      filterMode === 'radar'
                        ? 'bg-red-950 text-white border border-red-700/60 shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Radar
                  </button>
                  <button
                    onClick={() => setFilterMode('intercept')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      filterMode === 'intercept'
                        ? 'bg-red-950 text-white border border-red-700/60 shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    SigInt
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Active Target Telemetry Panel */}
            <div className="lg:col-span-5 border border-zinc-800/80 rounded-xl bg-zinc-900/50 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-xs font-mono">
                <span className="text-zinc-400 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-red-400" />
                  SELECTED WATCHPOINT
                </span>
                <span className="text-red-400 font-semibold">{selectedEye.label}</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-zinc-800/40">
                  <span className="text-zinc-500">REGION SECTOR:</span>
                  <span className="text-zinc-200">{selectedEye.region}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/40">
                  <span className="text-zinc-500">SENSOR TYPE:</span>
                  <span className="text-red-300 font-medium">{selectedEye.feedType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/40">
                  <span className="text-zinc-500">STATUS:</span>
                  <span className="text-emerald-400 uppercase">{selectedEye.status}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">ANOMALY COEFFICIENT:</span>
                  <span className="text-white font-bold tabular-nums">{selectedEye.anomalyScore}%</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    argusAudio.playClick();
                    alert(`Interrogating Node ${selectedEye.label}. Quantum downlink established with sector ${selectedEye.region}.`);
                  }}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono tracking-wider rounded-lg border border-zinc-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  INTERROGATE SENSOR DOWNLINK
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: LIVE SIMULATED OPTICAL FEED & SENSOR MATRIX */}
        <section id="feed" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Visual Recon Feed */}
          <div className="lg:col-span-8 rounded-2xl border border-zinc-800 bg-black p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-white font-bold">OPTICAL RECON FEED // LIVE</span>
                <span className="text-zinc-600">·</span>
                <span>{selectedEye.region}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIrMode(!irMode)}
                  className={`px-2.5 py-1 text-[11px] rounded transition-colors cursor-pointer border ${
                    irMode
                      ? 'bg-red-950 border-red-600 text-red-200'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  {irMode ? 'INFRARED (FLIR)' : 'OPTICAL (RGB)'}
                </button>
                <Maximize2 className="w-4 h-4 text-zinc-500" />
              </div>
            </div>

            {/* Visual Feed Canvas / Target Box */}
            <div
              className={`relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center transition-all ${
                irMode
                  ? 'bg-gradient-to-tr from-slate-950 via-red-950/80 to-amber-950/40 text-red-400'
                  : 'bg-gradient-to-tr from-zinc-950 via-zinc-900 to-black text-zinc-200'
              }`}
            >
              {/* Surveillance crosshairs & grid */}
              <div className="absolute inset-0 surveillance-grid opacity-30" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-red-500/30" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-red-500/30" />

              {/* Dynamic Target Recognition Bounding Box */}
              <div className="absolute top-1/4 left-1/3 w-48 h-36 border-2 border-red-500/80 rounded flex flex-col justify-between p-2 animate-pulse">
                <div className="flex justify-between text-[10px] font-mono text-red-400 bg-black/60 px-1 rounded">
                  <span>TRACK #4092</span>
                  <span>CONF: 98.4%</span>
                </div>
                <div className="text-[10px] font-mono text-white/90 bg-red-950/80 px-1 py-0.5 rounded self-start">
                  HIGH-ALTITUDE TRANSIENT
                </div>
              </div>

              {/* Central Eye Emblem in Feed */}
              <div className="relative flex flex-col items-center justify-center text-center p-6 bg-black/50 backdrop-blur-sm rounded-xl border border-zinc-800/80 max-w-sm">
                <Eye className="w-12 h-12 text-red-500 mb-3 animate-pulse" />
                <div className="font-cinzel text-lg font-bold text-white tracking-widest">
                  ARGUS RETINA SYNC
                </div>
                <div className="font-mono text-xs text-zinc-400 mt-1">
                  Node: {selectedEye.label}
                </div>
                <div className="font-mono text-[11px] text-zinc-500 mt-2">
                  Coordinates: {(selectedEye.cx * 1.8 - 90).toFixed(4)}°N {(selectedEye.cy * 3.6 - 180).toFixed(4)}°E
                </div>
              </div>

              {/* Live telemetry stamp */}
              <div className="absolute bottom-3 left-4 font-mono text-[11px] text-zinc-400 bg-black/70 px-2 py-1 rounded border border-zinc-800">
                FRAME: 2026-10-08T14:33:48Z // AZIMUTH: 184.2° // ELEV: 42.1°
              </div>

              <div className="absolute bottom-3 right-4 font-mono text-[11px] text-red-400 bg-black/70 px-2 py-1 rounded border border-red-900/60">
                CLASSIFICATION: LEVEL-5 ARGUS DIRECTIVE
              </div>
            </div>
          </div>

          {/* Right Column: Node Grid Selector (All 22 Eyes) */}
          <div className="lg:col-span-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-red-400" />
                OCULAR NODES ({filteredEyes.length})
              </span>
              <span className="text-[11px] font-mono text-zinc-500">CLICK TO LOCK</span>
            </div>

            <div className="flex-1 max-h-[380px] overflow-y-auto space-y-2 pr-1">
              {filteredEyes.map((eye) => {
                const isSelected = selectedEye.id === eye.id;
                return (
                  <div
                    key={eye.id}
                    onClick={() => handleSelectEye(eye)}
                    className={`p-3 rounded-lg border text-xs font-mono transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-red-950/60 border-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.25)]'
                        : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-red-500 animate-ping' : 'bg-zinc-600'}`} />
                      <div>
                        <div className="font-semibold text-zinc-200">{eye.label}</div>
                        <div className="text-[10px] text-zinc-500">{eye.region}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-red-400">{eye.feedType}</div>
                      <div className="text-[10px] text-zinc-500">{eye.anomalyScore}% ANOMALY</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 3: REAL-TIME SYSTEM LOGS & TELEMETRY STREAM */}
        <section id="telemetry" className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <h2 className="font-mono text-sm font-semibold text-white tracking-wider">
                ARGUS SIGNAL INTERCEPT LOGS
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-500">LIVE FEED RECON</span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded bg-zinc-900/40 border border-zinc-800/60 flex items-start gap-4 hover:border-zinc-700 transition-colors"
              >
                <span className="text-zinc-500 shrink-0 tabular-nums">{log.timestamp}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 font-bold ${
                    log.level === 'ALERT'
                      ? 'bg-red-950 text-red-400 border border-red-800'
                      : log.level === 'INTERCEPT'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-red-300 shrink-0">{log.nodeCode}</span>
                <span className="text-zinc-300 flex-1">{log.message}</span>
              </div>
            ))}
          </div>
        </section>

        {/* RE-TRIGGER TRANSITION FOOTER CALLOUT */}
        <div className="p-6 rounded-2xl border border-red-900/50 bg-gradient-to-r from-red-950/30 via-black to-red-950/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-cinzel text-lg font-bold text-white">
              EXPERIENCE THE APERTURE AWAKENING AGAIN
            </h3>
            <p className="text-xs text-zinc-400">
              Return the ARGUS globe to slumber and re-trigger the central "ENTER ARGUS" eye-opening transition sequence.
            </p>
          </div>

          <button
            onClick={onReturnToDormant}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-cinzel font-bold text-xs tracking-widest uppercase rounded-lg transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer flex items-center gap-2 shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>RETURN TO DORMANT GLOBE</span>
          </button>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-zinc-850 px-6 py-6 text-center text-xs font-mono text-zinc-500">
        ARGUS PANOPTIC SURVEILLANCE SYSTEM · DESIGNED FOR MULTI-SPECTRUM RECONNAISSANCE · CONFIDENTIAL
      </footer>
    </div>
  );
};
