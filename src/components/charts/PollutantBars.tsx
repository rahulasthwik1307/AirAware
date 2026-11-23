'use client';

import React, { useState } from 'react';
import { AirQualityReport, PollutantKey } from '@/domain/types';

interface PollutantBarsProps {
  readonly report: AirQualityReport;
}

// CPCB National Ambient Air Quality Standards (NAAQS 2009) 24-Hour Limits
const CPCB_24H_LIMITS: Record<PollutantKey, { limit: number; unit: string; name: string; formula: string }> = {
  pm2_5: { limit: 60, unit: 'µg/m³', name: 'PM2.5', formula: 'PM₂.₅' },
  pm10: { limit: 100, unit: 'µg/m³', name: 'PM10', formula: 'PM₁₀' },
  nitrogen_dioxide: { limit: 80, unit: 'µg/m³', name: 'NO2', formula: 'NO₂' },
  sulphur_dioxide: { limit: 80, unit: 'µg/m³', name: 'SO2', formula: 'SO₂' },
  ozone: { limit: 100, unit: 'µg/m³', name: 'Ozone (8h)', formula: 'O₃' },
  carbon_monoxide: { limit: 2000, unit: 'µg/m³', name: 'CO', formula: 'CO' },
};

function getBarColor(ratio: number): string {
  if (ratio <= 0.5) return '#047857'; // <= 50% of limit: Good green
  if (ratio <= 1.0) return '#4d7c0f'; // 50-100% of limit: Satisfactory lime
  if (ratio <= 1.5) return '#92400e'; // 100-150% of limit: Moderate amber
  if (ratio <= 2.5) return '#EA580C'; // 150-250% of limit: Poor orange
  return '#DC2626'; // > 250% of limit: Severe red
}

function getStatusText(ratio: number): string {
  if (ratio <= 0.5) return 'Good';
  if (ratio <= 1.0) return 'Safe';
  if (ratio <= 1.5) return 'Moderate';
  if (ratio <= 2.5) return 'Poor';
  return 'Severe';
}

export function PollutantBars({ report }: PollutantBarsProps) {
  const [showTable, setShowTable] = useState(false);
  const isStation = report.sourceType === 'station';
  const pollutants = report.pollutants;

  if (!pollutants) return null;

  // As requested: compact version — PM2.5, PM10, and Ozone (O3) only if available
  const pollutantKeys: PollutantKey[] = ['pm2_5', 'pm10', 'ozone'];

  const availableItems = pollutantKeys
    .map((key) => {
      const item = pollutants[key];
      const standard = CPCB_24H_LIMITS[key];
      const conc = item?.concentration;
      if (conc === null || conc === undefined) return null;
      const ratio = conc / standard.limit;
      const pct = Math.min(100, Math.round(ratio * 100));
      const barColor = getBarColor(ratio);
      const isItemStation = isStation && Boolean(item.isStationMeasurement);
      return {
        key,
        formula: standard.formula,
        conc,
        unit: standard.unit,
        limit: standard.limit,
        ratio,
        pct,
        barColor,
        isItemStation,
        statusText: getStatusText(ratio),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (availableItems.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Against India's safe limits comparison"
      className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5 font-sans h-full flex flex-col justify-between"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm select-none" aria-hidden="true">
            📊
          </span>
          <h4 className="text-xs font-bold text-slate-900 font-sans truncate">
            Against India&apos;s safe limits
          </h4>
        </div>

        <button
          type="button"
          onClick={() => setShowTable((prev) => !prev)}
          className="text-[10px] font-mono text-slate-600 hover:text-slate-900 underline cursor-pointer shrink-0"
          aria-expanded={showTable}
        >
          {showTable ? 'Hide table' : 'View table'}
        </button>
      </div>

      <div
        role="img"
        aria-label="Pollutant concentrations against Indian 24-hour CPCB limits"
        className="space-y-2 pt-0.5"
      >
        {availableItems.map((item) => (
          <div key={item.key} className="space-y-1 text-xs">
            {/* Single clean line: Value+Unit left, limit & percentage right */}
            <div className="flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <strong className="text-slate-900 font-bold">{item.formula}</strong>
                <span className="text-slate-700 font-semibold tabular-nums">
                  {item.conc} {item.unit}
                </span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-semibold border ${
                    item.isItemStation
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {item.isItemStation ? 'Station' : 'Modeled'}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-slate-600 shrink-0 font-medium">
                <span>of {item.limit} limit</span>
                <span>·</span>
                <span className="font-bold tabular-nums" style={{ color: item.barColor }}>
                  {Math.round(item.ratio * 100)}% ({item.statusText})
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
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
        ))}
      </div>

      {/* Accessible Table Alternative */}
      {showTable && (
        <div className="max-h-28 overflow-y-auto border border-slate-200 rounded-xl p-1.5 bg-slate-50 text-[10px] font-mono">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="p-0.5">Pollutant</th>
                <th className="p-0.5">Value</th>
                <th className="p-0.5">Limit</th>
                <th className="p-0.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {availableItems.map((item) => (
                <tr key={item.key} className="border-b border-slate-100 last:border-0 text-slate-700">
                  <td className="p-0.5 font-bold">{item.formula}</td>
                  <td className="p-0.5">{item.conc} {item.unit}</td>
                  <td className="p-0.5">{item.limit} {item.unit}</td>
                  <td className="p-0.5 font-bold" style={{ color: item.barColor }}>
                    {item.statusText} ({Math.round(item.ratio * 100)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
