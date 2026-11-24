'use client';

import React, { useState } from 'react';
import { ForecastPoint, AtmosphericModelMetadata } from '@/domain/types';
import { HouseholdMember } from '@/domain/household/types';
import { PlannerRecommendation, ActiveActionItem } from '@/domain/planner/types';
import {
  deriveForecastExtremes,
  deriveConditionSummary,
  triageActivitiesNeedingAttention,
  calculateExposureGaugeData,
} from '@/domain/planner/briefing-derivations';
import { BriefingExposureGauge } from './briefing/BriefingExposureGauge';
import { BriefingMetricCards } from './briefing/BriefingMetricCards';

export interface FamilyDailyBriefingProps {
  readonly members: readonly HouseholdMember[];
  readonly forecast: readonly ForecastPoint[];
  readonly recommendations: readonly PlannerRecommendation[];
  readonly adoptedCount: number;
  readonly activePlanActions?: readonly ActiveActionItem[];
  readonly modelMetadata?: AtmosphericModelMetadata;
  readonly isLoadingForecast?: boolean;
  readonly forecastError?: string | null;
  readonly onJumpToActions?: () => void;
}

/**
 * Daily Air Briefing for families that cross-references atmospheric forecast models
 * against household schedules, visualizes potential/achieved smog exposure reductions,
 * and highlights windows for outdoor activities.
 *
 * @param props - Household members, forecast points, recommendations, and model metadata
 */
export function FamilyDailyBriefing({
  members,
  forecast,
  recommendations,
  adoptedCount,
  activePlanActions = [],
  modelMetadata,
  isLoadingForecast = false,
  forecastError = null,
  onJumpToActions,
}: FamilyDailyBriefingProps) {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // If loading
  if (isLoadingForecast) {
    return (
      <section
        aria-label="Family Daily Air Briefing"
        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 sm:p-6 shadow-xs animate-pulse space-y-3"
      >
        <div className="h-4 w-44 rounded bg-[var(--surface-subtle)]" />
        <div className="h-6 w-3/4 rounded bg-[var(--surface-subtle)]" />
        <div className="h-16 w-full rounded bg-[var(--surface-subtle)]" />
      </section>
    );
  }

  // If error or empty forecast
  if (forecastError || !forecast || forecast.length === 0) {
    return (
      <section
        aria-label="Family Daily Air Briefing"
        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 sm:p-6 shadow-xs space-y-2 text-xs"
      >
        <h2 className="text-base font-bold text-[var(--ink-primary)] font-sans flex items-center gap-2">
          <span>🌅 Your Family&apos;s Air Briefing</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-subtle)] text-[var(--ink-muted)] border border-[var(--border-subtle)]">
            Forecast Unavailable
          </span>
        </h2>
        <p className="text-[var(--ink-secondary)] leading-relaxed">
          {forecastError
            ? `Environmental forecast data is temporarily unavailable (${forecastError}). Family schedules remain active.`
            : 'Environmental forecast data is currently not reported for this location. Revisit once atmospheric model updates arrive.'}
        </p>
      </section>
    );
  }

  const { highestPoint, lowestPoint, highestPm25, lowestPm25 } = deriveForecastExtremes(forecast);
  const conditionSummary = deriveConditionSummary(highestPm25, lowestPm25);
  const { allSchedules, activitiesNeedingAttention } = triageActivitiesNeedingAttention(members, forecast);
  const gaugeData = calculateExposureGaugeData(recommendations, activePlanActions);
  const modelDomain = modelMetadata?.domainName ?? 'Open-Meteo CAMS Global Model';

  return (
    <section
      aria-labelledby="family-briefing-title"
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 sm:p-6 shadow-xs space-y-4"
    >
      {/* Header & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl select-none" aria-hidden="true">
              🌅
            </span>
            <h2
              id="family-briefing-title"
              className="text-base sm:text-lg font-bold text-[var(--ink-primary)] font-sans"
            >
              Your Family&apos;s Daily Air Briefing
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--brand-surface)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 font-medium">
              Modelled Forecast
            </span>
          </div>
          <p className="text-xs text-[var(--ink-secondary)] mt-1 max-w-2xl leading-relaxed">
            {conditionSummary}
          </p>
        </div>

        {onJumpToActions && adoptedCount > 0 && (
          <button
            type="button"
            onClick={onJumpToActions}
            className="px-3.5 py-1.5 rounded-xl bg-[var(--brand-surface)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white border border-[var(--brand-primary)]/20 text-xs font-mono font-semibold transition-all cursor-pointer self-start sm:self-auto shrink-0 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          >
            Today&apos;s Checklist ({adoptedCount} active) ↓
          </button>
        )}
      </div>

      {/* FEATURE: FAMILY SMOG EXPOSURE REDUCTION GAUGE */}
      <BriefingExposureGauge
        gaugeData={gaugeData}
        onJumpToActions={onJumpToActions}
      />

      {/* Briefing Key Indicators Grid */}
      <BriefingMetricCards
        highestPoint={highestPoint}
        lowestPoint={lowestPoint}
        highestPm25={highestPm25}
        lowestPm25={lowestPm25}
        activitiesNeedingAttention={activitiesNeedingAttention}
        totalSchedulesCount={allSchedules.length}
        recommendations={recommendations}
      />

      {/* Expandable Scientific Methodology & Disclaimer */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setIsMethodologyOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)] font-mono transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
          aria-expanded={isMethodologyOpen}
          aria-controls="briefing-methodology-details"
        >
          <span>ℹ️ How this daily briefing is calculated</span>
          <span
            className="text-[10px] transform transition-transform duration-200"
            style={{ transform: isMethodologyOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ▼
          </span>
        </button>

        {isMethodologyOpen && (
          <div
            id="briefing-methodology-details"
            className="mt-2.5 rounded-xl bg-[var(--surface-subtle)] p-3.5 text-xs text-[var(--ink-secondary)] space-y-2 border border-[var(--border-subtle)] animate-fadeIn font-mono leading-relaxed"
          >
            <p>
              <strong className="text-[var(--ink-primary)] font-sans">Atmospheric Model Source:</strong>{' '}
              {modelDomain}. Forecast data represents regional numerical aerosol transport simulations (~45km spatial grid resolution).
            </p>
            <p>
              <strong className="text-[var(--ink-primary)] font-sans">Relative Comparison Only:</strong>{' '}
              AirAware compares higher vs lower forecast hours to identify times when ambient particulate concentrations are modelled to be lower. It does not promise &quot;clean air&quot; or guaranteed protection from airborne pollutants.
            </p>
            <p>
              <strong className="text-[var(--ink-primary)] font-sans">Local Ground Inversions:</strong> Physical in-situ ground monitoring stations (e.g. roadside monitors) may measure higher localized concentrations than regional grid models during winter temperature inversions.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
