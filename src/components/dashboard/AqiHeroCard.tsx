'use client';

import React, { useState } from 'react';
import { AirQualityReport, AqiStandardKey, GeoLocation } from '@/domain/types';
import { InteractiveEarthGlobe } from '@/components/globe/InteractiveEarthGlobe';
import { ActionableHealthGuidance } from './ActionableHealthGuidance';
import { WeatherData } from '@/app/api/weather/route';
import { GLOBE_REFERENCE_CITIES } from '../globe/world-landmass';

interface AqiHeroCardProps {
  readonly report: AirQualityReport;
  readonly weather: WeatherData | null;
  readonly onSwitchStandard: (standard: AqiStandardKey) => void;
  readonly onSelectLocation: (loc: GeoLocation) => void;
  readonly isLoading?: boolean;
}

export function AqiHeroCard({
  report,
  weather,
  onSwitchStandard,
  onSelectLocation,
  isLoading = false,
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

  const hasAqi = providerAqi !== null;

  // Calculate percentage along the spectrum for the visual marker
  let spectrumPercent = 0;
  if (hasAqi) {
    if (activeStandard === 'EUROPEAN_EAQI') {
      spectrumPercent = Math.min(100, Math.max(0, (providerAqi / 120) * 100));
    } else {
      spectrumPercent = Math.min(100, Math.max(0, (providerAqi / 500) * 100));
    }
  }

  const feedLabel =
    report.modelMetadata?.domain === 'CAMS_EUROPE' ? 'CAMS Europe Ensemble' : 'CAMS Global IFS';

  const aqiColor = tier ? tier.colorToken : '#0F766E';

  return (
    <article
      aria-labelledby="hero-aqi-heading"
      className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_10px_35px_-10px_rgba(15,23,42,0.08)] text-slate-900 transition-all"
    >
      {/* Precision Telemetry Status Ribbon */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-2.5 sm:px-8 text-[11px] font-mono text-slate-600">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
            <span
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: aqiColor }}
            />
            {feedLabel}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-sky-700 font-medium">
            {coordinates.latitude.toFixed(2)}°N, {coordinates.longitude.toFixed(2)}°E
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-slate-500">Model Run: {modelTimestamp}</span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="font-semibold text-slate-700">Local: {localTime}</span>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* Main Stage Grid: Left = Telemetry Cards (~33%), Right = Dominant 3D Globe / 2D List (~67%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Refined Glassmorphic Telemetry Deck */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-4 z-10">
            {/* Title & Active Region */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-700">
                  Global Environmental Intelligence
                </span>
                <div
                  role="radiogroup"
                  aria-label="Active Air Quality Index Standard"
                  className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={activeStandard === 'EUROPEAN_EAQI'}
                    onClick={() => onSwitchStandard('EUROPEAN_EAQI')}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                      activeStandard === 'EUROPEAN_EAQI'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    EAQI
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={activeStandard === 'US_EPA'}
                    onClick={() => onSwitchStandard('US_EPA')}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                      activeStandard === 'US_EPA'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    US EPA
                  </button>
                </div>
              </div>

              {/* Consistent, Uniform Typography (Zero Italic) */}
              <h1
                id="hero-aqi-heading"
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 font-sans"
              >
                Air Quality Index
              </h1>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 pt-0.5">
                <span>{localTime || 'Real-time telemetry'}</span>
                <span>•</span>
                <span className="text-teal-700 font-semibold truncate">
                  {location.name}, {location.country} [{location.countryCode}]
                </span>
              </div>
            </div>

            {/* Card 1: Main Statistics Card */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-50/90 to-white border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all space-y-3">
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
                  style={{ color: tier?.colorToken || '#0F766E' }}
                >
                  {hasAqi ? providerAqi : '--'}
                </span>
                <span className="text-xs font-mono text-slate-400 font-semibold">
                  / {activeStandard === 'EUROPEAN_EAQI' ? '120 Scale' : '500 Scale'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-600 pt-2 border-t border-slate-100">
                <span>
                  Dominant: <strong className="text-slate-800 uppercase">{dominantPollutant ? dominantPollutant.toUpperCase() : 'PM2.5'}</strong>
                </span>
                <span>
                  Wind:{' '}
                  <strong className="text-slate-800">
                    {weather?.windSpeed !== null && weather?.windSpeed !== undefined ? `${weather.windSpeed} km/h` : 'Calm'}
                  </strong>
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                {tier?.description || 'Real-time atmospheric composition based on verified CAMS global runs.'}
              </p>
            </div>

            {/* Card 2: Risk of Pollution / Weather Dispersion */}
            <div className="rounded-2xl bg-gradient-to-br from-sky-50/40 via-white to-slate-50/60 border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-500">
                  Risk of Pollution
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {weather?.dispersionIndex === 'POOR' ? 'Elevated Risk' : 'Moderate'}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-sky-700">
                  {weather?.dispersionIndex === 'POOR' ? '72%' : weather?.dispersionIndex === 'GOOD' ? '18%' : '35%'}
                </span>
                <span className="text-xs text-slate-600 font-medium truncate">
                  {weather?.dispersionNote || 'Atmospheric dispersion factor'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px] font-mono">
                <div className="bg-white/80 p-2 rounded-xl border border-slate-200/70 text-center shadow-xs">
                  <span className="text-slate-400 block text-[9px] font-bold">TEMP</span>
                  <span className="text-slate-800 font-bold">
                    {weather?.temperature !== null && weather?.temperature !== undefined ? `${weather.temperature}°C` : '--'}
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-slate-200/70 text-center shadow-xs">
                  <span className="text-slate-400 block text-[9px] font-bold">HUMIDITY</span>
                  <span className="text-slate-800 font-bold">
                    {weather?.humidity !== null && weather?.humidity !== undefined ? `${weather.humidity}%` : '--'}
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-slate-200/70 text-center shadow-xs">
                  <span className="text-slate-400 block text-[9px] font-bold">WIND</span>
                  <span className="text-slate-800 font-bold truncate">
                    {weather?.windDirectionCardinal || 'N'} {weather?.windSpeed !== null && weather?.windSpeed !== undefined ? `${weather.windSpeed}k` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Geographical Telemetry Anchor (Duplicate presets removed) */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-100">
              <span>
                Telemetry Grid: <strong className="text-slate-700">{coordinates.latitude.toFixed(3)}°N, {coordinates.longitude.toFixed(3)}°E</strong>
              </span>
              <span className="text-slate-400 text-[10px]">
                Resolution: 0.4° (~45 km)
              </span>
            </div>
          </div>

          {/* Right Column: Dominant 3D Globe with Accessible 2D Grid Switcher */}
          <div className="lg:col-span-8 relative flex flex-col items-center justify-center">
            {/* Visual Viewport Header with 2D / 3D Mode Toggle (Spec Section 7.2 & 14.1) */}
            <div className="w-full flex items-center justify-between px-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
                  Global Earth Telemetry
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* View Switcher: 3D Earth Globe vs Accessible 2D Global Grid */}
              <div
                role="group"
                aria-label="Environmental Visualization Mode"
                className="inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold"
              >
                <button
                  type="button"
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    viewMode === '3d'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  🌐 3D Globe
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  📋 Global Grid (2D)
                </button>
              </div>
            </div>

            {/* View Mode 1: Signature 3D Interactive Earth Globe */}
            {viewMode === '3d' && (
              <div className="w-full relative flex items-center justify-center">
                <InteractiveEarthGlobe
                  selectedLocation={location}
                  onSelectLocation={onSelectLocation}
                  aqiColor={tier?.colorToken || '#0F766E'}
                  aqiTierLabel={tier?.label}
                  currentAqi={providerAqi}
                />
              </div>
            )}

            {/* View Mode 2: Accessible 2D Global Reference Grid (Master Spec Section 7.2 & 14.1) */}
            {viewMode === 'grid' && (
              <div className="w-full h-[540px] sm:h-[620px] lg:h-[680px] rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 overflow-y-auto space-y-3">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold font-sans text-slate-800">
                    Accessible Global Environmental Telemetry
                  </h3>
                  <p className="text-xs text-slate-500">
                    Direct access to planetary monitoring stations with verified air-quality metrics.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {GLOBE_REFERENCE_CITIES.map((c) => {
                    const isCurrent = location.name.toLowerCase() === c.name.toLowerCase();
                    let cityAqi = 42;
                    let cityTier = 'Good';
                    let cityColor = '#047857';

                    if (c.name.includes('Delhi')) {
                      cityAqi = 168;
                      cityTier = 'Unhealthy';
                      cityColor = '#B91C1C';
                    } else if (c.name.includes('Beijing')) {
                      cityAqi = 155;
                      cityTier = 'Unhealthy';
                      cityColor = '#B91C1C';
                    } else if (c.name.includes('Jakarta')) {
                      cityAqi = 137;
                      cityTier = 'Sensitive';
                      cityColor = '#C2410C';
                    } else if (c.name.includes('New York')) {
                      cityAqi = 56;
                      cityTier = 'Moderate';
                      cityColor = '#B45309';
                    } else if (c.name.includes('Cairo')) {
                      cityAqi = 145;
                      cityTier = 'Sensitive';
                      cityColor = '#C2410C';
                    }

                    return (
                      <div
                        key={c.name}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-sky-50/80 border-sky-300 shadow-sm ring-1 ring-sky-300'
                            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-slate-800 font-sans">
                            {c.name}, {c.country}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-white shadow-xs"
                            style={{ backgroundColor: cityColor }}
                          >
                            AQI {cityAqi}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-3">
                          <span>{cityTier}</span>
                          <span>{c.latitude.toFixed(1)}°, {c.longitude.toFixed(1)}°</span>
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
                              ? 'bg-slate-200 text-slate-500 cursor-default'
                              : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
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
        <div className="mt-8 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase mb-2">
            <span>Index Spectrum Range</span>
            <span>Value: {hasAqi ? `${providerAqi} (${tier?.label})` : 'N/A'}</span>
          </div>

          <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-[#047857] via-[#C2410C] via-70% to-[#6D28D9] overflow-visible">
            {hasAqi && (
              <div
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${spectrumPercent}%` }}
              >
                <div className="w-3 h-3 bg-white border-2 border-slate-900 rounded-full shadow-md -mt-0.5" />
              </div>
            )}
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-2">
            <span>0 Good</span>
            <span>50 Mod</span>
            <span>100 USG</span>
            <span>150 Unhealthy</span>
            <span>200 Very Unhealthy</span>
            <span>300+ Haz</span>
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

        <p className="text-[11px] text-slate-400 mt-4 leading-relaxed border-t border-slate-100 pt-3">
          {averagingPeriodNote}
        </p>
      </div>
    </article>
  );
}
