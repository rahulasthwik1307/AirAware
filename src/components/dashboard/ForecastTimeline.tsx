'use client';

import React, { useState, useRef, useMemo } from 'react';
import { AqiStandardKey, AtmosphericModelMetadata, ForecastPoint } from '@/domain/types';

interface ForecastTimelineProps {
  readonly forecast: readonly ForecastPoint[];
  readonly activeStandard: AqiStandardKey;
  readonly modelMetadata?: AtmosphericModelMetadata;
  readonly modelTimestamp?: string;
  readonly localTime?: string;
}

// Convert an array of 2D points into a smooth cubic Bézier spline path string
function getSplinePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const prev = points[Math.max(0, i - 1)];
    const after = points[Math.min(points.length - 1, i + 2)];

    // Catmull-Rom to cubic Bézier tangents
    const cp1x = curr.x + (next.x - prev.x) / 6;
    const cp1y = curr.y + (next.y - prev.y) / 6;
    const cp2x = next.x - (after.x - curr.x) / 6;
    const cp2y = next.y - (after.y - curr.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
  }
  return d;
}

export function ForecastTimeline({
  forecast,
  activeStandard,
  modelMetadata,
}: ForecastTimelineProps) {
  const [showTableView, setShowTableView] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  if (!forecast || forecast.length === 0) {
    return (
      <section aria-labelledby="forecast-telemetry-heading" className="w-full">
        <h2
          id="forecast-telemetry-heading"
          className="text-base font-bold tracking-tight text-[var(--ink-primary)] font-sans"
        >
          24-Hour Modelled Forecast
        </h2>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 text-center text-xs text-[var(--ink-muted)]">
          Hourly forecast data unavailable for the selected location.
        </div>
      </section>
    );
  }

  const standardLabel = activeStandard === 'EUROPEAN_EAQI' ? 'European EAQI' : 'US EPA AQI';

  // Identify peak and best projected hour based on available data
  let peakPoint: ForecastPoint | null = null;
  let bestPoint: ForecastPoint | null = null;
  let maxAqi = -1;
  let minAqi = Infinity;

  for (const p of forecast) {
    if (p.activeAqi !== null && Number.isFinite(p.activeAqi)) {
      if (p.activeAqi > maxAqi) {
        maxAqi = p.activeAqi;
        peakPoint = p;
      }
      if (p.activeAqi < minAqi) {
        minAqi = p.activeAqi;
        bestPoint = p;
      }
    }
  }

  // Active inspected point is either hovered or explicitly selected
  const activeIndex = hoveredIndex ?? selectedIndex;
  const activePoint = forecast[activeIndex] ?? forecast[0];

  // SVG Spline calculations (viewBox 0 0 1000 220)
  const svgData = useMemo(() => {
    const isEaqi = activeStandard === 'EUROPEAN_EAQI';
    const maxScale = isEaqi ? 100 : Math.max(220, maxAqi > 0 ? maxAqi * 1.15 : 220);
    const chartBottom = 185;
    const chartTop = 35;
    const chartHeight = chartBottom - chartTop;

    const points = forecast.map((p, i) => {
      const aqi = p.activeAqi ?? 0;
      const x = 35 + (i / Math.max(1, forecast.length - 1)) * (1000 - 70);
      const ratio = Math.min(1, Math.max(0, aqi / maxScale));
      const y = chartBottom - ratio * chartHeight;
      return { x, y, aqi: p.activeAqi, point: p, index: i };
    });

    const splineD = getSplinePath(points);
    const areaD = points.length > 0 ? `${splineD} L ${points[points.length - 1].x.toFixed(1)} ${chartBottom} L ${points[0].x.toFixed(1)} ${chartBottom} Z` : '';

    // Threshold lines
    const getThresholdY = (val: number) => chartBottom - (val / maxScale) * chartHeight;

    const thresholds = isEaqi
      ? [
          { val: 75, label: '75 • Poor', y: getThresholdY(75), color: 'rgba(239, 68, 68, 0.45)' },
          { val: 50, label: '50 • Moderate', y: getThresholdY(50), color: 'rgba(234, 179, 8, 0.45)' },
          { val: 25, label: '25 • Fair', y: getThresholdY(25), color: 'rgba(16, 185, 129, 0.45)' },
        ]
      : [
          { val: 200, label: '200 • Very Unhealthy', y: getThresholdY(200), color: 'rgba(168, 85, 247, 0.45)' },
          { val: 150, label: '150 • Unhealthy', y: getThresholdY(150), color: 'rgba(244, 63, 94, 0.45)' },
          { val: 100, label: '100 • Sensitive', y: getThresholdY(100), color: 'rgba(249, 115, 22, 0.45)' },
          { val: 50, label: '50 • Moderate', y: getThresholdY(50), color: 'rgba(234, 179, 8, 0.45)' },
        ];

    return { points, splineD, areaD, thresholds, maxScale, chartBottom };
  }, [forecast, activeStandard, maxAqi]);

  // Keyboard navigation handler for stepping through hours
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = Math.min(forecast.length - 1, index + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = Math.max(0, index - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = forecast.length - 1;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedIndex(index);
      return;
    } else {
      return;
    }

    setSelectedIndex(nextIndex);
    const buttons = timelineContainerRef.current?.querySelectorAll<HTMLElement>('[role="button"]');
    if (buttons && buttons[nextIndex]) {
      buttons[nextIndex].focus();
    }
  };

  const isCurrentActive = Boolean(activePoint.isCurrentHour || activeIndex === 0);
  const activeSvgPoint = svgData.points[activeIndex] || svgData.points[0];

  return (
    <section aria-labelledby="forecast-telemetry-heading" className="w-full">
      {/* Header with Scientific Provenance & Resolution Disclosures */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h2
            id="forecast-telemetry-heading"
            className="text-base font-bold tracking-tight text-[var(--ink-primary)] font-sans flex items-center gap-2"
          >
            <span>24-Hour Modelled Forecast</span>
            <span className="text-[10px] font-mono font-normal text-[var(--ink-muted)] bg-[var(--surface-subtle)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
              Hourly resolution
            </span>
          </h2>
          <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
            Modelled Projections ({standardLabel}) from Copernicus Atmosphere Monitoring Service (CAMS) numerical simulations via Open-Meteo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {bestPoint && bestPoint.activeAqi !== null && bestPoint.displayTime !== peakPoint?.displayTime && (
            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-300 shadow-2xs">
              Best Window: {bestPoint.displayTime} ({bestPoint.activeAqi} AQI)
            </span>
          )}

          {peakPoint && peakPoint.activeAqi !== null && (
            <span className="text-[10px] font-mono font-bold text-[var(--aqi-unhealthy)] bg-[var(--aqi-unhealthy-bg)] px-2.5 py-1 rounded-md border border-[var(--aqi-unhealthy-border)] shadow-xs">
              Projected Peak: {peakPoint.displayTime} ({peakPoint.activeAqi} AQI)
            </span>
          )}

          {/* View Toggle Button */}
          <div className="inline-flex p-0.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setShowTableView(false)}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-all cursor-pointer ${
                !showTableView
                  ? 'bg-[var(--surface-card)] text-[var(--brand-primary)] shadow-xs border border-[var(--border-subtle)]'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
              }`}
            >
              Diurnal Wave
            </button>
            <button
              type="button"
              onClick={() => setShowTableView(true)}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-all cursor-pointer ${
                showTableView
                  ? 'bg-[var(--surface-card)] text-[var(--brand-primary)] shadow-xs border border-[var(--border-subtle)]'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
              }`}
            >
              Data Table
            </button>
          </div>
        </div>
      </div>

      {/* Daily Family Routine Windows (PromptWars Urban Air Quality Guidance) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3.5">
        <div className="p-3 rounded-xl border border-rose-200/80 bg-rose-50/60 text-slate-900 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base" aria-hidden="true">🌅</span>
            <span className="font-mono text-[11px] font-bold tracking-wider text-rose-900 uppercase">
              Morning Commute (07:00–09:30)
            </span>
          </div>
          <span className="inline-block text-[10px] font-bold text-rose-700 bg-rose-100/90 px-1.5 py-0.5 rounded mb-1">
            High Smog
          </span>
          <p className="text-xs text-slate-700 leading-snug">
            Night cooling traps ground emissions. Keep school bus windows shut; N95 advised for outdoor walks.
          </p>
        </div>

        <div className="p-3 rounded-xl border border-emerald-200/80 bg-emerald-50/60 text-slate-900 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base" aria-hidden="true">☀️</span>
            <span className="font-mono text-[11px] font-bold tracking-wider text-emerald-900 uppercase">
              Midday Window (12:00–15:30)
            </span>
          </div>
          <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded mb-1">
            Best Air Window
          </span>
          <p className="text-xs text-slate-700 leading-snug">
            Solar heating promotes atmospheric mixing, thinning surface particulate smog. Best time for outdoor errands.
          </p>
        </div>

        <div className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/60 text-slate-900 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base" aria-hidden="true">🌙</span>
            <span className="font-mono text-[11px] font-bold tracking-wider text-amber-900 uppercase">
              Evening &amp; Night (18:00–23:00)
            </span>
          </div>
          <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded mb-1">
            Trapping Returns
          </span>
          <p className="text-xs text-slate-700 leading-snug">
            Surface temperatures drop, concentrating evening commute fumes. Seal home windows and operate purifiers.
          </p>
        </div>
      </div>

      {!showTableView ? (
        <div className="relative">
          {/* Selected-Time Inspection Panel (Clean, Stable, Never Flickering) */}
          <div
            aria-live="polite"
            className="mb-2.5 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-xs font-mono shadow-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm text-[var(--ink-primary)]">
                  {activePoint.time.replace('T', ' ')}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    isCurrentActive
                      ? 'bg-[var(--brand-surface)] text-[var(--brand-primary)] border-[var(--brand-primary)]/40'
                      : 'bg-[var(--surface-card)] text-[var(--ink-secondary)] border-[var(--border-subtle)]'
                  }`}
                >
                  {isCurrentActive ? 'Current Model Hour' : 'Modelled Projections'}
                </span>

                {activePoint.activeAqi !== null && activePoint.tier ? (
                  <span
                    className="font-bold px-2 py-0.5 rounded text-[11px] border"
                    style={{
                      color: activePoint.tier.colorToken,
                      backgroundColor: activePoint.tier.bgToken,
                      borderColor: activePoint.tier.borderToken,
                    }}
                  >
                    {activePoint.activeAqi} AQI • {activePoint.tier.label}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-[var(--ink-muted)] bg-[var(--surface-card)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                    Not Reported
                  </span>
                )}
              </div>

              {/* Show criteria pollutant concentrations and weather parameters */}
              <div className="flex items-center gap-2.5 text-[11px] text-[var(--ink-muted)]">
                {activePoint.pm25 !== null && activePoint.pm25 !== undefined && (
                  <span className="font-semibold text-[var(--ink-primary)]">
                    PM₂.₅: {activePoint.pm25.toFixed(1)} µg/m³
                  </span>
                )}
                {activePoint.pm10 !== null && activePoint.pm10 !== undefined && (
                  <span className="hidden sm:inline">
                    PM₁₀: {activePoint.pm10.toFixed(1)} µg/m³
                  </span>
                )}
                {activePoint.temperature !== null && activePoint.temperature !== undefined && (
                  <span>Temp: {activePoint.temperature.toFixed(1)}°C</span>
                )}
                {activePoint.windSpeed !== null && activePoint.windSpeed !== undefined && (
                  <span>Wind: {activePoint.windSpeed.toFixed(1)} km/h</span>
                )}
              </div>
            </div>

            <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[var(--ink-secondary)] pt-1.5 border-t border-[var(--border-subtle)]/50">
              <span className="truncate">
                {activePoint.tier?.healthAdvisory ||
                  'Model forecast provides expected atmospheric trends; exercise normal personal judgment.'}
              </span>
              <span className="text-[10px] text-[var(--ink-muted)] shrink-0">
                Use Left / Right arrow keys to step through hours
              </span>
            </div>
          </div>

          {/* The Diurnal Smog Wave: Continuous Gradient Spline Visualization */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 sm:p-5 shadow-xs overflow-hidden">
            <div className="relative w-full aspect-[16/7] min-h-[190px] max-h-[260px]">
              <svg
                viewBox="0 0 1000 220"
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible select-none"
                aria-hidden="true"
              >
                <defs>
                  {/* Atmospheric Glow Gradient Fill under the Curve */}
                  <linearGradient id="diurnalWaveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--aqi-unhealthy)" stopOpacity="0.45" />
                    <stop offset="60%" stopColor="var(--brand-primary)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="var(--surface-card)" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Day-Night Sky Horizon Bands */}
                  <linearGradient id="horizonBands" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(30, 27, 75, 0.05)" />
                    <stop offset="28%" stopColor="rgba(244, 63, 94, 0.06)" />
                    <stop offset="55%" stopColor="rgba(16, 185, 129, 0.07)" />
                    <stop offset="80%" stopColor="rgba(245, 158, 11, 0.06)" />
                    <stop offset="100%" stopColor="rgba(30, 27, 75, 0.05)" />
                  </linearGradient>
                </defs>

                {/* Day-Night Horizon Shading Backdrop */}
                <rect x="35" y="20" width="930" height="165" fill="url(#horizonBands)" rx="8" />

                {/* Horizontal Regulatory Threshold Reference Lines */}
                {svgData.thresholds.map((th) => (
                  <g key={th.val}>
                    <line
                      x1="35"
                      y1={th.y}
                      x2="965"
                      y2={th.y}
                      stroke={th.color}
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x="962"
                      y={th.y - 4}
                      textAnchor="end"
                      className="text-[9px] font-mono fill-[var(--ink-muted)] opacity-80"
                    >
                      {th.label}
                    </text>
                  </g>
                ))}

                {/* Continuous Area Fill Under Curve */}
                {svgData.areaD && (
                  <path d={svgData.areaD} fill="url(#diurnalWaveGradient)" />
                )}

                {/* The Smooth Continuous Spline Curve */}
                {svgData.splineD && (
                  <path
                    d={svgData.splineD}
                    fill="none"
                    stroke="var(--aqi-unhealthy)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300"
                  />
                )}

                {/* Milestone Beacon Pins on the Spline */}
                {peakPoint && svgData.points.find((pt) => pt.point.time === peakPoint?.time) && (
                  (() => {
                    const pt = svgData.points.find((p) => p.point.time === peakPoint?.time)!;
                    return (
                      <g transform={`translate(${pt.x}, ${pt.y})`}>
                        <circle r="7" fill="var(--aqi-unhealthy)" fillOpacity="0.3" className="animate-ping" />
                        <circle r="4" fill="var(--aqi-unhealthy)" stroke="#ffffff" strokeWidth="1.5" />
                        <text
                          y="-10"
                          textAnchor="middle"
                          className="text-[9px] font-mono font-bold fill-[var(--aqi-unhealthy)]"
                        >
                          ▲ Peak: {pt.aqi}
                        </text>
                      </g>
                    );
                  })()
                )}

                {bestPoint && bestPoint.time !== peakPoint?.time && svgData.points.find((pt) => pt.point.time === bestPoint?.time) && (
                  (() => {
                    const pt = svgData.points.find((p) => p.point.time === bestPoint?.time)!;
                    return (
                      <g transform={`translate(${pt.x}, ${pt.y})`}>
                        <circle r="6" fill="#10b981" fillOpacity="0.4" />
                        <circle r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                        <text
                          y="-10"
                          textAnchor="middle"
                          className="text-[9px] font-mono font-bold fill-emerald-700"
                        >
                          ★ Best: {pt.aqi}
                        </text>
                      </g>
                    );
                  })()
                )}

                {/* Vertical Interactive Scrubber Guideline */}
                {activeSvgPoint && (
                  <g>
                    <line
                      x1={activeSvgPoint.x}
                      y1="25"
                      x2={activeSvgPoint.x}
                      y2={svgData.chartBottom}
                      stroke="var(--brand-primary)"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={activeSvgPoint.x}
                      cy={activeSvgPoint.y}
                      r="6"
                      fill="var(--brand-primary)"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="shadow-sm"
                    />
                  </g>
                )}
              </svg>
            </div>

            {/* Interactive Timeline Buttons Strip for Keyboard Accessibility & Touch Scrutiny */}
            <div
              ref={timelineContainerRef}
              role="region"
              aria-label="24-hour air quality forecast timeline strip"
              className="mt-2 pt-2 border-t border-[var(--border-subtle)]/70 flex items-center justify-between gap-1 overflow-x-auto scrollbar-thin"
            >
              {forecast.map((point, index) => {
                const tier = point.tier;
                const aqi = point.activeAqi;
                const isSelected = selectedIndex === index;
                const isHovered = hoveredIndex === index;
                const isHighlighted = isSelected || isHovered;

                return (
                  <button
                    key={point.time}
                    type="button"
                    tabIndex={0}
                    aria-label={`Forecast for ${point.displayTime}: ${aqi !== null ? `${aqi} AQI` : 'Not Reported'}, ${
                      tier?.label || 'Unknown Category'
                    }${point.isCurrentHour ? ', Current Model Hour' : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedIndex(index)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className={`flex-1 min-w-[32px] py-1.5 px-1 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
                      isSelected
                        ? 'bg-[var(--brand-surface)] text-[var(--brand-primary)] font-bold ring-1 ring-[var(--brand-primary)]/40 shadow-2xs'
                        : isHighlighted
                        ? 'bg-[var(--surface-subtle)] text-[var(--ink-primary)]'
                        : 'text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)]/60'
                    }`}
                  >
                    <span className="text-[10px] font-mono leading-none">
                      {point.displayTime}
                    </span>
                    <span
                      className={`text-[9px] font-mono tabular-nums mt-1 font-bold ${
                        point.isCurrentHour ? 'text-[var(--brand-primary)] underline' : ''
                      }`}
                    >
                      {aqi !== null ? aqi : '—'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Scientific Provenance and Model Resolution Disclosures */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-[var(--border-subtle)]/70 pt-2.5 px-1 mt-2 text-[10px] font-mono text-[var(--ink-muted)] gap-1">
              <span>
                Start: {forecast[0]?.time.replace('T', ' ')} • End: {forecast[forecast.length - 1]?.time.replace('T', ' ')}
              </span>
              <span>
                Model resolution: {modelMetadata?.temporalResolution || 'Hourly resolution'} (CAMS simulation runs)
              </span>
            </div>
          </div>

          <p className="mt-2 text-[10px] font-mono text-[var(--ink-muted)] leading-relaxed px-1">
            Notice: Modelled forecast projections provide expected regional atmospheric trends and do not represent physical station measurements or guaranteed future conditions.
          </p>
        </div>
      ) : (
        /* Accessible Table Alternative per Modern Web Guidance */
        <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <caption className="sr-only">
              24-hour forecast data for air quality index, criteria pollutants, and health advisory
            </caption>
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)] font-mono text-[11px]">
                <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
                  Time (Local)
                </th>
                <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
                  Active AQI ({standardLabel})
                </th>
                <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
                  Category
                </th>
                <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
                  PM₂.₅ (µg/m³)
                </th>
                <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
                  PM₁₀ (µg/m³)
                </th>
                <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
                  Health Advisory
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-[11px]">
              {forecast.map((point) => (
                <tr
                  key={point.time}
                  className={`hover:bg-[var(--surface-subtle)] transition-colors ${
                    point.isCurrentHour ? 'bg-[var(--surface-subtle)]/70 font-semibold' : ''
                  }`}
                >
                  <td className="p-3 whitespace-nowrap text-[var(--ink-primary)]">
                    {point.displayTime}
                    {point.isCurrentHour && (
                      <span className="ml-1.5 inline-block text-[9px] font-bold text-[var(--brand-primary)] bg-[var(--surface-card)] px-1.5 py-0.2 rounded border border-[var(--border-subtle)]">
                        Current
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-bold text-[var(--ink-primary)] tabular-nums">
                    {point.activeAqi !== null ? point.activeAqi : 'Not Reported'}
                  </td>
                  <td className="p-3">
                    {point.tier ? (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold border"
                        style={{
                          color: point.tier.colorToken,
                          backgroundColor: point.tier.bgToken,
                          borderColor: point.tier.borderToken,
                        }}
                      >
                        {point.tier.label}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-3 tabular-nums text-[var(--ink-secondary)]">
                    {point.pm25 !== null && point.pm25 !== undefined ? point.pm25.toFixed(1) : '—'}
                  </td>
                  <td className="p-3 tabular-nums text-[var(--ink-secondary)]">
                    {point.pm10 !== null && point.pm10 !== undefined ? point.pm10.toFixed(1) : '—'}
                  </td>
                  <td className="p-3 text-[var(--ink-muted)] max-w-xs truncate font-sans text-xs">
                    {point.tier?.healthAdvisory || 'General public awareness guidance.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
