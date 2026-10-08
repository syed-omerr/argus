import React, { useMemo } from 'react';
import { EYE_COORDINATES } from '../data/argusData.ts';
import { EyeCoordinate, ArgusState } from '../types.ts';

interface ArgusEyeGlobeProps {
  state: ArgusState;
  customClosedImage?: string | null;
  customOpenImage?: string | null;
  activeEyeId?: number | null;
  onEyeClick?: (eye: EyeCoordinate) => void;
  mousePos?: { x: number; y: number };
  pulseIntensity?: number;
}

export const ArgusEyeGlobe: React.FC<ArgusEyeGlobeProps> = ({
  state,
  customClosedImage,
  customOpenImage,
  activeEyeId,
  onEyeClick,
  mousePos = { x: 0, y: 0 },
}) => {
  const isAwakening = state === 'awakening';
  const isOpen = state === 'active' || state === 'awakening';

  // Calculate normalized mouse offset from center for pupil tracking (-1 to 1)
  const normMouse = useMemo(() => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = Math.max(-1, Math.min(1, (mousePos.x - cx) / (window.innerWidth / 2 || 1)));
    const dy = Math.max(-1, Math.min(1, (mousePos.y - cy) / (window.innerHeight / 2 || 1)));
    return { x: dx, y: dy };
  }, [mousePos.x, mousePos.y]);

  // If user provided custom uploaded images for both closed and open states, render direct image overlay with transition
  if (customClosedImage && customOpenImage) {
    return (
      <div className="relative w-full max-w-[860px] aspect-[16/9] flex items-center justify-center select-none overflow-hidden rounded-2xl bg-black">
        {/* Closed Eyes Image */}
        <img
          src={customClosedImage}
          alt="ARGUS Closed Eyes"
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ease-in-out ${
            isOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
          }`}
        />

        {/* Opened Eyes Image */}
        <img
          src={customOpenImage}
          alt="ARGUS Opened Eyes"
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full object-contain transition-all duration-700 ease-in-out ${
            isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
          }`}
        />

        {/* Cinematic Scanline Grid */}
        <div className="absolute inset-0 scanline-overlay pointer-events-none" />

        {/* Awakening flare shockwave */}
        {isAwakening && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-red-500/80 animate-ping" />
            <div className="absolute inset-0 bg-red-600/10 mix-blend-screen animate-pulse" />
          </div>
        )}
      </div>
    );
  }

  // Vector Graphic Canvas (Ultra high fidelity matching the uploaded collage)
  return (
    <div className="relative w-full max-w-[820px] aspect-square flex items-center justify-center select-none">
      <svg
        viewBox="0 0 1000 1000"
        className="w-full h-full drop-shadow-[0_0_80px_rgba(220,38,38,0.15)] overflow-visible"
        style={{ transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <defs>
          {/* Subtle paper grain texture pattern */}
          <pattern id="paper-texture" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="#f4eedd" />
            <circle cx="15" cy="25" r="0.8" fill="#d9d0ba" opacity="0.6" />
            <circle cx="85" cy="70" r="1.1" fill="#d9d0ba" opacity="0.5" />
            <circle cx="45" cy="85" r="0.9" fill="#d9d0ba" opacity="0.6" />
            <circle cx="65" cy="20" r="1.0" fill="#d9d0ba" opacity="0.4" />
          </pattern>

          {/* Engraving hatching lines for woodcut eyes */}
          <pattern id="hatch-vert" width="4" height="4" patternTransform="rotate(0 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="4" stroke="#18181b" strokeWidth="1" opacity="0.8" />
          </pattern>

          <pattern id="hatch-fine" width="3" height="3" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="3" stroke="#27272a" strokeWidth="0.8" opacity="0.75" />
          </pattern>

          {/* Radial glow filter */}
          <radialGradient id="pupil-glow" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#111827" stopOpacity="1" />
            <stop offset="100%" stopColor="#050505" stopOpacity="1" />
          </radialGradient>

          {/* Shockwave gradient */}
          <radialGradient id="optic-wave" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="transparent" />
            <stop offset="90%" stopColor="#dc2626" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer ambient surveillance halo */}
        <circle
          cx="500"
          cy="500"
          r="460"
          fill="none"
          stroke="rgba(220, 38, 38, 0.15)"
          strokeWidth="1.5"
          strokeDasharray="4 8"
          className={isOpen ? 'animate-[spin_120s_linear_infinite]' : ''}
        />
        <circle
          cx="500"
          cy="500"
          r="485"
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="1"
        />

        {/* MAIN GLOBE MEDALLION (Antique Ivory Circle) */}
        <clipPath id="globe-clip">
          <circle cx="500" cy="500" r="440" />
        </clipPath>

        <g clipPath="url(#globe-clip)">
          {/* Base parchment ivory background */}
          <circle cx="500" cy="500" r="440" fill="url(#paper-texture)" />

          {/* Fine latitude and longitude graticule hairlines */}
          <g stroke="#e2d8c3" strokeWidth="0.75" opacity="0.85" fill="none">
            <circle cx="500" cy="500" r="140" />
            <circle cx="500" cy="500" r="280" />
            <circle cx="500" cy="500" r="390" />
            <line x1="60" y1="500" x2="940" y2="500" />
            <line x1="500" y1="60" x2="500" y2="940" />
            <path d="M 500,60 Q 320,500 500,940" />
            <path d="M 500,60 Q 680,500 500,940" />
            <path d="M 500,60 Q 180,500 500,940" />
            <path d="M 500,60 Q 820,500 500,940" />
          </g>

          {/* CONTINENTAL LANDMASSES IN BOLD CRIMSON RED (#dc2626) */}
          <g fill="#dc2626" opacity="0.96">
            {/* North America & Greenland */}
            <path d="M 370,120 Q 420,100 450,110 Q 440,160 410,180 Q 380,180 370,120 Z" />
            <path d="M 230,170 Q 320,140 370,190 Q 380,240 340,290 Q 300,320 280,380 Q 240,360 220,300 Q 200,240 230,170 Z" />
            <path d="M 280,380 Q 320,380 340,430 Q 310,470 280,450 Z" />

            {/* Central America & Caribbean */}
            <path d="M 280,450 Q 310,490 325,520 Q 315,530 295,505 Z" />

            {/* South America */}
            <path d="M 320,520 Q 410,540 435,630 Q 420,730 380,820 Q 350,870 330,850 Q 315,750 310,660 Q 290,580 320,520 Z" />

            {/* Europe */}
            <path d="M 470,190 Q 550,160 580,220 Q 560,280 510,300 Q 460,270 470,190 Z" />
            <path d="M 500,120 Q 540,100 550,170 Q 520,180 500,120 Z" />
            <path d="M 445,210 Q 470,200 460,250 Q 440,240 445,210 Z" />

            {/* Africa */}
            <path d="M 460,320 Q 600,310 620,420 Q 640,510 590,640 Q 560,760 510,780 Q 470,720 460,600 Q 420,500 460,320 Z" />
            <path d="M 645,630 Q 660,610 655,680 Q 640,700 645,630 Z" />

            {/* Asia & Siberia */}
            <path d="M 580,140 Q 750,120 850,220 Q 820,340 760,370 Q 700,430 650,430 Q 620,350 580,270 Z" />
            {/* India */}
            <path d="M 650,380 Q 710,380 720,480 Q 680,540 650,480 Z" />
            {/* East Asia / China / Korea / Japan */}
            <path d="M 720,320 Q 830,310 840,430 Q 780,480 730,420 Z" />
            <path d="M 850,340 Q 880,330 870,410 Q 850,420 850,340 Z" />
            {/* Southeast Asia */}
            <path d="M 740,480 Q 790,490 770,570 Q 730,550 740,480 Z" />

            {/* Australia & Oceania */}
            <path d="M 760,650 Q 870,640 880,750 Q 830,830 750,810 Q 730,730 760,650 Z" />
            <path d="M 890,790 Q 910,790 905,840 Q 890,830 890,790 Z" />
          </g>

          {/* 21 SURROUNDING COLLAGE EYES */}
          {EYE_COORDINATES.map((eye) => {
            const eyeX = (eye.cx / 100) * 1000;
            const eyeY = (eye.cy / 100) * 1000;
            const eyeScale = (eye.radius / 3.8) * 1.05;
            const isSelected = activeEyeId === eye.id;

            // Pupil offset incorporates mouse tracking when open
            const gazeX = isOpen ? (eye.lookX * 3.5 + normMouse.x * 1.8) : 0;
            const gazeY = isOpen ? (eye.lookY * 2.2 + normMouse.y * 1.2) : 0;

            return (
              <g
                key={eye.id}
                transform={`translate(${eyeX}, ${eyeY}) rotate(${eye.rotation || 0}) scale(${eyeScale})`}
                className="cursor-pointer transition-transform duration-300 hover:scale-125"
                onClick={() => onEyeClick && onEyeClick(eye)}
                style={{
                  transformOrigin: '0 0',
                }}
              >
                {/* Vintage paper cut-out polygonal border */}
                <polygon
                  points="-32,-16 28,-18 36,0 26,18 -26,19 -36,0"
                  fill="#ebe5d5"
                  stroke="#27272a"
                  strokeWidth="0.8"
                  opacity="0.95"
                />

                {/* Halftone / engraved paper eye base */}
                <ellipse cx="0" cy="0" rx="27" ry="14" fill="#faf8f2" stroke="#18181b" strokeWidth="1" />

                {/* Open State: Visible Sclera, Iris, Pupil */}
                <g
                  style={{
                    opacity: isOpen ? 1 : 0,
                    transition: `opacity 0.4s ease-out ${eye.delay * 0.7}ms, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${eye.delay * 0.7}ms`,
                    transform: isOpen ? 'scaleY(1)' : 'scaleY(0.05)',
                    transformOrigin: '0 0',
                  }}
                >
                  {/* Sclera fine capillaries / radial etching */}
                  <path d="M -24,0 Q -10,-10 0,-12 Q 10,-10 24,0 Q 10,10 0,12 Q -10,10 -24,0 Z" fill="#f8f6f0" />
                  <path d="M -22,-2 L -15,0 M -20,2 L -16,1 M 22,-2 L 15,0 M 20,3 L 14,1" stroke="#d4d4d8" strokeWidth="0.6" />

                  {/* Circular Iris with striations */}
                  <g transform={`translate(${gazeX}, ${gazeY})`}>
                    <circle cx="0" cy="0" r="9.5" fill="#3f3f46" stroke="#18181b" strokeWidth="1" />
                    {/* Iris radial hatch */}
                    <circle cx="0" cy="0" r="8.5" fill="none" stroke="#27272a" strokeWidth="1.2" strokeDasharray="1.5 2" />
                    {/* Deep black pupil */}
                    <circle cx="0" cy="0" r="5" fill="#09090b" />
                    {/* Reflection glint */}
                    <circle cx="-2" cy="-2.5" r="1.6" fill="#ffffff" />
                  </g>

                  {/* Upper & lower eyelid rim */}
                  <path d="M -27,0 Q 0,-16 27,0" fill="none" stroke="#18181b" strokeWidth="1.4" />
                  <path d="M -25,0 Q 0,15 25,0" fill="none" stroke="#18181b" strokeWidth="1.1" />
                </g>

                {/* Closed State: Curved vintage eyelid with eyelashes and hatch shading */}
                <g
                  style={{
                    opacity: isOpen ? 0 : 1,
                    transition: `opacity 0.35s ease-in ${eye.delay * 0.5}ms, transform 0.4s ease-out`,
                    transform: isOpen ? 'scaleY(0.1)' : 'scaleY(1)',
                    transformOrigin: '0 0',
                  }}
                >
                  {/* Eyelid skin tone */}
                  <path d="M -27,0 Q 0,-6 27,0 Q 0,14 -27,0 Z" fill="#dfd8c7" />
                  {/* Closed seam line with lashes */}
                  <path d="M -27,0 Q 0,8 27,0" fill="none" stroke="#18181b" strokeWidth="1.8" />
                  {/* Eyelash fringe along closed seam */}
                  <path
                    d="M -20,3 L -21,7 M -14,5 L -15,10 M -8,7 L -8,12 M -2,8 L -1,13 M 4,8 L 5,13 M 10,7 L 11,11 M 16,5 L 18,9 M 21,2 L 23,6"
                    stroke="#18181b"
                    strokeWidth="1.1"
                  />
                  {/* Upper lid crease line with vintage engraving hatch */}
                  <path d="M -23,-5 Q 0,-12 23,-5" fill="none" stroke="#52525b" strokeWidth="0.9" />
                  <path
                    d="M -16,-6 L -16,-9 M -10,-8 L -10,-11 M -4,-9 L -4,-12 M 2,-9 L 2,-12 M 8,-8 L 8,-11 M 14,-6 L 14,-9"
                    stroke="#71717a"
                    strokeWidth="0.6"
                  />
                </g>

                {/* Active node targeting ring if clicked or locked */}
                {isSelected && (
                  <circle cx="0" cy="0" r="32" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" className="animate-spin" />
                )}
              </g>
            );
          })}

          {/* LARGE CENTRAL WOODCUT ENGRAVED EYE (Panopticon Prime) */}
          <g transform="translate(500, 500)">
            {/* Hexagonal antique parchment paper-cut backing */}
            <polygon
              points="-180,-75 160,-80 185,0 155,95 -165,90 -195,5"
              fill="#f5eee0"
              stroke="#18181b"
              strokeWidth="1.8"
            />

            {/* Vertical woodcut hatch lines on background cut-out paper */}
            <polygon
              points="-175,-70 155,-75 178,0 150,90 -160,85 -188,5"
              fill="url(#hatch-vert)"
              opacity="0.3"
            />

            {/* CENTRAL EYE SCLERA & SOCKET */}
            <path
              d="M -160,5 C -100,-75 100,-75 160,5 C 100,85 -100,85 -160,5 Z"
              fill="#faf8f2"
              stroke="#09090b"
              strokeWidth="2.5"
            />

            {/* OPEN STATE: Striated Woodcut Iris & Staring Black Pupil */}
            <g
              style={{
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? 'scale(1)' : 'scaleY(0.04)',
                transformOrigin: '0 0',
                transition: 'opacity 0.5s ease-out 100ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 50ms',
              }}
            >
              {/* Radial Woodcut Hatching in Sclera */}
              <g stroke="#27272a" strokeWidth="0.8" opacity="0.65">
                {/* Left corner radial hatch */}
                <line x1="-155" y1="5" x2="-120" y2="2" />
                <line x1="-150" y1="-8" x2="-115" y2="-6" />
                <line x1="-150" y1="18" x2="-115" y2="10" />
                <line x1="-135" y1="-28" x2="-105" y2="-18" />
                <line x1="-135" y1="36" x2="-105" y2="24" />
                {/* Right corner radial hatch */}
                <line x1="155" y1="5" x2="120" y2="2" />
                <line x1="150" y1="-8" x2="115" y2="-6" />
                <line x1="150" y1="18" x2="115" y2="10" />
                <line x1="135" y1="-28" x2="105" y2="-18" />
                <line x1="135" y1="36" x2="105" y2="24" />
              </g>

              {/* Dynamic Pupil Tracking with Smooth Offset */}
              <g transform={`translate(${isOpen ? normMouse.x * 12 : 0}, ${isOpen ? normMouse.y * 8 : 0})`}>
                {/* Iris Outer Contour & Radial Woodcut Striations */}
                <circle cx="0" cy="5" r="54" fill="#1c1917" stroke="#0c0a09" strokeWidth="2.5" />

                {/* Engraved Iris Rays */}
                {Array.from({ length: 48 }).map((_, i) => {
                  const angle = (i * 360) / 48;
                  const rad = (angle * Math.PI) / 180;
                  const x1 = Math.cos(rad) * 28;
                  const y1 = 5 + Math.sin(rad) * 28;
                  const x2 = Math.cos(rad) * 52;
                  const y2 = 5 + Math.sin(rad) * 52;
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={i % 2 === 0 ? '#d6d3d1' : '#78716c'}
                      strokeWidth={i % 4 === 0 ? '1.8' : '1'}
                    />
                  );
                })}

                {/* Inner Iris Ring */}
                <circle cx="0" cy="5" r="30" fill="none" stroke="#e7e5e4" strokeWidth="1.2" strokeDasharray="2 3" />

                {/* Solid Deep Pupil */}
                <circle cx="0" cy="5" r="26" fill="#000000" />

                {/* High-Contrast White Reflection Glint */}
                <circle cx="-10" cy="-6" r="8" fill="#ffffff" />
                <circle cx="-15" cy="-2" r="3" fill="#ffffff" opacity="0.8" />
              </g>

              {/* Heavy Woodcut Engraving Upper & Lower Eyelids */}
              <path
                d="M -160,5 C -100,-75 100,-75 160,5"
                fill="none"
                stroke="#09090b"
                strokeWidth="4"
              />
              <path
                d="M -160,5 C -100,85 100,85 160,5"
                fill="none"
                stroke="#09090b"
                strokeWidth="3"
              />

              {/* Upper Lid Fold Lines */}
              <path
                d="M -140,-25 C -80,-95 80,-95 140,-25"
                fill="none"
                stroke="#27272a"
                strokeWidth="2"
              />
              {/* Fine hatch lines along upper fold */}
              {Array.from({ length: 24 }).map((_, i) => {
                const px = -110 + i * 10;
                return (
                  <line
                    key={i}
                    x1={px}
                    y1={-58 - Math.sin((i / 24) * Math.PI) * 20}
                    x2={px + 2}
                    y2={-72 - Math.sin((i / 24) * Math.PI) * 22}
                    stroke="#1c1917"
                    strokeWidth="1.2"
                  />
                );
              })}
            </g>

            {/* CLOSED STATE: Antique Woodcut Closed Eyelid & Fringe of Lashes */}
            <g
              style={{
                opacity: isOpen ? 0 : 1,
                transform: isOpen ? 'scaleY(0.08)' : 'scaleY(1)',
                transformOrigin: '0 5px',
                transition: 'opacity 0.4s ease-in, transform 0.5s ease-out',
              }}
            >
              {/* Shaded Eyelid Tone */}
              <path
                d="M -160,5 C -100,-40 100,-40 160,5 C 100,50 -100,50 -160,5 Z"
                fill="#dfd6c2"
              />

              {/* Curved Closed Eyelid Seam with Thick Engraved Line */}
              <path
                d="M -160,5 C -90,38 90,38 160,5"
                fill="none"
                stroke="#09090b"
                strokeWidth="4.5"
              />

              {/* Downward arching dense woodcut eyelashes */}
              {Array.from({ length: 32 }).map((_, i) => {
                const frac = i / 31;
                const lx = -135 + frac * 270;
                const ly = 12 + Math.sin(frac * Math.PI) * 24;
                const lashLen = 14 + Math.sin(frac * Math.PI) * 12;
                return (
                  <line
                    key={i}
                    x1={lx}
                    y1={ly}
                    x2={lx + (frac - 0.5) * 8}
                    y2={ly + lashLen}
                    stroke="#09090b"
                    strokeWidth={i % 3 === 0 ? '2.4' : '1.6'}
                  />
                );
              })}

              {/* Upper Lid Arc Crease with Fine Hatching */}
              <path
                d="M -135,-22 C -70,-65 70,-65 135,-22"
                fill="none"
                stroke="#18181b"
                strokeWidth="2.5"
              />
              {/* Hatch shading along the upper crease */}
              {Array.from({ length: 28 }).map((_, i) => {
                const px = -110 + i * 8.2;
                const py = -16 - Math.sin((i / 28) * Math.PI) * 32;
                return (
                  <line
                    key={i}
                    x1={px}
                    y1={py}
                    x2={px + 3}
                    y2={py - 12}
                    stroke="#27272a"
                    strokeWidth="1.4"
                  />
                );
              })}

              {/* Lower Lid Contour Line */}
              <path
                d="M -110,48 C -50,62 50,62 110,48"
                fill="none"
                stroke="#71717a"
                strokeWidth="1.5"
              />
            </g>
          </g>

          {/* Awakening Shockwave Animation Ring */}
          {isAwakening && (
            <circle
              cx="500"
              cy="500"
              r="440"
              fill="url(#optic-wave)"
              className="animate-ping pointer-events-none"
              style={{ animationDuration: '1.2s' }}
            />
          )}
        </g>
      </svg>
    </div>
  );
};
