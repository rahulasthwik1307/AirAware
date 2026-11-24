'use client';

import React from 'react';
import { HistoricalAirshedPoint } from '@/domain/types';
import { PollutantLimitItem } from './chart-geometry';

export interface AnalyticsDataTableProps {
  readonly activeTab: 'limits' | 'trend';
  readonly availableItems: readonly PollutantLimitItem[];
  readonly points: readonly HistoricalAirshedPoint[];
}

/**
 * Accessible tabular representation of air quality telemetry and historical trend data.
 * Toggled on demand for screen readers and tabular data review.
 *
 * @param props - activeTab ('limits' | 'trend'), items, and historical points
 */
export function AnalyticsDataTable({
  activeTab,
  availableItems,
  points,
}: AnalyticsDataTableProps) {
  return (
    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 text-xs font-mono animate-fadeIn">
      {activeTab === 'limits' ? (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
              <th className="p-1">Pollutant</th>
              <th className="p-1">Measured</th>
              <th className="p-1">CPCB 24h Limit</th>
              <th className="p-1">Ratio</th>
              <th className="p-1">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {availableItems.map((item) => (
              <tr key={item.key}>
                <td className="p-1 font-bold text-slate-900">{item.formula} ({item.fullName})</td>
                <td className="p-1 font-semibold">{item.conc} {item.unit}</td>
                <td className="p-1 text-slate-600">{item.limit} {item.unit}</td>
                <td className="p-1 font-bold">{Math.round(item.ratio * 100)}%</td>
                <td className="p-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${item.badge.bgClass} ${item.badge.textClass} ${item.badge.borderClass}`}>
                    {item.badge.label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
              <th className="p-1">Date</th>
              <th className="p-1">Day</th>
              <th className="p-1">AQI Level</th>
              <th className="p-1">PM₂.₅</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {points.map((p) => (
              <tr key={p.date}>
                <td className="p-1 font-semibold text-slate-900">{p.date}</td>
                <td className="p-1">{p.dayLabel}</td>
                <td className="p-1 font-bold">{p.aqi}</td>
                <td className="p-1 text-slate-600">{p.pm25} µg/m³</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
