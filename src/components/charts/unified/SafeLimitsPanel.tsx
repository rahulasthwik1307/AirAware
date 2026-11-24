'use client';

import React from 'react';
import { PollutantLimitItem } from './chart-geometry';

export interface SafeLimitsPanelProps {
  readonly availableItems: readonly PollutantLimitItem[];
  readonly exceededCount: number;
}

/**
 * Visual breakdown comparing critical criteria pollutants against CPCB NAAQS 24-hour limits.
 *
 * @param props - computed pollutant items and count exceeding limits
 */
export function SafeLimitsPanel({ availableItems, exceededCount }: SafeLimitsPanelProps) {
  return (
    <div
      id="panel-safe-limits"
      role="tabpanel"
      aria-labelledby="tab-safe-limits"
      className="space-y-3 animate-fadeIn"
    >
      <div className="space-y-2">
        {availableItems.map((item) => (
          <div
            key={item.key}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1 transition-all hover:bg-slate-50"
          >
            {/* Row 1: Identity on left, value + source badge on right */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-slate-900 font-mono text-xs sm:text-sm">{item.formula}</span>
                <span className="text-[11px] text-slate-500 hidden sm:inline truncate">
                  ({item.fullName})
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0 font-mono">
                <span className="font-bold text-slate-900 text-xs sm:text-sm tabular-nums">
                  {item.conc} <span className="text-[10px] font-normal text-slate-500">{item.unit}</span>
                </span>
                <span
                  className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${
                    item.isItemStation
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {item.isItemStation ? 'Station' : 'Modeled'}
                </span>
              </div>
            </div>

            {/* Row 2: Standard Benchmark & High-Contrast Severity Badge */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
              <span className="text-[10px] sm:text-[11px]">
                CPCB limit: <strong className="text-slate-800">{item.limit} {item.unit}</strong>
              </span>
              <span
                className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-md border shrink-0 ${item.badge.bgClass} ${item.badge.textClass} ${item.badge.borderClass}`}
              >
                {Math.round(item.ratio * 100)}% of limit · {item.badge.label}
              </span>
            </div>

            {/* Row 3: Progress Bar with 100% Threshold Tick */}
            <div className="relative pt-0.5">
              <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.pct}%`,
                    backgroundColor: item.barColor,
                  }}
                  role="progressbar"
                  aria-valuenow={item.conc}
                  aria-valuemin={0}
                  aria-valuemax={item.limit}
                  aria-label={`${item.formula} concentration: ${item.conc} ${item.unit} out of ${item.limit} limit`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Status Footer Callout */}
      <div className="p-2 rounded-xl bg-slate-100/70 border border-slate-200/80 flex items-center justify-between text-[11px] font-mono text-slate-700">
        <span className="flex items-center gap-1.5">
          <span>⚖️</span>
          <span>
            <strong>CPCB NAAQS Compliance: </strong>
            {exceededCount === 0 ? (
              <span className="text-emerald-700 font-bold">All monitored pollutants within 24h limits</span>
            ) : (
              <span className="text-amber-800 font-bold">
                {exceededCount} of {availableItems.length} criteria pollutants exceed 24h limits
              </span>
            )}
          </span>
        </span>
        <span className="text-[10px] text-slate-600 hidden sm:inline">NAAQS 2009 Standards</span>
      </div>
    </div>
  );
}
