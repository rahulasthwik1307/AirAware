'use client';

import React, { useState } from 'react';
import { CommuteComparisonResult } from '@/domain/choices/types';
import { TRANSIT_MODES } from '@/domain/choices/constants';

interface AirshedPollutantBreakdownCardProps {
  readonly commute: CommuteComparisonResult;
  readonly onAskCopilot: (prompt: string) => void;
}

export function AirshedPollutantBreakdownCard({
  commute,
  onAskCopilot,
}: AirshedPollutantBreakdownCardProps) {
  const [activeTab, setActiveTab] = useState<'CHARTS' | 'CHEMISTRY'>('CHARTS');
  const altMeta = TRANSIT_MODES[commute.alternativeMode];
  const weeklyKm = commute.distanceKm * commute.tripsPerWeek;

  // Pollutant 1: CO2e (kg) - Planetary Greenhouse Gas
  const baselineCo2 = commute.baselineKgCo2eWeekly;
  const altCo2 = commute.alternativeKgCo2eWeekly;
  const co2ReductionPct = commute.percentageCo2eReduction;
  const co2AltWidth = baselineCo2 > 0 ? Math.min(100, Math.round((altCo2 / baselineCo2) * 100)) : 0;

  // Pollutant 2: NOx (g) - Smog & Secondary Aerosol Precursor
  const baselineNox = Number((weeklyKm * 0.450).toFixed(1));
  const altNox = Number((weeklyKm * altMeta.factorGramsNoxPerKm).toFixed(1));
  const noxReductionPct =
    baselineNox > 0 ? Math.round(((baselineNox - altNox) / baselineNox) * 100) : 0;
  const noxAvoidedGrams = Number((baselineNox - altNox).toFixed(1));
  const noxAltWidth = baselineNox > 0 ? Math.min(100, Math.round((altNox / baselineNox) * 100)) : 0;

  // Pollutant 3: PM2.5 Tailpipe Exhaust (g) - Ultrafine Sidewalk Soot
  const baselinePm = Number((weeklyKm * 0.025).toFixed(2));
  const altPm = Number((weeklyKm * altMeta.factorGramsPm25PerKm).toFixed(2));
  const pmReductionPct =
    baselinePm > 0 ? Math.round(((baselinePm - altPm) / baselinePm) * 100) : 0;
  const pmAvoidedGrams = Number((baselinePm - altPm).toFixed(2));
  const pmAltWidth = baselinePm > 0 ? Math.min(100, Math.round((altPm / baselinePm) * 100)) : 0;

  return (
    <article
      className="p-5 sm:p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between gap-3.5 transition-shadow hover:shadow-md h-full"
      aria-labelledby="airshed-pollutants-heading"
    >
      {/* Header: Uniform 2-Row Layout with Copilot Trigger */}
      <div className="flex flex-col gap-1.5 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0" aria-hidden="true">
              🧪
            </span>
            <h2
              id="airshed-pollutants-heading"
              className="text-base sm:text-lg font-bold text-[var(--ink-primary)] truncate font-sans tracking-tight"
            >
              City Air Quality Impact Breakdown
            </h2>
          </div>
          <button
            type="button"
            onClick={() =>
              onAskCopilot(
                'How do vehicle exhaust emissions react in winter air to produce secondary PM2.5 smog? Why does shifting morning commutes reduce neighborhood air pollution?'
              )
            }
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--brand-primary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 shadow-2xs transition-colors shrink-0 cursor-pointer"
            title="Ask Copilot about winter tailpipe chemistry"
          >
            <span className="text-sm">🤖</span>
            <span>Ask Copilot</span>
          </button>
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
              Tailpipe Chemistry
            </span>
            <p className="text-xs text-[var(--ink-secondary)] truncate">
              Contrast toxic criteria precursors against planetary greenhouse gases.
            </p>
          </div>

          {/* Interactive Analysis View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('CHARTS')}
              className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-md transition-all cursor-pointer ${
                activeTab === 'CHARTS'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 Comparative Charts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('CHEMISTRY')}
              className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-md transition-all cursor-pointer ${
                activeTab === 'CHEMISTRY'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔬 Inversion Chemistry
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Data Visualization Section */}
      <div className="flex-1 flex flex-col justify-start gap-3">
        {/* Top Visual Impact Overview Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/50 border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500 transition-all duration-700 ease-out"
                  strokeDasharray={`${co2ReductionPct}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[10px] font-mono font-black text-slate-800">
                {co2ReductionPct}%
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Emission Cut</span>
              <span className="text-xs font-bold text-slate-900 leading-tight block">
                {co2ReductionPct === 0 ? 'Fossil Baseline' : `-${commute.avoidedKgCo2eWeekly} kg CO₂e`}
              </span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
            <span className="text-[10px] font-mono font-bold text-amber-800 uppercase block">Smog Precursor NOx</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black font-mono text-amber-950">
                {noxAvoidedGrams > 0 ? `-${noxAvoidedGrams}g` : '0g'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">avoided/wk</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
            <span className="text-[10px] font-mono font-bold text-violet-800 uppercase block">Sidewalk PM2.5</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black font-mono text-violet-950">
                {pmAvoidedGrams > 0 ? `-${pmAvoidedGrams}g` : '0g'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">avoided/wk</span>
            </div>
          </div>
        </div>

        {activeTab === 'CHARTS' ? (
          <div className="space-y-2.5">
            {/* Pollutant 1: CO2e - Greenhouse Gas */}
            <div className="p-2.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🌍</span>
                  <div>
                    <span className="font-bold text-slate-900">Greenhouse Gases (CO₂e)</span>
                    <span className="text-[10px] text-slate-500 block font-mono">Planetary Climate Driver</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-xs">
                  -{co2ReductionPct}% ({commute.avoidedKgCo2eWeekly} kg avoided)
                </span>
              </div>

              {/* Comparative Horizontal Bars */}
              <div className="space-y-1 pt-0.5">
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="w-16 shrink-0 text-slate-500 text-[10px]">Solo Car</span>
                  <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-rose-400 to-amber-400 rounded-full w-full" />
                  </div>
                  <span className="w-14 shrink-0 text-right font-bold text-slate-800">{baselineCo2} kg</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="w-16 shrink-0 font-bold text-emerald-700 text-[10px] truncate">{altMeta.shortLabel}</span>
                  <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${co2AltWidth}%` }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right font-bold text-emerald-900">{altCo2} kg</span>
                </div>
              </div>
            </div>

            {/* Pollutant 2: NOx - Smog Precursor */}
            <div className="p-2.5 rounded-2xl bg-amber-50/40 border border-amber-200/90 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">💨</span>
                  <div>
                    <span className="font-bold text-amber-950">Nitrogen Oxides (NOx)</span>
                    <span className="text-[10px] text-amber-700 block font-mono">Primary Winter Smog &amp; Ozone Precursor</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-300 text-xs">
                  -{noxReductionPct}% ({noxAvoidedGrams}g avoided)
                </span>
              </div>

              {/* Comparative Horizontal Bars */}
              <div className="space-y-1 pt-0.5">
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="w-16 shrink-0 text-slate-500 text-[10px]">Solo Car</span>
                  <div className="flex-1 h-2.5 bg-amber-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full w-full" />
                  </div>
                  <span className="w-14 shrink-0 text-right font-bold text-amber-950">{baselineNox} g</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="w-16 shrink-0 font-bold text-emerald-700 text-[10px] truncate">{altMeta.shortLabel}</span>
                  <div className="flex-1 h-2.5 bg-amber-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${noxAltWidth}%` }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right font-bold text-emerald-900">{altNox} g</span>
                </div>
              </div>
              <p className="text-[10px] text-amber-800 leading-snug">
                *Reacts with airborne ammonia under cold winter inversions to produce hazardous secondary ammonium nitrate aerosol.
              </p>
            </div>

            {/* Pollutant 3: PM2.5 Tailpipe Exhaust - Ultrafine Combustion Soot */}
            <div className="p-2.5 rounded-2xl bg-violet-50/40 border border-violet-200/90 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🔬</span>
                  <div>
                    <span className="font-bold text-violet-950">Tailpipe PM₂.₅ Soot</span>
                    <span className="text-[10px] text-violet-700 block font-mono">Ultrafine Sidewalk Breathing Zone Carcinogen</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-violet-800 bg-violet-100/70 px-2 py-0.5 rounded-full border border-violet-300 text-xs">
                  -{pmReductionPct}% ({pmAvoidedGrams}g avoided)
                </span>
              </div>

              {/* Comparative Horizontal Bars */}
              <div className="space-y-1 pt-0.5">
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="w-16 shrink-0 text-slate-500 text-[10px]">Solo Car</span>
                  <div className="flex-1 h-2.5 bg-violet-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full w-full" />
                  </div>
                  <span className="w-14 shrink-0 text-right font-bold text-violet-950">{baselinePm} g</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="w-16 shrink-0 font-bold text-emerald-700 text-[10px] truncate">{altMeta.shortLabel}</span>
                  <div className="flex-1 h-2.5 bg-violet-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${pmAltWidth}%` }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right font-bold text-emerald-900">{altPm} g</span>
                </div>
              </div>
              <p className="text-[10px] text-violet-800 leading-snug">
                *Combustion soot particles emitted at 0.5m sidewalk height, penetrating directly into deep alveolar lung tissue.
              </p>
            </div>
          </div>
        ) : (
          /* Chemistry Flow View: The 4-Stage Inversion Smog Reactor */
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-800 font-sans">
                Winter Inversion Atmospheric Reaction Cascade
              </span>
              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Aerosol Chemistry
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* Step 1 */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Cold-Start Tailpipe Injection</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Cold engine starts emit 4x higher NOx and unburnt hydrocarbons directly into roadside air at breathing height.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Thermal Inversion Trapping</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Ground-level radiative cooling creates a thermal lid below 150m, sealing vehicle exhaust in the urban breathing dome.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                  <span className="w-4 h-4 rounded-full bg-violet-500 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Secondary Ammonium Nitrate</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Trapped NOx oxidizes and binds with ambient ammonia (NH₃), forming secondary PM2.5 that worsens regional smog.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-2.5 rounded-xl bg-white border border-emerald-200 shadow-2xs space-y-1 bg-emerald-50/50">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-[11px]">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">4</span>
                  <span>Clean Transit Elimination</span>
                </div>
                <p className="text-[10px] text-emerald-900 leading-relaxed">
                  Shifting {commute.distanceKm} km to {altMeta.label} prevents {noxAvoidedGrams}g of NOx, stopping secondary particulate formation before it begins.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Atmospheric Science & Health Action Callout (Zero Empty Space) */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50/70 via-slate-50 to-emerald-50/70 border border-slate-200 text-xs space-y-1 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-[11px]">
            <span>🌡️</span>
            <span>Why Winter Tailpipe Chemistry Multiplies Exposure:</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
            CPCB Science Model
          </span>
        </div>
        <p className="text-slate-600 leading-relaxed text-[11px]">
          During morning winter inversions (7:00–9:30 AM), calm surface winds (&lt; 5 km/h) prevent atmospheric dispersion. Clean mobility and delayed commute departures directly eliminate sidewalk precursors right when the atmosphere is most stagnant.
        </p>
      </div>
    </article>
  );
}
