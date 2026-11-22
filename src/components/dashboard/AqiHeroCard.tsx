'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AirQualityReport, AqiStandardKey, GeoLocation } from '@/domain/types';
import { calculateCpcbAqi, calculateCompositeCpcbAqi } from '@/domain/aqi/cpcb-benchmark';
import { WeatherData } from '@/app/api/weather/route';
import { GLOBE_REFERENCE_CITIES } from '../globe/world-landmass';

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

// Dynamically import MapLibre 3D Globe with SSR disabled to protect WebGL contexts
const MapLibreGlobe = dynamic(
  () => import('@/components/globe/MapLibreGlobe').then((mod) => mod.MapLibreGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[540px] sm:h-[620px] lg:h-[680px] rounded-3xl flex flex-col items-center justify-center bg-[#0F172A] text-slate-200 gap-3 border border-slate-800/90 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.5)] select-none">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-teal-500 border-t-transparent" />
        <span className="text-xs font-mono text-slate-400 font-medium">
          Loading 3D Atmospheric Globe...
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
  type HeroViewMode = 'overview' | 'compare' | 'globe';
  const [activeView, setActiveView] = useState<HeroViewMode>('overview');
  const tabListRef = useRef<HTMLDivElement>(null);

  // Regional comparisons state (cached 15 minutes via /api/regional-hotspots)
  const [regionalHotspots, setRegionalHotspots] = useState<any[]>([]);
  const [isHotspotsLoading, setIsHotspotsLoading] = useState(false);
  const [hotspotsError, setHotspotsError] = useState<string | null>(null);

  useEffect(() => {
    if (activeView !== 'compare' || regionalHotspots.length > 0) return;

    let cancelled = false;
    setIsHotspotsLoading(true);
    setHotspotsError(null);

    fetch('/api/regional-hotspots')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          if (data.success && Array.isArray(data.cities)) {
            setRegionalHotspots(data.cities);
          } else {
            setHotspotsError(data.error || 'Could not load regional comparisons right now. Please try again later.');
          }
          setIsHotspotsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHotspotsError('Could not load regional comparisons right now. Please try again later.');
          setIsHotspotsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeView, regionalHotspots.length]);

  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    const tabKeys: HeroViewMode[] = ['overview', 'compare', 'globe'];
    const currentIndex = tabKeys.indexOf(activeView);
    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % tabKeys.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + tabKeys.length) % tabKeys.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = tabKeys.length - 1;
    } else {
      return;
    }
    const nextView = tabKeys[nextIndex];
    setActiveView(nextView);
    const targetBtn = tabListRef.current?.querySelector<HTMLButtonElement>(`#tab-${nextView}`);
    targetBtn?.focus();
  };

  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [hoveredBand, setHoveredBand] = useState<string | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePos({ x: Math.round(x), y: Math.round(y) });
    }
  };

  const isCpcbActive = selectedStandard === 'CPCB_NAQI';
  const isStation = report.sourceType === 'station';
  const stationMeasuredPm10 = isStation
    ? (report.pollutants?.pm10?.isStationMeasurement ? report.pollutants?.pm10?.concentration : null)
    : report.pollutants?.pm10?.concentration;
  const cpcbResult = calculateCompositeCpcbAqi(
    report.pollutants?.pm2_5?.concentration,
    stationMeasuredPm10,
    isStation
  );

  const effectiveAqi = isCpcbActive
    ? (cpcbResult.aqi ?? providerAqi)
    : providerAqi;

  const hasAqi = effectiveAqi !== null;
  const isIndia = location.countryCode === 'IN' || location.country.toLowerCase().includes('india');
  const animatedAqi = useAnimatedNumber(hasAqi ? effectiveAqi : null);
  const displayAqi = hasAqi ? (animatedAqi ?? effectiveAqi) : null;

  const effectiveTierLabel = isCpcbActive
    ? (cpcbResult.category !== 'Unavailable' ? cpcbResult.category : (tier?.label ?? 'Moderate'))
    : (tier ? tier.label : 'Moderate');

  const aqiColor = isCpcbActive
    ? (cpcbResult.colorToken !== 'var(--ink-muted)' ? cpcbResult.colorToken : (tier?.colorToken ?? '#059669'))
    : (tier ? tier.colorToken : '#059669');

  // Calculate percentage along the spectrum for the visual marker (strictly 0–500 scale)
  let spectrumPercent = 0;
  if (hasAqi && Number.isFinite(effectiveAqi) && effectiveAqi >= 0) {
    spectrumPercent = Math.min(100, Math.max(0, (effectiveAqi / 500) * 100));
  }

  // Graded Response Action Plan (GRAP) for Delhi-NCR, or Standard Clean Air Advisory for other Indian Cities
  const isDelhiNcr =
    isIndia &&
    /delhi|noida|gurugram|gurgaon|ghaziabad|faridabad|rohtak/i.test(
      location.name + ' ' + (location.admin1 || '')
    );

  const getGrapProtocol = (aqi: number | null) => {
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
          color: '#D97706',
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
        color: '#D97706',
        bgColor: '#FFFBEB',
        borderColor: '#FDE68A',
      };
    }
    return null;
  };

  const grapInfo = getGrapProtocol(providerAqi);

  const feedLabel =
    report.modelMetadata?.domain === 'CAMS_EUROPE' ? 'CAMS Europe Ensemble' : 'CAMS Global IFS';

  // SVG Gauge calculations
  const gaugeRadius = 40;
  const gaugeCircumference = Math.PI * gaugeRadius; // Semi-circle arc
  const gaugeStrokeDashoffset = gaugeCircumference - (gaugeCircumference * (spectrumPercent / 100));

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
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200/80 bg-white px-6 py-2.5 sm:px-8 text-[11px] font-mono text-slate-600 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: aqiColor }}
            />
            {isStation ? (
              <span>
                Ground station: <strong className="text-slate-900">{report.stationName || 'Nearby Monitor'}</strong>, {report.distanceKm !== null && report.distanceKm !== undefined ? `${report.distanceKm} km away` : ''} · OpenAQ · Observed {report.observedAt ? (report.observedAt.includes('T') ? report.observedAt.split('T')[1].slice(0, 5) : report.observedAt) : ''} ({formatDataAge(report.observedAt || modelTimestamp)})
                {report.distanceKm !== null && report.distanceKm !== undefined && report.distanceKm > 10 && (
                  <span className="text-amber-800 ml-1.5 font-normal">
                    · This station is far from you; air near you may differ.
                  </span>
                )}
              </span>
            ) : (
              <span>Modeled estimate (Copernicus CAMS via Open-Meteo, ~45 km grid) · {report.modelFallbackReason || 'no recent station within 25 km'}</span>
            )}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-sky-700 font-semibold tabular-nums">
            {coordinates.latitude.toFixed(2)}°N, {coordinates.longitude.toFixed(2)}°E
          </span>
          {isLoading && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full">
              <span>🔄 Updating telemetry feed...</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-slate-600 tabular-nums">
            Observation: <strong className="text-slate-800">{report.observedAt || modelTimestamp}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
            Age: {formatDataAge(report.observedAt || modelTimestamp)}
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="font-semibold text-slate-700 tabular-nums hidden sm:inline">Local: {localTime}</span>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* Main Stage Grid: Left = Compact Intelligence Deck (5/12 ~ 41.7%), Right = Dominant 3D Globe (7/12 ~ 58.3%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Focused Intelligence Deck (5/12) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4 z-10">
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
                  {/* Center Visual Indicator (Option A: Severity Icon & Dominant Pollutant, Balanced Centering) */}
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

                  {/* Urgent Exposure Action Pill */}
                  <div className="pt-0.5">
                    {providerAqi !== null && providerAqi > 200 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-rose-50 text-rose-900 border border-rose-300 shadow-2xs">
                        <span>🛡️ Urgent:</span>
                        <span>N95/FFP2 Respirator Required</span>
                      </span>
                    ) : providerAqi !== null && providerAqi > 100 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                        <span>⚠️ Caution:</span>
                        <span>Sensitive members limit morning exertion</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-2xs">
                        <span>✓ Standard:</span>
                        <span>Favorable air for routine family activities</span>
                      </span>
                    )}
                  </div>
                </div>
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
          <div className="lg:col-span-7 relative flex flex-col items-center justify-center">
            {/* Visual Viewport Header with 3-Option Segmented Control */}
            <div className="w-full flex items-center justify-between px-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 font-sans">
                  {activeView === 'overview'
                    ? 'Environmental Overview'
                    : activeView === 'compare'
                    ? 'Regional Air Quality Comparison'
                    : '3D Earth Atmospheric Dispersion'}
                </span>
              </div>

              {/* View Switcher: Accessible 3-Option Segmented Control */}
              <div
                ref={tabListRef}
                role="tablist"
                aria-label="Environmental view mode"
                className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/90 shadow-2xs text-xs font-mono font-bold"
                onKeyDown={handleTabKeyDown}
              >
                <button
                  id="tab-overview"
                  role="tab"
                  type="button"
                  aria-selected={activeView === 'overview'}
                  aria-controls="panel-overview"
                  tabIndex={activeView === 'overview' ? 0 : -1}
                  onClick={() => setActiveView('overview')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer tactile-btn ${
                    activeView === 'overview'
                      ? 'bg-sky-600 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Overview
                </button>
                <button
                  id="tab-compare"
                  role="tab"
                  type="button"
                  aria-selected={activeView === 'compare'}
                  aria-controls="panel-compare"
                  tabIndex={activeView === 'compare' ? 0 : -1}
                  onClick={() => setActiveView('compare')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer tactile-btn ${
                    activeView === 'compare'
                      ? 'bg-sky-600 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Regional compare
                </button>
                <button
                  id="tab-globe"
                  role="tab"
                  type="button"
                  aria-selected={activeView === 'globe'}
                  aria-controls="panel-globe"
                  tabIndex={activeView === 'globe' ? 0 : -1}
                  onClick={() => setActiveView('globe')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer tactile-btn ${
                    activeView === 'globe'
                      ? 'bg-sky-600 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  3D globe
                </button>
              </div>
            </div>

            {/* Panel 1: Overview */}
            {activeView === 'overview' && (
              <div
                id="panel-overview"
                role="tabpanel"
                aria-labelledby="tab-overview"
                className="w-full h-[540px] sm:h-[620px] lg:h-[680px] rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 overflow-y-auto space-y-4 shadow-sm flex flex-col justify-between animate-fadeIn"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <div>
                      <h3 className="text-base font-bold font-sans text-slate-900 flex items-center gap-2">
                        <span>🌤️ Environmental Overview: {location.name}</span>
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Local atmospheric conditions, ventilation windows, and exposure mitigation.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView('globe')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <span>🌐</span>
                      <span>View on Globe</span>
                    </button>
                  </div>

                  {/* Smog Season Protective Directives */}
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-900 font-sans">
                      <span>🛡️ Winter Smog Advisory &amp; Safe Windows</span>
                    </div>
                    <p className="text-amber-800 leading-relaxed font-sans">
                      Night ground cooling traps particulate matter below a shallow boundary layer between 06:00 and 09:30. Outdoor exercise, school sports, and natural window ventilation are safest when afternoon solar heating lifts the stagnant layer.
                    </p>
                  </div>

                  {/* Summary metric callouts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="text-[11px] font-mono text-slate-500 uppercase font-semibold">
                        Telemetry Source
                      </span>
                      <p className="text-xs font-bold text-slate-800 font-mono">
                        {isStation
                          ? `Ground Station (${report.stationName || 'Nearby'}, ${report.distanceKm ?? 0} km)`
                          : 'Copernicus CAMS (~45 km regional grid)'}
                      </p>
                      <span className="text-[10px] text-slate-500 block">
                        Observed: {formatDataAge(report.observedAt || report.modelTimestamp)}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="text-[11px] font-mono text-slate-500 uppercase font-semibold">
                        Primary Concern
                      </span>
                      <p className="text-xs font-bold text-slate-800 font-mono">
                        {dominantPollutant ? dominantPollutant.toUpperCase() : 'PM2.5'} ({effectiveTierLabel})
                      </p>
                      <span className="text-[10px] text-slate-500 block">
                        Fine particles penetrate deep into bronchial airways.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Switcher Banner to explore Globe or Compare */}
                <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-slate-700 shadow-md">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden="true">🌍</span>
                    <div>
                      <h4 className="text-xs font-bold font-sans">Explore 3D Dispersion Earth</h4>
                      <p className="text-[11px] text-slate-300">Visualize aerosol plumes &amp; compare regional air quality</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveView('compare')}
                      className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-mono text-xs font-bold transition-all cursor-pointer"
                    >
                      Compare Cities
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView('globe')}
                      className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-mono text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      Open 3D Globe →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Panel 2: Regional compare (Live batched Open-Meteo CAMS data) */}
            {activeView === 'compare' && (
              <div
                id="panel-compare"
                role="tabpanel"
                aria-labelledby="tab-compare"
                className="w-full h-[540px] sm:h-[620px] lg:h-[680px] rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 overflow-y-auto space-y-4 shadow-lg animate-fadeIn"
              >
                <div className="border-b border-slate-200/80 pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold font-sans text-slate-900 flex items-center gap-2">
                      <span>🇮🇳 Regional Air Quality Comparison</span>
                    </h3>
                    <span className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                      Modeled estimates
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Live modeled estimates from Copernicus Atmosphere Monitoring Service (CAMS) via Open-Meteo (~45 km horizontal grid). Click any city to switch your active location.
                  </p>
                </div>

                {isHotspotsLoading && (
                  <div className="p-8 text-center space-y-3">
                    <div className="h-7 w-7 animate-spin rounded-full border-3 border-sky-600 border-t-transparent mx-auto" />
                    <p className="text-xs font-mono text-slate-500">
                      Loading live regional comparison estimates...
                    </p>
                  </div>
                )}

                {hotspotsError && !isHotspotsLoading && (
                  <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2">
                    <span className="text-xl">⚠️</span>
                    <p className="text-xs font-sans text-amber-900 font-semibold">
                      {hotspotsError}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setHotspotsError(null);
                        setRegionalHotspots([]);
                      }}
                      className="px-3 py-1 text-xs font-mono font-bold bg-amber-200 text-amber-900 rounded-lg hover:bg-amber-300 transition-colors cursor-pointer"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {!isHotspotsLoading && !hotspotsError && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {(regionalHotspots.length > 0 ? regionalHotspots : GLOBE_REFERENCE_CITIES).map((c: any) => {
                      const isCurrent = location.name.toLowerCase() === c.name.toLowerCase();
                      const flag = c.countryCode === 'GB' ? '🇬🇧' : c.countryCode === 'JP' ? '🇯🇵' : '🇮🇳';
                      const cityAqi = typeof c.aqi === 'number' ? c.aqi : null;

                      return (
                        <div
                          key={c.name}
                          className={`p-4 rounded-2xl border transition-all ${
                            isCurrent
                              ? 'bg-sky-50/90 border-sky-400 shadow-sm ring-2 ring-sky-300'
                              : 'bg-slate-50/80 border-slate-200/80 hover:border-slate-300 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-slate-900 font-sans flex items-center gap-1.5">
                              <span aria-hidden="true">{flag}</span>
                              <span>{c.name}</span>
                            </span>
                            {cityAqi !== null ? (
                              <span
                                className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold text-white shadow-xs tabular-nums"
                                style={{ backgroundColor: c.colorToken || aqiColor }}
                              >
                                AQI {cityAqi}
                              </span>
                            ) : isCurrent ? (
                              <span
                                className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold text-white shadow-xs tabular-nums"
                                style={{ backgroundColor: aqiColor }}
                              >
                                AQI {displayAqi ?? effectiveAqi}
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                Modeled
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs font-mono text-slate-600 mb-2">
                            <span className="text-slate-500">{c.admin1}, {c.country}</span>
                            <span
                              className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                isCurrent
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200/70 text-slate-700'
                              }`}
                            >
                              {isCurrent
                                ? (isStation ? '● Active Ground Station' : '● Active Model Grid')
                                : (c.tierLabel || 'Modeled')}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-3">
                            <span className="font-semibold" style={{ color: isCurrent ? aqiColor : (c.colorToken || 'inherit') }}>
                              {isCurrent
                                ? effectiveTierLabel
                                : c.pm25 !== null && c.pm25 !== undefined
                                ? `PM₂.₅: ${c.pm25} µg/m³`
                                : `${c.latitude.toFixed(2)}°N, ${c.longitude.toFixed(2)}°E`}
                            </span>
                            <span className="tabular-nums">
                              {c.pm10 !== null && c.pm10 !== undefined
                                ? `PM₁₀: ${c.pm10} µg/m³`
                                : `${c.latitude.toFixed(1)}°, ${c.longitude.toFixed(1)}°`}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              onSelectLocation(c);
                              setActiveView('overview');
                            }}
                            disabled={isCurrent}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-slate-100 text-slate-400 cursor-default'
                                : 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs tactile-btn'
                            }`}
                          >
                            {isCurrent ? 'Current Active Location' : 'Select as Active Location ↵'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Panel 3: MapLibre 3D Globe */}
            {activeView === 'globe' && (
              <div
                id="panel-globe"
                role="tabpanel"
                aria-labelledby="tab-globe"
                className="w-full relative flex items-center justify-center animate-fadeIn"
              >
                <MapLibreGlobe
                  selectedLocation={location}
                  onSelectLocation={onSelectLocation}
                  aqiColor={aqiColor}
                  aqiTierLabel={effectiveTierLabel}
                  currentAqi={effectiveAqi}
                  theme="light"
                />
              </div>
            )}
          </div>
        </div>

        {/* Rapid 6-Hour Exposure Window — ALWAYS VISIBLE under the hero */}
        <div className="mt-8 pt-6 border-t border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-3 mb-4 gap-2">
            <div>
              <h3 className="text-base font-bold font-sans text-slate-900 flex items-center gap-2">
                <span>⏱️ Rapid 6-Hour Exposure Window</span>
                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                  Forecast: modeled
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Hourly atmospheric trajectory from numerical forecast models for routine and commute planning.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Hourly resolution
              </span>
            </div>
          </div>

          {/* Hourly forecast quick cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {report.forecast.slice(0, 6).map((point, idx) => {
              const ptAqi = point.activeAqi ?? 100;
              const ptColor = point.tier?.colorToken || '#059669';
              return (
                <div
                  key={point.time || idx}
                  className="rounded-2xl p-3 border border-slate-200/80 bg-white hover:border-slate-300 transition-all text-center space-y-1 shadow-2xs"
                >
                  <span className="text-xs font-mono font-bold text-slate-600 block">
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
                    <span className="text-[10px] text-slate-500 block font-mono">
                      PM₂.₅: {point.pm25.toFixed(1)} µg/m³
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Enhanced Calibrated Precision Atmospheric Spectrum Bar */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 font-sans">
                Index Scale &amp; Position
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                {activeStandard === 'EUROPEAN_EAQI' ? 'European EAQI (0–100+ Scale)' : 'US EPA AQI (0–500 Scale)'}
              </span>
            </div>
            <span className="text-slate-900 font-bold text-sm tabular-nums">
              Active Value: {hasAqi && effectiveAqi !== null && Number.isFinite(effectiveAqi) ? `${effectiveAqi} (${effectiveTierLabel})` : 'N/A'}
            </span>
          </div>

          {/* Segmented Gradient Bar with Dynamic Needle and Hover Tooltip */}
          <div className="relative pt-7 pb-1">
            {hasAqi && effectiveAqi !== null && Number.isFinite(effectiveAqi) && effectiveAqi >= 0 && (
              <div
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300 pointer-events-none z-20"
                style={{ left: `${spectrumPercent}%` }}
              >
                <span
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-black text-white shadow-md mb-1 whitespace-nowrap flex items-center gap-1"
                  style={{ backgroundColor: aqiColor }}
                >
                  <span>▼</span>
                  <span>{providerAqi}</span>
                  <span>•</span>
                  <span>{tier?.label || 'Active'}</span>
                </span>
                <div
                  className="w-4 h-4 bg-white border-3 rounded-full shadow-lg"
                  style={{ borderColor: aqiColor }}
                />
              </div>
            )}

            {/* Hover Tooltip Overlay */}
            {hoveredBand && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-slate-900 text-white text-xs font-mono shadow-md z-30 pointer-events-none whitespace-nowrap">
                {hoveredBand}
              </div>
            )}

            {/* Interactive Bar */}
            <div className="h-5 w-full rounded-xl overflow-hidden flex shadow-inner bg-slate-200 border border-slate-300">
              {activeStandard === 'EUROPEAN_EAQI' ? (
                <>
                  <div
                    className="flex-1 bg-[#059669] hover:brightness-110 transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredBand('0–20: Good (Ideal for outdoor activities)')}
                    onMouseLeave={() => setHoveredBand(null)}
                  />
                  <div
                    className="flex-1 bg-[#10B981] hover:brightness-110 transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredBand('20–40: Fair (Air quality acceptable)')}
                    onMouseLeave={() => setHoveredBand(null)}
                  />
                  <div
                    className="flex-1 bg-[#D97706] hover:brightness-110 transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredBand('40–60: Moderate (Sensitive groups notice irritation)')}
                    onMouseLeave={() => setHoveredBand(null)}
                  />
                  <div
                    className="flex-1 bg-[#EA580C] hover:brightness-110 transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredBand('60–80: Poor (General public notice discomfort)')}
                    onMouseLeave={() => setHoveredBand(null)}
                  />
                  <div
                    className="flex-1 bg-[#DC2626] hover:brightness-110 transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredBand('80–100: Very Poor (Severe exposure warnings)')}
                    onMouseLeave={() => setHoveredBand(null)}
                  />
                  <div
                    className="flex-1 bg-[#7C3AED] hover:brightness-110 transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredBand('100+: Extremely Poor (Hazardous inversion smog)')}
                    onMouseLeave={() => setHoveredBand(null)}
                  />
                </>
              ) : (
                <>
                  <div
                    className="w-[10%] bg-[#059669] hover:brightness-110 transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredBand('0–50: Good • CPCB Good (Clean air, no restrictions)')}
                    onMouseLeave={() => setHoveredBand(null)}
                  />
                  <div
                    className="w-[10%] bg-[#D97706] hover:brightness-110 transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredBand('51–100: Moderate • CPCB Satisfactory (Acceptable air)')}
                    onMouseLeave={() => setHoveredBand(null)}
                  />
                  <div
                    className="w-[10%] bg-[#EA580C] hover:brightness-110 transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredBand('101–150: Sensitive • CPCB Moderate (Children & asthmatics limit exertion)')}
                    onMouseLeave={() => setHoveredBand(null)}
                  />
                  <div
                    className="w-[10%] bg-[#DC2626] hover:brightness-110 transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredBand('151–200: Unhealthy • CPCB Poor (Health effects for general population)')}
                    onMouseLeave={() => setHoveredBand(null)}
                  />
                  <div
                    className="w-[20%] bg-[#9333EA] hover:brightness-110 transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredBand('201–300: Very Unhealthy • CPCB Very Poor (Health alert: morning inversion)')}
                    onMouseLeave={() => setHoveredBand(null)}
                  />
                  <div
                    className="w-[40%] bg-[#7F1D1D] hover:brightness-110 transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredBand('301–500: Hazardous • CPCB Severe (Emergency conditions; stay indoors)')}
                    onMouseLeave={() => setHoveredBand(null)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Dual-Scale Legend (US EPA / EAQI + 🇮🇳 India CPCB Scale) */}
          <div className="space-y-1 overflow-x-auto scrollbar-none pb-0.5">
            {activeStandard === 'EUROPEAN_EAQI' ? (
              <div className="flex justify-between text-xs font-mono text-slate-600 tabular-nums min-w-[340px]">
                <span>0 Good</span>
                <span>20 Fair</span>
                <span>40 Moderate</span>
                <span>60 Poor</span>
                <span>80 Very Poor</span>
                <span>100+ Extr.</span>
              </div>
            ) : (
              <div className="min-w-[480px] sm:min-w-0 space-y-1">
                <div className="flex justify-between text-xs font-mono font-bold text-slate-700 tabular-nums">
                  <span>0 Good</span>
                  <span>50 Mod</span>
                  <span>100 Sens</span>
                  <span>150 Unhealthy</span>
                  <span>200 Very Unhealthy</span>
                  <span>300+ Haz</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono text-emerald-800 font-semibold bg-emerald-50/70 px-2.5 py-1 rounded-lg border border-emerald-200 gap-1.5 whitespace-nowrap">
                  <span>🇮🇳 CPCB Good (0–50)</span>
                  <span>Satisfactory (51–100)</span>
                  <span>Moderate (101–200)</span>
                  <span>Poor (201–300)</span>
                  <span>Very Poor (301–400)</span>
                  <span>Severe (401–500+)</span>
                </div>
              </div>
            )}
          </div>

          <div className="text-xs font-mono text-slate-500 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span>
              {activeStandard === 'EUROPEAN_EAQI'
                ? 'European Air Quality Index (0–100+ continuous scale based on EEA 2024 concentration thresholds).'
                : 'US EPA Air Quality Index (0–500 continuous scale across 6 criteria pollutants; EPA-454/B-18-007).'}
            </span>
            <span className="text-slate-400">
              *AQI is strictly non-negative (0 to 500+). Minus signs in Choices reflect avoided emissions.
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-4 leading-relaxed border-t border-slate-200/80 pt-3">
          {averagingPeriodNote}
        </p>
      </div>
    </article>
  );
}
