'use client';

import React from 'react';
import { PollutantKey, PollutantMeasurement } from '@/domain/types';
import { PollutantEducationalData } from '@/domain/aqi/pollutant-educational-data';
import {
  formatBadgeTier,
  getRegulatoryMethodDisclosure,
  POLLUTANT_SOURCE_TAGS,
} from '@/domain/aqi/pollutant-presentation';
import { RadialArcGauge } from './RadialArcGauge';

export interface PollutantCardProps {
  readonly pollutantKey: PollutantKey;
  readonly item: PollutantMeasurement;
  readonly edu: PollutantEducationalData;
  readonly isDominant: boolean;
  readonly isEaqi: boolean;
  readonly standardName: string;
  readonly highestSubIndex: number;
}

/**
 * Visual telemetry card for an individual criteria air pollutant.
 * Displays real-time / modelled concentration, regulatory sub-index, WHO gauge,
 * and expandable scientific & educational drawers.
 *
 * @param props - Card presentation properties and measurement telemetry
 */
export function PollutantCard({
  pollutantKey,
  item,
  edu,
  isDominant,
  isEaqi,
  standardName,
  highestSubIndex,
}: PollutantCardProps) {
  const hasConcentration = item.concentration !== null && Number.isFinite(item.concentration);
  const isCoUnderEaqi = isEaqi && pollutantKey === 'carbon_monoxide';
  const tier = item.tier;
  const isStationMeasurement = Boolean(item.isStationMeasurement);
  const regulatoryMethodDisclosure = getRegulatoryMethodDisclosure(pollutantKey, isEaqi);
  const tierColor = tier ? tier.colorToken : 'var(--brand-primary)';
  const sourceTag = POLLUTANT_SOURCE_TAGS[pollutantKey];

  return (
    <article
      data-pollutant={pollutantKey}
      aria-label={`${edu.fullName} (${edu.chemicalFormula})`}
      className={`flex flex-col justify-between rounded-2xl border bg-[var(--surface-card)] p-5 transition-all shadow-xs card-elevate ${
        isDominant
          ? 'border-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)]/30 shadow-sm'
          : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
      }`}
    >
      <div>
        {/* 1. Header: Chemical Formula & Unclipped Full Name with Badges Above/Beside */}
        <div className="border-b border-[var(--border-subtle)]/70 pb-3 mb-3">
          <div className="flex items-center justify-between gap-2">
            <span
              aria-hidden="true"
              className="text-2xl font-black font-mono text-[var(--ink-primary)] tracking-tight shrink-0"
            >
              {edu.chemicalFormula}
            </span>

            <div className="flex flex-wrap items-center justify-end gap-1.5 min-w-0">
              {isDominant && (
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[var(--brand-primary)] text-white shrink-0 shadow-2xs"
                  title={`Identified as Primary Driver based on highest sub-index (${highestSubIndex}) under ${standardName}, not raw concentration.`}
                >
                  Primary Driver
                </span>
              )}

              {isCoUnderEaqi ? (
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium text-[var(--ink-muted)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] whitespace-nowrap shrink-0"
                  title="Not evaluated under European EAQI standard (EEA convention)"
                >
                  EAQI Excluded
                </span>
              ) : tier ? (
                <span
                  className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border whitespace-nowrap shrink-0 shadow-2xs"
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
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-[var(--ink-muted)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] whitespace-nowrap shrink-0">
                  Unreported
                </span>
              ) : null}
              {isStationMeasurement ? (
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 whitespace-nowrap shrink-0 shadow-2xs"
                  title="Physical in-situ measurement from government reference ground station"
                >
                  Station
                </span>
              ) : (
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap shrink-0"
                  title="Atmospheric numerical model simulation"
                >
                  Modeled
                </span>
              )}
            </div>
          </div>

          {/* Second Row: Full Name and Screen Reader Accessibility */}
          <div className="mt-1">
            <span className="sr-only">{edu.screenReaderName}</span>
            <span className="text-xs font-semibold text-[var(--ink-secondary)] font-sans block truncate">
              {edu.fullName}
            </span>
          </div>
        </div>

        {/* Everyday Source Indicator */}
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-sans px-2.5 py-1 rounded-lg bg-[var(--surface-subtle)] text-[var(--ink-secondary)] border border-[var(--border-subtle)]">
            <span aria-hidden="true">{sourceTag?.icon}</span>
            <span className="font-medium">{sourceTag?.sourceName}</span>
          </span>
        </div>

        {/* 2. Primary Concentration Numeral & Sub-Index */}
        <div className="flex items-baseline justify-between mt-2 mb-3">
          {hasConcentration ? (
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-[var(--ink-primary)]">
                  {item.concentration === 0 ? '0.0' : item.concentration}
                </span>
                <span className="text-sm font-mono font-semibold text-[var(--ink-muted)]">
                  {item.unit}
                </span>
              </div>
              <span className="text-xs font-mono text-[var(--ink-muted)] block mt-0.5">
                {isStationMeasurement ? 'Measured at ground station' : '1-hour model concentration'}
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
            <span className="text-[10px] font-mono font-bold text-[var(--ink-muted)] uppercase block tracking-wider">
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
              <span className="text-lg font-black font-mono text-[var(--ink-primary)] tabular-nums">
                {item.subIndex}
              </span>
            ) : (
              <span className="text-xs font-mono text-[var(--ink-muted)]">N/A</span>
            )}
          </div>
        </div>

        {/* 3. Visual Radial Arc / Speedometer Gauge with Zero Overlapping Text */}
        <RadialArcGauge
          concentration={item.concentration}
          refValue={edu.who2021Guidelines.shortTerm.value}
          unit={edu.who2021Guidelines.shortTerm.unit}
          tierColor={tierColor}
        />
      </div>

      {/* 4. Collapsible Scientific Details & Regulatory Disclosures Drawer */}
      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]/70">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-mono font-bold text-[var(--ink-secondary)] hover:text-[var(--brand-primary)] py-1 select-none transition-colors">
            <span className="flex items-center gap-1">
              <span>▸ Scientific Standards &amp; Methods</span>
            </span>
            <span className="text-[10px] text-[var(--ink-muted)] group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>

          <div className="mt-2 space-y-2 text-xs font-mono text-[var(--ink-secondary)] bg-[var(--surface-subtle)]/80 p-3 rounded-xl border border-[var(--border-subtle)]/60">
            <div>
              <strong className="block font-bold text-[var(--ink-primary)] mb-0.5">
                Regulatory Standard Method:
              </strong>
              <p>{regulatoryMethodDisclosure}</p>
              <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                This application does not compute multi-hour regulatory rolling averages locally; values reflect provider-calculated sub-indices or 1-hour inputs.
              </p>
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)]/50">
              <strong className="block font-bold text-[var(--ink-primary)] mb-0.5">
                WHO 2021 Reference Levels
              </strong>
              <p>
                WHO 24-hour guideline level: {edu.who2021Guidelines.shortTerm.value} {edu.who2021Guidelines.shortTerm.unit}
                {edu.who2021Guidelines.annual
                  ? ` • WHO annual guideline level: ${edu.who2021Guidelines.annual.value} ${edu.who2021Guidelines.annual.unit}`
                  : ''}
              </p>
              <p className="mt-1 text-[11px] text-[var(--ink-muted)] leading-relaxed">
                Advisory reference levels only; not a legal limit or guarantee of safety. Modelled 1-hour values cannot be directly equated with 24-hour or annual chronic guideline levels due to incompatible averaging periods; no direct pass/fail equivalence is calculated.
              </p>
            </div>
          </div>
        </details>

        {/* 5. Accessible Expandable Educational Details */}
        <details className="group mt-2">
          <summary
            className="flex items-center justify-between cursor-pointer list-none text-xs font-mono font-bold text-[var(--ink-secondary)] hover:text-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded py-1 select-none transition-colors"
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

          <div className="mt-2.5 space-y-2 text-xs leading-relaxed text-[var(--ink-secondary)] bg-[var(--surface-subtle)]/80 p-3 rounded-xl border border-[var(--border-subtle)]/60 font-sans">
            <div>
              <strong className="font-sans text-xs text-[var(--ink-primary)] block mb-0.5 font-semibold">
                Primary Sources
              </strong>
              <p>{edu.sources}</p>
            </div>

            <div>
              <strong className="font-sans text-xs text-[var(--ink-primary)] block mb-0.5 font-semibold">
                Health Considerations
              </strong>
              <p>{edu.healthEffects}</p>
            </div>

            <div>
              <strong className="font-sans text-xs text-[var(--ink-primary)] block mb-0.5 font-semibold">
                Seasonal &amp; Diurnal Behaviour
              </strong>
              <p>{edu.seasonalBehavior}</p>
              <p className="mt-1 text-[11px] text-[var(--ink-muted)] font-mono">
                Note: Diurnal and seasonal patterns vary significantly across geography, local meteorology, source emissions, and seasonal weather patterns.
              </p>
            </div>
          </div>
        </details>
      </div>
    </article>
  );
}
