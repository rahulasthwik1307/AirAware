'use client';

import React from 'react';
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
  const altMeta = TRANSIT_MODES[commute.alternativeMode];
  const weeklyKm = commute.distanceKm * commute.tripsPerWeek;

  // Pollutant 1: CO2e (kg)
  const baselineCo2 = commute.baselineKgCo2eWeekly;
  const altCo2 = commute.alternativeKgCo2eWeekly;
  const co2ReductionPct = commute.percentageCo2eReduction;

  // Pollutant 2: NOx (g)
  const baselineNox = Number((weeklyKm * 0.450).toFixed(1));
  const altNox = Number((weeklyKm * altMeta.factorGramsNoxPerKm).toFixed(1));
  const noxReductionPct =
    baselineNox > 0 ? Math.round(((baselineNox - altNox) / baselineNox) * 100) : 0;

  // Pollutant 3: PM2.5 Tailpipe Exhaust (g)
  const baselinePm = Number((weeklyKm * 0.025).toFixed(2));
  const altPm = Number((weeklyKm * altMeta.factorGramsPm25PerKm).toFixed(2));
  const pmReductionPct =
    baselinePm > 0 ? Math.round(((baselinePm - altPm) / baselinePm) * 100) : 0;

  return (
    <article
      className="p-5 sm:p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between gap-5 transition-shadow hover:shadow-md"
      aria-labelledby="airshed-pollutants-heading"
    >
      {/* Header: Uniform 2-Row Layout */}
      <div className="flex flex-col gap-1.5 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0" aria-hidden="true">
              🧪
            </span>
            <h2
              id="airshed-pollutants-heading"
              className="text-base sm:text-lg font-bold text-[var(--ink-primary)] truncate font-sans tracking-tight"
            >
              Airshed Pollutant Impact Breakdown
            </h2>
          </div>
          <button
            type="button"
            onClick={() =>
              onAskCopilot(
                'How do vehicle tailpipe NOx emissions react during cold winter thermal inversions to produce secondary PM2.5 ammonium nitrate smog? Why does shifting morning commutes clean the airshed?'
              )
            }
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--brand-primary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 shadow-2xs transition-colors shrink-0 cursor-pointer"
            title="Ask Copilot about winter tailpipe chemistry"
          >
            <span className="text-sm">🤖</span>
            <span>Ask Copilot</span>
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
            Tailpipe Chemistry
          </span>
          <p className="text-xs text-[var(--ink-secondary)] truncate">
            Contrast toxic criteria precursors against planetary greenhouse gases.
          </p>
        </div>
      </div>

      {/* Chart 3: Multi-Bar Chemical Waterfall Comparison */}
      <div className="space-y-4">
        {/* Metric 1: CO2e */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <span>🌍</span> Greenhouse Gases (CO₂e)
            </span>
            <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              -{co2ReductionPct}% ({commute.avoidedKgCo2eWeekly} kg avoided)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Solo Car: </span>
              <span className="font-bold text-slate-800">{baselineCo2} kg</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-emerald-700">{altMeta.shortLabel}: </span>
              <span className="font-bold text-emerald-900">{altCo2} kg</span>
            </div>
          </div>
        </div>

        {/* Metric 2: NOx */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <span>💨</span> Nitrogen Oxides (NOx)
            </span>
            <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              -{noxReductionPct}% ({commute.avoidedNoxGramsWeekly}g avoided)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Solo Car: </span>
              <span className="font-bold text-slate-800">{baselineNox} g</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="text-amber-800">{altMeta.shortLabel}: </span>
              <span className="font-bold text-amber-950">{altNox} g</span>
            </div>
          </div>
          <p className="text-[10px] text-[var(--ink-muted)]">
            *Direct precursor to secondary aerosol smog and urban ground-level ozone.
          </p>
        </div>

        {/* Metric 3: PM2.5 Tailpipe Exhaust */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <span>🔬</span> Tailpipe PM₂.₅ Soot
            </span>
            <span className="font-mono font-bold text-violet-800 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
              -{pmReductionPct}% ({commute.avoidedPm25GramsWeekly}g avoided)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Solo Car: </span>
              <span className="font-bold text-slate-800">{baselinePm} g</span>
            </div>
            <div className="p-2 rounded-xl bg-violet-50/70 border border-violet-200">
              <span className="text-violet-800">{altMeta.shortLabel}: </span>
              <span className="font-bold text-violet-950">{altPm} g</span>
            </div>
          </div>
          <p className="text-[10px] text-[var(--ink-muted)]">
            *Direct combustion soot particles emitted directly at sidewalk breathing height.
          </p>
        </div>
      </div>

      {/* Atmospheric Science Callout Box */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
        <div className="flex items-center gap-2 text-slate-900 font-bold">
          <span>🌡️</span>
          <span>Why Tailpipe Timing Matters in Winter:</span>
        </div>
        <p className="text-slate-600 leading-relaxed text-[11px]">
          During morning winter inversions, cold ground air traps tailpipe emissions below 150m. Shifting transport to electric transit or delaying departure removes vehicle precursors right when the atmosphere cannot disperse them.
        </p>
      </div>
    </article>
  );
}
