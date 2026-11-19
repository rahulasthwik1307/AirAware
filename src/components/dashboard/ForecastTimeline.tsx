'use client';

import React, { useState, useRef } from 'react';
import { AqiStandardKey, AtmosphericModelMetadata, ForecastPoint } from '@/domain/types';

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

  // Identify peak projected hour based on available data
  let peakPoint: ForecastPoint | null = null;
  let maxAqi = -1;
  for (const p of forecast) {
    if (p.activeAqi !== null && p.activeAqi > maxAqi) {
      maxAqi = p.activeAqi;
      peakPoint = p;
    }
  }

  // Active inspected point is either hovered or explicitly selected
  const activeIndex = hoveredIndex ?? selectedIndex;
  const activePoint = forecast[activeIndex] ?? forecast[0];

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
    // Focus the target element if available
    const buttons = timelineContainerRef.current?.querySelectorAll<HTMLElement>('[role="button"]');
    if (buttons && buttons[nextIndex]) {
      buttons[nextIndex].focus();
    }
  };

  const isCurrentActive = Boolean(activePoint.isCurrentHour || activeIndex === 0);

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
              Timeline
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

      {!showTableView ? (
        <div className="relative">
          {/* Selected-Time Inspection Panel (Clean, Stable, Never Flickering) */}
          <div
            aria-live="polite"
            className="mb-2.5 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]/90 backdrop-blur-md text-xs font-mono"
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

              {/* Show available pollutants & weather ONLY when data is genuinely present */}
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

          {/* Interactive Bar Chart Strip */}
          <div
            ref={timelineContainerRef}
            role="region"
            aria-label="24-hour air quality forecast timeline strip"
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 sm:p-5 shadow-xs overflow-x-auto scrollbar-thin"
          >
            <div className="min-w-[680px] flex items-end justify-between gap-1.5 h-44 pt-6 pb-2 px-1">
              {forecast.map((point, index) => {
                const tier = point.tier;
                const aqi = point.activeAqi;
                const isPeak = peakPoint?.time === point.time;
                const isSelected = selectedIndex === index;
                const isHovered = hoveredIndex === index;
                const isHighlighted = isSelected || isHovered;

                // Height calculation: scale proportionally
                let heightPct = 20;
                if (aqi !== null) {
                  const maxScale = activeStandard === 'EUROPEAN_EAQI' ? 100 : 300;
                  heightPct = Math.min(100, Math.max(16, (aqi / maxScale) * 100));
                }

                return (
                  <div
                    key={point.time}
                    role="button"
                    tabIndex={0}
                    aria-label={`Forecast for ${point.displayTime}: ${aqi !== null ? `${aqi} AQI` : 'Not Reported'}, ${
                      tier?.label || 'Unknown Category'
                    }${point.isCurrentHour ? ', Current Model Hour' : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedIndex(index)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className={`flex-1 flex flex-col items-center justify-end h-full cursor-pointer rounded-md p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] transition-all duration-150 motion-reduce:transition-none ${
                      isSelected
                        ? 'bg-[var(--surface-subtle)] ring-1 ring-[var(--brand-primary)]/50'
                        : 'hover:bg-[var(--surface-subtle)]/50'
                    }`}
                  >
                    {/* Forecast Value */}
                    <span
                      className={`text-[10px] font-mono font-bold tabular-nums mb-1 transition-all ${
                        isPeak
                          ? 'text-[var(--aqi-unhealthy)] font-black'
                          : isHighlighted
                          ? 'text-[var(--brand-primary)] font-black'
                          : 'text-[var(--ink-secondary)]'
                      }`}
                    >
                      {aqi !== null ? aqi : '—'}
                    </span>

                    {/* Severity Pillar Bar */}
                    <div
                      className={`w-full max-w-[22px] rounded-t-sm transition-all duration-150 motion-reduce:transition-none ${
                        isHighlighted
                          ? 'ring-2 ring-[var(--brand-primary)] ring-offset-1 opacity-100 scale-y-105 origin-bottom'
                          : 'opacity-85'
                      }`}
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: tier ? tier.colorToken : 'var(--border-strong)',
                      }}
                    />

                    {/* Timestamp */}
                    <span
                      className={`text-[10px] font-mono mt-2 transition-colors ${
                        point.isCurrentHour
                          ? 'font-black text-[var(--brand-primary)] underline'
                          : isPeak
                          ? 'text-[var(--ink-primary)] font-bold'
                          : isHighlighted
                          ? 'text-[var(--ink-primary)] font-semibold'
                          : 'text-[var(--ink-muted)]'
                      }`}
                    >
                      {point.displayTime}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Scientific Provenance and Disclaimer Note */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-[var(--border-subtle)]/70 pt-2.5 px-2 text-[10px] font-mono text-[var(--ink-muted)] gap-1">
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
                  Condition Status
                </th>
                <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
                  Forecast AQI ({standardLabel})
                </th>
                <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
                  PM₂.₅ (Modelled)
                </th>
                <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
                  Category Tier
                </th>
                <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
                  Health Advisory
                </th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((point) => {
                const tier = point.tier;
                return (
                  <tr
                    key={point.time}
                    className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--surface-subtle)] font-mono"
                  >
                    <td className="p-3 font-bold text-[var(--ink-primary)]">
                      {point.time.replace('T', ' ')}
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold uppercase text-[var(--ink-muted)]">
                        {point.isCurrentHour ? 'Current Model Hour' : 'Model Forecast'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-[var(--ink-primary)] tabular-nums">
                      {point.activeAqi !== null ? point.activeAqi : 'Not Reported'}
                    </td>
                    <td className="p-3 tabular-nums text-[var(--ink-secondary)]">
                      {point.pm25 !== null && point.pm25 !== undefined ? `${point.pm25.toFixed(1)} µg/m³` : '—'}
                    </td>
                    <td className="p-3">
                      {tier ? (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                          style={{
                            color: tier.colorToken,
                            backgroundColor: tier.bgToken,
                            borderColor: tier.borderToken,
                          }}
                        >
                          {tier.label}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3 text-[var(--ink-secondary)] text-xs font-sans">
                      {tier?.healthAdvisory || 'Standard environmental precautions.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
