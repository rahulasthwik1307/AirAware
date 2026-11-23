'use client';

import React, { useState } from 'react';
import { ForecastPoint } from '@/domain/types';
import { findBestDaytimeWindow, BestWindowResult } from '@/domain/aqi/best-window';
import { calculateCpcbPm25SubIndex } from '@/domain/aqi/cpcb-benchmark';

interface BestTimeStripProps {
  readonly forecast: readonly ForecastPoint[];
}

function getCpcbColor(aqi: number): string {
  if (aqi <= 50) return '#047857'; // Good
  if (aqi <= 100) return '#4d7c0f'; // Satisfactory
  if (aqi <= 200) return '#92400e'; // Moderate
  if (aqi <= 300) return '#EA580C'; // Poor
  if (aqi <= 400) return '#DC2626'; // Very Poor
  return '#7F1D1D'; // Severe
}

function getCpcbShortText(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Sat';
  if (aqi <= 200) return 'Mod';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'V.Poor';
  return 'Sev';
}

export function BestTimeStrip({ forecast }: BestTimeStripProps) {
  const [showTable, setShowTable] = useState(false);
  const points = (forecast || []).slice(0, 24);
  const bestWindow: BestWindowResult | null = findBestDaytimeWindow(forecast, 2);

  if (points.length === 0) {
    return null;
  }

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base select-none" aria-hidden="true">
            ⏱️
          </span>
          <div>
            <h4 className="text-xs font-bold text-slate-900 font-sans">
              24-Hour Diurnal Exposure Forecast
            </h4>
            <span className="text-[10px] font-mono font-semibold text-slate-500">
              Forecast: modeled (Open-Meteo CAMS)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowTable((prev) => !prev)}
          className="text-[10px] font-mono text-slate-600 hover:text-slate-900 underline cursor-pointer"
          aria-expanded={showTable}
        >
          {showTable ? 'Hide table' : 'View table'}
        </button>
      </div>

      {/* Best Window Callout Banner */}
      {bestWindow && (
        <div
          className="p-2.5 rounded-xl border flex items-center justify-between gap-2 shadow-2xs"
          style={{
            backgroundColor: `${bestWindow.colorToken}12`,
            borderColor: `${bestWindow.colorToken}40`,
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base" aria-hidden="true">
              ✨
            </span>
            <div className="text-xs font-sans">
              <span className="font-bold text-slate-900">Best time to be outside: </span>
              <strong className="text-teal-950 font-extrabold">{bestWindow.displayWindow}</strong>
              <span className="text-slate-600 ml-1.5 font-mono text-[11px]">
                (AQI ~{bestWindow.averageAqi}, {bestWindow.category})
              </span>
            </div>
          </div>
          <span
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md text-white shrink-0"
            style={{ backgroundColor: bestWindow.colorToken }}
          >
            Recommended
          </span>
        </div>
      )}

      {/* 24-Hour Color & Text Coded Strip */}
      <div
        role="img"
        aria-label="24-hour diurnal air quality forecast strip with CPCB color bands and category text"
        className="flex items-center gap-1 overflow-x-auto pb-1 pt-1 select-none"
      >
        {points.map((pt, idx) => {
          const aqiVal =
            pt.activeAqi ??
            pt.usAqi ??
            (pt.pm25 !== null && pt.pm25 !== undefined ? calculateCpcbPm25SubIndex(pt.pm25) : null) ??
            70;
          const col = getCpcbColor(aqiVal);
          const shortText = getCpcbShortText(aqiVal);
          const timeLabel = pt.displayTime.slice(0, 5);

          return (
            <div
              key={pt.time || idx}
              className="flex flex-col items-center justify-between min-w-[38px] p-1 rounded-xl border bg-slate-50/90 text-center transition-all hover:bg-white hover:shadow-xs"
              style={{ borderColor: `${col}40` }}
              title={`${pt.displayTime}: AQI ${aqiVal} (${shortText})`}
            >
              <span className="text-[9px] font-mono text-slate-500 font-semibold">{timeLabel}</span>
              <div className="w-full h-1.5 rounded-full my-1" style={{ backgroundColor: col }} />
              <span className="text-[10px] font-mono font-bold text-slate-800 tabular-nums">
                {aqiVal}
              </span>
              <span
                className="text-[8px] font-mono font-semibold uppercase tracking-tight"
                style={{ color: col }}
              >
                {shortText}
              </span>
            </div>
          );
        })}
      </div>

      {/* Accessible Tabular Alternative for Screen Readers */}
      {showTable && (
        <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 text-[10px] font-mono">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="p-1">Time</th>
                <th className="p-1">Predicted AQI</th>
                <th className="p-1">CPCB Category</th>
              </tr>
            </thead>
            <tbody>
              {points.map((pt) => {
                const aqiVal =
                  pt.activeAqi ??
                  pt.usAqi ??
                  (pt.pm25 !== null && pt.pm25 !== undefined ? calculateCpcbPm25SubIndex(pt.pm25) : null) ??
                  70;
                return (
                  <tr key={pt.time} className="border-b border-slate-100 last:border-0 text-slate-700">
                    <td className="p-1">{pt.displayTime}</td>
                    <td className="p-1 font-bold">{aqiVal}</td>
                    <td className="p-1">{getCpcbShortText(aqiVal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
