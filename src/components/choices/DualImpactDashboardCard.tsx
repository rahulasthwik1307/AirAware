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

      {/* Side-by-Side Dual Panels (Power BI Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Panel 1: Personal Exposure Defense */}
        <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-200 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
              <span>🛡️</span> Personal Smog Defense
            </span>
            <span className="text-[10px] font-mono font-bold text-sky-700 bg-white px-2 py-0.5 rounded border border-sky-200">
              {dualImpact.personalDefenseBadge}
            </span>
          </div>

          {/* SVG Circular Radial Progress Arc */}
          <div className="flex items-center justify-center my-1">
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
            <p className="text-xs font-semibold text-sky-900">
              Shifted Away from Peak Inversion
            </p>
            <p className="text-[11px] font-mono text-sky-700">
              Modelled Relative ΔC: -{dualImpact.relativeAmbientDeltaC} µg/m³
            </p>
          </div>
        </div>

        {/* Panel 2: Planetary Emissions Avoided */}
        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <span>🌍</span> Planetary Avoidance
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
              {dualImpact.avoidedCo2eProgressPercent}% of Goal
            </span>
          </div>

          {/* SVG Circular Radial Progress Arc */}
          <div className="flex items-center justify-center my-1">
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
            <p className="text-xs font-semibold text-emerald-900">
              Tailpipe Greenhouse Gases Prevented
            </p>
            <p className="text-[11px] font-mono text-emerald-700">
              ~{dualImpact.equivalentCarKmSavedMonthly} km car travel eliminated
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
