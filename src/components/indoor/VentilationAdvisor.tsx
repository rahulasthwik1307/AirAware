'use client';

import React, { useMemo } from 'react';
import { AirQualityReport, ForecastPoint } from '@/domain/types';
import { evaluateVentilationCurve, RawHourlyDataPoint } from '@/domain/indoor/calculations';
import { VentilationHourlyPoint } from '@/domain/indoor/types';

interface VentilationAdvisorProps {
  readonly report: AirQualityReport | null;
  readonly onAskCopilot?: (question: string) => void;
}

export function VentilationAdvisor({ report, onAskCopilot }: VentilationAdvisorProps) {
  // Extract real Copernicus CAMS hourly points from the report if present
  const hourlyDataPoints: readonly RawHourlyDataPoint[] = useMemo(() => {
    if (!report || !report.forecast || report.forecast.length === 0) {
      return [];
    }

    const currentO3 = report.pollutants?.ozone?.concentration ?? undefined;

    return report.forecast.slice(0, 24).map((point: ForecastPoint) => {
      return {
        time: point.time,
        pm25: point.pm25 ?? undefined,
        pm10: point.pm10 ?? undefined,
        ozone: currentO3,
        temperatureC: point.temperature ?? undefined,
        humidityPercent: undefined,
      };
    });
  }, [report]);

  const curve: readonly VentilationHourlyPoint[] = useMemo(() => {
    return evaluateVentilationCurve(hourlyDataPoints);
  }, [hourlyDataPoints]);

  // Current or upcoming best window
  const activePoint = curve[0] || null;

  return (
    <section
      aria-labelledby="ventilation-advisor-heading"
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 sm:p-6 shadow-xs space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2
              id="ventilation-advisor-heading"
              className="text-base sm:text-lg font-bold text-[var(--ink-primary)] font-sans flex items-center gap-2"
            >
              <span>🪟 Outdoor-to-Indoor Ventilation Advisor</span>
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--ink-secondary)] border border-[var(--border-subtle)]">
              Multi-Factor Trade-Off
            </span>
          </div>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Balances outdoor PM2.5 and ground-level ozone against indoor CO2 and moisture buildup.
          </p>
        </div>

        {onAskCopilot && (
          <button
            type="button"
            onClick={() =>
              onAskCopilot('What factors should I consider before opening my windows today?')
            }
            className="px-3 py-1.5 rounded-lg bg-[var(--surface-subtle)] text-[var(--ink-secondary)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-card)] text-xs font-mono font-medium border border-[var(--border-subtle)] transition-all cursor-pointer self-start sm:self-auto shrink-0 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          >
            <span>🤖</span>
            <span>Ask Copilot about Ventilation</span>
          </button>
        )}
      </div>

      {/* Atmospheric Disclaimer Alert */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]/60 p-3 text-xs text-[var(--ink-secondary)] space-y-1">
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[var(--ink-primary)]">
          <span>ℹ️ Atmospheric Model Grid Resolution: ~45 km (Copernicus CAMS IFS)</span>
        </div>
        <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
          Evaluations reflect regional numerical weather forecasts. Local street canyons, immediate traffic density, and building tightness introduce variation that regional models cannot measure. Never treat model estimates as physical indoor measurements.
        </p>
      </div>

      {/* Current Hour Assessment Card */}
      {activePoint ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]/40 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[var(--ink-muted)] uppercase">
                Active Forecast Hour ({activePoint.hour})
              </span>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  activePoint.suitability === 'FAVORABLE'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : activePoint.suitability === 'MODERATE'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {activePoint.suitability === 'FAVORABLE'
                  ? '✓ Favorable for Air Exchange'
                  : activePoint.suitability === 'MODERATE'
                  ? '⚠️ Brief Airing Only (5–10 min)'
                  : '✕ Keep Windows Closed'}
              </span>
            </div>

            <span className="text-[11px] font-mono text-[var(--ink-muted)]">
              Outdoor PM2.5: {Math.round(activePoint.pm25Concentration)} µg/m³
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[var(--ink-primary)] leading-relaxed font-sans">
            {activePoint.summary}
          </p>

          {/* Factor Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {activePoint.factors.map((factor, idx) => (
              <span
                key={idx}
                className="text-[11px] font-mono px-2 py-1 rounded-md bg-white border border-[var(--border-subtle)] text-[var(--ink-secondary)] flex items-center gap-1.5"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    factor.status === 'good'
                      ? 'bg-emerald-500'
                      : factor.status === 'moderate'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  aria-hidden="true"
                />
                <strong>{factor.name}:</strong> {factor.value}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-6 text-center text-xs text-[var(--ink-muted)]">
          Insufficient regional forecast array data available to generate a 24-hour ventilation curve. Observe indoor air freshness, use mechanical filtration if available, or air rooms briefly if stuffy.
        </div>
      )}

      {/* 24-Hour Diurnal Timeline Bar */}
      {curve.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--ink-muted)]">
            <span className="font-bold uppercase tracking-wider text-[11px]">
              24-Hour Comparative Forecast Timeline
            </span>
            <span className="text-[10px]">Tap a block for details</span>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="flex gap-1.5 min-w-[600px]">
              {curve.slice(0, 18).map((point, idx) => {
                const colorClass =
                  point.suitability === 'FAVORABLE'
                    ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300'
                    : point.suitability === 'MODERATE'
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                    : 'bg-rose-100 hover:bg-rose-200 text-rose-900 border-rose-300';

                return (
                  <div
                    key={idx}
                    className={`flex-1 p-2 rounded-lg border text-center transition-all cursor-default select-none ${colorClass}`}
                    title={`${point.hour} — ${point.suitability}: ${point.summary}`}
                  >
                    <span className="block text-[11px] font-mono font-bold">{point.hour}</span>
                    <span className="block text-[10px] font-mono mt-0.5">
                      {Math.round(point.pm25Concentration)}
                    </span>
                    <span className="block text-[9px] uppercase font-bold tracking-tight mt-1">
                      {point.suitability === 'FAVORABLE'
                        ? 'Open'
                        : point.suitability === 'MODERATE'
                        ? 'Brief'
                        : 'Close'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[var(--ink-muted)] pt-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                <span>Favorable Airing</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
                <span>Brief Flush Only</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
                <span>Keep Sealed &amp; Purify</span>
              </span>
            </div>
            <span>Values: Regional PM2.5 (µg/m³)</span>
          </div>
        </div>
      )}
    </section>
  );
}
