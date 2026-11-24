'use client';

import React from 'react';
import { PollutantKey, PollutantMeasurement } from '@/domain/types';
import { derivePollutantThreatRanking } from '@/domain/aqi/pollutant-presentation';

interface PollutantThreatRankingProps {
  readonly pollutants: Record<PollutantKey, PollutantMeasurement>;
}

/**
 * Everyday Family-Friendly Threat Ranking Bar Stack comparing all 6 criteria pollutants.
 * @param props - pollutants record
 */
export function PollutantThreatRanking({ pollutants }: PollutantThreatRankingProps) {
  const rankingData = derivePollutantThreatRanking(pollutants);
  const maxRatio = Math.max(4, Math.max(...rankingData.map((d) => d.ratio)));

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 sm:p-6 mb-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-[var(--brand-primary)] bg-[var(--brand-surface)] px-2.5 py-1 rounded-md border border-[var(--brand-primary)]/30">
              📊 Pollutant Threat Ranking
            </span>
            <span className="text-xs font-mono text-[var(--ink-muted)]">
              Compared to WHO 2021 Health Baselines
            </span>
          </div>
          <p className="text-xs text-[var(--ink-secondary)] mt-1.5">
            Horizontal bars show which pollutants exceed health safety limits. Bars extending past the vertical line exceed WHO 24-hour guidelines.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
            1.0x = WHO Safe Limit
          </span>
        </div>
      </div>

      {/* Horizontal Bar Stack */}
      <div className="space-y-3.5">
        {rankingData.map((d) => {
          // Normalize bar width: 1.0x maps to ~22% width, maxRatio maps to 100%
          const barWidthPct = Math.min(100, Math.max(4, (d.ratio / (maxRatio * 1.05)) * 100));
          const safeMarkerPct = Math.min(100, (1 / (maxRatio * 1.05)) * 100);
          const isOver = d.ratio > 1;

          return (
            <div key={d.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs font-sans">
              {/* Pollutant Name & Everyday Source */}
              <div className="sm:w-56 shrink-0 flex items-center justify-between sm:justify-start gap-2">
                <span className="font-mono font-bold text-sm text-[var(--ink-primary)]">
                  {d.formula}
                </span>
                <span className="text-xs text-[var(--ink-secondary)] truncate">
                  {d.sourceName}
                </span>
              </div>

              {/* Progress Bar Track with 1.0x WHO Reference Guideline Marker */}
              <div className="flex-1 relative h-6 bg-[var(--surface-subtle)] rounded-lg overflow-hidden flex items-center">
                {/* 1.0x Safe Marker Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-emerald-600/80 z-10"
                  style={{ left: `${safeMarkerPct}%` }}
                  title="WHO 24-hour Safe Guideline Level (1.0x)"
                />

                {/* Progress Bar Fill */}
                <div
                  className="h-full rounded-lg transition-all duration-500 ease-out flex items-center justify-end px-2"
                  style={{
                    width: `${barWidthPct}%`,
                    backgroundColor: d.tierColor,
                  }}
                />
              </div>

              {/* Threat Ratio Badge */}
              <div className="sm:w-36 shrink-0 flex items-center justify-between sm:justify-end gap-1.5 font-mono">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    isOver
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {isOver ? `⚠️ ${d.ratio.toFixed(1)}x Limit` : `✓ ${d.ratio.toFixed(2)}x Safe`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
