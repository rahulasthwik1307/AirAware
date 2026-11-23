'use client';

import React, { useMemo } from 'react';
import { AirQualityReport } from '@/domain/types';
import { UnifiedAnalyticsCard } from '@/components/charts/UnifiedAnalyticsCard';
import { findBestDaytimeWindow } from '@/domain/aqi/best-window';
import { ComponentErrorBoundary } from '@/components/common/ComponentErrorBoundary';
import { HERO_RIGHT_PANEL_HEIGHT_CLASS } from './constants';
import { formatDataAge } from '@/lib/formatters/time';

interface OverviewPanelProps {
  readonly report: AirQualityReport;
  readonly effectiveTierLabel: string;
  readonly dominantPollutant: string | null;
  readonly aqiColor: string;
  readonly isStation: boolean;
}

export const OverviewPanel = React.memo(function OverviewPanel({
  report,
  effectiveTierLabel,
  dominantPollutant,
  aqiColor,
  isStation,
}: OverviewPanelProps) {
  const { location, coordinates } = report;

  const bestDaytimeWindow = useMemo(
    () => findBestDaytimeWindow(report.forecast, 2),
    [report.forecast]
  );

  return (
    <div
      id="panel-overview"
      role="tabpanel"
      aria-labelledby="tab-overview"
      className={`${HERO_RIGHT_PANEL_HEIGHT_CLASS} rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 overflow-y-auto shadow-sm flex flex-col justify-start animate-fadeIn`}
    >
      <div className="space-y-3 flex-1 flex flex-col justify-start">
        {/* Header */}
        <div className="border-b border-slate-200/80 pb-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-sm sm:text-base font-bold font-sans text-slate-900 flex items-center gap-2">
              <span>🌤️ Environmental Overview: {location.name}</span>
            </h2>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
              📍 {coordinates.latitude.toFixed(2)}°N, {coordinates.longitude.toFixed(2)}°E
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-sans">
            Local atmospheric conditions, ventilation windows, and exposure mitigation.
          </p>
        </div>

        {/* a. Conditional advisory based on live CPCB category (1-2 lines max) */}
        {effectiveTierLabel === 'Severe' ||
        effectiveTierLabel === 'Very Poor' ||
        effectiveTierLabel === 'Poor' ? (
          <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-300 text-xs flex items-center gap-2">
            <span className="text-base shrink-0" aria-hidden="true">🛡️</span>
            <p className="text-amber-900 leading-snug font-sans text-xs">
              <strong className="font-semibold">Winter Smog Advisory: </strong>
              Night ground cooling traps particulate below a shallow boundary layer. Avoid morning exertion; shift outdoor activities to afternoon solar breakup.
            </p>
          </div>
        ) : effectiveTierLabel === 'Moderate' ? (
          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs flex items-center gap-2">
            <span className="text-base shrink-0" aria-hidden="true">⚠️</span>
            <p className="text-amber-900 leading-snug font-sans text-xs">
              <strong className="font-semibold">Moderate Air Quality Notice: </strong>
              Air quality is acceptable; sensitive groups (children, asthmatics, seniors) should limit prolonged morning outdoor exertion.
            </p>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs flex items-center gap-2">
            <span className="text-base shrink-0" aria-hidden="true">🌿</span>
            <p className="text-emerald-950 leading-snug font-sans text-xs">
              <strong className="font-semibold">Good Air Quality: </strong>
              Safe ambient air. Favorable conditions for morning workouts, airing out living spaces, and outdoor sports.
            </p>
          </div>
        )}

        {/* b. Compact merged row: Data source + Primary concern */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Data source</span>
              <p className="text-xs font-bold text-slate-800 truncate">
                {isStation
                  ? `${report.stationName || 'Nearby Station'} (${report.distanceKm ?? 0} km)`
                  : 'Copernicus CAMS (~45 km grid)'}
              </p>
            </div>
            <span className="text-[10px] text-slate-500 shrink-0 font-medium bg-white px-1.5 py-0.5 rounded border border-slate-200">
              {formatDataAge(report.observedAt || report.modelTimestamp)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Primary Concern</span>
              <p className="text-xs font-bold text-slate-800 truncate">
                {dominantPollutant ? dominantPollutant.toUpperCase() : 'PM2.5'}
              </p>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0"
              style={{
                backgroundColor: `${aqiColor}15`,
                borderColor: `${aqiColor}40`,
                color: aqiColor,
              }}
            >
              {effectiveTierLabel}
            </span>
          </div>
        </div>

        {/* c. Best time to be outside compact chip */}
        {bestDaytimeWindow && (
          <div
            className="p-2 rounded-xl border flex items-center justify-between gap-2 shadow-2xs text-xs font-sans"
            style={{
              backgroundColor: `${bestDaytimeWindow.colorToken}10`,
              borderColor: `${bestDaytimeWindow.colorToken}35`,
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm select-none" aria-hidden="true">✨</span>
              <span className="text-slate-800 truncate text-xs">
                <strong className="text-slate-900 font-bold">Best time to be outside: </strong>
                <span className="font-bold text-teal-950 font-mono">{bestDaytimeWindow.displayWindow}</span>
                <span className="text-slate-600 ml-1.5 font-mono text-[11px]">
                  (AQI ~{bestDaytimeWindow.averageAqi}, {bestDaytimeWindow.category})
                </span>
              </span>
            </div>
            <span
              className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md text-white shrink-0 uppercase tracking-tight"
              style={{ backgroundColor: bestDaytimeWindow.colorToken }}
            >
              Recommended
            </span>
          </div>
        )}

        {/* d. Unified Environmental Analytics Card (Interactive Segmented Switcher) */}
        <div className="w-full pt-0.5">
          <ComponentErrorBoundary
            fallbackTitle="Environmental Analytics Unavailable"
            fallbackMessage="The comparative air quality charts could not be displayed. Numerical station telemetry remains available above."
          >
            <UnifiedAnalyticsCard report={report} />
          </ComponentErrorBoundary>
        </div>
      </div>
    </div>
  );
});
