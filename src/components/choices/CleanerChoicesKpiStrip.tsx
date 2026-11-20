'use client';

import React from 'react';
import { CommuteComparisonResult, DualImpactSummary } from '@/domain/choices/types';

interface CleanerChoicesKpiStripProps {
  readonly commute: CommuteComparisonResult;
  readonly dualImpact: DualImpactSummary;
  readonly activeHabitCount: number;
}

export function CleanerChoicesKpiStrip({
  commute,
  dualImpact,
  activeHabitCount,
}: CleanerChoicesKpiStripProps) {
  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3.5"
      role="region"
      aria-label="Environmental and exposure impact summary statistics"
    >
      {/* KPI 1: Monthly CO2e Avoided */}
      <div className="p-3.5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[var(--ink-secondary)]">CO₂e Avoided</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {commute.percentageCo2eReduction > 0 ? `-${commute.percentageCo2eReduction}%` : 'Baseline'}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono text-[var(--ink-primary)]">
            {dualImpact.avoidedCo2eKgMonthly}
          </span>
          <span className="text-xs font-mono font-bold text-[var(--ink-secondary)]">kg / mo</span>
        </div>
        <p className="mt-1 text-[11px] text-[var(--ink-muted)] truncate">
          ~{dualImpact.equivalentCarKmSavedMonthly} km car travel avoided
        </p>
      </div>

      {/* KPI 2: Smog Peak Exposure Hours */}
      <div className="p-3.5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[var(--ink-secondary)]">Exposure Shifted</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200">
            {dualImpact.personalDefenseBadge}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono text-[var(--ink-primary)]">
            {dualImpact.exposureHoursShiftedWeekly}
          </span>
          <span className="text-xs font-mono font-bold text-[var(--ink-secondary)]">hrs / wk</span>
        </div>
        <p className="mt-1 text-[11px] text-[var(--ink-muted)] truncate">
          Out of morning thermal inversion peaks
        </p>
      </div>

      {/* KPI 3: Criteria NOx Avoided */}
      <div className="p-3.5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[var(--ink-secondary)]">Tailpipe NOx</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Airshed Clean
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono text-[var(--ink-primary)]">
            {dualImpact.avoidedNoxGramsMonthly}
          </span>
          <span className="text-xs font-mono font-bold text-[var(--ink-secondary)]">g / mo</span>
        </div>
        <p className="mt-1 text-[11px] text-[var(--ink-muted)] truncate">
          Prevents secondary aerosol formation
        </p>
      </div>

      {/* KPI 4: Active Clean Habits */}
      <div className="p-3.5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[var(--ink-secondary)]">Active Habits</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-violet-50 text-violet-700 border border-violet-200">
            Local-First
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono text-[var(--ink-primary)]">
            {activeHabitCount}
          </span>
          <span className="text-xs font-mono font-bold text-[var(--ink-secondary)]">adopted</span>
        </div>
        <p className="mt-1 text-[11px] text-[var(--ink-muted)] truncate">
          Tracked anonymously in localStorage
        </p>
      </div>
    </div>
  );
}
