'use client';

import React, { useState } from 'react';
import { AqiStandardKey, ForecastPoint } from '@/domain/types';

interface ForecastTimelineProps {
  readonly forecast: readonly ForecastPoint[];
  readonly activeStandard: AqiStandardKey;
}

export function ForecastTimeline({ forecast, activeStandard }: ForecastTimelineProps) {
  const [showTableView, setShowTableView] = useState(false);
  const [activeHoverPoint, setActiveHoverPoint] = useState<ForecastPoint | null>(null);

  if (!forecast || forecast.length === 0) {
    return null;
  }

  const standardLabel = activeStandard === 'EUROPEAN_EAQI' ? 'European EAQI' : 'US EPA AQI';

  // Find the peak pollution hour
  let peakPoint: ForecastPoint | null = null;
  let maxAqi = -1;
  for (const p of forecast) {
    if (p.activeAqi !== null && p.activeAqi > maxAqi) {
      maxAqi = p.activeAqi;
      peakPoint = p;
    }
  }

  return (
    <section aria-labelledby="forecast-telemetry-heading" className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h2
            id="forecast-telemetry-heading"
            className="text-base font-bold tracking-tight text-[var(--ink-primary)] font-sans"
          >
            24-Hour Predictive Forecast
          </h2>
          <p className="text-xs text-[var(--ink-secondary)]">
            Hourly atmospheric model projections ({standardLabel}) from CAMS simulation runs.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {peakPoint && (
            <span className="text-[10px] font-mono font-bold text-[var(--aqi-unhealthy)] bg-[var(--aqi-unhealthy-bg)] px-2.5 py-1 rounded-md border border-[var(--aqi-unhealthy-border)] shadow-xs">
              Peak: {peakPoint.displayTime} ({peakPoint.activeAqi} AQI)
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
        /* Integrated Futuristic Forecast Telemetry Strip with Interactive Tooltips */
        <div className="relative">
          {/* Active Hover Floating Info Bar */}
          {activeHoverPoint && (
            <div className="mb-2 p-2.5 rounded-lg bg-[var(--surface-card)] border border-[var(--brand-primary)]/40 shadow-sm flex items-center justify-between text-xs font-mono animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--ink-primary)]">
                  Hour {activeHoverPoint.displayTime}:
                </span>
                <span
                  className="font-extrabold px-2 py-0.5 rounded text-[11px]"
                  style={{
                    color: activeHoverPoint.tier?.colorToken,
                    backgroundColor: activeHoverPoint.tier?.bgToken,
                  }}
                >
                  {activeHoverPoint.activeAqi} AQI • {activeHoverPoint.tier?.label}
                </span>
              </div>
              <span className="text-[11px] text-[var(--ink-secondary)] hidden sm:inline">
                {activeHoverPoint.tier?.healthAdvisory}
              </span>
            </div>
          )}

          <div
            role="region"
            aria-label="24-hour air quality forecast telemetry timeline"
            tabIndex={0}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-xs overflow-x-auto scrollbar-thin focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40"
          >
            <div className="min-w-[640px] flex items-end justify-between gap-1.5 h-40 pt-6 pb-2 px-1">
              {forecast.map((point) => {
                const tier = point.tier;
                const aqi = point.activeAqi;
                const isPeak = peakPoint?.time === point.time;
                const isHovered = activeHoverPoint?.time === point.time;

                // Height calculation: scale proportionally
                let heightPct = 25;
                if (aqi !== null) {
                  const maxScale = activeStandard === 'EUROPEAN_EAQI' ? 100 : 300;
                  heightPct = Math.min(100, Math.max(18, (aqi / maxScale) * 100));
                }

                return (
                  <div
                    key={point.time}
                    onMouseEnter={() => setActiveHoverPoint(point)}
                    onMouseLeave={() => setActiveHoverPoint(null)}
                    onTouchStart={() => setActiveHoverPoint(point)}
                    className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer transition-transform"
                  >
                    {/* Forecast Value */}
                    <span
                      className={`text-[11px] font-mono font-bold tabular-nums mb-1 transition-all ${
                        isPeak
                          ? 'text-[var(--aqi-unhealthy)] font-black scale-110'
                          : isHovered
                          ? 'text-[var(--brand-primary)] font-black scale-115'
                          : 'text-[var(--ink-primary)]'
                      }`}
                    >
                      {aqi !== null ? aqi : '—'}
                    </span>

                    {/* Dynamic Severity Pillar Bar */}
                    <div
                      className={`w-full max-w-[22px] rounded-t-sm transition-all duration-200 ${
                        isHovered ? 'ring-2 ring-[var(--brand-primary)] ring-offset-1' : ''
                      }`}
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: tier ? tier.colorToken : 'var(--border-strong)',
                        opacity: isHovered ? 1 : 0.88,
                      }}
                    />

                    {/* Timestamp */}
                    <span
                      className={`text-[10px] font-mono mt-2 transition-colors ${
                        isPeak
                          ? 'text-[var(--ink-primary)] font-bold'
                          : isHovered
                          ? 'text-[var(--brand-primary)] font-bold'
                          : 'text-[var(--ink-muted)]'
                      }`}
                    >
                      {point.displayTime}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border-subtle)]/70 pt-2.5 px-2 text-[10px] font-mono text-[var(--ink-muted)]">
              <span>Start: {forecast[0]?.displayTime}</span>
              <span className="hidden sm:inline">Tap or hover any bar to inspect hourly guidance</span>
              <span>End: {forecast[forecast.length - 1]?.displayTime}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Accessible Table Alternative per Modern Web Guidance */
        <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <caption className="sr-only">
              24-hour forecast data for air quality index and status tiers
            </caption>
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)] font-mono text-[11px]">
                <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
                  Time (Local)
                </th>
                <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
                  Forecast AQI ({standardLabel})
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
                    className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--surface-subtle)]"
                  >
                    <td className="p-3 font-mono font-bold text-[var(--ink-primary)]">
                      {point.displayTime}
                    </td>
                    <td className="p-3 font-mono font-bold text-[var(--ink-primary)] tabular-nums">
                      {point.activeAqi !== null ? point.activeAqi : '—'}
                    </td>
                    <td className="p-3">
                      {tier ? (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border"
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
                    <td className="p-3 text-[var(--ink-secondary)] text-xs">
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
