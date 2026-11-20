'use client';

import React, { useState } from 'react';
import { calculateCadrAch } from '@/domain/indoor/calculations';

interface CleanAirSizerProps {
  readonly floorAreaM2: number;
  readonly ceilingHeightM: number;
  readonly selectedCadrM3h: number;
  readonly targetAch: number;
  readonly onUpdateArea: (area: number) => void;
  readonly onUpdateCeilingHeight: (height: number) => void;
  readonly onUpdatePurifier: (cadr: number, targetAch: number) => void;
  readonly onAskCopilot?: (question: string) => void;
}

export function CleanAirSizer({
  floorAreaM2,
  ceilingHeightM,
  selectedCadrM3h,
  targetAch,
  onUpdateArea,
  onUpdateCeilingHeight,
  onUpdatePurifier,
  onAskCopilot,
}: CleanAirSizerProps) {
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false);

  const calc = calculateCadrAch(floorAreaM2, ceilingHeightM, targetAch, selectedCadrM3h);

  return (
    <section
      aria-labelledby="clean-air-sizer-heading"
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 sm:p-6 shadow-xs space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2
              id="clean-air-sizer-heading"
              className="text-base sm:text-lg font-bold text-[var(--ink-primary)] font-sans flex items-center gap-2"
            >
              <span>💨 Clean Air &amp; Purifier Sizer</span>
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--ink-secondary)] border border-[var(--border-subtle)]">
              Engineering CADR Calculator
            </span>
          </div>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Size air purifiers to room volume using Clean Air Delivery Rate (CADR) and Air Changes per Hour (ACH).
          </p>
        </div>

        {onAskCopilot && (
          <button
            type="button"
            onClick={() =>
              onAskCopilot(
                `How do I size an air purifier for a ${floorAreaM2}m² room with ${selectedCadrM3h} m³/h CADR?`
              )
            }
            className="px-3 py-1.5 rounded-lg bg-[var(--surface-subtle)] text-[var(--ink-secondary)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-card)] text-xs font-mono font-medium border border-[var(--border-subtle)] transition-all cursor-pointer self-start sm:self-auto shrink-0 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          >
            <span>🤖</span>
            <span>Ask Copilot about Sizing</span>
          </button>
        )}
      </div>

      {/* Interactive Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Room Dimensions Input */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]/40 p-4 space-y-4">
          <span className="text-xs font-mono font-bold text-[var(--ink-muted)] uppercase tracking-wider block">
            1. Room Dimensions &amp; Volume
          </span>

          {/* Floor Area Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="floor-area-slider" className="font-semibold text-[var(--ink-primary)]">
                Floor Area
              </label>
              <span className="font-mono font-bold text-[var(--brand-primary)] bg-white px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                {floorAreaM2} m² <span className="text-[10px] text-[var(--ink-muted)] font-normal">(~{Math.round(floorAreaM2 * 10.76)} sq ft)</span>
              </span>
            </div>
            <input
              id="floor-area-slider"
              type="range"
              min="8"
              max="60"
              step="1"
              value={floorAreaM2}
              onChange={(e) => onUpdateArea(Number(e.target.value))}
              className="w-full accent-[var(--brand-primary)] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-[var(--ink-muted)]">
              <span>8 m² (Small)</span>
              <span>25 m² (Medium)</span>
              <span>60 m² (Large)</span>
            </div>
          </div>

          {/* Ceiling Height Toggles */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--ink-primary)] block">
              Ceiling Height
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[2.4, 2.7, 3.0].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => onUpdateCeilingHeight(h)}
                  className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                    ceilingHeightM === h
                      ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                      : 'bg-white hover:bg-[var(--surface-subtle)] text-[var(--ink-secondary)] border-[var(--border-subtle)]'
                  }`}
                >
                  {h} m
                </button>
              ))}
            </div>
          </div>

          {/* Calculated Volume Callout */}
          <div className="p-2.5 rounded-lg bg-white border border-[var(--border-subtle)] flex items-center justify-between text-xs">
            <span className="text-[var(--ink-muted)] font-medium">Calculated Room Volume:</span>
            <span className="font-mono font-bold text-[var(--ink-primary)]">
              {calc.roomVolumeM3} m³ <span className="text-[10px] text-[var(--ink-muted)] font-normal">[Area × Height]</span>
            </span>
          </div>
        </div>

        {/* Right Column: Purifier Sizing & Target ACH */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]/40 p-4 space-y-4">
          <span className="text-xs font-mono font-bold text-[var(--ink-muted)] uppercase tracking-wider block">
            2. Purifier Capacity &amp; Design Target
          </span>

          {/* Purifier CADR Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="cadr-slider" className="font-semibold text-[var(--ink-primary)]">
                Purifier Rated CADR
              </label>
              <span className="font-mono font-bold text-[var(--brand-primary)] bg-white px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                {selectedCadrM3h} m³/h <span className="text-[10px] text-[var(--ink-muted)] font-normal">(~{Math.round(selectedCadrM3h * 0.589)} CFM)</span>
              </span>
            </div>
            <input
              id="cadr-slider"
              type="range"
              min="50"
              max="600"
              step="10"
              value={selectedCadrM3h}
              onChange={(e) => onUpdatePurifier(Number(e.target.value), targetAch)}
              className="w-full accent-[var(--brand-primary)] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-[var(--ink-muted)]">
              <span>50 m³/h</span>
              <span>300 m³/h</span>
              <span>600 m³/h</span>
            </div>
          </div>

          {/* Target ACH Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--ink-primary)] block">
              Design Target (Air Changes / Hour)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3.0, 4.0, 5.0].map((ach) => (
                <button
                  key={ach}
                  type="button"
                  onClick={() => onUpdatePurifier(selectedCadrM3h, ach)}
                  className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                    targetAch === ach
                      ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                      : 'bg-white hover:bg-[var(--surface-subtle)] text-[var(--ink-secondary)] border-[var(--border-subtle)]'
                  }`}
                >
                  {ach} ACH
                </button>
              ))}
            </div>
            <span className="text-[10px] text-[var(--ink-muted)] block font-mono">
              3–5 ACH is an engineering baseline; required CADR for this room is{' '}
              <strong className="text-[var(--ink-primary)]">{calc.requiredCadrM3h} m³/h</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* Visual ACH Output & Comparison Gauge */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--brand-surface)]/40 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-mono font-bold text-[var(--ink-muted)] uppercase tracking-wider">
              Calculated Turnover Rate
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black font-mono text-[var(--brand-primary)]">
                {calc.estimatedAch}
              </span>
              <span className="text-sm font-bold text-[var(--ink-secondary)] font-sans">
                Air Changes per Hour (ACH)
              </span>
            </div>
          </div>

          <div className="self-start sm:self-auto">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                calc.isTargetMet
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : calc.isUnderpowered
                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {calc.isTargetMet
                ? '✓ Meets Selected ACH Target'
                : calc.isUnderpowered
                ? '⚠️ Underpowered (< 2 ACH)'
                : '⚡ Below Target ACH'}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden flex">
            <div
              className={`h-full transition-all duration-300 ${
                calc.isUnderpowered
                  ? 'bg-rose-500'
                  : calc.isTargetMet
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, (calc.estimatedAch / 6) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-[var(--ink-muted)]">
            <span>0 ACH</span>
            <span className="text-amber-800 font-bold">2 ACH (Minimum)</span>
            <span className="text-emerald-800 font-bold">4 ACH (Target: {calc.requiredCadrM3h} m³/h)</span>
            <span>6+ ACH</span>
          </div>
        </div>

        {/* Derated Sleep Fan Warning */}
        <div className="p-3 rounded-lg bg-white border border-[var(--border-subtle)] text-xs text-[var(--ink-secondary)] space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-[var(--ink-primary)] font-sans text-xs">
            <span>⚠️ Fan Speed Derating &amp; HEPA Limitations</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Rated CADR reflects maximum fan speed. On low/sleep mode, actual airflow typically drops to approx <strong>{calc.deratedSleepAch} ACH</strong>. Standard HEPA captures particulates (dust, smoke, PM2.5); it does <em>not</em> capture gaseous combustion products (NO2, CO) without significant activated carbon.
          </p>
        </div>
      </div>

      {/* Corsi-Rosenthal Box Blueprint Toggle */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-white p-4">
        <button
          type="button"
          onClick={() => setIsBlueprintOpen((prev) => !prev)}
          className="w-full flex items-center justify-between text-left cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          aria-expanded={isBlueprintOpen}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl" aria-hidden="true">📦</span>
            <div>
              <h3 className="text-sm font-bold text-[var(--ink-primary)] group-hover:text-[var(--brand-primary)] transition-colors font-sans">
                Low-Cost Alternative: The Corsi-Rosenthal Box
              </h3>
              <p className="text-[11px] text-[var(--ink-muted)]">
                DIY multi-filter box fan proven in peer-reviewed indoor air research.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[var(--brand-primary)]">
            {isBlueprintOpen ? 'Hide Blueprint ▲' : 'View Blueprint ▼'}
          </span>
        </button>

        {isBlueprintOpen && (
          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-3 text-xs text-[var(--ink-secondary)] animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-1">
                <span className="font-bold text-[var(--ink-primary)] font-mono text-[11px] block">
                  1. Materials
                </span>
                <p className="text-[11px] text-[var(--ink-muted)]">
                  One 20-inch box fan + four MERV 13 furnace filters (20×20 in) + duct tape + cardboard bottom shroud.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-1">
                <span className="font-bold text-[var(--ink-primary)] font-mono text-[11px] block">
                  2. Airflow Mechanics
                </span>
                <p className="text-[11px] text-[var(--ink-muted)]">
                  Four filters form a cube pulling air inward; fan on top exhausts filtered clean air vertically.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-1">
                <span className="font-bold text-[var(--ink-primary)] font-mono text-[11px] block">
                  3. Verified Performance
                </span>
                <p className="text-[11px] text-[var(--ink-muted)]">
                  Tested configurations deliver 300–450 m³/h CADR at ~20% of commercial purifier acquisition costs.
                </p>
              </div>
            </div>

            <p className="text-[10px] text-[var(--ink-muted)] italic">
              Note: CADR depends on filter depth (2-inch or 4-inch preferred for low pressure drop), fan motor, and perimeter duct-tape sealing. Avoid unsealed edges.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
