'use client';

import React, { useState } from 'react';
import { ForecastPoint, AtmosphericModelMetadata } from '@/domain/types';
import { HouseholdMember } from '@/domain/household/types';
import { PlannerRecommendation } from '@/domain/planner/types';

interface FamilyDailyBriefingProps {
  readonly members: readonly HouseholdMember[];
  readonly forecast: readonly ForecastPoint[];
  readonly recommendations: readonly PlannerRecommendation[];
  readonly adoptedCount: number;
  readonly modelMetadata?: AtmosphericModelMetadata;
  readonly isLoadingForecast?: boolean;
  readonly forecastError?: string | null;
  readonly onJumpToActions?: () => void;
}

function parseHourFromTimeString(timeStr: string): number {
  const [h] = timeStr.split(':');
  const parsed = parseInt(h, 10);
  return Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(23, parsed));
}

function findForecastPointForHour(
  forecast: readonly ForecastPoint[],
  targetHour: number
): ForecastPoint | null {
  if (!forecast || forecast.length === 0) return null;
  const hourPrefix = `${targetHour.toString().padStart(2, '0')}:`;
  const match = forecast.find((fp) => {
    if (fp.displayTime && fp.displayTime.startsWith(hourPrefix)) {
      return true;
    }
    const tIndex = fp.time.indexOf('T');
    if (tIndex !== -1 && fp.time.length >= tIndex + 3) {
      const isoHour = parseInt(fp.time.slice(tIndex + 1, tIndex + 3), 10);
      return isoHour === targetHour;
    }
    return false;
  });
  return match ?? null;
}

export function FamilyDailyBriefing({
  members,
  forecast,
  recommendations,
  adoptedCount,
  modelMetadata,
  isLoadingForecast = false,
  forecastError = null,
  onJumpToActions,
}: FamilyDailyBriefingProps) {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // If loading or error
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

  // Derived Telemetry from actual forecast points
  const validPoints = forecast.filter(
    (fp) => fp.pm25 !== null && fp.pm25 !== undefined && Number.isFinite(fp.pm25)
  );

  let highestPoint: ForecastPoint | null = null;
  let lowestPoint: ForecastPoint | null = null;

  if (validPoints.length > 0) {
    highestPoint = validPoints.reduce((prev, curr) =>
      (curr.pm25 ?? 0) > (prev.pm25 ?? 0) ? curr : prev
    );
    lowestPoint = validPoints.reduce((prev, curr) =>
      (curr.pm25 ?? Infinity) < (prev.pm25 ?? Infinity) ? curr : prev
    );
  }

  // Triage all scheduled family activities against forecast
  const allSchedules = members.flatMap((m) =>
    m.schedules.map((s) => ({
      ...s,
      memberNickname: m.nickname,
      memberArchetype: m.archetype,
      memberSensitivity: m.sensitivityTier,
    }))
  );

  // An activity needs attention if:
  // 1. It is OUTDOOR_EXERCISE or COMMUTE or SCHOOL_TRAVEL or VENTILATION, and
  // 2. Its scheduled hour PM2.5 > 35 μg/m³ (or member has sensitivity and PM2.5 > 25 μg/m³)
  const activitiesNeedingAttention = allSchedules.filter((item) => {
    const hour = parseHourFromTimeString(item.startTime);
    const fp = findForecastPointForHour(forecast, hour);
    const pm25 = fp?.pm25;
    if (pm25 === null || pm25 === undefined) return false;

    if (item.activityType === 'OUTDOOR_EXERCISE') {
      const threshold = item.memberSensitivity !== 'NONE' ? 25 : 35;
      return pm25 > threshold;
    }
    if (item.activityType === 'COMMUTE' || item.activityType === 'SCHOOL_TRAVEL') {
      return pm25 > 45;
    }
    if (item.activityType === 'VENTILATION') {
      // If outdoor PM2.5 is elevated during airing out
      return pm25 > 40;
    }
    return false;
  });

  const modelDomain = modelMetadata?.domainName ?? 'Open-Meteo CAMS Global Model';
  const highestPm25 = highestPoint?.pm25 ?? null;
  const lowestPm25 = lowestPoint?.pm25 ?? null;

  // Plain-Language Summary Drafting
  let conditionSummary = 'Modelled particulate levels remain relatively steady across today.';
  if (highestPm25 !== null && lowestPm25 !== null) {
    if (highestPm25 > 80) {
      conditionSummary =
        'Modelled particulate levels indicate elevated smog concentrations during peak hours, with lower forecast pollution during mid-day windows.';
    } else if (highestPm25 > 45) {
      conditionSummary =
        'Moderate ambient particulate concentrations forecast across daytime hours, with measurable differences between morning and afternoon windows.';
    } else {
      conditionSummary =
        'Relatively lower ambient particulate levels modelled across daytime hours. Favorable periods for outdoor family routines.';
    }
  }

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

      {/* Briefing Key Indicators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Peak Forecast Smog */}
        <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] space-y-1">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
            Peak Modelled Pollution
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-[var(--ink-primary)]">
              {highestPm25 !== null ? `${highestPm25}` : '—'}
            </span>
            <span className="text-xs text-[var(--ink-secondary)] font-mono">μg/m³ PM2.5</span>
          </div>
          <p className="text-[10px] text-[var(--ink-muted)] font-mono">
            {highestPoint?.displayTime ? `Highest around ${highestPoint.displayTime}` : 'Across 24h cycle'}
          </p>
        </div>

        {/* Metric 2: Lower Pollution Window */}
        <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] space-y-1">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
            Lower Forecast Window
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-[var(--aqi-good)]">
              {lowestPm25 !== null ? `${lowestPm25}` : '—'}
            </span>
            <span className="text-xs text-[var(--ink-secondary)] font-mono">μg/m³ PM2.5</span>
          </div>
          <p className="text-[10px] text-[var(--ink-muted)] font-mono">
            {lowestPoint?.displayTime ? `Lowest around ${lowestPoint.displayTime}` : 'Daytime minimum'}
          </p>
        </div>

        {/* Metric 3: Activities Needing Attention */}
        <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] space-y-1">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
            Activities Needing Attention
          </p>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl font-bold font-mono ${
                activitiesNeedingAttention.length > 0 ? 'text-amber-700' : 'text-[var(--ink-primary)]'
              }`}
            >
              {activitiesNeedingAttention.length}
            </span>
            <span className="text-xs text-[var(--ink-secondary)] font-mono">
              of {allSchedules.length} scheduled
            </span>
          </div>
          <p className="text-[10px] text-[var(--ink-muted)]">
            {activitiesNeedingAttention.length > 0
              ? 'Overlap with higher forecast pollution'
              : 'All routines align with lower pollution'}
          </p>
        </div>

        {/* Metric 4: Actionable Recommendations */}
        <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] space-y-1">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
            Available Routine Shifts
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-[var(--brand-primary)]">
              {recommendations.length}
            </span>
            <span className="text-xs text-[var(--ink-secondary)] font-mono">recommendations</span>
          </div>
          <p className="text-[10px] text-[var(--ink-muted)]">
            {recommendations.length > 0
              ? 'Practical timing shifts & habits ready'
              : 'No adjustments required today'}
          </p>
        </div>
      </div>

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
