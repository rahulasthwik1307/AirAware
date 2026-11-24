'use client';

import React from 'react';
import { ForecastPoint } from '@/domain/types';
import { ScheduledActivityWithMember } from '@/domain/planner/briefing-derivations';
import { PlannerRecommendation } from '@/domain/planner/types';

export interface BriefingMetricCardsProps {
  readonly highestPoint: ForecastPoint | null;
  readonly lowestPoint: ForecastPoint | null;
  readonly highestPm25: number | null;
  readonly lowestPm25: number | null;
  readonly activitiesNeedingAttention: readonly ScheduledActivityWithMember[];
  readonly totalSchedulesCount: number;
  readonly recommendations: readonly PlannerRecommendation[];
}

/**
 * 4-card metric grid for the family briefing summarizing peak pollution,
 * lower pollution windows, activities needing attention, and available routine shifts.
 *
 * @param props - Extremes, scheduled activity counts, and recommendations
 */
export function BriefingMetricCards({
  highestPoint,
  lowestPoint,
  highestPm25,
  lowestPm25,
  activitiesNeedingAttention,
  totalSchedulesCount,
  recommendations,
}: BriefingMetricCardsProps) {
  return (
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
            of {totalSchedulesCount} scheduled
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
  );
}
