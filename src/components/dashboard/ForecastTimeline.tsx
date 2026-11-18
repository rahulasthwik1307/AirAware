'use client';

import React, { useState } from 'react';
import { AqiStandardKey, ForecastPoint } from '@/domain/types';

interface ForecastTimelineProps {
  readonly forecast: readonly ForecastPoint[];
  readonly activeStandard: AqiStandardKey;
}

export function ForecastTimeline({ forecast, activeStandard }: ForecastTimelineProps) {
  const [showTableView, setShowTableView] = useState(false);

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
            24-Hour Telemetry Forecast // Model Time Series
          </h2>
          <p className="text-xs text-[var(--ink-secondary)]">
            Hourly &amp; 3-hourly atmospheric model projections ({standardLabel}) with discrete reporting intervals.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {peakPoint && (
            <span className="text-[10px] font-mono font-bold text-[var(--aqi-unhealthy)] bg-[var(--aqi-unhealthy-bg)] px-2 py-1 rounded border border-[var(--aqi-unhealthy-border)]">
              PEAK: {peakPoint.displayTime} ({peakPoint.activeAqi} AQI)
            </span>
          )}

          {/* Accessible View Toggle Button */}
          <button
            type="button"
            onClick={() => setShowTableView((prev) => !prev)}
            className="text-xs font-mono font-semibold px-2.5 py-1 rounded border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-primary)] shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-primary)]"
          >
            {showTableView ? '[SWITCH TO TIMELINE STRIP]' : '[ACCESSIBLE TABLE VIEW]'}
          </button>
        </div>
      </div>

      {!showTableView ? (
        /* Integrated Futuristic Forecast Telemetry Strip */
        <div
          role="region"
          aria-label="24-hour air quality forecast telemetry timeline"
          tabIndex={0}
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 shadow-xs overflow-x-auto scrollbar-thin focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-primary)]"
        >
          <div className="min-w-[640px] flex items-end justify-between gap-2 h-36 pt-6 pb-2 px-2">
            {forecast.map((point) => {
              const tier = point.tier;
              const aqi = point.activeAqi;
              const isPeak = peakPoint?.time === point.time;

              // Height calculation: scale proportionally
              let heightPct = 25;
              if (aqi !== null) {
                const maxScale = activeStandard === 'EUROPEAN_EAQI' ? 100 : 300;
                heightPct = Math.min(100, Math.max(20, (aqi / maxScale) * 100));
              }

              return (
                <div
                  key={point.time}
                  className="flex-1 flex flex-col items-center justify-end h-full group cursor-default"
                >
                  {/* Forecast Value */}
                  <span
                    className={`text-[11px] font-mono font-bold tabular-nums mb-1 transition-transform group-hover:scale-110 ${
                      isPeak ? 'text-[var(--aqi-unhealthy)] font-black' : 'text-[var(--ink-primary)]'
                    }`}
                  >
                    {aqi !== null ? aqi : '—'}
                  </span>

                  {/* Dynamic Severity Pillar Bar */}
                  <div
                    className="w-full max-w-[20px] rounded-xs transition-all duration-300 group-hover:opacity-90"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: tier ? tier.colorToken : 'var(--border-strong)',
                    }}
                  />

                  {/* Timestamp */}
                  <span
                    className={`text-[10px] font-mono mt-2 transition-colors ${
                      isPeak ? 'text-[var(--ink-primary)] font-bold' : 'text-[var(--ink-muted)]'
                    }`}
                  >
                    {point.displayTime}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border-subtle)]/70 pt-2 px-2 text-[10px] font-mono text-[var(--ink-muted)]">
            <span>START: {forecast[0]?.displayTime}</span>
            <span>DISCRETE MODEL INTERVALS // NO SYNTHETIC INTERPOLATION</span>
            <span>END: {forecast[forecast.length - 1]?.displayTime}</span>
          </div>
        </div>
      ) : (
        /* Accessible Table Alternative per Modern Web Guidance */
        <div className="overflow-x-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <caption className="sr-only">
              24-hour forecast data for air quality index and status tiers
            </caption>
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)] font-mono text-[11px]">
                <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
                  TIME (UTC/LOCAL)
                </th>
                <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
                  FORECAST AQI ({standardLabel})
                </th>
                <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
                  CATEGORY TIER
                </th>
                <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
                  HEALTH ADVISORY
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
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                          style={{
                            color: tier.colorToken,
                            backgroundColor: tier.bgToken,
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
