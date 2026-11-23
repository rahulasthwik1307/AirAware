'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { AirQualityReport, AqiStandardKey, GeoLocation } from '@/domain/types';
import { calculateCompositeCpcbAqi } from '@/domain/aqi/cpcb-benchmark';
import { WeatherData } from '@/app/api/weather/route';
import { AtmosphericSpectrumBar } from './AtmosphericSpectrumBar';
import { SourceRibbon } from './hero/SourceRibbon';
import { ViewSwitcher } from './hero/ViewSwitcher';
import { OverviewPanel } from './hero/OverviewPanel';
import { HERO_RIGHT_PANEL_HEIGHT_CLASS } from './hero/constants';
import type { HeroViewMode } from './hero/types';
import {
  useAnimatedNumber,
  formatDataAge,
  computeGrapInfo,
} from './hero/hero-helpers';
import { HeroAtmosphericCard } from './hero/HeroAtmosphericCard';
import { RapidExposureWindow } from './hero/RapidExposureWindow';
import { CpcbBenchmarkBanner } from './hero/CpcbBenchmarkBanner';

export { HERO_RIGHT_PANEL_HEIGHT_CLASS };

import { LazyGlobePanel, LazyRegionalComparePanel } from './hero/LazyHeroPanels';

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

  const [selectedStandard, setSelectedStandard] = useState<'CPCB_NAQI' | 'US_EPA'>('CPCB_NAQI');
  const [activeView, setActiveView] = useState<HeroViewMode>('overview');

  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePos({ x: Math.round(x), y: Math.round(y) });
    }
  }, []);

  const isCpcbActive = selectedStandard === 'CPCB_NAQI';
  const isStation = report.sourceType === 'station';

  const stationMeasuredPm10 = useMemo(() => {
    return isStation
      ? (report.pollutants?.pm10?.isStationMeasurement ? report.pollutants?.pm10?.concentration : null)
      : report.pollutants?.pm10?.concentration;
  }, [isStation, report.pollutants?.pm10]);

  const cpcbResult = useMemo(() => {
    return calculateCompositeCpcbAqi(
      report.pollutants?.pm2_5?.concentration,
      stationMeasuredPm10,
      isStation
    );
  }, [report.pollutants?.pm2_5?.concentration, stationMeasuredPm10, isStation]);

  const effectiveAqi = isCpcbActive
    ? (cpcbResult.aqi ?? providerAqi)
    : providerAqi;

  const hasAqi = effectiveAqi !== null;
  const isIndia = location.countryCode === 'IN' || location.country.toLowerCase().includes('india');
  const animatedAqi = useAnimatedNumber(hasAqi ? effectiveAqi : null);
  const displayAqi = hasAqi ? (animatedAqi ?? effectiveAqi) : null;

  const effectiveTierLabel = useMemo(() => {
    return isCpcbActive
      ? (cpcbResult.category !== 'Unavailable' ? cpcbResult.category : (tier?.label ?? 'Moderate'))
      : (tier ? tier.label : 'Moderate');
  }, [isCpcbActive, cpcbResult.category, tier]);

  const aqiColor = useMemo(() => {
    return isCpcbActive
      ? (cpcbResult.colorToken !== 'var(--ink-muted)' ? cpcbResult.colorToken : (tier?.colorToken ?? '#059669'))
      : (tier ? tier.colorToken : '#059669');
  }, [isCpcbActive, cpcbResult.colorToken, tier]);

  // Calculate percentage along the spectrum for the visual marker (strictly 0–500 scale)
  const spectrumPercent = useMemo(() => {
    if (hasAqi && Number.isFinite(effectiveAqi) && effectiveAqi >= 0) {
      return Math.min(100, Math.max(0, (effectiveAqi / 500) * 100));
    }
    return 0;
  }, [hasAqi, effectiveAqi]);

  // Graded Response Action Plan (GRAP) for Delhi-NCR, or Standard Clean Air Advisory for other Indian Cities
  const isDelhiNcr = useMemo(() => {
    return (
      isIndia &&
      /delhi|noida|gurugram|gurgaon|ghaziabad|faridabad|rohtak/i.test(
        location.name + ' ' + (location.admin1 || '')
      )
    );
  }, [isIndia, location.name, location.admin1]);

  const grapInfo = useMemo(() => {
    return computeGrapInfo(providerAqi, isIndia, isDelhiNcr);
  }, [providerAqi, isIndia, isDelhiNcr]);

  // SVG Gauge calculations
  const gaugeRadius = 40;
  const gaugeCircumference = Math.PI * gaugeRadius; // Semi-circle arc
  const gaugeStrokeDashoffset = gaugeCircumference - (gaugeCircumference * (spectrumPercent / 100));

  const handleSwitchToOverview = useCallback(() => {
    setActiveView('overview');
  }, []);

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
      {/* Current In-Situ Ground Station or Modelled Atmospheric Feed Ribbon with Explicit Provenance */}
      <SourceRibbon report={report} aqiColor={aqiColor} isLoading={isLoading} />

      <div className="p-6 sm:p-8">
        {/* Main Stage Grid: Left = Compact Intelligence Deck (5/12 ~ 41.7%), Right = Dominant 3D Globe / Overview (7/12 ~ 58.3%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start lg:items-stretch">
          {/* Left Column: Focused Intelligence Deck (5/12) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4 z-10 h-full">
            {/* Title & Active Region */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h1
                  id="hero-aqi-heading"
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 font-sans"
                >
                  Air Quality Index
                </h1>
                <div
                  role="radiogroup"
                  aria-label="Active Air Quality Index Standard"
                  className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 shadow-xs text-xs font-mono font-bold"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isCpcbActive}
                    onClick={() => setSelectedStandard('CPCB_NAQI')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer tactile-btn ${
                      isCpcbActive
                        ? 'bg-emerald-700 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🇮🇳 CPCB NAQI
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={!isCpcbActive}
                    onClick={() => {
                      setSelectedStandard('US_EPA');
                      onSwitchStandard('US_EPA');
                    }}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer tactile-btn ${
                      !isCpcbActive
                        ? 'bg-sky-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    US EPA
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-mono text-slate-600 pt-0.5">
                <span className="tabular-nums font-semibold">Observed: {localTime || modelTimestamp}</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] text-slate-700 font-semibold border border-slate-200">
                  {formatDataAge(modelTimestamp)}
                </span>
                <span>•</span>
                <span className="text-teal-700 font-bold truncate">
                  {location.name}, {location.country} [{location.countryCode}]
                </span>
                {isDefaultLocation && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                    Default Starting Reference (Not your detected location)
                  </span>
                )}
              </div>

              {/* India CPCB NAQI Benchmark Highlight Banner */}
              {report.cpcbComparison && (
                <CpcbBenchmarkBanner
                  cpcbComparison={report.cpcbComparison}
                  isStation={isStation}
                  stationMeasuredPm10={stationMeasuredPm10}
                />
              )}
            </div>

            {/* Flagship Atmospheric Intelligence Card (Sleek, Compact Height & Highly Visual) */}
            <HeroAtmosphericCard
              aqiColor={aqiColor}
              effectiveTierLabel={effectiveTierLabel}
              gaugeRadius={gaugeRadius}
              gaugeCircumference={gaugeCircumference}
              gaugeStrokeDashoffset={gaugeStrokeDashoffset}
              providerAqi={providerAqi}
              dominantPollutant={dominantPollutant}
              hasAqi={hasAqi}
              displayAqi={displayAqi}
              isCpcbActive={isCpcbActive}
              tierDescription={tier?.description}
              effectiveAqi={effectiveAqi}
              grapInfo={grapInfo}
              weather={weather}
              coordinates={coordinates}
              spatialResolution={report.modelMetadata?.spatialResolution}
            />
          </div>

          {/* Right Column: 3-Option Segmented Control (Overview | Regional compare | 3D globe) */}
          <div className="lg:col-span-7 relative flex flex-col lg:justify-end gap-2.5 h-full">
            {/* Visual Viewport Header with 3-Option Segmented Control */}
            <ViewSwitcher activeView={activeView} onSelectView={setActiveView} />

            {/* Panel 1: Overview */}
            {activeView === 'overview' && (
              <OverviewPanel
                report={report}
                effectiveTierLabel={effectiveTierLabel}
                dominantPollutant={dominantPollutant}
                aqiColor={aqiColor}
                isStation={isStation}
              />
            )}

            {/* Panel 2: Regional compare (Lazy loaded) */}
            {activeView === 'compare' && (
              <LazyRegionalComparePanel
                location={location}
                onSelectLocation={onSelectLocation}
                onSwitchToOverview={handleSwitchToOverview}
                aqiColor={aqiColor}
                effectiveTierLabel={effectiveTierLabel}
                displayAqi={displayAqi}
                effectiveAqi={effectiveAqi}
                isStation={isStation}
              />
            )}

            {/* Panel 3: MapLibre 3D Globe (Lazy loaded) */}
            {activeView === 'globe' && (
              <LazyGlobePanel
                selectedLocation={location}
                onSelectLocation={onSelectLocation}
                aqiColor={aqiColor}
                effectiveTierLabel={effectiveTierLabel}
                effectiveAqi={effectiveAqi}
              />
            )}
          </div>
        </div>

        {/* Rapid 6-Hour Exposure Window — ALWAYS VISIBLE under the hero */}
        <RapidExposureWindow forecast={report.forecast} />

        {/* Enhanced Calibrated Precision Atmospheric Spectrum Bar */}
        <AtmosphericSpectrumBar
          activeStandard={activeStandard}
          hasAqi={hasAqi}
          effectiveAqi={effectiveAqi}
          effectiveTierLabel={effectiveTierLabel}
          spectrumPercent={spectrumPercent}
          aqiColor={aqiColor}
          providerAqi={providerAqi}
          tierLabel={tier?.label}
        />

        <p className="text-xs text-slate-500 mt-4 leading-relaxed border-t border-slate-200/80 pt-3">
          {averagingPeriodNote}
        </p>
      </div>
    </article>
  );
}
