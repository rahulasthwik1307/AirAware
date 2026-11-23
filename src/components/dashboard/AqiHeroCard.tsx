'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { AirQualityReport, AqiStandardKey, GeoLocation } from '@/domain/types';
import { calculateCompositeCpcbAqi } from '@/domain/aqi/cpcb-benchmark';
import { WeatherData } from '@/app/api/weather/route';
import { AtmosphericSpectrumBar } from './AtmosphericSpectrumBar';
import { SourceRibbon } from './hero/SourceRibbon';
import { ViewSwitcher } from './hero/ViewSwitcher';
import { OverviewPanel } from './hero/OverviewPanel';
import { HERO_RIGHT_PANEL_HEIGHT_CLASS } from './hero/constants';
import type { HeroViewMode } from './hero/types';

export { HERO_RIGHT_PANEL_HEIGHT_CLASS };

// Tactile number roll hook for smooth instrument calibration feel
function useAnimatedNumber(target: number | null, durationMs = 450): number | null {
  const [current, setCurrent] = useState<number | null>(target);
  const prevRef = useRef<number | null>(target);

  useEffect(() => {
    if (target === null) {
      setCurrent(null);
      prevRef.current = null;
      return;
    }
    const start = prevRef.current ?? 0;
    prevRef.current = target;
    if (start === target) {
      setCurrent(target);
      return;
    }

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCurrent(target);
      return;
    }

    const startTime = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(start + (target - start) * ease));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, durationMs]);

  return current;
}

// Lazy-loaded GlobePanel (MapLibre/three separated from initial dashboard bundle)
const LazyGlobePanel = dynamic(
  () => import('./hero/GlobePanel').then((mod) => mod.GlobePanel),
  {
    ssr: false,
    loading: () => (
      <div
        id="panel-globe"
        role="tabpanel"
        aria-labelledby="tab-globe"
        className="w-full h-[540px] sm:h-[620px] lg:h-[680px] rounded-3xl flex flex-col items-center justify-center bg-[#0F172A] text-slate-200 gap-3 border border-slate-800/90 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.5)] select-none"
      >
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-teal-500 border-t-transparent" />
        <span className="text-xs font-mono text-slate-400 font-medium">
          Loading 3D Atmospheric Globe...
        </span>
      </div>
    ),
  }
);

// Lazy-loaded RegionalComparePanel (only fetches regional hotspots when opened)
const LazyRegionalComparePanel = dynamic(
  () => import('./hero/RegionalComparePanel').then((mod) => mod.RegionalComparePanel),
  {
    ssr: false,
    loading: () => (
      <div
        id="panel-compare"
        role="tabpanel"
        aria-labelledby="tab-compare"
        className="w-full h-[540px] sm:h-[620px] lg:h-[680px] rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 overflow-y-auto space-y-4 shadow-lg flex flex-col items-center justify-center gap-3"
      >
        <div className="h-7 w-7 animate-spin rounded-full border-3 border-sky-600 border-t-transparent" />
        <p className="text-xs font-mono text-slate-500">
          Loading live regional comparison estimates...
        </p>
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

function formatPollutantSymbol(code?: string | null): string {
  if (!code) return 'PM₂.₅';
  const clean = code.toLowerCase().trim();
  if (clean.includes('pm2') || clean.includes('pm2_5') || clean.includes('pm2.5')) return 'PM₂.₅';
  if (clean.includes('pm10')) return 'PM₁₀';
  if (clean === 'o3' || clean.includes('ozone')) return 'O₃';
  if (clean === 'no2') return 'NO₂';
  if (clean === 'so2') return 'SO₂';
  if (clean === 'co') return 'CO';
  return code.toUpperCase().replace('_', '.');
}

function formatDataAge(timestampStr?: string): string {
  if (!timestampStr) return 'recent';
  try {
    const iso = timestampStr.includes('T') ? timestampStr : timestampStr.replace(' ', 'T');
    const time = new Date(iso).getTime();
    if (isNaN(time)) return 'recent';
    const diffMs = Date.now() - time;
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h ${diffMin % 60}m ago`;
  } catch {
    return 'recent';
  }
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
    const aqi = providerAqi;
    if (!isIndia || aqi === null || !Number.isFinite(aqi)) return null;

    if (isDelhiNcr) {
      if (aqi > 450) {
        return {
          stage: 'GRAP Stage IV (Severe+)',
          badge: 'EMERGENCY',
          action: 'Ban on diesel trucks; halt on construction; mandatory hybrid school & telework.',
          color: '#7F1D1D',
          bgColor: '#FEF2F2',
          borderColor: '#F87171',
        };
      }
      if (aqi > 400) {
        return {
          stage: 'GRAP Stage III (Severe)',
          badge: 'STRICT BAN',
          action: 'BS-III Petrol & BS-IV Diesel ban; halt on non-essential earthwork & mining.',
          color: '#991B1B',
          bgColor: '#FEF2F2',
          borderColor: '#FCA5A5',
        };
      }
      if (aqi > 300) {
        return {
          stage: 'GRAP Stage II (Very Poor)',
          badge: 'ENHANCED RESTRICTION',
          action: 'Diesel generator bans active; mechanized street vacuuming & daily water spraying.',
          color: '#C2410C',
          bgColor: '#FFF7ED',
          borderColor: '#FDBA74',
        };
      }
      if (aqi > 200) {
        return {
          stage: 'GRAP Stage I (Poor)',
          badge: 'ACTIVE REGULATION',
          action: 'Anti-smog guns deployed at construction sites; strict PUC vehicle checks.',
          color: '#92400E',
          bgColor: '#FFFBEB',
          borderColor: '#FDE68A',
        };
      }
      return null;
    }

    // For non-Delhi-NCR Indian cities (Mumbai, Bengaluru, Kolkata, Hyderabad, etc.):
    if (aqi > 400) {
      return {
        stage: 'National Clean Air Advisory (Severe)',
        badge: 'HIGH SMOG ALERT',
        action: 'Severe particulate smog. Avoid outdoor exposure; run certified indoor HEPA filtration.',
        color: '#991B1B',
        bgColor: '#FEF2F2',
        borderColor: '#FCA5A5',
      };
    }
    if (aqi > 300) {
      return {
        stage: 'National Clean Air Advisory (Very Poor)',
        badge: 'HEALTH ALERT',
        action: 'Very poor air quality. Wear an N95 respirator outdoors and keep indoor windows sealed.',
        color: '#C2410C',
        bgColor: '#FFF7ED',
        borderColor: '#FDBA74',
      };
    }
    if (aqi > 200) {
      return {
        stage: 'National Clean Air Advisory (Poor)',
        badge: 'ACTIVE ADVISORY',
        action: 'Poor air quality. Sensitive members should avoid heavy outdoor exertion.',
        color: '#92400E',
        bgColor: '#FFFBEB',
        borderColor: '#FDE68A',
      };
    }
    return null;
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
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-emerald-50/90 border border-emerald-300 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true">🇮🇳</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-emerald-800">
                        CPCB NAQI:
                      </span>
                      <strong className="text-sm font-bold text-emerald-950">
                        {report.cpcbComparison.equivalentCategory}
                      </strong>
                      <span className="text-xs font-mono text-emerald-700 font-semibold">
                        (AQI {report.cpcbComparison.compositeAqi ?? report.cpcbComparison.estimatedAqiRange})
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-white text-emerald-800 border border-emerald-200 shrink-0 shadow-2xs">
                    {stationMeasuredPm10 === null || stationMeasuredPm10 === undefined
                      ? 'PM2.5 sub-index only'
                      : report.cpcbComparison?.indexLabel || (isStation ? 'CPCB AQI (PM2.5/PM10 sub-index)' : 'PM2.5 sub-index, modeled')}
                  </span>
                </div>
              )}
            </div>

            {/* Flagship Atmospheric Intelligence Card (Sleek, Compact Height & Highly Visual) */}
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
                    {tier?.description || 'Modelled atmospheric composition based on Copernicus Atmosphere Monitoring Service (CAMS) forecasts.'}
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
                  Res: {report.modelMetadata?.spatialResolution || '0.4° (~45 km)'}
                </span>
              </div>
            </div>
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
        <div className="mt-8 pt-6 border-t border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-3 mb-4 gap-2">
            <div>
              <h2 className="text-base font-bold font-sans text-slate-900 flex items-center gap-2">
                <span>⏱️ Rapid 6-Hour Exposure Window</span>
                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                  Forecast: modeled
                </span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Hourly atmospheric trajectory from numerical forecast models for routine and commute planning.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Hourly resolution
              </span>
            </div>
          </div>

          {/* Hourly forecast quick cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {report.forecast.slice(0, 6).map((point, idx) => {
              const ptAqi = point.activeAqi ?? 100;
              const ptColor = point.tier?.colorToken || '#047857';
              return (
                <div
                  key={point.time || idx}
                  className="rounded-2xl p-3 border border-slate-200/80 bg-white hover:border-slate-300 transition-all text-center space-y-1 shadow-2xs"
                >
                  <span className="text-xs font-mono font-bold text-slate-700 block">
                    {point.displayTime}
                    {point.isCurrentHour ? ' (Now)' : ''}
                  </span>
                  <span
                    className="text-2xl font-black font-mono tabular-nums block"
                    style={{ color: ptColor }}
                  >
                    {ptAqi}
                  </span>
                  <span
                    className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase"
                    style={{
                      backgroundColor: `${ptColor}18`,
                      color: ptColor,
                    }}
                  >
                    {point.tier?.label || 'Moderate'}
                  </span>
                  {point.pm25 !== null && point.pm25 !== undefined && (
                    <span className="text-[10px] text-slate-600 block font-mono">
                      PM₂.₅: {point.pm25.toFixed(1)} µg/m³
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

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
