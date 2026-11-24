'use client';

import React from 'react';
import { ExposureGaugeData } from '@/domain/planner/briefing-derivations';

export interface BriefingExposureGaugeProps {
  readonly gaugeData: ExposureGaugeData;
  readonly onJumpToActions?: () => void;
}

/**
 * Visual semi-circle SVG arc gauge displaying smog exposure reduction percentage,
 * achieved vs potential states, and modeled ambient concentration differential (ΔC).
 *
 * @param props - exposure reduction gauge calculations and action jump handler
 */
export function BriefingExposureGauge({
  gaugeData,
  onJumpToActions,
}: BriefingExposureGaugeProps) {
  const {
    gaugePercentage,
    gaugeDeltaCValue,
    gaugeStatusTitle,
    gaugeStatusSubtitle,
    gaugeIsOptimized,
    hasPotentialShifts,
  } = gaugeData;

  // Semi-circle arc geometry: radius 68, length = PI * 68 = 213.63
  const arcLength = 213.63;
  const strokeDashoffset = arcLength * (1 - Math.min(100, Math.max(0, gaugePercentage)) / 100);

  return (
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
              stroke={
                gaugeIsOptimized
                  ? 'url(#reduction-gauge-emerald)'
                  : hasPotentialShifts
                  ? 'url(#reduction-gauge-amber)'
                  : '#10b981'
              }
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />

            {/* In-Arc Text Content */}
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
              y={hasPotentialShifts && !gaugeIsOptimized ? '76' : '70'}
              textAnchor="middle"
              className="text-2xl font-black font-mono tracking-tight fill-[var(--ink-primary)]"
            >
              {gaugePercentage > 0 ? `${gaugePercentage}%` : 'OPTIMAL'}
            </text>
            <text
              x="95"
              y={hasPotentialShifts && !gaugeIsOptimized ? '91' : '88'}
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
  );
}
