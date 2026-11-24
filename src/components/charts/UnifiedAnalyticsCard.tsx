'use client';

import { useState, useMemo } from 'react';
import { AirQualityReport } from '@/domain/types';
import {
  calculatePollutantLimitItems,
  computeTrendGeometry,
  DEFAULT_CHART_DIMENSIONS,
} from './unified/chart-geometry';
import { SafeLimitsPanel } from './unified/SafeLimitsPanel';
import { HistoricalTrendPanel } from './unified/HistoricalTrendPanel';
import { AnalyticsDataTable } from './unified/AnalyticsDataTable';

export interface UnifiedAnalyticsCardProps {
  readonly report: AirQualityReport;
}

/**
 * Unified Environmental Intelligence Card orchestrating CPCB safe-limit compliance
 * and 7-day historical airshed trends with accessible tab navigation and data tables.
 *
 * @param props - Active air quality report telemetry
 */
export function UnifiedAnalyticsCard({ report }: UnifiedAnalyticsCardProps) {
  const [activeTab, setActiveTab] = useState<'limits' | 'trend'>('limits');
  const [showTable, setShowTable] = useState(false);

  const isStation = report.sourceType === 'station';
  const pollutants = report.pollutants;
  const trend = report.historicalTrend;

  const availableItems = useMemo(
    () => calculatePollutantLimitItems(pollutants, isStation),
    [pollutants, isStation]
  );

  const exceededCount = useMemo(
    () => availableItems.filter((item) => item.conc > item.limit).length,
    [availableItems]
  );

  const trendGeometry = useMemo(
    () => computeTrendGeometry(trend, report.providerAqi, DEFAULT_CHART_DIMENSIONS),
    [trend, report.providerAqi]
  );

  return (
    <div
      role="region"
      aria-label="Environmental Intelligence & Historical Analysis"
      className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 font-sans w-full"
    >
      {/* Interactive Top Segmented Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div
          role="tablist"
          aria-label="Environmental Analysis Views"
          className="inline-flex p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs font-mono font-medium gap-1"
        >
          <button
            type="button"
            role="tab"
            id="tab-safe-limits"
            aria-selected={activeTab === 'limits'}
            aria-controls="panel-safe-limits"
            onClick={() => setActiveTab('limits')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'limits'
                ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span aria-hidden="true">📊</span>
            <span>Against Safe Limits</span>
            {exceededCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 font-bold">
                {exceededCount}
              </span>
            )}
          </button>

          {trendGeometry.hasTrend && (
            <button
              type="button"
              role="tab"
              id="tab-historical-trend"
              aria-selected={activeTab === 'trend'}
              aria-controls="panel-historical-trend"
              onClick={() => setActiveTab('trend')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'trend'
                  ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span aria-hidden="true">📈</span>
              <span>7-Day Historical Trend</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowTable((prev) => !prev)}
          className="text-[11px] font-mono text-slate-600 hover:text-slate-900 underline cursor-pointer self-start sm:self-auto shrink-0 transition-colors"
          aria-expanded={showTable}
        >
          {showTable ? 'Hide data table' : 'View data table'}
        </button>
      </div>

      {/* Accessible Tabular Breakdown (Toggled on request) */}
      {showTable && (
        <AnalyticsDataTable
          activeTab={activeTab}
          availableItems={availableItems}
          points={trendGeometry.points}
        />
      )}

      {/* VIEW 1: AGAINST SAFE LIMITS */}
      {activeTab === 'limits' && (
        <SafeLimitsPanel
          availableItems={availableItems}
          exceededCount={exceededCount}
        />
      )}

      {/* VIEW 2: 7-DAY HISTORICAL TREND */}
      {activeTab === 'trend' && trendGeometry.hasTrend && (
        <HistoricalTrendPanel
          trendGeometry={trendGeometry}
          dimensions={DEFAULT_CHART_DIMENSIONS}
        />
      )}
    </div>
  );
}
