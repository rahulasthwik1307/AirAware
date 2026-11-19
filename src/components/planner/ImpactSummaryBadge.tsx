'use client';

import React from 'react';
import { DeltaCIndicator, TransportEmissionIndicator } from '@/domain/planner/types';

interface ImpactSummaryBadgeProps {
  readonly deltaC?: DeltaCIndicator;
  readonly transportImpact?: TransportEmissionIndicator;
  readonly compact?: boolean;
}

export function ImpactSummaryBadge({
  deltaC,
  transportImpact,
  compact = false,
}: ImpactSummaryBadgeProps) {
  if (!deltaC && !transportImpact) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? 'text-xs' : 'text-xs mt-2'}`}>
      {/* Dimension A: Personal Ambient Exposure Difference (ΔC) */}
      {deltaC && (
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono font-medium border ${
            deltaC.deltaValue > 0
              ? 'bg-[var(--aqi-good-bg)] text-[var(--aqi-good)] border-[var(--aqi-good-border)]'
              : 'bg-[var(--surface-subtle)] text-[var(--ink-secondary)] border-[var(--border-subtle)]'
          }`}
          title={deltaC.cautionaryNote}
        >
          <span className="text-sm select-none" aria-hidden="true">
            🛡️
          </span>
          <span>
            {deltaC.deltaValue > 0 ? `+${deltaC.deltaValue}` : deltaC.deltaValue} {deltaC.unit} {deltaC.pollutantLabel}
          </span>
          <span className="text-[10px] uppercase font-sans font-semibold tracking-wider text-[var(--ink-muted)]">
            Ambient Diff
          </span>
        </div>
      )}

      {/* Dimension B: Environmental Operational Emissions Avoided */}
      {transportImpact && (
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono font-medium bg-[var(--brand-surface)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/20"
          title={`${transportImpact.sourceCitation} • ${transportImpact.operationalScopeNote}`}
        >
          <span className="text-sm select-none" aria-hidden="true">
            🌱
          </span>
          <span>
            -{transportImpact.avoidedCo2eKg} kg CO₂e
          </span>
          <span className="text-[10px] uppercase font-sans font-semibold tracking-wider text-[var(--brand-hover)]">
            Emissions Avoided
          </span>
        </div>
      )}
    </div>
  );
}
