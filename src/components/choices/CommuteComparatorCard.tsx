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
  { label: '2 days', trips: 4, subtext: 'Partial' },
  { label: '3 days', trips: 6, subtext: 'Hybrid' },
  { label: '5 days', trips: 10, subtext: 'Standard' },
  { label: '7 days', trips: 14, subtext: 'Full' },
];

function getDistanceTier(km: number) {
  if (km <= 8) {
    return {
      tier: 'Active Mobility Zone',
      subtext: 'Walking & Cycling Peak Efficiency',
      badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      dotClass: 'bg-emerald-500',
    };
  }
  if (km <= 18) {
    return {
      tier: 'Urban Transit Corridor',
      subtext: 'Electric Metro & Bus Prime Range',
      badgeClass: 'text-cyan-700 bg-cyan-50 border-cyan-200',
      dotClass: 'bg-cyan-500',
    };
  }
  if (km <= 30) {
    return {
      tier: 'Suburban Commuter Trunk',
      subtext: 'Carpool & Rapid Rail Corridor',
      badgeClass: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      dotClass: 'bg-indigo-500',
    };
  }
  return {
    tier: 'Regional Highway Corridor',
    subtext: 'High Tailpipe Winter Exposure',
    badgeClass: 'text-amber-800 bg-amber-50 border-amber-200',
    dotClass: 'bg-amber-500',
  };
}

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
  const sliderFillPercent = Math.min(100, Math.max(0, ((commute.distanceKm - 1) / (50 - 1)) * 100));
  const tierInfo = getDistanceTier(commute.distanceKm);

  // Concrete tangible savings conversions (DEFRA & Indian Urban Standards)
  const weeklyKm = commute.distanceKm * commute.tripsPerWeek;
  const fuelSavedLitresWeekly = Number((commute.avoidedKgCo2eWeekly / 2.31).toFixed(1));
  const directRupeesSavedMonthly = Math.round(fuelSavedLitresWeekly * 4.33 * 104); // ₹104/L avg

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
                  {!isBaseline && (
                    modeMeta.factorKgCo2ePerKm === 0 ? (
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                        -100%
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-100/70 px-1.5 py-0.2 rounded">
                        -{Math.round(((0.170 - modeMeta.factorKgCo2ePerKm) / 0.170) * 100)}%
                      </span>
                    )
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

      {/* Interactive Commute Controls & Distance HUD */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-200/90 shadow-2xs space-y-3.5">
        {/* Distance HUD Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <label htmlFor="commute-distance-range" className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider cursor-pointer">
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
              {commute.distanceKm * 2} km daily roundtrip • <span className="font-semibold text-slate-700">{weeklyKm} km weekly travel</span>
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
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-2xs ${
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

      {/* Chart 1: High-Contrast Comparative Tailpipe Emissions & Impact */}
      <div className="space-y-3.5 pt-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold font-mono uppercase tracking-wider text-slate-800">
              Weekly Tailpipe Emissions Contrast
            </span>
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              Comparative DEFRA Model
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            Total {weeklyKm} km/week
          </span>
        </div>

        {/* High-Contrast Comparative Bars */}
        <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200">
          {/* Baseline Bar (Solo Petrol Car) - Vivid Warning Tone */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs items-center">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="text-sm">🚗</span> Solo Petrol Car
              </span>
              <span className="font-mono font-bold text-rose-950">
                {commute.baselineKgCo2eWeekly} kg CO₂e
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300">
              <div
                className="h-full bg-gradient-to-r from-rose-500 via-rose-400 to-amber-500 rounded-full transition-all duration-500 ease-out shadow-xs"
                style={{ width: `${baselineBarWidth}%` }}
              />
            </div>
          </div>

          {/* Alternative Bar - Vibrant Green/Teal Tone */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs items-center">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <span className="text-sm">{TRANSIT_MODES[commute.alternativeMode].icon}</span>{' '}
                {TRANSIT_MODES[commute.alternativeMode].label}
                {commute.percentageCo2eReduction === 100 && (
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                    Zero Tailpipe
                  </span>
                )}
              </span>
              <span className="font-mono font-bold text-emerald-950">
                {commute.alternativeKgCo2eWeekly} kg CO₂e
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-500 ease-out shadow-xs"
                style={{ width: `${altBarWidth}%` }}
              />
            </div>
          </div>

          {/* Visual Delta Bridge (Comparison Breakdown) */}
          {commute.percentageCo2eReduction > 0 && (
            <div className="pt-2 border-t border-slate-200/80">
              <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                <span className="text-emerald-800 font-bold flex items-center gap-1">
                  <span>📉</span> Avoided: -{commute.avoidedKgCo2eWeekly} kg ({commute.percentageCo2eReduction}%)
                </span>
                <span className="text-slate-500">
                  Remaining: {commute.alternativeKgCo2eWeekly} kg
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-200 border border-slate-300">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${commute.percentageCo2eReduction}%` }}
                  title={`Avoided: ${commute.percentageCo2eReduction}%`}
                />
                <div
                  className="bg-rose-400 h-full transition-all duration-500"
                  style={{ width: `${100 - commute.percentageCo2eReduction}%` }}
                  title={`Remaining: ${100 - commute.percentageCo2eReduction}%`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tangible Impact KPI Micro-Tiles */}
        {commute.percentageCo2eReduction > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {/* Tile 1: Carbon Offset */}
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
              <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wider">
                Carbon Offset
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-base font-black font-mono text-emerald-950">
                  -{commute.avoidedKgCo2eWeekly}
                </span>
                <span className="text-[11px] font-bold text-emerald-700">kg CO₂e/wk</span>
              </div>
              <span className="text-[10px] text-emerald-700 mt-0.5">
                ~{commute.avoidedKgCo2eMonthly} kg avoided / mo
              </span>
            </div>

            {/* Tile 2: Fuel Saved */}
            <div className="p-2.5 rounded-xl bg-cyan-50/70 border border-cyan-200 flex flex-col justify-between">
              <span className="text-[10px] font-mono font-bold text-cyan-800 uppercase tracking-wider">
                Petrol Conserved
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-base font-black font-mono text-cyan-950">
                  ~{fuelSavedLitresWeekly}
                </span>
                <span className="text-[11px] font-bold text-cyan-700">Litres/wk</span>
              </div>
              <span className="text-[10px] text-cyan-700 mt-0.5">
                Combustion avoided
              </span>
            </div>

            {/* Tile 3: Direct Money Saved */}
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
              <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-wider">
                Financial Savings
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-base font-black font-mono text-amber-950">
                  ₹{directRupeesSavedMonthly.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] font-bold text-amber-700">/ mo</span>
              </div>
              <span className="text-[10px] text-amber-700 mt-0.5">
                Direct fuel cost offset
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <span>ℹ️</span>
            <span>
              Solo Petrol Car is the baseline reference. Select Electric Metro, Carpool, Bus, or Cycling to calculate real-world tailpipe reductions and financial savings.
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
