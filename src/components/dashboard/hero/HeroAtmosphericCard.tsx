'use client';

import React from 'react';
import { WeatherData } from '@/app/api/weather/route';
import { GrapInfo, formatPollutantSymbol } from './hero-helpers';

interface HeroAtmosphericCardProps {
  readonly aqiColor: string;
  readonly effectiveTierLabel: string;
  readonly gaugeRadius: number;
  readonly gaugeCircumference: number;
  readonly gaugeStrokeDashoffset: number;
  readonly providerAqi: number | null;
  readonly dominantPollutant?: string | null;
  readonly hasAqi: boolean;
  readonly displayAqi: number | null;
  readonly isCpcbActive: boolean;
  readonly tierDescription?: string;
  readonly effectiveAqi: number | null;
  readonly grapInfo: GrapInfo | null;
  readonly weather: WeatherData | null;
  readonly coordinates: { latitude: number; longitude: number };
  readonly spatialResolution?: string;
}

export function HeroAtmosphericCard({
  aqiColor,
  effectiveTierLabel,
  gaugeRadius,
  gaugeCircumference,
  gaugeStrokeDashoffset,
  providerAqi,
  dominantPollutant,
  hasAqi,
  displayAqi,
  isCpcbActive,
  tierDescription,
  effectiveAqi,
  grapInfo,
  weather,
  coordinates,
  spatialResolution,
}: HeroAtmosphericCardProps) {
  return (
    <div
      className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-5.5 shadow-md hover:shadow-lg transition-all space-y-3.5"
      style={{
        boxShadow: `0 14px 32px -12px ${aqiColor}22`,
      }}
    >
      {/* Header inside card */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 font-sans">
            Current Air Quality
          </span>
        </div>
        <span
          className="px-3 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border shadow-xs inline-flex items-center gap-1.5"
          style={{
            backgroundColor: `${aqiColor}15`,
            borderColor: `${aqiColor}50`,
            color: aqiColor,
          }}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: aqiColor }} />
          {effectiveTierLabel}
        </span>
      </div>

      {/* Dynamic Severity Gauge + Large AQI Display */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {/* Visual Radial Meter (Compact 96px) */}
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            {/* Background Track Arc */}
            <circle
              cx="50"
              cy="50"
              r={gaugeRadius}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Active Gauge Arc */}
            <circle
              cx="50"
              cy="50"
              r={gaugeRadius}
              fill="none"
              stroke={aqiColor}
              strokeWidth="8"
              strokeDasharray={gaugeCircumference * 2}
              strokeDashoffset={gaugeStrokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          {/* Center Visual Indicator */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none">
            <span className="text-xl leading-none" aria-hidden="true">
              {providerAqi !== null && providerAqi > 300
                ? '🚨'
                : providerAqi !== null && providerAqi > 200
                ? '⚠️'
                : providerAqi !== null && providerAqi > 100
                ? '😷'
                : providerAqi !== null && providerAqi > 50
                ? '🌤️'
                : '🌿'}
            </span>
            <span
              className="text-[9px] font-mono font-bold uppercase mt-1 px-1.5 py-0.5 rounded border shadow-2xs leading-none"
              style={{
                color: aqiColor,
                backgroundColor: `${aqiColor}12`,
                borderColor: `${aqiColor}35`,
              }}
            >
              {formatPollutantSymbol(dominantPollutant)}
            </span>
          </div>
        </div>

        {/* Metric Summary & Health Directives */}
        <div className="flex-1 space-y-1.5 text-center sm:text-left">
          <div className="flex flex-wrap items-baseline justify-center sm:justify-start gap-2">
            <span
              className="text-4xl sm:text-5xl font-black font-mono tracking-tight tabular-nums"
              style={{ color: aqiColor }}
            >
              {hasAqi ? displayAqi : '--'}
            </span>
            <span className="text-xs font-mono text-slate-500 font-bold tabular-nums">
              / {isCpcbActive ? '0–500 Scale (CPCB NAQI India)' : '0–500 Scale (US EPA)'}
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium">
            {tierDescription || 'Modelled atmospheric composition based on Copernicus Atmosphere Monitoring Service (CAMS) forecasts.'}
          </p>
        </div>
      </div>

      {/* Health Advisory Alert Banner (Full Card Width) */}
      <div className="pt-0.5 w-full">
        {(effectiveAqi !== null && effectiveAqi > 200) || (providerAqi !== null && providerAqi > 200) ? (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-rose-50/90 border border-rose-200 text-rose-900 shadow-2xs">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 text-[11px] font-bold font-mono shrink-0 whitespace-nowrap">
              <span aria-hidden="true">🛡️</span>
              <span>Urgent</span>
            </span>
            <span className="text-xs font-sans font-semibold text-rose-900 leading-snug">
              N95/FFP2 Respirator Required
            </span>
          </div>
        ) : (effectiveAqi !== null && effectiveAqi > 100) || (providerAqi !== null && providerAqi > 100) ? (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50/90 border border-amber-300/80 text-amber-900 shadow-2xs">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[11px] font-bold font-mono shrink-0 whitespace-nowrap">
              <span aria-hidden="true">⚠️</span>
              <span>Caution</span>
            </span>
            <span className="text-xs font-sans font-semibold text-amber-900 leading-snug">
              Sensitive members limit morning exertion
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 shadow-2xs">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[11px] font-bold font-mono shrink-0 whitespace-nowrap">
              <span aria-hidden="true">✓</span>
              <span>Standard</span>
            </span>
            <span className="text-xs font-sans font-semibold text-emerald-900 leading-snug">
              Favorable air for routine family activities
            </span>
          </div>
        )}
      </div>

      {/* Indian Graded Response Action Plan (GRAP) Protocol Banner */}
      {grapInfo && (
        <div
          className="p-2.5 rounded-xl border text-xs font-mono space-y-0.5 transition-all"
          style={{
            backgroundColor: grapInfo.bgColor,
            borderColor: grapInfo.borderColor,
            color: grapInfo.color,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <span>🏛️</span>
              <span>{grapInfo.stage}</span>
            </span>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-2xs"
              style={{ backgroundColor: grapInfo.color }}
            >
              {grapInfo.badge}
            </span>
          </div>
          <p className="text-slate-800 font-sans text-xs font-medium leading-relaxed">
            {grapInfo.action}
          </p>
        </div>
      )}

      {/* Surface Meteorological Context Matrix (4 Clean Elevated Metric Tiles) */}
      <div className="pt-2.5 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 font-sans">
            Surface Weather (2m / 10m)
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium border bg-slate-100 text-slate-700 border-slate-300">
            Modelled Surface Feed
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80 text-center">
            <span className="text-slate-500 block text-[11px] font-semibold">🔬 Dominant</span>
            <span className="text-slate-900 font-bold text-xs sm:text-sm uppercase truncate">
              {dominantPollutant ? dominantPollutant.toUpperCase() : 'PM2.5'}
            </span>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80 text-center">
            <span className="text-slate-500 block text-[11px] font-semibold">🌡️ Temp</span>
            <span className="text-slate-900 font-bold text-xs sm:text-sm tabular-nums">
              {weather?.temperature !== null && weather?.temperature !== undefined ? `${weather.temperature.toFixed(1)}°C` : '--'}
            </span>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80 text-center">
            <span className="text-slate-500 block text-[11px] font-semibold">💧 Humidity</span>
            <span className="text-slate-900 font-bold text-xs sm:text-sm tabular-nums">
              {weather?.humidity !== null && weather?.humidity !== undefined ? `${weather.humidity}%` : '--'}
            </span>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80 text-center">
            <span className="text-slate-500 block text-[11px] font-semibold">💨 Wind</span>
            <span className="text-slate-900 font-bold text-xs sm:text-sm truncate tabular-nums">
              {weather?.windDirectionCardinal || 'N'} {weather?.windSpeed !== null && weather?.windSpeed !== undefined ? `${weather.windSpeed.toFixed(1)}k` : '--'}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed pt-0.5 font-sans">
          Surface weather parameters from numerical forecast models. Surface winds provide horizontal transport; boundary-layer height and vertical temperature profiles (inversions) determine whether smog stays trapped near street level.
        </p>
      </div>

      {/* Modelled Grid Coordinate Anchor */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-600 pt-1.5 border-t border-slate-100">
        <span>
          Grid: <strong className="text-slate-800 tabular-nums">{coordinates.latitude.toFixed(3)}°N, {coordinates.longitude.toFixed(3)}°E</strong>
        </span>
        <span className="text-slate-500 text-xs">
          Res: {spatialResolution || '0.4° (~45 km)'}
        </span>
      </div>
    </div>
  );
}
