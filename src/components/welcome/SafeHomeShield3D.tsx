'use client';

import React, { useState } from 'react';

export function SafeHomeShield3D() {
  const [mode, setMode] = useState<'morning_peak' | 'afternoon_safe'>('morning_peak');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const isMorning = mode === 'morning_peak';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
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
      {/* Top Header & Simple 1-Tap Routine Toggle */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-800">
              Clean Air Shield
            </span>
          </div>
          <span className="text-xs font-bold text-slate-900 block mt-0.5">
            How AirAware Protects Your Home
          </span>
        </div>

        {/* Friendly Routine Switcher */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setMode('morning_peak')}
            className={`px-3 py-1 text-[11px] font-mono font-semibold rounded-lg transition-all cursor-pointer ${
              isMorning
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Morning Smog
          </button>
          <button
            type="button"
            onClick={() => setMode('afternoon_safe')}
            className={`px-3 py-1 text-[11px] font-mono font-semibold rounded-lg transition-all cursor-pointer ${
              !isMorning
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Afternoon Sun
          </button>
        </div>
      </div>

      {/* 3D Safe Home Dome Cutaway Display */}
      <div className="relative h-64 sm:h-72 my-3 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
        {/* Dynamic Outdoor Ambient Background (Smoggy Rose/Amber vs Sunny Blue) */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            isMorning
              ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/40 via-rose-950/25 to-slate-950'
              : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/40 via-teal-950/30 to-slate-950'
          }`}
        />

        {/* Outside Smog / Sun Status Floating Label (Top Left) */}
        <div className="absolute top-3 left-3 z-20">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-tight shadow-sm border ${
              isMorning
                ? 'bg-rose-950/80 text-rose-200 border-rose-800/80'
                : 'bg-emerald-950/80 text-emerald-200 border-emerald-800/80'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isMorning ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
              }`}
            />
            {isMorning ? 'Outdoor Air: Dangerous Smog (382 AQI)' : 'Outdoor Air: Safe Sunlight (62 AQI)'}
          </span>
        </div>

        {/* Vector 3D Isometric Home & Protective Dome (SVG) */}
        <svg
          className="w-full h-full max-w-[340px] mx-auto z-10 overflow-visible"
          viewBox="0 0 320 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Protective Glass Dome Gradient */}
            <radialGradient id="shieldGlow" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#0D9488" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#042F2E" stopOpacity="0" />
            </radialGradient>

            {/* Cozy Home Interior Lighting */}
            <linearGradient id="warmHomeFloor" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            {/* Clean Air Flow Stream */}
            <linearGradient id="cleanFlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0" />
              <stop offset="50%" stopColor="#5EEAD4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Outside Smog Particles Bouncing Off Shield (Morning State) */}
          {isMorning && (
            <g className="animate-fadeIn">
              <circle cx="45" cy="65" r="3" fill="#FDA4AF" opacity="0.6" />
              <circle cx="70" cy="40" r="2.5" fill="#FB7185" opacity="0.7" />
              <circle cx="265" cy="55" r="3" fill="#F43F5E" opacity="0.6" />
              <circle cx="285" cy="85" r="2" fill="#FDA4AF" opacity="0.5" />
              <circle cx="35" cy="110" r="2" fill="#FB7185" opacity="0.6" />
              {/* Deflected smog trajectories */}
              <path
                d="M 40 50 Q 75 70 60 95"
                stroke="#FB7185"
                strokeWidth="1.2"
                strokeDasharray="2 3"
                opacity="0.6"
              />
              <path
                d="M 280 45 Q 245 65 260 90"
                stroke="#FB7185"
                strokeWidth="1.2"
                strokeDasharray="2 3"
                opacity="0.6"
              />
            </g>
          )}

          {/* Afternoon Sunlight Rays Entering (Afternoon State) */}
          {!isMorning && (
            <g className="animate-fadeIn">
              <path
                d="M 240 20 L 200 130"
                stroke="#FDE047"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.4"
              />
              <path
                d="M 270 30 L 225 140"
                stroke="#FACC15"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.5"
              />
              <circle cx="270" cy="25" r="8" fill="#FDE047" opacity="0.6" className="animate-pulse" />
            </g>
          )}

          {/* The Glowing 3D Protective Shield Dome */}
          <path
            d="M 50 175 C 50 80, 270 80, 270 175 Z"
            fill="url(#shieldGlow)"
            stroke={isMorning ? '#2DD4BF' : '#34D399'}
            strokeWidth="1.8"
            className="transition-colors duration-500"
          />

          {/* Dome Base Ring */}
          <ellipse cx="160" cy="175" rx="110" ry="24" stroke="#0F766E" strokeWidth="1.2" strokeDasharray="3 3" fill="none" opacity="0.5" />

          {/* Isometric Home Floor Base */}
          <path
            d="M 90 160 L 160 195 L 230 160 L 160 125 Z"
            fill="url(#warmHomeFloor)"
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* Isometric House Walls */}
          {/* Back Left Wall */}
          <path d="M 90 160 L 90 110 L 160 80 L 160 125 Z" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          {/* Back Right Wall (with Window) */}
          <path d="M 160 125 L 160 80 L 230 110 L 230 160 Z" fill="#0F172A" stroke="#475569" strokeWidth="1" />

          {/* Roof Ridge Silhouette */}
          <path d="M 90 110 L 160 65 L 230 110" stroke="#0D9488" strokeWidth="1.8" fill="none" />
          <line x1="160" y1="65" x2="160" y2="80" stroke="#0D9488" strokeWidth="1" />

          {/* The Home Window (Back Right Wall) */}
          <g>
            <rect
              x="178"
              y="105"
              width="34"
              height="28"
              rx="3"
              fill={isMorning ? '#0F172A' : '#14532D'}
              stroke={isMorning ? '#475569' : '#34D399'}
              strokeWidth="1.5"
            />
            {/* Window crossbar */}
            <line x1="195" y1="105" x2="195" y2="133" stroke={isMorning ? '#475569' : '#34D399'} strokeWidth="1" />
            <line x1="178" y1="119" x2="212" y2="119" stroke={isMorning ? '#475569' : '#34D399'} strokeWidth="1" />

            {/* Window Status Tag */}
            <text
              x="195"
              y="97"
              textAnchor="middle"
              fill={isMorning ? '#FDA4AF' : '#86EFAC'}
              fontSize="7.5"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {isMorning ? 'WINDOW SEALED' : '15-MIN WINDOW OPEN'}
            </text>
          </g>

          {/* Interior Air Purifier Device (Bottom Left Corner) */}
          <g transform="translate(115, 145)">
            <rect x="0" y="0" width="16" height="24" rx="4" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1" />
            <circle cx="8" cy="8" r="2.5" fill="#14B8A6" className="animate-pulse" />
            {/* Intake vents */}
            <line x1="3" y1="14" x2="13" y2="14" stroke="#CBD5E1" strokeWidth="1" />
            <line x1="3" y1="17" x2="13" y2="17" stroke="#CBD5E1" strokeWidth="1" />
            <line x1="3" y1="20" x2="13" y2="20" stroke="#CBD5E1" strokeWidth="1" />
          </g>

          {/* Circulating Clean Air Stream Inside Home */}
          <path
            d="M 125 145 C 130 115, 175 120, 185 145 C 190 160, 150 170, 135 155"
            stroke="url(#cleanFlow)"
            strokeWidth="1.8"
            strokeDasharray="5 3"
            className="animate-pulse"
          />

          {/* Houseplant with fresh green leaves (Bottom Center) */}
          <g transform="translate(155, 155)">
            <ellipse cx="6" cy="14" rx="5" ry="3" fill="#334155" />
            <path d="M 6 12 Q 2 6 0 4" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 6 12 Q 7 4 10 2" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 6 12 Q 10 8 13 8" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Protective Shield Pulse Indicator */}
          <g transform="translate(160, 48)">
            <circle cx="0" cy="0" r="4" fill="#2DD4BF" className="animate-ping" opacity="0.6" />
            <circle cx="0" cy="0" r="3" fill="#14B8A6" />
            <text
              x="0"
              y="-7"
              textAnchor="middle"
              fill="#5EEAD4"
              fontSize="8.5"
              fontFamily="monospace"
              fontWeight="bold"
            >
              AIRAWARE SHIELD ACTIVE
            </text>
          </g>
        </svg>

        {/* Clean Home Status Floating Badge (Bottom Center) */}
        <div className="absolute bottom-3 inset-x-0 flex justify-center z-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-teal-500/50 shadow-md backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-emerald-300">
              {isMorning ? 'Indoor Air: 18 AQI • Clean & Filtered' : 'Indoor Air: 22 AQI • Cross-Ventilated'}
            </span>
          </div>
        </div>
      </div>

      {/* Two Clear Real-World Statistics Any Normal User Understands */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Outside Card */}
        <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
            Outside Street Air
          </span>
          <span className={`text-xl font-black font-sans ${isMorning ? 'text-rose-700' : 'text-amber-700'}`}>
            {isMorning ? '382 AQI (Severe)' : '145 AQI (Moderate)'}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5 font-sans">
            {isMorning ? 'Heavy morning traffic & winter inversion' : 'Sun lifts boundary smog'}
          </span>
        </div>

        {/* Inside Protected Home Card */}
        <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-200/90 shadow-xs">
          <span className="text-[10px] font-mono uppercase font-bold text-teal-800 block">
            Inside Your Home
          </span>
          <span className="text-xl font-black font-sans text-emerald-700">
            {isMorning ? '18 AQI (Pristine)' : '22 AQI (Fresh Air)'}
          </span>
          <span className="text-[11px] text-teal-900 block mt-0.5 font-sans">
            {isMorning ? 'Purifier sized to room volume' : 'CO₂ flushed safely in 15 mins'}
          </span>
        </div>
      </div>

      {/* Action Recommendation Bar */}
      <div className="mt-2.5 p-2.5 rounded-xl bg-slate-100/90 border border-slate-200 text-xs font-sans text-slate-800 flex items-center justify-between">
        <span className="font-semibold text-[11px]">
          {isMorning
            ? 'Action: Keep windows sealed • Run purifier on medium • Shift outdoor run to 1:30 PM'
            : 'Action: Safe 15-minute cross-ventilation window active right now'}
        </span>
        <span className="text-[10px] font-mono font-bold text-teal-800 shrink-0 ml-2">
          {isMorning ? '7:00 – 10:30 AM' : '12:30 – 3:30 PM'}
        </span>
      </div>
    </div>
  );
}
