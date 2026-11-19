'use client';

import React from 'react';
import { AqiStandardKey, PollutantKey, PollutantMeasurement } from '@/domain/types';
import {
  POLLUTANT_EDUCATIONAL_DATA,
  PollutantEducationalData,
} from '@/domain/aqi/pollutant-educational-data';

interface PollutantGridProps {
  readonly pollutants: Record<PollutantKey, PollutantMeasurement>;
  readonly activeStandard: AqiStandardKey;
  readonly modelTimestamp?: string;
  readonly localTime?: string;
  readonly dominantPollutant?: string | null;
}

const ORDERED_POLLUTANT_KEYS: readonly PollutantKey[] = [
  'pm2_5',
  'pm10',
  'nitrogen_dioxide',
  'ozone',
  'sulphur_dioxide',
  'carbon_monoxide',
];

function formatBadgeTier(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes('sensitive')) return 'Sensitive';
  if (lower.includes('very unhealthy') || lower.includes('very poor')) return 'Very Unhealthy';
  if (lower.includes('hazardous')) return 'Hazardous';
  if (lower.includes('unhealthy') || lower.includes('poor')) return 'Unhealthy';
  if (lower.includes('moderate') || lower.includes('fair')) return 'Moderate';
  if (lower.includes('good')) return 'Good';
  return label;
}

export function PollutantGrid({
  pollutants,
  activeStandard,
  modelTimestamp,
  localTime,
  dominantPollutant,
}: PollutantGridProps) {
  const isEaqi = activeStandard === 'EUROPEAN_EAQI';
  const standardName = isEaqi ? 'European EAQI' : 'US EPA AQI';

  // Identify dominant pollutant strictly from calculated positive sub-indices under the active standard
  // NEVER infer dominant pollutant from raw concentration!
  let highestSubIndex = -1;
  let calculatedDominantKey: PollutantKey | null = null;

  for (const k of ORDERED_POLLUTANT_KEYS) {
    const p = pollutants[k];
    if (
      p &&
      p.isEvaluatedInActiveStandard &&
      p.subIndex !== null &&
      Number.isFinite(p.subIndex) &&
      p.subIndex > 0
    ) {
      if (p.subIndex > highestSubIndex) {
        highestSubIndex = p.subIndex;
        calculatedDominantKey = k;
      }
    }
  }

  const effectiveTimestamp = localTime || modelTimestamp || null;

  return (
    <section aria-labelledby="pollutants-telemetry-heading" className="w-full">
      {/* Matrix Header with Provenance & Standard Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
        <div>
          <h2
            id="pollutants-telemetry-heading"
            className="text-base sm:text-lg font-bold tracking-tight text-[var(--ink-primary)] font-sans flex items-center gap-2"
          >
            <span>Pollutant Concentration Matrix</span>
            <span className="text-[10px] font-mono font-normal text-[var(--ink-muted)] bg-[var(--surface-subtle)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
              6 Criteria Species
            </span>
          </h2>
          <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
            Current instantaneous 1-hour modelled environmental estimates evaluated against regulatory index methods and WHO 2021 health-based guideline levels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto shrink-0">
          {effectiveTimestamp && (
            <span className="text-[10px] font-mono text-[var(--ink-muted)] bg-[var(--surface-subtle)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
              Model: {effectiveTimestamp}
            </span>
          )}
          <span className="text-[10px] font-mono font-bold text-[var(--brand-primary)] bg-[var(--brand-surface)] px-2 py-0.5 rounded border border-[var(--brand-primary)]/30 uppercase">
            Standard: {standardName}
          </span>
        </div>
      </div>

      {/* Responsive Grid: Desktop 3x2, Tablet 2x3, Mobile 1-col (no horizontal scroll) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {ORDERED_POLLUTANT_KEYS.map((key) => {
          const item = pollutants[key];
          const edu: PollutantEducationalData = POLLUTANT_EDUCATIONAL_DATA[key];
          if (!item || !edu) return null;

          const hasConcentration = item.concentration !== null && Number.isFinite(item.concentration);
          const isCoUnderEaqi = isEaqi && key === 'carbon_monoxide';

          // Dominant check: must match calculated sub-index driver, or explicit dominantPollutant from aggregate
          const isDominant =
            !isCoUnderEaqi &&
            highestSubIndex > 0 &&
            (key === calculatedDominantKey ||
              (dominantPollutant && (edu.chemicalFormula === dominantPollutant || key === dominantPollutant)));

          const tier = item.tier;

          // Pollutant-specific regulatory averaging disclosure
          let regulatoryMethodDisclosure = '';
          if (isCoUnderEaqi) {
            regulatoryMethodDisclosure = 'Not evaluated under European EAQI standard (EEA convention)';
          } else if (isEaqi) {
            regulatoryMethodDisclosure = 'EAQI method: evaluates five pollutant indices using hourly concentrations';
          } else {
            // US EPA AQI
            if (key === 'pm2_5' || key === 'pm10') {
              regulatoryMethodDisclosure =
                'US EPA AQI method: requires preceding 24-hour rolling average (provider-modelled sub-index; not computed locally)';
            } else if (key === 'carbon_monoxide') {
              regulatoryMethodDisclosure =
                'US EPA AQI method: requires 8-hour rolling average (provider-modelled sub-index; not computed locally)';
            } else if (key === 'ozone') {
              regulatoryMethodDisclosure =
                'US EPA AQI method: requires 8-hour rolling average (provider-modelled sub-index; not computed locally)';
            } else if (key === 'sulphur_dioxide') {
              regulatoryMethodDisclosure =
                'US EPA AQI method: evaluated against 1-hour daily maximum standard';
            } else {
              // NO2
              regulatoryMethodDisclosure =
                'US EPA AQI method: evaluated against 1-hour daily maximum standard';
            }
          }

          return (
            <article
              key={key}
              data-pollutant={key}
              aria-label={`${edu.fullName} (${edu.chemicalFormula})`}
              className={`flex flex-col justify-between rounded-xl border bg-[var(--surface-card)] p-4 transition-all shadow-xs ${
                isDominant
                  ? 'border-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)]/30 shadow-sm'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div>
                {/* 1. Header: Chemical Formula, Screen-Reader Full Name, and Status Badges */}
                <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)]/70 pb-2.5 mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      aria-hidden="true"
                      className="text-xl font-black font-mono text-[var(--ink-primary)] tracking-tight"
                    >
                      {edu.chemicalFormula}
                    </span>
                    <span className="sr-only">{edu.screenReaderName}</span>
                    <span className="text-xs text-[var(--ink-secondary)] truncate font-sans font-medium">
                      {edu.fullName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isDominant && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[var(--brand-primary)] text-white uppercase tracking-wider shrink-0"
                        title={`Identified as Primary Driver based on highest sub-index (${highestSubIndex}) under ${standardName}, not raw concentration.`}
                      >
                        Primary Driver
                      </span>
                    )}

                    {isCoUnderEaqi ? (
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono text-[var(--ink-muted)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] whitespace-nowrap shrink-0"
                        title="Not evaluated under European EAQI standard (EEA convention)"
                      >
                        EAQI Excluded
                      </span>
                    ) : tier ? (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border whitespace-nowrap shrink-0"
                        title={tier.label}
                        style={{
                          color: tier.colorToken,
                          backgroundColor: tier.bgToken,
                          borderColor: tier.borderToken,
                        }}
                      >
                        {formatBadgeTier(tier.label)}
                      </span>
                    ) : !hasConcentration ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-[var(--ink-muted)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] whitespace-nowrap shrink-0">
                        Unreported
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* 2. Primary Concentration Numeral & Sub-Index */}
                <div className="flex items-baseline justify-between mt-1 mb-1">
                  {hasConcentration ? (
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black font-mono tabular-nums text-[var(--ink-primary)]">
                          {item.concentration === 0 ? '0.0' : item.concentration}
                        </span>
                        <span className="text-xs font-mono font-semibold text-[var(--ink-muted)]">
                          {item.unit}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-[var(--ink-muted)] block mt-0.5">
                        1-hour model concentration
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="inline-block text-xs font-mono font-semibold text-[var(--ink-muted)] bg-[var(--surface-subtle)] px-2.5 py-1 rounded-md border border-[var(--border-subtle)]">
                        Not Reported
                      </span>
                    </div>
                  )}

                  {/* Sub-index display */}
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-[var(--ink-muted)] uppercase block">
                      Sub-Index
                    </span>
                    {isCoUnderEaqi ? (
                      <span
                        className="text-xs font-mono text-[var(--ink-muted)]"
                        title="Carbon monoxide is excluded from the European EAQI standard sub-index calculation by EEA convention."
                      >
                        N/A (EEA)
                      </span>
                    ) : item.subIndex !== null ? (
                      <span className="text-base font-black font-mono text-[var(--ink-primary)] tabular-nums">
                        {item.subIndex}
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-[var(--ink-muted)]">N/A</span>
                    )}
                  </div>
                </div>

                {/* 3. Regulatory Averaging Period & Calculation Disclosure */}
                <div className="text-[10px] font-mono text-[var(--ink-muted)] bg-[var(--surface-subtle)]/60 px-2 py-1 rounded border border-[var(--border-subtle)]/50 mb-2.5 leading-snug">
                  <span>{regulatoryMethodDisclosure}</span>
                </div>

                {/* 4. WHO 2021 Reference Baselines (Scientific Dual-Window & Caveat) */}
                <div className="pt-2 border-t border-[var(--border-subtle)]/60 text-[10px] font-mono">
                  <div className="flex items-center justify-between text-[var(--ink-secondary)] mb-1">
                    <span className="font-semibold text-[var(--ink-primary)]">
                      WHO 2021 Reference Levels
                    </span>
                    <span className="text-[9px] text-[var(--ink-muted)]">
                      {edu.who2021Guidelines.shortTerm.label}: {edu.who2021Guidelines.shortTerm.value} {edu.who2021Guidelines.shortTerm.unit}
                      {edu.who2021Guidelines.annual
                        ? ` • ${edu.who2021Guidelines.annual.label}: ${edu.who2021Guidelines.annual.value} ${edu.who2021Guidelines.annual.unit}`
                        : ''}
                    </span>
                  </div>

                  {hasConcentration ? (
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center justify-between text-[9px] text-[var(--ink-muted)]">
                        <span>Current (1-h) vs {edu.who2021Guidelines.shortTerm.period} ref:</span>
                        <span className="font-semibold tabular-nums text-[var(--ink-primary)]">
                          {item.concentration} / {edu.who2021Guidelines.shortTerm.value} {edu.standardUnit}
                        </span>
                      </div>
                      <div
                        className="w-full bg-[var(--surface-subtle)] h-1 rounded-full overflow-hidden"
                        role="progressbar"
                        aria-label={`WHO guideline reference comparison for ${edu.fullName}`}
                        aria-valuenow={Math.min(100, Math.round((item.concentration! / edu.who2021Guidelines.shortTerm.value) * 100))}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(5, (item.concentration! / (edu.who2021Guidelines.shortTerm.value * 2.5)) * 100))}%`,
                            backgroundColor:
                              item.concentration! > edu.who2021Guidelines.shortTerm.value * 2
                                ? 'var(--aqi-unhealthy)'
                                : item.concentration! > edu.who2021Guidelines.shortTerm.value
                                ? 'var(--aqi-moderate)'
                                : 'var(--aqi-good)',
                          }}
                        />
                      </div>
                      <p className="text-[9px] text-[var(--ink-muted)] leading-tight pt-0.5">
                        Health-based advisory reference level, not a legal limit or guarantee of safety. Modelled 1-hour values cannot be directly equated with 24-hour or annual chronic guideline levels.
                      </p>
                    </div>
                  ) : (
                    <p className="text-[9px] text-[var(--ink-muted)] italic pt-0.5">
                      Benchmark comparison unavailable (data not reported).
                    </p>
                  )}
                </div>
              </div>

              {/* 5. Accessible Expandable Educational Details (Native semantic details & summary) */}
              <details className="group mt-3 pt-2.5 border-t border-[var(--border-subtle)]/70">
                <summary
                  className="flex items-center justify-between cursor-pointer list-none text-[11px] font-mono font-bold text-[var(--ink-secondary)] hover:text-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded py-1 px-1 -mx-1 select-none transition-colors"
                  aria-label={`Educational Profile for ${edu.fullName}`}
                >
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden="true">📘</span>
                    <span>Educational Profile</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-[10px] text-[var(--ink-muted)] group-open:rotate-180 transition-transform duration-200"
                  >
                    ▼
                  </span>
                </summary>

                <div className="mt-2.5 space-y-2 text-[11px] leading-relaxed text-[var(--ink-secondary)] bg-[var(--surface-subtle)]/70 p-2.5 rounded-lg border border-[var(--border-subtle)]/60">
                  <div>
                    <strong className="font-mono text-[10px] uppercase text-[var(--ink-primary)] block mb-0.5 tracking-wider">
                      Primary Sources
                    </strong>
                    <p>{edu.sources}</p>
                  </div>

                  <div>
                    <strong className="font-mono text-[10px] uppercase text-[var(--ink-primary)] block mb-0.5 tracking-wider">
                      Health Considerations
                    </strong>
                    <p>{edu.healthEffects}</p>
                  </div>

                  <div>
                    <strong className="font-mono text-[10px] uppercase text-[var(--ink-primary)] block mb-0.5 tracking-wider">
                      Seasonal &amp; Diurnal Behaviour
                    </strong>
                    <p>{edu.seasonalBehavior}</p>
                  </div>

                  <div className="pt-1.5 border-t border-[var(--border-subtle)]/50">
                    <strong className="font-mono text-[10px] uppercase text-[var(--ink-primary)] block mb-0.5 tracking-wider">
                      Averaging Windows &amp; Guidelines
                    </strong>
                    <p className="font-mono text-[10px] text-[var(--ink-secondary)]">
                      Concentration Basis: {edu.concentrationBasis}
                    </p>
                    <p className="font-mono text-[10px] text-[var(--ink-secondary)] mt-0.5">
                      Regulatory Standard: {isEaqi ? edu.regulatoryWindows.europeanEaqi : edu.regulatoryWindows.usEpa}
                    </p>
                    <p className="font-mono text-[10px] text-[var(--ink-muted)] mt-0.5">
                      Application Notice: This platform reports instantaneous 1-hour Open-Meteo model concentrations and provider-supplied sub-indices; it does not compute multi-hour regulatory rolling averages locally.
                    </p>
                    <p className="font-mono text-[10px] text-[var(--ink-muted)] mt-0.5">
                      {edu.who2021Guidelines.disclosure}
                    </p>
                  </div>
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
