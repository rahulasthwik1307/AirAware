'use client';

import React, { useState, useRef, useCallback } from 'react';

export function PollutionComparisonSplit() {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = Math.round((x / rect.width) * 100);
    setSliderPos(percentage);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <div className="w-full select-none">
      {/* Header Controls & Mode Switcher */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 font-sans">
            Air Quality Comparison
          </span>
        </div>

        {/* 1-Tap Quick Position Presets */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setSliderPos(90)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-sans font-semibold transition-all cursor-pointer ${
              sliderPos >= 65
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Toxic Smog
          </button>
          <button
            type="button"
            onClick={() => setSliderPos(50)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-sans font-semibold transition-all cursor-pointer ${
              sliderPos > 35 && sliderPos < 65
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Split 50/50
          </button>
          <button
            type="button"
            onClick={() => setSliderPos(10)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-sans font-semibold transition-all cursor-pointer ${
              sliderPos <= 35
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clean Shield
          </button>
        </div>
      </div>

      {/* Main Interactive Split Container */}
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={(e) => {
          setIsDragging(true);
          if (e.touches[0]) handleMove(e.touches[0].clientX);
        }}
        onTouchEnd={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
        className="relative h-[340px] sm:h-[420px] w-full overflow-hidden rounded-3xl border-2 border-slate-200 shadow-xl bg-slate-950 cursor-ew-resize group"
      >
        {/* Layer A (Background / Right Side): Clean Protected Air */}
        <div className="absolute inset-0 h-full w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/landing/clean_sky_city.webp"
            alt="Exact same city street cleaned under clear blue sky with smiling pedestrians"
            className="h-full w-full object-cover"
          />
          {/* Right Floating Badge */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex flex-col items-end gap-1 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/85 backdrop-blur-md border border-emerald-400/40 px-2.5 py-1 sm:px-3.5 sm:py-1.5 text-[11px] sm:text-xs font-sans font-bold text-emerald-300 shadow-lg">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              18 AQI • PRISTINE
            </span>
            <span className="hidden sm:block rounded-lg bg-black/60 backdrop-blur-xs px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-sm">
              Safe Outdoor Windows • CO₂ Flushed
            </span>
          </div>
        </div>

        {/* Layer B (Foreground / Left Side with Clip Path): Toxic Winter Smog */}
        <div
          className="absolute inset-0 h-full w-full overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/landing/winter_smog_city.webp"
            alt="Winter smog engulfing city streets"
            className="h-full w-full object-cover"
          />
          {/* Subtle amber pollution wash */}
          <div className="absolute inset-0 bg-amber-950/20 mix-blend-multiply" />

          {/* Left Floating Badge */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex flex-col items-start gap-1 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-950/90 backdrop-blur-md border border-rose-500/50 px-2.5 py-1 sm:px-3.5 sm:py-1.5 text-[11px] sm:text-xs font-sans font-bold text-rose-300 shadow-lg">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              382 AQI • HAZARD
            </span>
            <span className="hidden sm:block rounded-lg bg-black/60 backdrop-blur-xs px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-sm">
              Lungs Exposed • Boundary Trapping
            </span>
          </div>
        </div>

        {/* Center Draggable Slider Line & Pill Handle */}
        <div
          className="absolute top-0 bottom-0 z-20 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white text-slate-900 shadow-2xl border-2 border-slate-900/10 cursor-ew-resize transition-transform group-hover:scale-105 active:scale-95">
            <svg
              className="w-5 h-5 text-slate-800"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
              <polyline points="9 18 3 12 9 6" />
            </svg>
            <svg
              className="w-5 h-5 text-slate-800 -ml-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
              <polyline points="15 18 21 12 15 6" />
            </svg>
          </div>
        </div>

        {/* Bottom Helper Drag Prompt */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 backdrop-blur-md px-3 py-1 text-[11px] font-sans font-semibold text-white/90 border border-white/20 shadow-md">
            <span>◀ Drag slider to reveal clean air transformation ▶</span>
          </span>
        </div>
      </div>

      {/* Comparison Metrics Footer (High-contrast, zero fluff) */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/70">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-rose-800">
              Without AirAware
            </span>
            <span className="text-sm font-sans font-extrabold text-rose-700">382 AQI</span>
          </div>
          <p className="text-xs font-sans font-medium text-slate-700 leading-snug">
            Blind morning walks during nocturnal inversion peak; under-sized air filtration.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/70">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-emerald-800">
              With AirAware Shield
            </span>
            <span className="text-sm font-sans font-extrabold text-emerald-700">18 AQI</span>
          </div>
          <p className="text-xs font-sans font-medium text-slate-700 leading-snug">
            Calculated CADR room sizing; routines shifted to sunny afternoon dispersion windows.
          </p>
        </div>
      </div>
    </div>
  );
}
