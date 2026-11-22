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
  readonly sourceType?: 'station' | 'model';
  readonly stationName?: string | null;
  readonly distanceKm?: number | null;
  readonly observedAt?: string | null;
}

const ORDERED_POLLUTANT_KEYS: readonly PollutantKey[] = [
  'pm2_5',
  'pm10',
  'nitrogen_dioxide',
  'ozone',
  'sulphur_dioxide',
  'carbon_monoxide',
];

const POLLUTANT_SOURCE_TAGS: Record<PollutantKey, { sourceName: string; icon: string }> = {
  pm2_5: { sourceName: 'Fine Smog & Stubble Smoke', icon: '🔥' },
  pm10: { sourceName: 'Road Dust & Construction', icon: '🏗️' },
  nitrogen_dioxide: { sourceName: 'Diesel & Vehicle Exhaust', icon: '🚗' },
  ozone: { sourceName: 'Sunlight Chemical Smog', icon: '☀️' },
  sulphur_dioxide: { sourceName: 'Industrial Fuel Fumes', icon: '🏭' },
  carbon_monoxide: { sourceName: 'Incomplete Fuel Burning', icon: '⚠️' },
};

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

function formatDataAge(timestampStr?: string): string {
  if (!timestampStr) return 'recent';
  try {
    const iso = timestampStr.includes('T') ? timestampStr : timestampStr.replace(' ', 'T');
    const time = new Date(iso).getTime();
    if (isNaN(time)) return 'recent';
    const diffMs = Date.now() - time;
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h ${diffMin % 60}m ago`;
  } catch {
    return 'recent';
  }
}

// Clean Radial Arc Speedometer with Zero Overlapping Text
function RadialArcGauge({
  concentration,
  refValue,
  unit,
  tierColor,
}: {
  concentration: number | null;
  refValue: number;
  unit: string;
  tierColor: string;
}) {
  if (concentration === null || !Number.isFinite(concentration)) {
    return (
      <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-[var(--surface-subtle)] text-xs font-mono text-[var(--ink-muted)]">
        <span>No Reference Benchmark</span>
      </div>
    );
  }

  const ratio = concentration / refValue;
  // Map ratio: 0 to 4x (ratios >= 3.5x fill the arc completely)
  const arcPct = Math.min(1, Math.max(0.04, ratio / 3.5));
  const arcLength = 219.9; // Half circumference of radius 70: pi * 70
  const strokeDashoffset = arcLength * (1 - arcPct);
  const isOver = ratio >= 1;

  return (
    <div className="flex flex-col items-center justify-center my-2 select-none w-full">
      <div className="relative w-full max-w-[190px] aspect-[180/105]">
        <svg viewBox="0 0 180 105" className="w-full h-full overflow-visible" aria-hidden="true">
          {/* Background Track Arc */}
          <path
            d="M 20 95 A 70 70 0 0 1 160 95"
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Active Colored Progress Arc */}
          <path
            d="M 20 95 A 70 70 0 0 1 160 95"
            fill="none"
            stroke={tierColor}
            strokeWidth="12"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />

          {/* Ratio Numeral Centered Inside the Arc */}
          <text
            x="90"
            y="65"
            textAnchor="middle"
            dominantBaseline="central"
            fill={isOver ? tierColor : 'var(--ink-primary)'}
            className="text-2xl font-black font-mono tracking-tight"
          >
            {ratio >= 1 ? `${ratio.toFixed(1)}x` : `${ratio.toFixed(2)}x`}
          </text>

          {/* Label Below the Numeral with Generous Vertical Clearance */}
          <text
            x="90"
            y="85"
            textAnchor="middle"
            dominantBaseline="central"
            fill={isOver ? tierColor : 'var(--ink-muted)'}
            className="text-[10px] font-mono font-semibold"
          >
            {isOver ? 'WHO Ref Exceeded' : 'Within WHO Limit'}
          </text>
        </svg>
      </div>

      {/* Reference Benchmark Pill - Completely Separated Below the SVG with Dedicated Padding */}
      <div className="mt-3 w-full py-1.5 px-3 rounded-lg bg-[var(--surface-subtle)] text-center border border-[var(--border-subtle)]/70">
        <span className="text-xs font-mono text-[var(--ink-muted)]">
          WHO 24h Ref: <strong className="text-[var(--ink-primary)]">{refValue} {unit}</strong>
        </span>
      </div>
    </div>
  );
}

// Everyday Family-Friendly Threat Ranking Bar Stack (Replaces the complex Radar Chart)
function PollutantThreatRanking({
  pollutants,
}: {
  pollutants: Record<PollutantKey, PollutantMeasurement>;
}) {
  const rankingData = ORDERED_POLLUTANT_KEYS.map((key) => {
    const item = pollutants[key];
    const edu = POLLUTANT_EDUCATIONAL_DATA[key];
    const conc = item?.concentration ?? 0;
    const ref = edu?.who2021Guidelines?.shortTerm?.value || 15;
    const ratio = conc > 0 && Number.isFinite(conc) ? conc / ref : 0;
    const tierColor = item?.tier ? item.tier.colorToken : ratio > 1 ? 'var(--aqi-unhealthy)' : 'var(--aqi-good)';

    return {
      key,
      formula: edu?.chemicalFormula || key,
      fullName: edu?.fullName || key,
      sourceName: POLLUTANT_SOURCE_TAGS[key]?.sourceName || '',
      icon: POLLUTANT_SOURCE_TAGS[key]?.icon || '💨',
      ratio,
      conc,
      ref,
      unit: item?.unit || 'μg/m³',
      tierColor,
    };
  }).sort((a, b) => b.ratio - a.ratio); // Sort highest hazard to lowest

  const maxRatio = Math.max(4, Math.max(...rankingData.map((d) => d.ratio)));

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 sm:p-6 mb-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-[var(--brand-primary)] bg-[var(--brand-surface)] px-2.5 py-1 rounded-md border border-[var(--brand-primary)]/30">
              📊 Pollutant Threat Ranking
            </span>
            <span className="text-xs font-mono text-[var(--ink-muted)]">
              Compared to WHO 2021 Health Baselines
            </span>
          </div>
          <p className="text-xs text-[var(--ink-secondary)] mt-1.5">
            Horizontal bars show which pollutants exceed health safety limits. Bars extending past the vertical line exceed WHO 24-hour guidelines.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
            1.0x = WHO Safe Limit
          </span>
        </div>
      </div>

      {/* Horizontal Bar Stack */}
      <div className="space-y-3.5">
        {rankingData.map((d) => {
          // Normalize bar width: 1.0x maps to ~22% width, maxRatio maps to 100%
          const barWidthPct = Math.min(100, Math.max(4, (d.ratio / (maxRatio * 1.05)) * 100));
          const safeMarkerPct = Math.min(100, (1 / (maxRatio * 1.05)) * 100);
          const isOver = d.ratio > 1;

          return (
            <div key={d.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs font-sans">
              {/* Pollutant Name & Everyday Source */}
              <div className="sm:w-56 shrink-0 flex items-center justify-between sm:justify-start gap-2">
                <span className="font-mono font-bold text-sm text-[var(--ink-primary)]">
                  {d.formula}
                </span>
                <span className="text-xs text-[var(--ink-secondary)] truncate">
                  {d.sourceName}
                </span>
              </div>

              {/* Progress Bar Track with 1.0x WHO Reference Guideline Marker */}
              <div className="flex-1 relative h-6 bg-[var(--surface-subtle)] rounded-lg overflow-hidden flex items-center">
                {/* 1.0x Safe Marker Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-emerald-600/80 z-10"
                  style={{ left: `${safeMarkerPct}%` }}
                  title="WHO 24-hour Safe Guideline Level (1.0x)"
                />

                {/* Progress Bar Fill */}
                <div
                  className="h-full rounded-lg transition-all duration-500 ease-out flex items-center justify-end px-2"
                  style={{
                    width: `${barWidthPct}%`,
                    backgroundColor: d.tierColor,
                  }}
                />
              </div>

              {/* Threat Ratio Badge */}
              <div className="sm:w-36 shrink-0 flex items-center justify-between sm:justify-end gap-1.5 font-mono">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    isOver
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {isOver ? `⚠️ ${d.ratio.toFixed(1)}x Limit` : `✓ ${d.ratio.toFixed(2)}x Safe`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PollutantGrid({
  pollutants,
  activeStandard,
  modelTimestamp,
  localTime,
  dominantPollutant,
  sourceType = 'model',
  stationName,
  distanceKm,
  observedAt,
}: PollutantGridProps) {
  const isEaqi = activeStandard === 'EUROPEAN_EAQI';
  const standardName = isEaqi ? 'European EAQI' : 'US EPA AQI';
  const isStation = sourceType === 'station' && Boolean(stationName);

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

  const effectiveTimestamp = observedAt || localTime || modelTimestamp || null;

  return (
    <section aria-labelledby="pollutants-telemetry-heading" className="w-full">
      {/* Matrix Header with Provenance & Standard Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2
            id="pollutants-telemetry-heading"
            className="text-lg sm:text-xl font-bold tracking-tight text-[var(--ink-primary)] font-sans flex items-center gap-2"
          >
            <span>Pollutant Concentration Matrix</span>
            <span className="text-xs font-mono font-normal text-[var(--ink-muted)] bg-[var(--surface-subtle)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
              6 Criteria Species
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--ink-secondary)] mt-0.5">
            {isStation
              ? 'In-situ ground monitor measurements for PM2.5/PM10 combined with regional numerical model estimates for gaseous species.'
              : 'Current instantaneous 1-hour modelled environmental estimates evaluated against regulatory index methods and WHO 2021 health-based guideline levels.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto shrink-0">
          {effectiveTimestamp && (
            <span className="text-xs font-mono text-[var(--ink-muted)] bg-[var(--surface-subtle)] px-2 py-1 rounded border border-[var(--border-subtle)]">
              Observation: {effectiveTimestamp} ({formatDataAge(observedAt || modelTimestamp)})
            </span>
          )}
          <span className="text-xs font-mono font-semibold text-[var(--brand-primary)] bg-[var(--brand-surface)] px-2.5 py-1 rounded border border-[var(--brand-primary)]/30">
            {isStation
              ? `Ground station: ${stationName}, ${distanceKm !== null && distanceKm !== undefined ? `${distanceKm} km away` : ''} · OpenAQ`
              : 'Modeled estimate (Copernicus CAMS via Open-Meteo, ~45 km grid) · no recent station within 25 km'}
          </span>
        </div>
      </div>

      {/* Human-Friendly Pollutant Threat Ranking Bar Stack */}
      <PollutantThreatRanking pollutants={pollutants} />

      {/* Responsive Grid: Desktop 3x2, Tablet 2x3, Mobile 1-col (no clipping, generous breathing room) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

          const tierColor = tier ? tier.colorToken : 'var(--brand-primary)';

          return (
            <article
              key={key}
              data-pollutant={key}
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
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="text-2xl font-black font-mono text-[var(--ink-primary)] tracking-tight"
                        >
                          {edu.chemicalFormula}
                        </span>
                        <span className="sr-only">{edu.screenReaderName}</span>
                        <span className="text-sm font-semibold text-[var(--ink-primary)] font-sans">
                          {edu.fullName}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                      {isDominant && (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--brand-primary)] text-white shrink-0"
                          title={`Identified as Primary Driver based on highest sub-index (${highestSubIndex}) under ${standardName}, not raw concentration.`}
                        >
                          Primary Driver
                        </span>
                      )}

                      {isCoUnderEaqi ? (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono text-[var(--ink-muted)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] whitespace-nowrap shrink-0"
                          title="Not evaluated under European EAQI standard (EEA convention)"
                        >
                          EAQI Excluded
                        </span>
                      ) : tier ? (
                        <span
                          className="px-2 py-0.5 rounded text-xs font-mono font-semibold border whitespace-nowrap shrink-0"
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[var(--ink-muted)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] whitespace-nowrap shrink-0">
                          Unreported
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Everyday Source Indicator */}
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-sans px-2.5 py-1 rounded-lg bg-[var(--surface-subtle)] text-[var(--ink-secondary)] border border-[var(--border-subtle)]">
                    <span aria-hidden="true">{POLLUTANT_SOURCE_TAGS[key]?.icon}</span>
                    <span className="font-medium">{POLLUTANT_SOURCE_TAGS[key]?.sourceName}</span>
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
        })}
      </div>
    </section>
  );
}
