'use client';

import React, { useState } from 'react';
import { ForecastPoint, AtmosphericModelMetadata } from '@/domain/types';
import { HouseholdMember } from '@/domain/household/types';
import { PlannerRecommendation, ActiveActionItem } from '@/domain/planner/types';

interface FamilyDailyBriefingProps {
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
  activePlanActions = [],
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

  // Exposure Reduction Gauge Calculations
  const recsWithDelta = recommendations.filter(
    (r) => r.deltaC && r.deltaC.deltaValue > 0
  );

  const adoptedDeltaActions = (activePlanActions || []).filter(
    (a) => a.deltaCValue && a.deltaCValue > 0
  );

  const hasAdoptedShifts = adoptedDeltaActions.length > 0;
  const hasPotentialShifts = recsWithDelta.length > 0;

  let gaugePercentage = 0;
  let gaugeDeltaCValue = 0;
  let gaugeStatusTitle = 'Baseline Routine Schedule';
  let gaugeStatusSubtitle = 'No routine shifts active';
  let gaugeIsOptimized = false;

  if (hasAdoptedShifts) {
    gaugeIsOptimized = true;
    gaugeDeltaCValue = Math.round(
      adoptedDeltaActions.reduce((sum, a) => sum + (a.deltaCValue ?? 0), 0) * 10
    ) / 10;
    const avgDelta = gaugeDeltaCValue / adoptedDeltaActions.length;
    gaugePercentage = Math.min(85, Math.max(15, Math.round((avgDelta / Math.max(avgDelta + 20, 100)) * 100)));
    gaugeStatusTitle = 'Active Smog Exposure Reduction';
    gaugeStatusSubtitle = `${adoptedDeltaActions.length} routine ${adoptedDeltaActions.length === 1 ? 'shift' : 'shifts'} adopted across family`;
  } else if (hasPotentialShifts) {
    const totalPotentialDelta = Math.round(
      recsWithDelta.reduce((sum, r) => sum + (r.deltaC?.deltaValue ?? 0), 0) * 10
    ) / 10;
    gaugeDeltaCValue = totalPotentialDelta;
    const bestRec = recsWithDelta[0];
    const pct = bestRec.deltaC
      ? Math.round((bestRec.deltaC.deltaValue / Math.max(1, bestRec.deltaC.originalConcentration)) * 100)
      : 35;
    gaugePercentage = Math.min(85, Math.max(10, pct));
    gaugeStatusTitle = 'Potential Exposure Reduction Available';
    gaugeStatusSubtitle = `${recsWithDelta.length} routine shift ${recsWithDelta.length === 1 ? 'window' : 'windows'} ready to adopt`;
  } else {
    gaugePercentage = 0;
    gaugeStatusTitle = 'Routines In Lower Smog Hours';
    gaugeStatusSubtitle = 'Current schedule aligns with daytime forecast dips';
  }

  // Semi-circle arc geometry: radius 68, length = PI * 68 = 213.63
  const arcLength = 213.63;
  const strokeDashoffset = arcLength * (1 - Math.min(100, Math.max(0, gaugePercentage)) / 100);

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

      {/* ============================================================ */}
      {/* FEATURE: FAMILY SMOG EXPOSURE REDUCTION GAUGE                */}
      {/* Visual Semi-Circle Arc & Ambient Difference Telemetry         */}
      {/* ============================================================ */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {/* Left: SVG Semi-Circle Exposure Reduction Gauge */}
        <div className="flex items-center gap-5 shrink-0">
          <div className="relative w-40 h-24 flex items-end justify-center select-none">
            <svg
              viewBox="0 0 190 110"
              className="w-full h-full overflow-visible"
              role="img"
              aria-label={`Family Smog Exposure Reduction Meter: ${gaugePercentage}%`}
            >
              <defs>
                <linearGradient id="reduction-gauge-emerald" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="reduction-gauge-amber" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Background Arc Track */}
              <path
                d="M 27 96 A 68 68 0 0 1 163 96"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                className="text-slate-200 dark:text-slate-800"
              />

              {/* Foreground Meter Arc */}
              <path
                d="M 27 96 A 68 68 0 0 1 163 96"
                fill="none"
                stroke={gaugeIsOptimized ? 'url(#reduction-gauge-emerald)' : hasPotentialShifts ? 'url(#reduction-gauge-amber)' : '#10b981'}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={arcLength}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out"
              />

              {/* In-Arc Text Content: Guaranteed completely inside the arc dome with ample clearance */}
              {hasPotentialShifts && !gaugeIsOptimized && (
                <text
                  x="95"
                  y="50"
                  textAnchor="middle"
                  className="text-[10px] font-mono font-bold uppercase tracking-widest fill-amber-700 dark:fill-amber-300"
                >
                  UP TO
                </text>
              )}
              <text
                x="95"
                y={hasPotentialShifts && !gaugeIsOptimized ? "76" : "70"}
                textAnchor="middle"
                className="text-2xl font-black font-mono tracking-tight fill-[var(--ink-primary)]"
              >
                {gaugePercentage > 0 ? `${gaugePercentage}%` : 'OPTIMAL'}
              </text>
              <text
                x="95"
                y={hasPotentialShifts && !gaugeIsOptimized ? "91" : "88"}
                textAnchor="middle"
                className="text-[9px] font-mono font-bold uppercase tracking-widest fill-[var(--ink-muted)]"
              >
                {gaugeIsOptimized ? 'ACHIEVED' : hasPotentialShifts ? 'POTENTIAL' : 'SCHEDULE'}
              </text>
            </svg>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--ink-primary)] font-sans">
                Smog Exposure Reduction
              </span>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                  gaugeIsOptimized
                    ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30'
                    : hasPotentialShifts
                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30'
                    : 'bg-slate-500/10 text-[var(--ink-muted)] border-slate-500/20'
                }`}
              >
                {gaugeIsOptimized ? 'Active Optimization' : hasPotentialShifts ? 'Timing Opportunity' : 'Aligned'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-[var(--ink-primary)] font-sans">
              {gaugeStatusTitle}
            </h3>
            <p className="text-xs text-[var(--ink-secondary)]">
              {gaugeStatusSubtitle}
            </p>
          </div>
        </div>

        {/* Right: Comparative Metric Cards & Action Trigger */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {gaugeDeltaCValue > 0 && (
            <div className="flex-1 md:flex-initial p-2.5 px-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-0.5">
              <span className="text-[10px] font-mono text-[var(--ink-muted)] block">
                Modelled Ambient Difference (ΔC)
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  +{gaugeDeltaCValue}
                </span>
                <span className="text-[10px] font-mono text-[var(--ink-muted)]">μg/m³ PM₂.₅</span>
              </div>
            </div>
          )}

          {hasPotentialShifts && !gaugeIsOptimized && onJumpToActions && (
            <button
              type="button"
              onClick={onJumpToActions}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <span>⚡ View Recommended Shifts</span>
              <span>↓</span>
            </button>
          )}

          {gaugeIsOptimized && (
            <div className="p-2.5 px-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 flex items-center gap-2 text-xs font-mono">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
              <span>Routines Protected</span>
            </div>
          )}
        </div>
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
