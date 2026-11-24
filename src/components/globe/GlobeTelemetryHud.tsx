'use client';

import React from 'react';
import { LocationInspectData } from './maplibre-styles';
import { formatLocationSubtitle } from './maplibre-helpers';

export interface GlobeTelemetryHudProps {
  readonly inspectData: LocationInspectData;
  readonly onClose: () => void;
  readonly onSelectLocation: (data: LocationInspectData) => void;
}

/**
 * Floating interactive environmental intelligence preview HUD.
 * Renders AQI gauge, micro-weather parameters, health advisories, and focus trigger.
 *
 * @param props - telemetry data, close handler, and location selection callback
 */
export function GlobeTelemetryHud({
  inspectData,
  onClose,
  onSelectLocation,
}: GlobeTelemetryHudProps) {
  const inspectTitle = inspectData.name;
  const inspectSubtitle = formatLocationSubtitle(inspectData);

  return (
    <div
      role="dialog"
      aria-label="Environmental Intelligence Preview"
      className="absolute top-14 right-3 sm:right-5 max-w-[230px] w-full p-2.5 rounded-2xl shadow-[0_16px_36px_-6px_rgba(0,0,0,0.85)] z-30 animate-fadeIn pointer-events-auto transition-all bg-slate-900 border border-slate-700/80 text-white select-none"
    >
      {/* Header Row: City / Place Name, Coordinates & Close */}
      <div className="flex items-center justify-between gap-1.5 pb-1 mb-1 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: inspectData.tierColor }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2 border border-white/90 shadow-2xs"
              style={{ backgroundColor: inspectData.tierColor }}
            />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h4 className="font-extrabold text-[12px] font-sans leading-tight truncate text-white">
                {inspectTitle}
              </h4>
              {inspectData.isReferenceSample && (
                <span className="shrink-0 px-1 py-0.2 rounded text-[7.5px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Sample
                </span>
              )}
            </div>
            <span className="text-[8.5px] font-mono leading-tight block truncate text-slate-400">
              {inspectSubtitle}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-4 h-4 rounded-full flex items-center justify-center transition-colors text-xs font-bold leading-none cursor-pointer shrink-0 text-slate-400 hover:text-white hover:bg-white/10"
          aria-label="Close preview"
        >
          ×
        </button>
      </div>

      {/* Consolidated Telemetry Cockpit (AQI Centerpiece + Micro-Weather in 1 Row) */}
      <div className="flex items-center justify-between gap-1.5 p-1.5 rounded-xl border border-slate-700/60 bg-slate-800/60 mb-1.5">
        {/* Left: Highlighted AQI Centerpiece */}
        <div className="flex items-center gap-1.5">
          <span
            className="text-2xl font-black font-mono tracking-tight tabular-nums leading-none"
            style={{ color: inspectData.tierColor }}
          >
            {inspectData.aqi}
          </span>
          <div className="flex flex-col">
            <span
              className="px-1.5 py-0.2 rounded text-[7.5px] font-mono font-extrabold uppercase tracking-wider border leading-tight"
              style={{
                backgroundColor: `${inspectData.tierColor}20`,
                borderColor: `${inspectData.tierColor}60`,
                color: inspectData.tierColor,
              }}
            >
              {inspectData.tier}
            </span>
            <span className="text-[7px] font-mono uppercase tracking-wider text-slate-400 mt-0.5">
              US EPA AQI
            </span>
          </div>
        </div>

        {/* Right: Micro Weather Telemetry Strip */}
        <div className="flex items-center gap-1.5 border-l border-slate-700/60 pl-2 text-[9px] font-mono">
          <div className="flex flex-col items-center">
            <span className="text-[6.5px] text-slate-400 uppercase leading-none">TEMP</span>
            <span className="font-bold text-white tabular-nums">{inspectData.temperature}°C</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[6.5px] text-slate-400 uppercase leading-none">HUM</span>
            <span className="font-bold text-white tabular-nums">{inspectData.humidity}%</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[6.5px] text-slate-400 uppercase leading-none">WIND</span>
            <span className="font-bold text-white tabular-nums">{inspectData.windSpeed}k</span>
          </div>
        </div>
      </div>

      {/* Actionable Health Insight (Compact 1-Line) */}
      <div className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-[8.5px] leading-tight mb-1.5 border bg-sky-950/30 border-sky-500/25 text-sky-200">
        <span className="text-[9.5px] shrink-0" aria-hidden="true">
          🛡️
        </span>
        <p className="font-medium truncate">{inspectData.healthAction}</p>
      </div>

      {/* Action Trigger Button */}
      <button
        type="button"
        onClick={() => onSelectLocation(inspectData)}
        className="w-full py-1.5 px-2 rounded-lg bg-linear-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 active:scale-[0.98] text-white font-mono font-bold text-[10px] tracking-wide transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-1"
      >
        <span>🎯 Focus &amp; Select Location</span>
        <span className="text-[9px]">↵</span>
      </button>
    </div>
  );
}
