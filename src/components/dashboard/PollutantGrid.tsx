'use client';

import React from 'react';
import { AqiStandardKey, PollutantKey, PollutantMeasurement } from '@/domain/types';

interface PollutantGridProps {
  readonly pollutants: Record<PollutantKey, PollutantMeasurement>;
  readonly activeStandard: AqiStandardKey;
}

const ORDERED_POLLUTANT_KEYS: readonly PollutantKey[] = [
  'pm2_5',
  'pm10',
  'nitrogen_dioxide',
  'ozone',
  'sulphur_dioxide',
  'carbon_monoxide',
];

export function PollutantGrid({ pollutants, activeStandard }: PollutantGridProps) {
  const standardName = activeStandard === 'EUROPEAN_EAQI' ? 'European EAQI' : 'US EPA AQI';

  return (
    <section aria-labelledby="pollutants-telemetry-heading" className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
        <div>
          <h2
            id="pollutants-telemetry-heading"
            className="text-base font-bold tracking-tight text-[var(--ink-primary)] font-sans"
          >
            Pollutant Telemetry Matrix // 6 Core Criteria Vectors
          </h2>
          <p className="text-xs text-[var(--ink-secondary)]">
            Atmospheric concentrations with sub-indices and WHO 2021 health benchmark ratios.
          </p>
        </div>
        <span className="text-[10px] font-mono font-bold text-[var(--ink-muted)] uppercase self-start sm:self-auto">
          EVALUATED UNDER: {standardName}
        </span>
      </div>

      {/* Futuristic Telemetry Matrix Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ORDERED_POLLUTANT_KEYS.map((key) => {
          const item = pollutants[key];
          if (!item) return null;

          const hasValue = item.concentration !== null;
          const tier = item.tier;

          // Calculate WHO percentage for the reference bar (capped at 100% for visual sanity)
          const whoPercentage = item.whoRatio
            ? Math.min(100, (item.whoRatio / 5) * 100)
            : 0;

          return (
            <div
              key={key}
              className="flex flex-col justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 shadow-xs hover:border-[var(--brand-primary)]/40 transition-all"
            >
              <div>
                {/* Header: Chemical Formula & Status Badge */}
                <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)]/70 pb-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black font-mono text-[var(--ink-primary)] tracking-tight">
                      {item.chemicalFormula}
                    </span>
                    <span className="text-xs text-[var(--ink-muted)] truncate max-w-[140px]">
                      {item.label}
                    </span>
                  </div>

                  {tier ? (
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                      style={{
                        color: tier.colorToken,
                        backgroundColor: tier.bgToken,
                        borderColor: tier.borderToken,
                      }}
                    >
                      {tier.label}
                    </span>
                  ) : !item.isEvaluatedInActiveStandard ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[var(--ink-muted)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                      EAQI EXCLUDED
                    </span>
                  ) : null}
                </div>

                {/* Primary Concentration Numeral & Units */}
                <div className="flex items-baseline justify-between mt-1">
                  {hasValue ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black font-mono tabular-nums text-[var(--ink-primary)]">
                        {item.concentration}
                      </span>
                      <span className="text-xs font-mono font-semibold text-[var(--ink-muted)]">
                        {item.unit}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-block text-xs font-mono font-semibold text-[var(--ink-muted)] bg-[var(--surface-subtle)] px-2 py-1 rounded border border-[var(--border-subtle)]">
                      Not Reported
                    </span>
                  )}

                  {/* Sub-index display */}
                  {item.subIndex !== null && (
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-[var(--ink-muted)] uppercase block">
                        SUB-INDEX
                      </span>
                      <span className="text-sm font-black font-mono text-[var(--ink-primary)]">
                        {item.subIndex}
                      </span>
                    </div>
                  )}
                </div>

                {/* WHO Guideline Benchmark Bar */}
                {hasValue && (
                  <div className="mt-3 pt-2 border-t border-[var(--border-subtle)]/60">
                    <div className="flex justify-between text-[10px] font-mono text-[var(--ink-muted)] mb-1">
                      <span>WHO Guideline: {item.whoGuideline} {item.unit}</span>
                      <span className={item.whoRatio && item.whoRatio > 1.0 ? 'text-[var(--aqi-unhealthy)] font-bold' : ''}>
                        {item.whoRatio ? `${item.whoRatio}x WHO level` : '—'}
                      </span>
                    </div>
                    <div className="w-full bg-[var(--surface-subtle)] h-1.5 rounded-xs overflow-hidden">
                      <div
                        className="h-full rounded-xs transition-all duration-500"
                        style={{
                          width: `${whoPercentage}%`,
                          backgroundColor:
                            item.whoRatio && item.whoRatio > 2.0
                              ? 'var(--aqi-unhealthy)'
                              : item.whoRatio && item.whoRatio > 1.0
                              ? 'var(--aqi-moderate)'
                              : 'var(--aqi-good)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Standard Evaluation Notes */}
              <div className="mt-3 pt-2 text-[10px] font-mono text-[var(--ink-muted)]">
                {!item.isEvaluatedInActiveStandard ? (
                  <span>Concentration measured • Not evaluated in European EAQI</span>
                ) : (
                  <span>{item.note || 'Criteria pollutant sub-index evaluated'}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
