'use client';

import React from 'react';
import { ForecastPoint } from '@/domain/types';

interface TimelineAxisHeaderProps {
  readonly validPoints: readonly ForecastPoint[];
  readonly minPm25: number;
  readonly pm25Range: number;
}

export function TimelineAxisHeader({
  validPoints,
  minPm25,
  pm25Range,
}: TimelineAxisHeaderProps) {
  return (
    <>
      {/* Top: 24-Hour Time Axis Header */}
      <div className="flex items-center border-b border-[var(--border-subtle)] bg-[var(--surface-card)]">
        <div className="w-48 shrink-0 px-3.5 py-2.5 border-r border-[var(--border-subtle)] bg-[var(--surface-card)]">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
            Family Member
          </span>
        </div>

        <div className="flex-1 relative h-8 select-none">
          {Array.from({ length: 25 }, (_, hour) => {
            const leftPercent = (hour / 24) * 100;
            const isMajor = hour % 3 === 0;
            return (
              <div
                key={hour}
                className="absolute top-0 bottom-0 flex flex-col justify-between -translate-x-1/2"
                style={{ left: `${leftPercent}%` }}
              >
                {isMajor ? (
                  <span className="text-[10px] font-mono font-bold text-[var(--ink-primary)] select-none pt-1">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                ) : (
                  <span className="text-[8px] font-mono text-[var(--ink-muted)] opacity-60 select-none pt-1.5 hidden xl:inline">
                    {hour.toString().padStart(2, '0')}
                  </span>
                )}
                <div
                  className={`w-px mx-auto ${
                    isMajor ? 'h-2 bg-[var(--border-strong)]' : 'h-1 bg-[var(--border-subtle)] opacity-70'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Forecast Intensity Gradient Strip */}
      <div className="flex items-center border-b border-[var(--border-subtle)] bg-[var(--surface-card)]/60">
        <div className="w-48 shrink-0 px-3.5 py-1.5 border-r border-[var(--border-subtle)]">
          <span className="text-[10px] font-mono font-semibold text-[var(--ink-muted)]">
            Hourly Forecast (PM₂.₅)
          </span>
        </div>

        <div className="flex-1 relative h-7 flex">
          {validPoints.map((point, index) => {
            const pm25 = point.pm25 ?? 0;
            const normalizedIntensity = (pm25 - minPm25) / pm25Range;
            const isHigh = normalizedIntensity >= 0.7 || pm25 > 90;
            const isLow = normalizedIntensity <= 0.3 && pm25 <= 60;

            return (
              <div
                key={point.time || index}
                className={`flex-1 h-full border-r ${
                  index % 3 === 2
                    ? 'border-black/15 dark:border-white/15'
                    : 'border-black/5 dark:border-white/5'
                } flex items-center justify-center text-[10px] font-mono transition-colors group relative cursor-help ${
                  isHigh
                    ? 'bg-amber-500/25 text-amber-950 dark:text-amber-200 font-semibold'
                    : isLow
                    ? 'bg-emerald-500/25 text-emerald-950 dark:text-emerald-200 font-semibold'
                    : 'bg-slate-500/10 text-[var(--ink-muted)]'
                }`}
                title={`${index.toString().padStart(2, '0')}:00 - ${pm25} μg/m³ PM₂.₅`}
              >
                <span className="select-none scale-90">{Math.round(pm25)}</span>
                <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                  <div className="rounded-lg bg-[var(--ink-primary)] text-white text-[10px] font-mono px-2 py-1 shadow-md whitespace-nowrap">
                    {index.toString().padStart(2, '0')}:00 • {pm25} μg/m³ PM₂.₅
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
