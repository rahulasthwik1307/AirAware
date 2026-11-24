'use client';

import React from 'react';
import { AqiStandardKey, PollutantKey, PollutantMeasurement } from '@/domain/types';
import {
  POLLUTANT_EDUCATIONAL_DATA,
  PollutantEducationalData,
} from '@/domain/aqi/pollutant-educational-data';
import {
  ORDERED_POLLUTANT_KEYS,
  calculateDominantPollutant,
} from '@/domain/aqi/pollutant-presentation';
import { formatDataAge } from '@/lib/formatters/time';
import { PollutantThreatRanking } from './pollutant/PollutantThreatRanking';
import { PollutantCard } from './pollutant/PollutantCard';

export interface PollutantGridProps {
  readonly pollutants: Record<PollutantKey, PollutantMeasurement>;
  readonly activeStandard: AqiStandardKey;
  readonly modelTimestamp?: string;
  readonly localTime?: string;
  readonly dominantPollutant?: string | null;
  readonly sourceType?: 'station' | 'model';
  readonly stationName?: string | null;
  readonly distanceKm?: number | null;
  readonly observedAt?: string | null;
  readonly modelFallbackReason?: string | null;
}

/**
 * Pollutant Concentration Matrix rendering all 6 criteria pollutants
 * with provenance tags, threat ranking stack, and granular cards.
 *
 * @param props - Pollutants record, active regulatory standard, and provenance info
 */
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
  modelFallbackReason,
}: PollutantGridProps) {
  const isEaqi = activeStandard === 'EUROPEAN_EAQI';
  const standardName = isEaqi ? 'European EAQI' : 'US EPA AQI';
  const isStation = sourceType === 'station' && Boolean(stationName);

  // Identify dominant pollutant strictly from calculated positive sub-indices under the active standard
  // NEVER infer dominant pollutant from raw concentration!
  const { dominantKey: calculatedDominantKey, highestSubIndex } = calculateDominantPollutant(pollutants);

  const effectiveTimestamp = observedAt || localTime || modelTimestamp || null;

  return (
    <section aria-labelledby="pollutants-telemetry-heading" className="w-full">
      {/* Matrix Header with Provenance & Standard Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
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

        <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-auto max-w-full">
          {effectiveTimestamp && (
            <span className="text-xs font-mono text-[var(--ink-muted)] bg-[var(--surface-subtle)] px-2 py-1 rounded border border-[var(--border-subtle)] truncate max-w-full">
              Observation: {effectiveTimestamp} ({formatDataAge(observedAt || modelTimestamp)})
            </span>
          )}
          <span className="text-xs font-mono font-semibold text-[var(--brand-primary)] bg-[var(--brand-surface)] px-2.5 py-1 rounded border border-[var(--brand-primary)]/30 break-words max-w-full">
            {isStation
              ? `Ground station: ${stationName}, ${distanceKm !== null && distanceKm !== undefined ? `${distanceKm} km away` : ''} · OpenAQ${distanceKm && distanceKm > 10 ? ' · This station is far from you; air near you may differ.' : ''}`
              : `Modeled estimate (Copernicus CAMS via Open-Meteo, ~45 km grid) · ${modelFallbackReason || 'no recent station within 25 km'}`}
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

          const isCoUnderEaqi = isEaqi && key === 'carbon_monoxide';

          // Dominant check: must match calculated sub-index driver, or explicit dominantPollutant from aggregate
          const isDominant =
            !isCoUnderEaqi &&
            highestSubIndex > 0 &&
            (key === calculatedDominantKey ||
              (dominantPollutant && (edu.chemicalFormula === dominantPollutant || key === dominantPollutant)));

          return (
            <PollutantCard
              key={key}
              pollutantKey={key}
              item={item}
              edu={edu}
              isDominant={Boolean(isDominant)}
              isEaqi={isEaqi}
              standardName={standardName}
              highestSubIndex={highestSubIndex}
            />
          );
        })}
      </div>
    </section>
  );
}
