'use client';

import React, { useState } from 'react';

export function AtmosphericInversion3D() {
  const [mode, setMode] = useState<'inversion' | 'dispersion'>('inversion');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const isInversion = mode === 'inversion';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white via-slate-50/60 to-slate-100/80 p-5 sm:p-6 shadow-xl transition-all duration-300"
      style={{
        transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
      }}
    >
      {/* Top Header & Interactive Diurnal Mode Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-800">
              3D Atmospheric Inversion Model
            </span>
          </div>
          <span className="text-xs font-bold text-slate-900 block mt-0.5">
            Vertical Airshed Physics
          </span>
        </div>

        {/* Diurnal Toggle */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setMode('inversion')}
            className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg transition-all cursor-pointer ${
              isInversion
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            08:00 Inversion
          </button>
          <button
            type="button"
            onClick={() => setMode('dispersion')}
            className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg transition-all cursor-pointer ${
              !isInversion
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            13:30 Solar Window
          </button>
        </div>
      </div>

      {/* 3D Atmospheric Column Visualization */}
      <div className="relative h-64 sm:h-72 my-3 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-900/95 border border-slate-800 shadow-inner">
        {/* Ambient Atmospheric Lighting & Gradients */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            isInversion
              ? 'bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-rose-950/40 via-amber-950/20 to-slate-950'
              : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/30 via-emerald-950/20 to-slate-950'
          }`}
        />

        {/* Vertical Altitude Axis Ruler (Left Side) */}
        <div className="absolute left-3 top-4 bottom-4 flex flex-col justify-between text-[9px] font-mono text-slate-400 select-none z-10 border-l border-slate-800 pl-2">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-px bg-slate-600" />
            <span>1,200m (Clean Troposphere)</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            <span className="w-2.5 h-px bg-amber-400" />
            <span>280m (Thermal Inversion Lid)</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <span className="w-1.5 h-px bg-slate-600" />
            <span>0m (Ground Surface / Delhi Grid)</span>
          </div>
        </div>

        {/* 3D Isometric Cylinder Wireframe & Particle Dynamics (SVG) */}
        <svg
          className="w-full h-full max-w-[320px] mx-auto z-10 overflow-visible"
          viewBox="0 0 300 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Top Clean Air Glow Gradient */}
            <linearGradient id="cleanTroposphere" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0D9488" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#14B8A6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0D9488" stopOpacity="0.2" />
            </linearGradient>

            {/* Inversion Boundary Lid Glow Gradient */}
            <radialGradient id="inversionLidGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={isInversion ? '#F43F5E' : '#10B981'} stopOpacity="0.8" />
              <stop offset="80%" stopColor={isInversion ? '#E11D48' : '#059669'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={isInversion ? '#BE123C' : '#047857'} stopOpacity="0" />
            </radialGradient>

            {/* Street Smog Gradient */}
            <linearGradient id="smogLayerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isInversion ? '#E11D48' : '#14B8A6'} stopOpacity="0.1" />
              <stop offset="100%" stopColor={isInversion ? '#E11D48' : '#14B8A6'} stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Isometric Cylinder Outer Silhouette Guide Lines */}
          <line x1="80" y1="30" x2="80" y2="210" stroke="#334155" strokeDasharray="2 3" strokeWidth="1" />
          <line x1="220" y1="30" x2="220" y2="210" stroke="#334155" strokeDasharray="2 3" strokeWidth="1" />

          {/* Top Troposphere Ring (1,200m) */}
          <ellipse cx="150" cy="30" rx="70" ry="16" stroke="url(#cleanTroposphere)" strokeWidth="1.5" fill="none" />
          <path
            d="M 90 28 Q 150 18 210 28"
            stroke="#2DD4BF"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            className="animate-pulse"
          />

          {/* Mid Air Boundary Guide (600m) */}
          <ellipse cx="150" cy="95" rx="70" ry="16" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" fill="none" />

          {/* Trapped Smog Volumetric Fill (Bottom Column) */}
          <path
            d={
              isInversion
                ? 'M 80 160 L 80 210 A 70 16 0 0 0 220 210 L 220 160 A 70 16 0 0 1 80 160 Z'
                : 'M 80 50 L 80 210 A 70 16 0 0 0 220 210 L 220 50 A 70 16 0 0 1 80 50 Z'
            }
            fill="url(#smogLayerGrad)"
            className="transition-all duration-700 ease-out"
          />

          {/* Ground Base Ring (0m Urban Surface) */}
          <ellipse cx="150" cy="210" rx="70" ry="16" stroke="#475569" strokeWidth="1.5" fill="#0F172A" />
          <ellipse cx="150" cy="210" rx="55" ry="11" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" fill="none" />

          {/* Swirling Smog Particulate Vectors (Inversion state) */}
          {isInversion ? (
            <g className="animate-fadeIn">
              <circle cx="110" cy="180" r="2.5" fill="#FB7185" className="animate-ping" style={{ animationDuration: '3s' }} />
              <circle cx="170" cy="195" r="2" fill="#FDA4AF" />
              <circle cx="140" cy="175" r="3" fill="#F43F5E" />
              <circle cx="190" cy="185" r="2" fill="#FB7185" />
              <circle cx="125" cy="198" r="2.5" fill="#FDA4AF" />
              {/* Trapped particulate trajectory eddy */}
              <path
                d="M 105 185 C 130 195, 170 190, 195 180"
                stroke="#FB7185"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.8"
              />
            </g>
          ) : (
            /* Dispersed Convection Streamlines (Safe Window state) */
            <g className="animate-fadeIn">
              <path
                d="M 120 200 C 130 140, 140 80, 150 35"
                stroke="#34D399"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.7"
              />
              <path
                d="M 170 200 C 160 140, 155 80, 165 35"
                stroke="#2DD4BF"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.7"
              />
              <circle cx="150" cy="70" r="2.5" fill="#34D399" className="animate-pulse" />
              <circle cx="135" cy="120" r="2" fill="#2DD4BF" />
            </g>
          )}

          {/* The Dynamic Thermal Inversion Boundary Lid Disc */}
          <g
            style={{
              transform: `translateY(${isInversion ? '0px' : '-115px'})`,
              transition: 'transform 0.75s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Glowing Inversion Lid Ellipse */}
            <ellipse
              cx="150"
              cy="160"
              rx="74"
              ry="18"
              fill="url(#inversionLidGlow)"
              stroke={isInversion ? '#F43F5E' : '#10B981'}
              strokeWidth="2"
              className={isInversion ? 'animate-pulse' : ''}
            />

            {/* Inversion Lid Center Tag */}
            <line x1="150" y1="160" x2="225" y2="145" stroke={isInversion ? '#FB7185' : '#34D399'} strokeWidth="1" strokeDasharray="2 2" />
            <circle cx="225" cy="145" r="2.5" fill={isInversion ? '#FB7185' : '#34D399'} />
            <text
              x="232"
              y="148"
              fill={isInversion ? '#FECDD3' : '#A7F3D0'}
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {isInversion ? 'Lid: 280m' : 'Lid: 1,200m'}
            </text>
          </g>
        </svg>

        {/* Ground City Silhouette Profile */}
        <div className="absolute bottom-2 inset-x-8 flex justify-center items-end opacity-25 pointer-events-none select-none z-10">
          <div className="w-3 h-5 bg-slate-400 mx-0.5" />
          <div className="w-5 h-8 bg-slate-400 mx-0.5" />
          <div className="w-4 h-6 bg-slate-400 mx-0.5" />
          <div className="w-6 h-11 bg-slate-400 mx-0.5" />
          <div className="w-3 h-7 bg-slate-400 mx-0.5" />
          <div className="w-5 h-4 bg-slate-400 mx-0.5" />
          <div className="w-4 h-9 bg-slate-400 mx-0.5" />
        </div>
      </div>

      {/* Floating 3D Telemetry Readout Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
            Boundary Height
          </span>
          <span className={`text-base font-black font-sans ${isInversion ? 'text-rose-700' : 'text-emerald-700'}`}>
            {isInversion ? '280 m (Trapping)' : '1,240 m (Mixing)'}
          </span>
          <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
            {isInversion ? 'Exhaust trapped near street' : 'Solar thermal dispersion'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
            Ground PM₂.₅ Density
          </span>
          <span className={`text-base font-black font-sans ${isInversion ? 'text-rose-700' : 'text-emerald-700'}`}>
            {isInversion ? '324 µg/m³' : '62 µg/m³'}
          </span>
          <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
            {isInversion ? '5.4x CPCB NAQI standard' : 'Diluted into boundary layer'}
          </span>
        </div>
      </div>

      {/* Bottom Physics Insight Callout */}
      <div className="mt-2.5 p-2.5 rounded-xl bg-slate-100/90 border border-slate-200 text-[11px] font-sans text-slate-700 flex items-center justify-between">
        <span className="font-mono text-[10px] text-teal-900 font-bold uppercase">
          {isInversion ? 'Action: Shift morning walks to 13:00' : 'Action: 15-min cross-ventilation window'}
        </span>
        <span className="text-[10px] font-mono font-semibold text-slate-500">
          Copernicus CAMS IFS
        </span>
      </div>
    </div>
  );
}
