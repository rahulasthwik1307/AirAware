'use client';

import React from 'react';
import { CommuteComparisonResult } from '@/domain/choices/types';
import { TRANSIT_MODES } from '@/domain/choices/constants';
import { CommuteImpactSavings } from '@/domain/choices/commute-emissions';

export interface CommuteEmissionsChartProps {
  readonly commute: CommuteComparisonResult;
  readonly savings: CommuteImpactSavings;
  readonly baselineBarWidth: number;
  readonly altBarWidth: number;
}

/**
 * High-Contrast Comparative Tailpipe Emissions Chart and Tangible Impact KPI Micro-Tiles.
 * Displays DEFRA comparison model, avoided delta bridge, petrol conserved, and financial savings.
 *
 * @param props - Commute result, savings metrics, and computed bar widths
 */
export function CommuteEmissionsChart({
  commute,
  savings,
  baselineBarWidth,
  altBarWidth,
}: CommuteEmissionsChartProps) {
  const { weeklyKm, fuelSavedLitresWeekly, directRupeesSavedMonthly } = savings;

  return (
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
        {/* Baseline Bar (Solo Petrol Car) */}
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

        {/* Alternative Bar */}
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

        {/* Visual Delta Bridge */}
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
  );
}
