'use client';

import React from 'react';
import { DiurnalPeriodSummary } from './timeline-types';

interface DiurnalPeriodSummaryCardsProps {
  readonly periods: readonly DiurnalPeriodSummary[];
}

export function DiurnalPeriodSummaryCards({ periods }: DiurnalPeriodSummaryCardsProps) {
  return (
    <div className="block md:hidden space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--ink-secondary)]">
          Diurnal Forecast Periods (Mobile Summary):
        </p>
        <span className="text-[10px] font-mono text-[var(--ink-muted)]">No horizontal scroll</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {periods.map((period) => (
          <div
            key={period.label}
            className={`p-3.5 rounded-xl border ${period.colorClass} space-y-2 transition-all`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-sans flex items-center gap-1.5">
                <span>{period.label}</span>
              </span>
              <span className="text-[10px] font-mono opacity-80">{period.timeRange}</span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-base font-bold font-mono">
                  {period.averagePm25 !== null ? `${period.averagePm25} μg/m³` : '—'}
                </span>
                <span className="text-[10px] font-mono opacity-70 ml-1">avg</span>
              </div>
              <span className="text-[10px] font-semibold">{period.severityLabel}</span>
            </div>

            {period.peakPm25 !== null && period.peakHour !== null && (
              <p className="text-[10px] font-mono text-[var(--ink-muted)]">
                Peak: ~{period.peakPm25} μg/m³ around {period.peakHour.toString().padStart(2, '0')}:00
              </p>
            )}

            <p className="text-[10px] text-[var(--ink-muted)] font-mono border-t border-black/5 dark:border-white/5 pt-1.5">
              {period.activityCount > 0
                ? `${period.activityCount} family ${period.activityCount === 1 ? 'activity' : 'activities'} scheduled`
                : 'No activities scheduled'}
            </p>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-[var(--ink-muted)] italic font-mono pt-1">
        Note: Period values reflect arithmetic averages of available 1-hour CAMS model points.
      </p>
    </div>
  );
}
