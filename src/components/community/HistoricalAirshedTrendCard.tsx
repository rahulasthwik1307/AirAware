'use client';

import React from 'react';
import { HistoricalAirshedPoint } from '@/domain/community/types';

interface HistoricalAirshedTrendCardProps {
  readonly history: readonly HistoricalAirshedPoint[];
  readonly locationName: string;
}

export function HistoricalAirshedTrendCard({
  history,
  locationName,
}: HistoricalAirshedTrendCardProps) {
  const maxAqi = Math.max(...history.map((h) => h.aqi), 450);
  const avgAqi = Math.round(history.reduce((sum, h) => sum + h.aqi, 0) / history.length);
  const severeDays = history.filter((h) => h.aqi >= 400).length;

  const getBarColor = (aqi: number) => {
    if (aqi >= 400) return 'from-rose-600 to-rose-700 text-rose-950';
    if (aqi >= 300) return 'from-amber-500 to-amber-600 text-amber-950';
    if (aqi >= 200) return 'from-orange-400 to-orange-500 text-orange-950';
    return 'from-emerald-500 to-teal-500 text-emerald-950';
  };

  return (
    <article
      className="p-5 sm:p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between gap-4 transition-shadow hover:shadow-md"
      aria-labelledby="historical-airshed-heading"
    >
      {/* Header */}
      <div className="flex flex-col gap-1.5 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0" aria-hidden="true">
              📈
            </span>
            <h2
              id="historical-airshed-heading"
              className="text-base sm:text-lg font-bold text-[var(--ink-primary)] truncate font-sans tracking-tight"
            >
              7-Day Airshed Trend &amp; Retrospective Inversion Wave
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
            Open-Meteo Reanalysis
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200 shrink-0">
            Diurnal Trajectory
          </span>
          <p className="text-xs text-[var(--ink-secondary)] truncate">
            Evaluating winter stagnation episodes and diurnal inversion waves for {locationName}.
          </p>
        </div>
      </div>

      {/* 3 Summary Metric Badges */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">7-Day Mean AQI</span>
          <span className="text-base font-black font-mono text-slate-900">{avgAqi}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
          <span className="text-[10px] font-mono text-rose-800 uppercase block">Peak Smog Day</span>
          <span className="text-base font-black font-mono text-rose-950">445 (Tue)</span>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
          <span className="text-[10px] font-mono text-amber-800 uppercase block">Severe+ Days</span>
          <span className="text-base font-black font-mono text-amber-950">{severeDays} of 7</span>
        </div>
      </div>

      {/* High-Contrast 7-Day Bar & Inversion Chart */}
      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pb-1 border-b border-slate-200">
          <span>CPCB National Standard Benchmark (60 µg/m³)</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Severe GRAP (&gt;400)
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block ml-1" /> Very Poor (&gt;300)
          </span>
        </div>

        <div className="h-44 flex items-end justify-between gap-2 pt-2">
          {history.map((pt) => {
            const heightPercent = Math.min(100, Math.round((pt.aqi / maxAqi) * 100));
            const isToday = pt.dayLabel.includes('Today');

            return (
              <div key={pt.date} className="flex-1 flex flex-col items-center h-full justify-end group">
                {/* Tooltip value */}
                <span className="text-[10px] font-mono font-bold text-slate-700 opacity-80 group-hover:opacity-100 transition-opacity mb-1">
                  {pt.aqi}
                </span>

                {/* Vertical Bar */}
                <div className="w-full max-w-[36px] bg-slate-200/90 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                  <div
                    className={`w-full bg-gradient-to-t ${getBarColor(pt.aqi)} rounded-t-lg transition-all duration-700 shadow-2xs ${
                      isToday ? 'ring-2 ring-emerald-500/80 ring-offset-1' : ''
                    }`}
                    style={{ height: `${heightPercent}%` }}
                    title={`${pt.dayLabel}: AQI ${pt.aqi}, PM2.5 ${pt.pm25} µg/m³, Inversion Height ${pt.inversionCeilingMeters}m`}
                  />
                </div>

                {/* Day Label */}
                <span
                  className={`text-[10px] font-mono mt-2 truncate max-w-full ${
                    isToday ? 'font-bold text-emerald-800' : 'text-slate-500'
                  }`}
                >
                  {pt.dayLabel}
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  {pt.inversionCeilingMeters}m
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanatory Inversion Note */}
      <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-200 text-[11px] text-sky-950 space-y-1">
        <div className="flex items-center gap-1.5 font-bold">
          <span>🌡️</span>
          <span>Airshed Correlation Insight:</span>
        </div>
        <p className="text-slate-600 leading-relaxed text-[10px]">
          Notice how AQI spiked to 445 on Tuesday when boundary mixing height dropped below 100m. As wind speeds recovered on Wednesday and Thursday, the inversion ceiling expanded to 145m, providing marginal relief.
        </p>
      </div>
    </article>
  );
}
