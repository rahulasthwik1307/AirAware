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
 * Provides screen readers and keyboard users a structured, accessible alternative to SVG charts.
 *
 * @param props - activeTab ('limits' | 'trend'), items, and historical points
 */
export function AnalyticsDataTable({
  activeTab,
  availableItems,
  points,
}: AnalyticsDataTableProps) {
  return (
    <div
      id="unified-analytics-data-table"
      role="region"
      aria-label="Environmental Intelligence Data Table"
      tabIndex={0}
      className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 text-xs font-mono animate-fadeIn focus:outline-none focus:ring-2 focus:ring-sky-500/40"
    >
      {activeTab === 'limits' ? (
        <table className="w-full text-left">
          <caption className="sr-only">
            Criteria Pollutant Concentrations and CPCB NAAQS 24-Hour Limits Comparison
          </caption>
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
              <th scope="col" className="p-1">Pollutant</th>
              <th scope="col" className="p-1">Measured</th>
              <th scope="col" className="p-1">CPCB 24h Limit</th>
              <th scope="col" className="p-1">Ratio</th>
              <th scope="col" className="p-1">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {availableItems.map((item) => (
              <tr key={item.key}>
                <th scope="row" className="p-1 font-bold text-slate-900 font-sans">{item.formula} ({item.fullName})</th>
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
          <caption className="sr-only">
            7-Day Historical Air Quality Index and PM2.5 Trend Data
          </caption>
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
              <th scope="col" className="p-1">Date</th>
              <th scope="col" className="p-1">Day</th>
              <th scope="col" className="p-1">AQI Level</th>
              <th scope="col" className="p-1">PM₂.₅</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {points.map((p) => (
              <tr key={p.date}>
                <th scope="row" className="p-1 font-semibold text-slate-900">{p.date}</th>
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
