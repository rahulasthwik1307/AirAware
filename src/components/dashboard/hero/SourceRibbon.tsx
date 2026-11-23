'use client';

import React from 'react';
import { AirQualityReport } from '@/domain/types';

interface SourceRibbonProps {
  readonly report: AirQualityReport;
  readonly aqiColor: string;
  readonly isLoading?: boolean;
}

function formatDataAge(timestampStr?: string): string {
  if (!timestampStr) return 'recent';
  try {
    const iso = timestampStr.includes('T') ? timestampStr : timestampStr.replace(' ', 'T');
    const time = new Date(iso).getTime();
    if (isNaN(time)) return 'recent';
    const diffMs = Date.now() - time;
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h ${diffMin % 60}m ago`;
  } catch {
    return 'recent';
  }
}

export const SourceRibbon = React.memo(function SourceRibbon({
  report,
  aqiColor,
  isLoading = false,
}: SourceRibbonProps) {
  const isStation = report.sourceType === 'station';
  const { coordinates, modelTimestamp, localTime } = report;

  return (
    <div className="flex flex-wrap items-center justify-between border-b border-slate-200/80 bg-white px-6 py-2.5 sm:px-8 text-[11px] font-mono text-slate-600 gap-2">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: aqiColor }}
          />
          {isStation ? (
            <span>
              Ground station: <strong className="text-slate-900">{report.stationName || 'Nearby Monitor'}</strong>, {report.distanceKm !== null && report.distanceKm !== undefined ? `${report.distanceKm} km away` : ''} · OpenAQ · Observed {report.observedAt ? (report.observedAt.includes('T') ? report.observedAt.split('T')[1].slice(0, 5) : report.observedAt) : ''} ({formatDataAge(report.observedAt || modelTimestamp)})
              {report.distanceKm !== null && report.distanceKm !== undefined && report.distanceKm > 10 && (
                <span className="text-amber-800 ml-1.5 font-normal">
                  · This station is far from you; air near you may differ.
                </span>
              )}
            </span>
          ) : (
            <span>Modeled estimate (Copernicus CAMS via Open-Meteo, ~45 km grid) · {report.modelFallbackReason || 'no recent station within 25 km'}</span>
          )}
        </span>
        <span className="text-slate-300">|</span>
        <span className="text-sky-700 font-semibold tabular-nums">
          {coordinates.latitude.toFixed(2)}°N, {coordinates.longitude.toFixed(2)}°E
        </span>
        {isLoading && (
          <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full">
            <span>🔄 Updating telemetry feed...</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <span className="text-slate-600 tabular-nums">
          Observation: <strong className="text-slate-800">{report.observedAt || modelTimestamp}</strong>
        </span>
        <span className="text-slate-300">|</span>
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
          Age: {formatDataAge(report.observedAt || modelTimestamp)}
        </span>
        <span className="hidden sm:inline text-slate-300">|</span>
        <span className="font-semibold text-slate-700 tabular-nums hidden sm:inline">Local: {localTime}</span>
      </div>
    </div>
  );
});
