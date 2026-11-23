'use client';

import React from 'react';
import { ForecastPoint } from '@/domain/types';

interface ForecastTableViewProps {
  readonly forecast: readonly ForecastPoint[];
  readonly standardLabel: string;
}

export function ForecastTableView({ forecast, standardLabel }: ForecastTableViewProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-xs">
      <table className="w-full text-left text-xs border-collapse">
        <caption className="sr-only">
          24-hour forecast data for air quality index, criteria pollutants, and health advisory
        </caption>
        <thead>
          <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)] font-mono text-[11px]">
            <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
              Time (Local)
            </th>
            <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
              Active AQI ({standardLabel})
            </th>
            <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
              Category
            </th>
            <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
              PM₂.₅ (µg/m³)
            </th>
            <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
              PM₁₀ (µg/m³)
            </th>
            <th scope="col" className="p-3 font-bold text-[var(--ink-primary)]">
              Health Advisory
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-[11px]">
          {forecast.map((point) => (
            <tr
              key={point.time}
              className={`hover:bg-[var(--surface-subtle)] transition-colors ${
                point.isCurrentHour ? 'bg-[var(--surface-subtle)]/70 font-semibold' : ''
              }`}
            >
              <td className="p-3 whitespace-nowrap text-[var(--ink-primary)]">
                {point.displayTime}
                {point.isCurrentHour && (
                  <span className="ml-1.5 inline-block text-[9px] font-bold text-[var(--brand-primary)] bg-[var(--surface-card)] px-1.5 py-0.2 rounded border border-[var(--border-subtle)]">
                    Current
                  </span>
                )}
              </td>
              <td className="p-3 font-bold text-[var(--ink-primary)] tabular-nums">
                {point.activeAqi !== null ? point.activeAqi : 'Not Reported'}
              </td>
              <td className="p-3">
                {point.tier ? (
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold border"
                    style={{
                      color: point.tier.colorToken,
                      backgroundColor: point.tier.bgToken,
                      borderColor: point.tier.borderToken,
                    }}
                  >
                    {point.tier.label}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td className="p-3 tabular-nums text-[var(--ink-secondary)]">
                {point.pm25 !== null && point.pm25 !== undefined ? point.pm25.toFixed(1) : '—'}
              </td>
              <td className="p-3 tabular-nums text-[var(--ink-secondary)]">
                {point.pm10 !== null && point.pm10 !== undefined ? point.pm10.toFixed(1) : '—'}
              </td>
              <td className="p-3 text-[var(--ink-muted)] max-w-xs truncate font-sans text-xs">
                {point.tier?.healthAdvisory || 'General public awareness guidance.'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
