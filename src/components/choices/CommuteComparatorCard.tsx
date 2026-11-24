'use client';

import React from 'react';
import { CleanerTransitMode, CommuteComparisonResult } from '@/domain/choices/types';
import { TRANSIT_MODES } from '@/domain/choices/constants';
import {
  DISTANCE_PRESETS,
  DAYS_PRESETS,
  getDistanceTier,
  calculateCommuteImpactSavings,
  calculateComparativeBarWidths,
} from '@/domain/choices/commute-emissions';
import { CommuteEmissionsChart } from './CommuteEmissionsChart';

export interface CommuteComparatorCardProps {
  readonly commute: CommuteComparisonResult;
  readonly onSelectAlternative: (mode: CleanerTransitMode) => void;
  readonly onDistanceChange: (km: number) => void;
  readonly onTripsChange: (trips: number) => void;
  readonly onAskCopilot: (prompt: string) => void;
}

/**
 * Interactive Commute Mode Shift Comparator Card.
 * Compares baseline solo car travel against cleaner transit alternatives with tangible
 * tailpipe emissions, petrol fuel conservation, and direct financial savings.
 *
 * @param props - Commute result, alternative selection, distance, trip callbacks, and AI prompt trigger
 */
export function CommuteComparatorCard({
  commute,
  onSelectAlternative,
  onDistanceChange,
  onTripsChange,
  onAskCopilot,
}: CommuteComparatorCardProps) {
  const modesList = Object.values(TRANSIT_MODES);
  const { baselineBarWidth, altBarWidth } = calculateComparativeBarWidths(
    commute.baselineKgCo2eWeekly,
    commute.alternativeKgCo2eWeekly
  );
  const sliderFillPercent = Math.min(100, Math.max(0, ((commute.distanceKm - 1) / (50 - 1)) * 100));
  const tierInfo = getDistanceTier(commute.distanceKm);

  const savings = calculateCommuteImpactSavings(
    commute.distanceKm,
    commute.tripsPerWeek,
    commute.avoidedKgCo2eWeekly
  );

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
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--brand-primary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 shadow-2xs transition-colors shrink-0 cursor-pointer tactile-btn"
            title="Ask Copilot about commute mode impact"
          >
            <span className="text-sm">🤖</span>
            <span>Ask Copilot</span>
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
            Mode Shift Simulator
          </span>
          <p className="text-xs text-[var(--ink-secondary)] truncate">
            Contrast operational transport emissions and tailpipe smog precursors.
          </p>
        </div>
      </div>

      {/* Mode Tiles Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-[var(--ink-secondary)] font-sans">
          Alternative Transport Mode
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
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 tactile-btn ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-2xs'
                    : isBaseline
                    ? 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{modeMeta.icon}</span>
                  {!isBaseline &&
                    (modeMeta.factorKgCo2ePerKm === 0 ? (
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                        -100%
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-100/70 px-1.5 py-0.2 rounded">
                        -{Math.round(((0.17 - modeMeta.factorKgCo2ePerKm) / 0.17) * 100)}%
                      </span>
                    ))}
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

      {/* Interactive Commute Controls & Distance HUD */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-200/90 shadow-2xs space-y-3.5">
        {/* Distance HUD Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <label htmlFor="commute-distance-range" className="text-xs font-semibold text-slate-800 font-sans cursor-pointer">
                One-Way Distance:
              </label>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-900 tracking-tight">
                  {commute.distanceKm}
                </span>
                <span className="text-xs font-bold font-mono text-emerald-700">km</span>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${tierInfo.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${tierInfo.dotClass}`} aria-hidden="true" />
                {tierInfo.tier}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {commute.distanceKm * 2} km daily roundtrip • <span className="font-semibold text-slate-700">{savings.weeklyKm} km weekly travel</span>
            </p>
          </div>

          {/* Quick Distance Presets */}
          <div className="flex items-center gap-1.5 self-start sm:self-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider hidden sm:inline">Presets:</span>
            {DISTANCE_PRESETS.map((preset) => {
              const isActive = commute.distanceKm === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onDistanceChange(preset)}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-2xs tactile-btn ${
                    isActive
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/30 scale-105'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {preset}km
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Dual-Color Gradient Range Slider */}
        <div className="space-y-1.5">
          <div className="relative flex items-center">
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
              style={{
                background: `linear-gradient(to right, #059669 0%, #0d9488 ${sliderFillPercent}%, #cbd5e1 ${sliderFillPercent}%, #cbd5e1 100%)`,
              }}
              className="w-full h-2.5 rounded-lg appearance-none cursor-pointer accent-emerald-600 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {/* Scale Ticks & Labels */}
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 px-0.5">
            <span className="font-semibold">1 km (Local)</span>
            <span>12 km</span>
            <span>25 km (Mid)</span>
            <span>35 km</span>
            <span className="font-semibold">50 km (Regional)</span>
          </div>
        </div>

        {/* Commute Days Stepper */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
              Commute Frequency:
            </span>
            <span className="text-slate-500 text-[11px]">
              ({commute.tripsPerWeek} one-way trips / wk)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {DAYS_PRESETS.map((day) => {
              const isActive = commute.tripsPerWeek === day.trips;
              return (
                <button
                  key={day.trips}
                  type="button"
                  onClick={() => onTripsChange(day.trips)}
                  className={`px-2.5 py-1 font-mono text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs ${
                    isActive
                      ? 'bg-slate-900 text-white ring-2 ring-slate-800/30'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                  title={`${day.trips} trips per week`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* High-Contrast Comparative Tailpipe Emissions & Impact */}
      <CommuteEmissionsChart
        commute={commute}
        savings={savings}
        baselineBarWidth={baselineBarWidth}
        altBarWidth={altBarWidth}
      />
    </article>
  );
}
