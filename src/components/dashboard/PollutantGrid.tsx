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

  // Identify highest sub-index to mark the dominant driver
  let highestSubIndex = -1;
  let dominantKey: PollutantKey | null = null;
  for (const k of ORDERED_POLLUTANT_KEYS) {
    const p = pollutants[k];
    if (p && p.subIndex !== null && p.subIndex > highestSubIndex) {
      highestSubIndex = p.subIndex;
      dominantKey = k;
    }
  }

  return (
    <section aria-labelledby="pollutants-telemetry-heading" className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
        <div>
          <h2
            id="pollutants-telemetry-heading"
            className="text-base font-bold tracking-tight text-[var(--ink-primary)] font-sans"
          >
            Pollutant Concentration Matrix
          </h2>
          <p className="text-xs text-[var(--ink-secondary)]">
            Ground-level criteria vectors evaluated against WHO 2021 air quality guidelines.
          </p>
        </div>
        <span className="text-[10px] font-mono font-bold text-[var(--ink-muted)] uppercase self-start sm:self-auto bg-[var(--surface-subtle)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
          Standard: {standardName}
        </span>
      </div>

      {/* Grid of Pollutant Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {ORDERED_POLLUTANT_KEYS.map((key) => {
          const item = pollutants[key];
          if (!item) return null;

          const hasValue = item.concentration !== null;
          const tier = item.tier;
          const isDominant = key === dominantKey && highestSubIndex > 0;

          // Calculate WHO percentage for the reference bar (capped at 100% for visual sanity)
          const whoPercentage = item.whoRatio
            ? Math.min(100, (item.whoRatio / 5) * 100)
            : 0;

          return (
            <div
              key={key}
              className={`flex flex-col justify-between rounded-xl border bg-[var(--surface-card)] p-4.5 transition-all shadow-xs ${
                isDominant
                  ? 'border-[var(--brand-primary)]/80 ring-1 ring-[var(--brand-primary)]/20 shadow-sm'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div>
                {/* Header: Chemical Formula & Status Badge */}
                <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)]/70 pb-2.5 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black font-mono text-[var(--ink-primary)] tracking-tight">
                      {item.chemicalFormula}
                    </span>
                    <span className="text-xs text-[var(--ink-muted)] truncate max-w-[130px]">
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isDominant && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[var(--brand-primary)] text-white uppercase tracking-wider">
                        Primary
                      </span>
                    )}
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
                    ) : !item.isEvaluatedInActiveStandard ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[var(--ink-muted)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                        EAQI Excluded
                      </span>
                    ) : null}
                  </div>
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
                        Sub-Index
                      </span>
                      <span className="text-base font-black font-mono text-[var(--ink-primary)] tabular-nums">
                        {item.subIndex}
                      </span>
                    </div>
                  )}
                </div>

                {/* WHO Guideline Benchmark Bar */}
                {hasValue && (
                  <div className="mt-3.5 pt-2.5 border-t border-[var(--border-subtle)]/60">
                    <div className="flex justify-between text-[10px] font-mono text-[var(--ink-muted)] mb-1.5">
                      <span>WHO Guideline: {item.whoGuideline} {item.unit}</span>
                      <span
                        className={
                          item.whoRatio && item.whoRatio > 1.0
                            ? 'text-[var(--aqi-unhealthy)] font-bold'
                            : ''
                        }
                      >
                        {item.whoRatio ? `${item.whoRatio}x WHO limit` : '—'}
                      </span>
                    </div>
                    <div className="w-full bg-[var(--surface-subtle)] h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
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
              <div className="mt-3 pt-2 text-[10px] font-mono text-[var(--ink-muted)] border-t border-[var(--border-subtle)]/40">
                {!item.isEvaluatedInActiveStandard ? (
                  <span>Concentration measured • Excluded from European EAQI standard</span>
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
