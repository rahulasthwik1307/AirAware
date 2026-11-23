'use client';

import React, { useState, useRef, useMemo } from 'react';
import { AqiStandardKey, AtmosphericModelMetadata, ForecastPoint } from '@/domain/types';
import { computeSvgData } from './forecast/forecast-chart-math';
import { ForecastSplineChart } from './forecast/ForecastSplineChart';
import { ForecastTableView } from './forecast/ForecastTableView';

interface ForecastTimelineProps {
  readonly forecast: readonly ForecastPoint[];
  readonly activeStandard: AqiStandardKey;
  readonly modelMetadata?: AtmosphericModelMetadata;
  readonly modelTimestamp?: string;
  readonly localTime?: string;
}

export function ForecastTimeline({
  forecast,
  activeStandard,
  modelTimestamp,
  localTime,
}: ForecastTimelineProps) {
  const [showTableView, setShowTableView] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  const safeForecast = useMemo(() => forecast ?? [], [forecast]);

  // Identify peak and best projected hour based on available data
  let peakPoint: ForecastPoint | null = null;
  let bestPoint: ForecastPoint | null = null;
  let maxAqi = -1;
  let minAqi = Infinity;

  for (const p of safeForecast) {
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
  const activePoint = safeForecast[activeIndex] ?? safeForecast[0];

  const svgData = useMemo(() => {
    return computeSvgData(safeForecast, activeStandard);
  }, [safeForecast, activeStandard]);

  const activeSvgPoint = svgData.points[activeIndex];
  const isCurrentActive = activePoint?.isCurrentHour ?? false;
  const standardLabel = activeStandard === 'EUROPEAN_EAQI' ? 'European EAQI' : 'US EPA AQI';

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = Math.min(safeForecast.length - 1, index + 1);
      setSelectedIndex(nextIndex);
      const buttons = timelineContainerRef.current?.querySelectorAll('button');
      buttons?.[nextIndex]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = Math.max(0, index - 1);
      setSelectedIndex(prevIndex);
      const buttons = timelineContainerRef.current?.querySelectorAll('button');
      buttons?.[prevIndex]?.focus();
    }
  };

  if (!safeForecast || safeForecast.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="forecast-timeline-title" className="space-y-3.5">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <h2
            id="forecast-timeline-title"
            className="text-base font-bold text-[var(--ink-primary)] font-sans flex items-center gap-2"
          >
            <span>24-Hour Diurnal Exposure Horizon</span>
            <span className="text-[10px] font-mono font-normal text-[var(--ink-muted)] bg-[var(--surface-subtle)] px-2 py-0.5 rounded border border-[var(--border-subtle)] hidden sm:inline">
              Hourly resolution
            </span>
          </h2>
          <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
            Forecast: modeled · Modelled Projections ({standardLabel}) from Copernicus Atmosphere Monitoring Service (CAMS) numerical simulations via Open-Meteo (~45 km grid).
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
              aria-pressed={!showTableView}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-all cursor-pointer ${
                !showTableView
                  ? 'bg-[var(--surface-card)] text-[var(--brand-primary)] shadow-xs border border-[var(--border-subtle)]'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
              }`}
            >
              Diurnal Wave
            </button>
            <button
              type="button"
              onClick={() => setShowTableView(true)}
              aria-pressed={showTableView}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-all cursor-pointer ${
                showTableView
                  ? 'bg-[var(--surface-card)] text-[var(--brand-primary)] shadow-xs border border-[var(--border-subtle)]'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
              }`}
            >
              Data Table
            </button>
          </div>
        </div>
      </div>

      {/* Daily Family Routine Windows */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3.5">
        <div className="p-3 rounded-xl border border-rose-200/80 bg-rose-50/60 text-slate-900 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base" aria-hidden="true">🌅</span>
            <span className="font-mono text-[11px] font-semibold text-rose-900">
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
            <span className="font-mono text-[11px] font-semibold text-emerald-900">
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
            <span className="font-mono text-[11px] font-semibold text-amber-900">
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
          {/* Selected-Time Inspection Panel */}
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
                  className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${
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

          {/* Spline Chart */}
          <ForecastSplineChart
            forecast={safeForecast}
            svgData={svgData}
            peakPoint={peakPoint}
            bestPoint={bestPoint}
            activeSvgPoint={activeSvgPoint}
            selectedIndex={selectedIndex}
            hoveredIndex={hoveredIndex}
            onSelectIndex={setSelectedIndex}
            onHoverIndex={setHoveredIndex}
            onKeyDown={handleKeyDown}
            timelineContainerRef={timelineContainerRef}
            localTime={localTime}
            modelTimestamp={modelTimestamp}
          />

          <p className="mt-2 text-[10px] font-mono text-[var(--ink-muted)] leading-relaxed px-1">
            Notice: Numerical atmospheric simulations reflect regional grid forecasts (~45 km). They do not represent physical station measurements or guaranteed future conditions.
          </p>
        </div>
      ) : (
        <ForecastTableView forecast={safeForecast} standardLabel={standardLabel} />
      )}
    </section>
  );
}
