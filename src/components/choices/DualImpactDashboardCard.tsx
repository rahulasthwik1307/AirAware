'use client';

import React, { useState } from 'react';
import { DualImpactSummary } from '@/domain/choices/types';
import { ScientificInspectorModal } from './ScientificInspectorModal';

interface DualImpactDashboardCardProps {
  readonly dualImpact: DualImpactSummary;
  readonly onAskCopilot: (prompt: string) => void;
}

export function DualImpactDashboardCard({
  dualImpact,
  onAskCopilot,
}: DualImpactDashboardCardProps) {
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // SVG Circular Gauge calculations (Radius 36, Circumference ~226)
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  // Personal Defense Gauge offset
  const personalProgress = Math.min(100, Math.max(0, dualImpact.exposureDefenseProgressPercent));
  const personalOffset = circumference - (personalProgress / 100) * circumference;

  // Planetary Avoidance Gauge offset
  const planetaryProgress = Math.min(100, Math.max(0, dualImpact.avoidedCo2eProgressPercent));
  const planetaryOffset = circumference - (planetaryProgress / 100) * circumference;

  return (
    <article
      className="p-5 sm:p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between gap-5 transition-shadow hover:shadow-md"
      aria-labelledby="dual-impact-heading"
    >
      {/* Header: Uniform 2-Row Layout */}
      <div className="flex flex-col gap-1.5 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0" aria-hidden="true">
              ⚖️
            </span>
            <h2
              id="dual-impact-heading"
              className="text-base sm:text-lg font-bold text-[var(--ink-primary)] truncate font-sans tracking-tight"
            >
              Dual-Impact Integrity Dashboard
            </h2>
          </div>
          <button
            type="button"
            onClick={() =>
              onAskCopilot(
                'Explain the scientific distinction between personal exposure defense (ΔC) and avoided greenhouse gas emissions (CO2e). Why do personal transit choices not directly clean neighborhood sensor readings?'
              )
            }
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--brand-primary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 shadow-2xs transition-colors shrink-0 cursor-pointer"
            title="Ask Copilot about dual-impact science"
          >
            <span className="text-sm">🤖</span>
            <span>Ask Copilot</span>
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200 shrink-0">
            Dual-Impact Ledger
          </span>
          <p className="text-xs text-[var(--ink-secondary)] truncate">
            Strictly separates breathing zone defense from collective climate emissions.
          </p>
        </div>
      </div>

      {/* Side-by-Side Dual Panels (Personal Defense vs Planetary Avoidance) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Panel 1: Personal Exposure Defense */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-sky-50/70 to-sky-100/40 border border-sky-200/90 shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-1.5 border-b border-sky-200/70 pb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm shrink-0" aria-hidden="true">🛡️</span>
              <h3 className="text-xs sm:text-sm font-bold text-sky-950 font-sans tracking-tight">
                Personal Smog Defense
              </h3>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-sky-700/80 font-medium">Inversion Shield</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-white text-sky-800 border border-sky-200 shadow-2xs whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
                <span>{dualImpact.personalDefenseBadge}</span>
              </span>
            </div>
          </div>

          {/* SVG Circular Radial Progress Arc */}
          <div className="flex items-center justify-center my-0.5">
            <div className="relative flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-sky-100"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={personalOffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="text-sky-500 transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black font-mono text-sky-950 leading-none">
                  {dualImpact.exposureHoursShiftedWeekly}
                </span>
                <span className="text-[10px] font-mono font-bold text-sky-700 uppercase">
                  hrs / wk
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-center">
            <p className="text-xs font-bold text-sky-950">
              Shifted Away from Peak Inversion
            </p>
            <p className="text-[11px] font-mono font-semibold text-sky-800">
              Modelled Relative ΔC: -{dualImpact.relativeAmbientDeltaC} µg/m³
            </p>
          </div>

          {/* Progressive Micro-Indicators for Personal Smog Defense */}
          <div className="pt-2 border-t border-sky-200/80 space-y-2 text-[11px]">
            <div>
              <div className="flex justify-between items-center text-[10px] font-mono text-sky-900 mb-0.5">
                <span className="font-semibold">Morning Inversion Shield:</span>
                <span className="font-bold">{personalProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-sky-200/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${personalProgress}%` }}
                />
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white/80 border border-sky-200 text-[10px] text-sky-900 leading-snug flex items-center gap-1.5">
              <span className="text-xs">🫁</span>
              <span>
                Sidewalk breathing zone soot deposition minimized during cold-air pooling.
              </span>
            </div>
          </div>
        </div>

        {/* Panel 2: Planetary Emissions Avoided */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-50/70 to-emerald-100/40 border border-emerald-200/90 shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-1.5 border-b border-emerald-200/70 pb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm shrink-0" aria-hidden="true">🌍</span>
              <h3 className="text-xs sm:text-sm font-bold text-emerald-950 font-sans tracking-tight">
                Planetary Avoidance
              </h3>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-emerald-700/80 font-medium">Monthly Target</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-white text-emerald-800 border border-emerald-200 shadow-2xs whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{dualImpact.avoidedCo2eProgressPercent}% of Goal</span>
              </span>
            </div>
          </div>

          {/* SVG Circular Radial Progress Arc */}
          <div className="flex items-center justify-center my-0.5">
            <div className="relative flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-emerald-100"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={planetaryOffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="text-emerald-600 transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black font-mono text-emerald-950 leading-none">
                  {dualImpact.avoidedCo2eKgMonthly}
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase">
                  kg / mo
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-center">
            <p className="text-xs font-bold text-emerald-950">
              Tailpipe Greenhouse Gases Prevented
            </p>
            <p className="text-[11px] font-mono font-semibold text-emerald-800">
              ~{dualImpact.equivalentCarKmSavedMonthly} km car travel eliminated
            </p>
          </div>

          {/* Progressive Micro-Indicators for Planetary Climate Mitigation */}
          <div className="pt-2 border-t border-emerald-200/80 space-y-2 text-[11px]">
            <div>
              <div className="flex justify-between items-center text-[10px] font-mono text-emerald-900 mb-0.5">
                <span className="font-semibold">Monthly Carbon Target:</span>
                <span className="font-bold">{planetaryProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-emerald-200/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${planetaryProgress}%` }}
                />
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white/80 border border-emerald-200 text-[10px] text-emerald-900 leading-snug flex items-center gap-1.5">
              <span className="text-xs">🌲</span>
              <span>
                Equivalent to ~{Math.max(1, Math.round(dualImpact.avoidedCo2eKgMonthly / 21.7))} mature urban trees absorbing carbon monthly.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dual-Impact Reconciliation Synthesis Ledger (Zero Dead Space) */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-50/60 via-slate-50 to-emerald-50/60 border border-slate-200 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono font-bold text-[11px] uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <span>⚖️</span> Dual-Impact Synthesis Matrix
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
            Scientific Separation
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded-xl bg-white/90 border border-sky-100 shadow-2xs space-y-0.5">
            <span className="text-[10px] font-mono font-bold text-sky-800 uppercase">
              Immediate / Acute
            </span>
            <p className="font-semibold text-slate-800 text-xs">
              Personal Breathing Zone
            </p>
            <p className="text-[10px] text-slate-600 leading-snug">
              Shields lung alveoli from toxic microgram concentrations during 8 PM - 9 AM thermal stagnation.
            </p>
          </div>
          <div className="p-2 rounded-xl bg-white/90 border border-emerald-100 shadow-2xs space-y-0.5">
            <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase">
              Cumulative / Global
            </span>
            <p className="font-semibold text-slate-800 text-xs">
              Planetary Decarbonization
            </p>
            <p className="text-[10px] text-slate-600 leading-snug">
              Permanent tailpipe metric-ton emission prevention that flattens regional airshed pollution curves.
            </p>
          </div>
        </div>
      </div>

      {/* Integrity Disclaimer & Inspector Trigger */}
      <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
        <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed italic">
          *{dualImpact.personalDisclaimer}
        </p>

        <button
          type="button"
          onClick={() => setIsInspectorOpen(true)}
          className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--ink-primary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
        >
          <span>🔬</span>
          <span>Behind the Math: Inspect Scientific Formulas &amp; DEFRA Factors</span>
        </button>
      </div>

      {/* Scientific Inspector Modal */}
      {isInspectorOpen && (
        <ScientificInspectorModal
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
        />
      )}
    </article>
  );
}
