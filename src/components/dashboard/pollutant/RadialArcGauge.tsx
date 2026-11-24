'use client';

import React from 'react';

interface RadialArcGaugeProps {
  readonly concentration: number | null;
  readonly refValue: number;
  readonly unit: string;
  readonly tierColor: string;
}

/**
 * Clean Radial Arc Speedometer visualizing current concentration relative to WHO guidelines.
 * @param props - concentration, refValue, unit, and tierColor
 */
export function RadialArcGauge({
  concentration,
  refValue,
  unit,
  tierColor,
}: RadialArcGaugeProps) {
  if (concentration === null || !Number.isFinite(concentration)) {
    return (
      <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-[var(--surface-subtle)] text-xs font-mono text-[var(--ink-muted)]">
        <span>No Reference Benchmark</span>
      </div>
    );
  }

  const ratio = concentration / refValue;
  // Map ratio: 0 to 4x (ratios >= 3.5x fill the arc completely)
  const arcPct = Math.min(1, Math.max(0.04, ratio / 3.5));
  const arcLength = 219.9; // Half circumference of radius 70: pi * 70
  const strokeDashoffset = arcLength * (1 - arcPct);
  const isOver = ratio >= 1;

  return (
    <div className="flex flex-col items-center justify-center my-2 select-none w-full">
      <div className="relative w-full max-w-[190px] aspect-[180/105]">
        <svg viewBox="0 0 180 105" className="w-full h-full overflow-visible" aria-hidden="true">
          {/* Background Track Arc */}
          <path
            d="M 20 95 A 70 70 0 0 1 160 95"
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Active Colored Progress Arc */}
          <path
            d="M 20 95 A 70 70 0 0 1 160 95"
            fill="none"
            stroke={tierColor}
            strokeWidth="12"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />

          {/* Ratio Numeral Centered Inside the Arc */}
          <text
            x="90"
            y="65"
            textAnchor="middle"
            dominantBaseline="central"
            fill={isOver ? tierColor : 'var(--ink-primary)'}
            className="text-2xl font-black font-mono tracking-tight"
          >
            {ratio >= 1 ? `${ratio.toFixed(1)}x` : `${ratio.toFixed(2)}x`}
          </text>

          {/* Label Below the Numeral with Generous Vertical Clearance */}
          <text
            x="90"
            y="85"
            textAnchor="middle"
            dominantBaseline="central"
            fill={isOver ? tierColor : 'var(--ink-muted)'}
            className="text-[10px] font-mono font-semibold"
          >
            {isOver ? 'WHO Ref Exceeded' : 'Within WHO Limit'}
          </text>
        </svg>
      </div>

      {/* Reference Benchmark Pill */}
      <div className="mt-3 w-full py-1.5 px-3 rounded-lg bg-[var(--surface-subtle)] text-center border border-[var(--border-subtle)]/70">
        <span className="text-xs font-mono text-[var(--ink-muted)]">
          WHO 24h Ref: <strong className="text-[var(--ink-primary)]">{refValue} {unit}</strong>
        </span>
      </div>
    </div>
  );
}
