'use client';

import React from 'react';
import { GlobeMapStyleKey } from './maplibre-styles';

export interface GlobeControlsOverlayProps {
  readonly isGlobe: boolean;
  readonly onToggleGlobe: (isGlobe: boolean) => void;
  readonly activeStyle: GlobeMapStyleKey;
  readonly onSelectStyle: (style: GlobeMapStyleKey) => void;
  readonly onResetNorth: () => void;
  readonly isRotating: boolean;
  readonly onToggleRotation: () => void;
  readonly onFocusActive: () => void;
  readonly cursorCoords: { lat: number; lng: number } | null;
  readonly currentZoom: number;
  readonly onZoom: (delta: number) => void;
}

/**
 * Floating glassmorphism controls overlay for 3D Earth Globe.
 * Houses projection switches, style selectors, compass, auto-rotate toggles,
 * active focus triggers, coordinate readouts, and zoom steppers.
 *
 * @param props - State and interaction callbacks for globe controls
 */
export function GlobeControlsOverlay({
  isGlobe,
  onToggleGlobe,
  activeStyle,
  onSelectStyle,
  onResetNorth,
  isRotating,
  onToggleRotation,
  onFocusActive,
  cursorCoords,
  currentZoom,
  onZoom,
}: GlobeControlsOverlayProps) {
  return (
    <>
      {/* Floating Top Controls: Projection, Layer, and Compass */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-none">
        {/* Left: 3D Globe vs 2D Mercator Toggle */}
        <div className="inline-flex p-1 rounded-xl shadow-lg text-[11px] font-mono font-bold pointer-events-auto bg-slate-900 border border-slate-700/80 text-slate-300">
          <button
            type="button"
            onClick={() => onToggleGlobe(true)}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              isGlobe
                ? 'bg-sky-600 text-white shadow-xs font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🌐 3D Globe
          </button>
          <button
            type="button"
            onClick={() => onToggleGlobe(false)}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              !isGlobe
                ? 'bg-sky-600 text-white shadow-xs font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🗺️ 2D Map
          </button>
        </div>

        {/* Right: Map Style & Compass */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Style Switcher */}
          <div className="inline-flex p-1 rounded-xl shadow-lg text-[11px] font-mono font-bold bg-slate-900 border border-slate-700/80">
            <button
              type="button"
              onClick={() => onSelectStyle('satellite')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeStyle === 'satellite'
                  ? 'bg-sky-600 text-white shadow-xs font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Photorealistic Earth satellite imagery with city labels"
            >
              🛰️ Real Earth
            </button>
            <button
              type="button"
              onClick={() => onSelectStyle('streets')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeStyle === 'streets'
                  ? 'bg-sky-600 text-white shadow-xs font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Detailed topographic and street network"
            >
              🗺️ Topo
            </button>
            <button
              type="button"
              onClick={() => onSelectStyle('scientific')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeStyle === 'scientific'
                  ? 'bg-sky-600 text-white shadow-xs font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Clean scientific vector grid"
            >
              🌐 Vector
            </button>
          </div>

          {/* Compass / Reset North */}
          <button
            type="button"
            onClick={onResetNorth}
            className="w-8 h-8 rounded-xl shadow-lg flex items-center justify-center transition-all font-mono font-bold text-xs cursor-pointer bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800"
            title="Reset North & Pitch"
            aria-label="Reset North"
          >
            🧭
          </button>
        </div>
      </div>

      {/* Bottom Floating Controls Bar */}
      <div className="absolute bottom-4 inset-x-4 flex items-center justify-between z-20 pointer-events-none">
        {/* Left: Action Buttons (Auto-Rotate & Focus Active) */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl shadow-lg text-[11px] font-mono font-bold pointer-events-auto bg-slate-900 border border-slate-700/80">
          <button
            type="button"
            onClick={onToggleRotation}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              isRotating
                ? 'bg-sky-600 text-white shadow-xs font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {isRotating ? '🔄 ROTATING' : '⏸️ PAUSED'}
          </button>
          <button
            type="button"
            onClick={onFocusActive}
            className="px-3 py-1 rounded-lg transition-colors cursor-pointer text-sky-300 hover:text-white hover:bg-slate-800"
          >
            🎯 FOCUS ACTIVE
          </button>
        </div>

        {/* Center: Real-Time HUD Coordinates & Zoom Level */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-lg text-[10px] font-mono bg-slate-900 border border-slate-700/80 text-slate-300">
          <span className="font-bold text-sky-300 tabular-nums">
            {cursorCoords ? `${cursorCoords.lat}°N, ${cursorCoords.lng}°E` : 'Explore Globe'}
          </span>
          <span className="text-white/20">|</span>
          <span className="tabular-nums">
            Zoom: {currentZoom} ({currentZoom < 4 ? 'Space' : currentZoom < 9 ? 'Region' : 'Street Level'})
          </span>
        </div>

        {/* Right: Zoom + / - Controls */}
        <div className="flex items-center gap-1 p-1 rounded-xl shadow-lg text-[11px] font-mono pointer-events-auto bg-slate-900 border border-slate-700/80">
          <button
            type="button"
            onClick={() => onZoom(1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg font-bold transition-colors cursor-pointer bg-slate-800 hover:bg-slate-700 text-white"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => onZoom(-1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg font-bold transition-colors cursor-pointer bg-slate-800 hover:bg-slate-700 text-white"
            aria-label="Zoom out"
          >
            −
          </button>
        </div>
      </div>
    </>
  );
}
