'use client';

import React from 'react';
import { CleanerTransitMode, CommuteComparisonResult } from '@/domain/choices/types';
import { TRANSIT_MODES } from '@/domain/choices/constants';

interface CommuteComparatorCardProps {
  readonly commute: CommuteComparisonResult;
  readonly onSelectAlternative: (mode: CleanerTransitMode) => void;
  readonly onDistanceChange: (km: number) => void;
  readonly onTripsChange: (trips: number) => void;
  readonly onAskCopilot: (prompt: string) => void;
}

const DISTANCE_PRESETS = [5, 12, 20, 35];
const DAYS_PRESETS = [
  { label: '2 days', trips: 4 },
  { label: '3 days', trips: 6 },
  { label: '5 days', trips: 10 },
  { label: '7 days', trips: 14 },
];

export function CommuteComparatorCard({
  commute,
  onSelectAlternative,
  onDistanceChange,
  onTripsChange,
  onAskCopilot,
}: CommuteComparatorCardProps) {
  const modesList = Object.values(TRANSIT_MODES);
  const baselineMax = Math.max(commute.baselineKgCo2eWeekly, 1);
  const baselineBarWidth = 100;
  const altBarWidth = Math.min(100, Math.round((commute.alternativeKgCo2eWeekly / baselineMax) * 100));

  return (
    <article
      className="p-5 sm:p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between gap-5 transition-shadow hover:shadow-md"
      aria-labelledby="commute-comparator-heading"
    >
      {/* Header: Uniform 2-Row Layout */}
      <div className="flex flex-col gap-1.5 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0" aria-hidden="true">
              🌱
            </span>
            <h2
              id="commute-comparator-heading"
              className="text-base sm:text-lg font-bold text-[var(--ink-primary)] truncate font-sans tracking-tight"
            >
              Sustainable Commute Comparator
            </h2>
          </div>
          <button
            type="button"
            onClick={() =>
              onAskCopilot(
                `Compare solo car driving with ${TRANSIT_MODES[commute.alternativeMode].label} for a ${commute.distanceKm} km daily commute during winter smog season. Why does it reduce secondary aerosol pollution?`
              )
            }
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--brand-primary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 shadow-2xs transition-colors shrink-0 cursor-pointer"
            title="Ask Copilot about commute mode impact"
          >
            <span className="text-sm">🤖</span>
            <span>Ask Copilot</span>
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
            Mode Shift Simulator
          </span>
          <p className="text-xs text-[var(--ink-secondary)] truncate">
            Contrast operational transport emissions and tailpipe smog precursors.
          </p>
        </div>
      </div>

      {/* Mode Tiles Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-bold font-mono uppercase tracking-wider text-[var(--ink-secondary)]">
          Select Alternative Transport Mode
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {modesList.map((modeMeta) => {
            const isSelected = commute.alternativeMode === modeMeta.mode;
            const isBaseline = modeMeta.mode === 'PRIVATE_CAR';

            return (
              <button
                key={modeMeta.mode}
                type="button"
                onClick={() => onSelectAlternative(modeMeta.mode)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-2xs'
                    : isBaseline
                    ? 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{modeMeta.icon}</span>
                  {isBaseline ? (
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                      Baseline
                    </span>
                  ) : modeMeta.factorKgCo2ePerKm === 0 ? (
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                      -100%
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-100/70 px-1.5 py-0.2 rounded">
                      -{Math.round(((0.170 - modeMeta.factorKgCo2ePerKm) / 0.170) * 100)}%
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--ink-primary)] truncate">
                    {modeMeta.shortLabel}
                  </p>
                  <p className="text-[10px] font-mono text-[var(--ink-muted)]">
                    {modeMeta.factorKgCo2ePerKm.toFixed(3)} kg/km
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Commute Controls */}
      <div className="p-3.5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label htmlFor="commute-distance-range" className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs font-bold text-[var(--ink-primary)] font-mono uppercase tracking-wider">
              One-Way Distance:
            </span>
            <span className="text-sm font-black font-mono text-[var(--brand-primary)]">
              {commute.distanceKm} km
            </span>
            <span className="text-[11px] text-[var(--ink-muted)]">
              ({commute.distanceKm * 2} km daily roundtrip)
            </span>
          </label>
          {/* Quick distance presets */}
          <div className="flex items-center gap-1.5">
            {DISTANCE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onDistanceChange(preset)}
                className={`px-2 py-0.5 text-xs font-mono font-semibold rounded-md transition-colors cursor-pointer ${
                  commute.distanceKm === preset
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'bg-white text-[var(--ink-secondary)] border border-[var(--border-subtle)] hover:bg-slate-100'
                }`}
              >
                {preset}km
              </button>
            ))}
          </div>
        </div>

        <input
          id="commute-distance-range"
          name="commuteDistance"
          type="range"
          min="1"
          max="50"
          step="1"
          value={commute.distanceKm}
          onChange={(e) => onDistanceChange(Number(e.target.value))}
          aria-label="Commute one-way distance in kilometers"
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[var(--brand-primary)]"
        />

        {/* Trips per week stepper */}
        <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]/60 text-xs">
          <span className="text-[var(--ink-secondary)] font-medium">Commute Days:</span>
          <div className="flex items-center gap-1.5">
            {DAYS_PRESETS.map((day) => (
              <button
                key={day.trips}
                type="button"
                onClick={() => onTripsChange(day.trips)}
                className={`px-2 py-0.5 font-mono text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  commute.tripsPerWeek === day.trips
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-[var(--ink-secondary)] border border-[var(--border-subtle)] hover:bg-slate-100'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 1: Comparative Delta Bar Chart */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold font-mono uppercase tracking-wider text-[var(--ink-secondary)]">
            Weekly Tailpipe Emissions Contrast
          </span>
          <span className="font-mono text-[11px] text-[var(--ink-muted)]">
            Total {commute.distanceKm * commute.tripsPerWeek} km/week
          </span>
        </div>

        {/* Comparative Bars */}
        <div className="space-y-2.5">
          {/* Baseline Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <span>🚗</span> Solo Petrol Car (Baseline)
              </span>
              <span className="font-mono font-bold text-slate-900">
                {commute.baselineKgCo2eWeekly} kg CO₂e
              </span>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full bg-slate-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${baselineBarWidth}%` }}
              />
            </div>
          </div>

          {/* Alternative Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-emerald-800 flex items-center gap-1.5">
                <span>{TRANSIT_MODES[commute.alternativeMode].icon}</span>{' '}
                {TRANSIT_MODES[commute.alternativeMode].label}
              </span>
              <span className="font-mono font-bold text-emerald-900">
                {commute.alternativeKgCo2eWeekly} kg CO₂e
              </span>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${altBarWidth}%` }}
              />
            </div>
          </div>
        </div>

        {/* Impact Savings Badge */}
        {commute.percentageCo2eReduction > 0 ? (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                ✓
              </span>
              <p className="text-xs font-semibold text-emerald-950">
                Avoids <span className="font-mono font-black">{commute.avoidedKgCo2eWeekly} kg</span>{' '}
                CO₂e weekly ({commute.percentageCo2eReduction}% reduction)
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-800 bg-white/80 px-2 py-0.5 rounded border border-emerald-200 self-start sm:self-auto">
              ~{commute.avoidedKgCo2eMonthly} kg avoided / mo
            </span>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            Selected alternative is identical to baseline. Select a shared or active mode to view savings.
          </div>
        )}
      </div>
    </article>
  );
}
