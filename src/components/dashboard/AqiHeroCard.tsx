'use client';

import React from 'react';
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
    standardMetadata,
    providerAqi,
    tier,
    dominantPollutant,
    localTime,
    modelTimestamp,
    coordinates,
    averagingPeriodNote,
  } = report;

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
      className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#070B14] shadow-2xl text-white transition-all"
      style={{
        backgroundImage: `
          radial-gradient(ellipse 60% 40% at 10% 10%, rgba(14, 116, 144, 0.18) 0%, transparent 70%),
          radial-gradient(ellipse 50% 50% at 85% 50%, rgba(2, 132, 199, 0.14) 0%, transparent 70%),
          linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 100% 100%, 40px 40px, 40px 40px',
      }}
    >
      {/* Precision Telemetry Status Ribbon */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 bg-slate-950/60 px-5 py-2.5 sm:px-8 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 font-bold text-slate-200">
            <span
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: aqiColor }}
            />
            {feedLabel}
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-sky-400">
            {coordinates.latitude.toFixed(2)}°N, {coordinates.longitude.toFixed(2)}°E
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">Model Run: {modelTimestamp}</span>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="font-semibold text-teal-300">Local: {localTime}</span>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* Main Stage Grid: Left = Compact Telemetry Cards, Right = Dominant Real 3D Earth Globe */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Compact Glassmorphic Telemetry Deck (Occupies ~33% width) */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-4 z-10">
            {/* Title & Active Region */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-400">
                  Global Environmental Intelligence
                </span>
                <div
                  role="radiogroup"
                  aria-label="Active Air Quality Index Standard"
                  className="inline-flex p-0.5 rounded-lg bg-slate-900/90 border border-slate-800"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={activeStandard === 'EUROPEAN_EAQI'}
                    onClick={() => onSwitchStandard('EUROPEAN_EAQI')}
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                      activeStandard === 'EUROPEAN_EAQI'
                        ? 'bg-sky-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    EAQI
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={activeStandard === 'US_EPA'}
                    onClick={() => onSwitchStandard('US_EPA')}
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                      activeStandard === 'US_EPA'
                        ? 'bg-sky-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    US EPA
                  </button>
                </div>
              </div>

              <h1
                id="hero-aqi-heading"
                className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-sans flex items-baseline gap-2"
              >
                Air Quality <span className="font-light italic text-slate-400">Index</span>
              </h1>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pt-0.5">
                <span>{localTime || 'Real-time telemetry'}</span>
                <span>•</span>
                <span className="text-teal-300 font-semibold truncate">
                  {location.name}, {location.country} [{location.countryCode}]
                </span>
              </div>
            </div>

            {/* Card 1: Main Statistics Card (Matches Image 3) */}
            <div className="rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-400">
                  Main Statistics
                </span>
                {tier && (
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border shadow-xs"
                    style={{
                      backgroundColor: `${tier.colorToken}20`,
                      borderColor: `${tier.colorToken}60`,
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
                  style={{ color: tier?.colorToken || '#38BDF8' }}
                >
                  {hasAqi ? providerAqi : '--'}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  / {activeStandard === 'EUROPEAN_EAQI' ? '120 Scale' : '500 Scale'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-300 pt-1 border-t border-slate-800/80">
                <span>
                  Dominant: <strong className="text-sky-300 uppercase">{dominantPollutant ? dominantPollutant.toUpperCase() : 'PM2.5'}</strong>
                </span>
                <span>
                  Wind:{' '}
                  <strong className="text-sky-300">
                    {weather?.windSpeed !== null && weather?.windSpeed !== undefined ? `${weather.windSpeed} km/h` : 'Calm'}
                  </strong>
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {tier?.description || 'Real-time atmospheric composition based on verified CAMS global runs.'}
              </p>
            </div>

            {/* Card 2: Risk of Pollution / Weather Dispersion (Matches Image 3) */}
            <div className="rounded-2xl bg-linear-to-br from-slate-900/90 to-[#0A1A2E]/90 backdrop-blur-xl border border-slate-800/80 p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-400">
                  Risk of Pollution
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {weather?.dispersionIndex === 'POOR' ? 'Elevated Risk' : 'Moderate'}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-sky-400">
                  {weather?.dispersionIndex === 'POOR' ? '72%' : weather?.dispersionIndex === 'GOOD' ? '18%' : '35%'}
                </span>
                <span className="text-xs text-slate-300 font-medium truncate">
                  {weather?.dispersionNote || 'Atmospheric dispersion factor'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-slate-500 block text-[9px]">TEMP</span>
                  <span className="text-slate-200 font-bold">
                    {weather?.temperature !== null && weather?.temperature !== undefined ? `${weather.temperature}°C` : '--'}
                  </span>
                </div>
                <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-slate-500 block text-[9px]">HUMIDITY</span>
                  <span className="text-slate-200 font-bold">
                    {weather?.humidity !== null && weather?.humidity !== undefined ? `${weather.humidity}%` : '--'}
                  </span>
                </div>
                <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-slate-500 block text-[9px]">WIND</span>
                  <span className="text-slate-200 font-bold truncate">
                    {weather?.windDirectionCardinal || 'N'} {weather?.windSpeed !== null && weather?.windSpeed !== undefined ? `${weather.windSpeed}km/h` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Coordinates & Preset Pivots */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-3">
                <span>
                  X: <strong className="text-sky-400">{coordinates.latitude.toFixed(4)}</strong>
                </span>
                <span>
                  Y: <strong className="text-sky-400">{coordinates.longitude.toFixed(4)}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase text-slate-500">Pivot:</span>
                {['New Delhi', 'New York', 'London', 'Tokyo', 'Paris'].map((cityName) => (
                  <button
                    key={cityName}
                    type="button"
                    onClick={() => {
                      const target = GLOBE_REFERENCE_CITIES.find((c) => c.name === cityName);
                      if (target) onSelectLocation(target);
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded transition-all cursor-pointer ${
                      location.name === cityName
                        ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50 font-bold'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {cityName}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Dominant Real 3D Earth Globe (Occupies ~67% width) */}
          <div className="lg:col-span-8 relative flex items-center justify-center">
            <InteractiveEarthGlobe
              selectedLocation={location}
              onSelectLocation={onSelectLocation}
              aqiColor={tier?.colorToken || '#0F766E'}
              aqiTierLabel={tier?.label}
              currentAqi={providerAqi}
            />
          </div>
        </div>

        {/* Continuous Linear Atmospheric Spectrum Bar */}
        <div className="mt-8 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase mb-2">
            <span>Index Spectrum Range</span>
            <span>Value: {hasAqi ? `${providerAqi} (${tier?.label})` : 'N/A'}</span>
          </div>

          <div className="relative h-2.5 w-full rounded-sm bg-linear-to-r from-[#047857] via-[#C2410C] via-70% to-[#6D28D9] overflow-visible">
            {hasAqi && (
              <div
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${spectrumPercent}%` }}
              >
                <div className="w-2 h-4 bg-white border border-slate-900 rounded-xs shadow-md" />
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

        {/* Actionable Health Guidance Grid */}
        <div className="mt-6">
          <ActionableHealthGuidance
            tier={tier}
            dominantPollutant={dominantPollutant}
          />
        </div>

        <p className="text-[11px] text-slate-400 mt-4 leading-relaxed border-t border-slate-800/80 pt-3">
          {averagingPeriodNote}
        </p>
      </div>
    </article>
  );
}
