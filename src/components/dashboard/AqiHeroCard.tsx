'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { AirQualityReport, AqiStandardKey, GeoLocation } from '@/domain/types';
import { ActionableHealthGuidance } from './ActionableHealthGuidance';
import { WeatherData } from '@/app/api/weather/route';
import { GLOBE_REFERENCE_CITIES } from '../globe/world-landmass';

// Dynamically import MapLibre 3D Globe with SSR disabled to protect WebGL contexts
const MapLibreGlobe = dynamic(
  () => import('@/components/globe/MapLibreGlobe').then((mod) => mod.MapLibreGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[540px] sm:h-[620px] lg:h-[680px] rounded-3xl flex flex-col items-center justify-center bg-[#0F172A] text-slate-200 gap-3 border border-slate-800/90 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.5)] select-none">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-teal-500 border-t-transparent" />
        <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-widest">
          Loading 3D Planetary Engine...
        </span>
      </div>
    ),
  }
);

interface AqiHeroCardProps {
  readonly report: AirQualityReport;
  readonly weather: WeatherData | null;
  readonly onSwitchStandard: (standard: AqiStandardKey) => void;
  readonly onSelectLocation: (loc: GeoLocation) => void;
  readonly isLoading?: boolean;
  readonly isDefaultLocation?: boolean;
}

export function AqiHeroCard({
  report,
  weather,
  onSwitchStandard,
  onSelectLocation,
  isLoading = false,
  isDefaultLocation = false,
}: AqiHeroCardProps) {
  const {
    location,
    activeStandard,
    providerAqi,
    tier,
    dominantPollutant,
    localTime,
    modelTimestamp,
    coordinates,
    averagingPeriodNote,
  } = report;

  const [viewMode, setViewMode] = useState<'3d' | 'grid'>('3d');
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePos({ x: Math.round(x), y: Math.round(y) });
    }
  };

  const hasAqi = providerAqi !== null;

  // Calculate percentage along the spectrum for the visual marker
  let spectrumPercent = 0;
  if (hasAqi && Number.isFinite(providerAqi) && providerAqi >= 0) {
    if (activeStandard === 'EUROPEAN_EAQI') {
      // European EAQI: strictly 0–100+ scale (Open-Meteo continuous EAQI)
      spectrumPercent = Math.min(100, Math.max(0, (providerAqi / 100) * 100));
    } else {
      // US EPA: strictly 0–500 scale
      spectrumPercent = Math.min(100, Math.max(0, (providerAqi / 500) * 100));
    }
  }

  const feedLabel =
    report.modelMetadata?.domain === 'CAMS_EUROPE' ? 'CAMS Europe Ensemble' : 'CAMS Global IFS';

  const aqiColor = tier ? tier.colorToken : '#059669';

  return (
    <article
      aria-labelledby="hero-aqi-heading"
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden rounded-3xl border border-slate-200/90 shadow-[0_12px_45px_-10px_rgba(15,23,42,0.08)] text-slate-900 transition-all select-none"
      style={{
        backgroundColor: '#F8FAFC',
        backgroundImage: `
          radial-gradient(850px circle at ${mousePos.x}% ${mousePos.y}%, rgba(14, 165, 233, 0.12) 0%, rgba(56, 189, 248, 0.04) 40%, transparent 75%),
          radial-gradient(circle at 82% 32%, ${aqiColor}18 0%, rgba(14, 165, 233, 0.05) 35%, transparent 65%),
          radial-gradient(circle at 18% 78%, rgba(99, 102, 241, 0.06) 0%, transparent 55%),
          linear-gradient(135deg, #FFFFFF 0%, #F0F7FB 45%, #E6F2F8 100%)
        `,
      }}
    >
      {/* Current Modelled Atmospheric Feed Ribbon */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200/80 bg-white/75 backdrop-blur-md px-6 py-2.5 sm:px-8 text-[11px] font-mono text-slate-600">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
            <span
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: aqiColor }}
            />
            {feedLabel}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-sky-700 font-semibold tabular-nums">
            {coordinates.latitude.toFixed(2)}°N, {coordinates.longitude.toFixed(2)}°E
          </span>
          {isLoading && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full animate-pulse">
              <span>🔄 Updating modelled atmospheric feed...</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-slate-500 tabular-nums">Model Run: {modelTimestamp}</span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="font-semibold text-slate-700 tabular-nums">Local: {localTime}</span>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* Main Stage Grid: Left = Modelled Intelligence Deck (40%), Right = Dominant 3D Globe (60%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Refined Glassmorphic Intelligence Deck (40%) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4 z-10">
            {/* Title & Active Region */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-600">
                  Global Environmental Intelligence
                </span>
                <div
                  role="radiogroup"
                  aria-label="Active Air Quality Index Standard"
                  className="inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200 shadow-xs text-[10px] font-mono font-bold"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={activeStandard === 'EUROPEAN_EAQI'}
                    onClick={() => onSwitchStandard('EUROPEAN_EAQI')}
                    className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                      activeStandard === 'EUROPEAN_EAQI'
                        ? 'bg-sky-600 text-white shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    EAQI
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={activeStandard === 'US_EPA'}
                    onClick={() => onSwitchStandard('US_EPA')}
                    className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                      activeStandard === 'US_EPA'
                        ? 'bg-sky-600 text-white shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    US EPA
                  </button>
                </div>
              </div>

              {/* Clean, Uniform Typography */}
              <h1
                id="hero-aqi-heading"
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 font-sans"
              >
                Air Quality Index
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 pt-0.5">
                <span className="tabular-nums">{localTime || 'Modelled estimate'}</span>
                <span>•</span>
                <span className="text-teal-700 font-bold truncate">
                  {location.name}, {location.country} [{location.countryCode}]
                </span>
                {isDefaultLocation && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                    Default Starting Reference (Not your detected location)
                  </span>
                )}
              </div>
            </div>

            {/* Card 1: Main Statistics Card (High Contrast Light Modernism) */}
            <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-500">
                  Main Statistics
                </span>
                {tier && (
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border shadow-xs"
                    style={{
                      backgroundColor: `${tier.colorToken}15`,
                      borderColor: `${tier.colorToken}50`,
                      color: tier.colorToken,
                    }}
                  >
                    {tier.label}
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-3">
                <span
                  className="text-5xl sm:text-6xl font-black font-mono tracking-tight tabular-nums"
                  style={{ color: tier?.colorToken || '#059669' }}
                >
                  {hasAqi ? providerAqi : '--'}
                </span>
                <span className="text-xs font-mono text-slate-500 font-semibold tabular-nums">
                  / {activeStandard === 'EUROPEAN_EAQI'
                    ? '0–100+ Scale (EAQI)'
                    : '0–500 Scale (US EPA)'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-600 pt-2 border-t border-slate-100">
                <span>
                  Dominant: <strong className="text-slate-900 uppercase">{dominantPollutant ? dominantPollutant.toUpperCase() : 'PM2.5'}</strong>
                </span>
                <span>
                  Wind:{' '}
                  <strong className="text-slate-900 tabular-nums">
                    {weather?.windSpeed !== null && weather?.windSpeed !== undefined ? `${weather.windSpeed} km/h` : 'Calm'}
                  </strong>
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {tier?.description || 'Modelled atmospheric composition based on Copernicus Atmosphere Monitoring Service (CAMS) forecasts.'}
              </p>
            </div>

            {/* Card 2: Surface Meteorological Context */}
            <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-500">
                  Surface Meteorological Context
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shadow-2xs bg-slate-100 text-slate-700 border-slate-300">
                  Modelled Surface Data (2m / 10m)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 text-center shadow-2xs">
                  <span className="text-slate-500 block text-[9px] font-bold">TEMP (2m)</span>
                  <span className="text-slate-800 font-bold text-sm tabular-nums">
                    {weather?.temperature !== null && weather?.temperature !== undefined ? `${weather.temperature.toFixed(1)}°C` : '--'}
                  </span>
                </div>
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 text-center shadow-2xs">
                  <span className="text-slate-500 block text-[9px] font-bold">HUMIDITY (2m)</span>
                  <span className="text-slate-800 font-bold text-sm tabular-nums">
                    {weather?.humidity !== null && weather?.humidity !== undefined ? `${weather.humidity}%` : '--'}
                  </span>
                </div>
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 text-center shadow-2xs">
                  <span className="text-slate-500 block text-[9px] font-bold">WIND (10m)</span>
                  <span className="text-slate-800 font-bold text-sm truncate tabular-nums">
                    {weather?.windDirectionCardinal || 'N'} {weather?.windSpeed !== null && weather?.windSpeed !== undefined ? `${weather.windSpeed.toFixed(1)} km/h` : '--'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed border-t border-slate-100 pt-2 font-sans">
                Surface weather parameters from numerical forecast models. Surface winds provide horizontal transport; boundary-layer height and vertical temperature profiles (inversions) require upper-air atmospheric soundings not captured in surface observations.
              </p>
            </div>

            {/* Modelled Grid Coordinate Anchor */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200/70">
              <span>
                Grid Coordinate: <strong className="text-slate-700 tabular-nums">{coordinates.latitude.toFixed(3)}°N, {coordinates.longitude.toFixed(3)}°E</strong>
              </span>
              <span className="text-slate-500 text-[10px]">
                Resolution: {report.modelMetadata?.spatialResolution || '0.4° (~45 km)'}
              </span>
            </div>
          </div>

          {/* Right Column: Dominant MapLibre 3D Globe with Deep Slate Cosmic Grounding (~60%) */}
          <div className="lg:col-span-7 relative flex flex-col items-center justify-center">
            {/* Visual Viewport Header with 2D / 3D Mode Toggle */}
            <div className="w-full flex items-center justify-between px-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
                  Global Environmental Intelligence • 3D Atmospheric Model View
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* View Switcher: 3D Earth Globe vs Accessible 2D Global Grid */}
              <div
                role="group"
                aria-label="Environmental Visualization Mode"
                className="inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200/90 shadow-2xs text-[11px] font-mono font-bold"
              >
                <button
                  type="button"
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    viewMode === '3d'
                      ? 'bg-sky-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌐 3D Globe
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-sky-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📋 Global Grid (2D)
                </button>
              </div>
            </div>

            {/* View Mode 1: Signature MapLibre 3D Globe (Space to Street Zoom) */}
            {viewMode === '3d' && (
              <div className="w-full relative flex items-center justify-center">
                <MapLibreGlobe
                  selectedLocation={location}
                  onSelectLocation={onSelectLocation}
                  aqiColor={tier?.colorToken || '#059669'}
                  aqiTierLabel={tier?.label}
                  currentAqi={providerAqi}
                  theme="light"
                />
              </div>
            )}

            {/* View Mode 2: Accessible 2D Global Reference Grid (Master Spec Section 7.2 & 14.1) */}
            {viewMode === 'grid' && (
              <div className="w-full h-[540px] sm:h-[620px] lg:h-[680px] rounded-2xl border border-slate-200/90 bg-white/90 p-5 overflow-y-auto space-y-3 shadow-lg backdrop-blur-xl">
                <div className="border-b border-slate-200/80 pb-3">
                  <h3 className="text-sm font-bold font-sans text-slate-900">
                    Accessible Global Environmental Estimates
                  </h3>
                  <p className="text-xs text-slate-500">
                    Direct access to planetary reference locations with modelled atmospheric estimates.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {GLOBE_REFERENCE_CITIES.map((c) => {
                    const isCurrent = location.name.toLowerCase() === c.name.toLowerCase();
                    let cityAqi = 42;
                    let cityTier = 'Good';
                    let cityColor = '#059669';

                    if (c.name.includes('Delhi')) {
                      cityAqi = 168;
                      cityTier = 'Unhealthy';
                      cityColor = '#DC2626';
                    } else if (c.name.includes('Beijing')) {
                      cityAqi = 155;
                      cityTier = 'Unhealthy';
                      cityColor = '#DC2626';
                    } else if (c.name.includes('Jakarta')) {
                      cityAqi = 137;
                      cityTier = 'Sensitive';
                      cityColor = '#EA580C';
                    } else if (c.name.includes('New York')) {
                      cityAqi = 56;
                      cityTier = 'Moderate';
                      cityColor = '#D97706';
                    } else if (c.name.includes('Cairo')) {
                      cityAqi = 145;
                      cityTier = 'Sensitive';
                      cityColor = '#EA580C';
                    }

                    return (
                      <div
                        key={c.name}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-sky-50/80 border-sky-400 shadow-sm ring-1 ring-sky-300'
                            : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-slate-800 font-sans">
                            {c.name}, {c.country}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-white shadow-xs tabular-nums"
                            style={{ backgroundColor: cityColor }}
                          >
                            AQI {cityAqi}
                          </span>
                        </div>

                        {/* Reference City Honesty Label */}
                        <div className="mb-2">
                          <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200/80">
                            Global Reference Sample (Demo / Illustrative)
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-3">
                          <span>{cityTier}</span>
                          <span className="tabular-nums">{c.latitude.toFixed(1)}°, {c.longitude.toFixed(1)}°</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onSelectLocation(c);
                            setViewMode('3d');
                          }}
                          disabled={isCurrent}
                          className={`w-full py-1.5 px-3 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-slate-100 text-slate-400 cursor-default'
                              : 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs'
                          }`}
                        >
                          {isCurrent ? 'Current Active Location' : 'Select as Active Location ↵'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Continuous Linear Atmospheric Spectrum Bar */}
        <div className="mt-8 pt-5 border-t border-slate-200/80">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase mb-2">
            <span>
              Index Spectrum Range ({activeStandard === 'EUROPEAN_EAQI' ? 'European EAQI (0–100+ Scale)' : 'US EPA AQI (0–500 Scale)'})
            </span>
            <span className="text-slate-700 font-bold tabular-nums">
              Value: {hasAqi && Number.isFinite(providerAqi) ? `${providerAqi} (${tier?.label || 'Evaluated'})` : 'N/A'}
            </span>
          </div>

          <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-[#059669] via-[#D97706] via-70% to-[#7C3AED] overflow-visible">
            {hasAqi && Number.isFinite(providerAqi) && providerAqi >= 0 && (
              <div
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${spectrumPercent}%` }}
              >
                <div className="w-3.5 h-3.5 bg-white border-2 border-slate-800 rounded-full shadow-md -mt-0.75" />
              </div>
            )}
          </div>

          {activeStandard === 'EUROPEAN_EAQI' ? (
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2 tabular-nums">
              <span>0 Good</span>
              <span>20 Fair</span>
              <span>40 Moderate</span>
              <span>60 Poor</span>
              <span>80 Very Poor</span>
              <span>100+ Extr.</span>
            </div>
          ) : (
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2 tabular-nums">
              <span>0 Good</span>
              <span>50 Mod</span>
              <span>100 Sensitive</span>
              <span>150 Unhealthy</span>
              <span>200 Very Unhealthy</span>
              <span>300+ Haz</span>
            </div>
          )}

          <div className="text-[10px] font-mono text-slate-400 mt-1">
            {activeStandard === 'EUROPEAN_EAQI'
              ? 'European Air Quality Index (0–100+ continuous scale based on EEA 2024 concentration thresholds; evaluated across 5 pollutants, CO excluded).'
              : 'US EPA Air Quality Index (0–500 continuous scale across 6 criteria pollutants; EPA-454/B-18-007).'}
          </div>
        </div>

        {/* Actionable Health Guidance Grid (Light Theme Variant) */}
        <div className="mt-6">
          <ActionableHealthGuidance
            tier={tier}
            dominantPollutant={dominantPollutant}
            variant="light"
          />
        </div>

        <p className="text-[11px] text-slate-500 mt-4 leading-relaxed border-t border-slate-200/80 pt-3">
          {averagingPeriodNote}
        </p>
      </div>
    </article>
  );
}
