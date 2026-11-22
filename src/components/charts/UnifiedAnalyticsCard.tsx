'use client';

import React, { useState } from 'react';
import { AirQualityReport, PollutantKey, HistoricalAirshedPoint } from '@/domain/types';

interface UnifiedAnalyticsCardProps {
  readonly report: AirQualityReport;
}

// CPCB National Ambient Air Quality Standards (NAAQS 2009) 24-Hour Limits
const CPCB_24H_LIMITS: Record<
  PollutantKey,
  { limit: number; unit: string; name: string; formula: string; fullName: string }
> = {
  pm2_5: { limit: 60, unit: 'µg/m³', name: 'PM2.5', formula: 'PM₂.₅', fullName: 'Fine Particulates' },
  pm10: { limit: 100, unit: 'µg/m³', name: 'PM10', formula: 'PM₁₀', fullName: 'Coarse Particulates' },
  nitrogen_dioxide: { limit: 80, unit: 'µg/m³', name: 'NO2', formula: 'NO₂', fullName: 'Nitrogen Dioxide' },
  sulphur_dioxide: { limit: 80, unit: 'µg/m³', name: 'SO2', formula: 'SO₂', fullName: 'Sulphur Dioxide' },
  ozone: { limit: 100, unit: 'µg/m³', name: 'Ozone (8h)', formula: 'O₃', fullName: 'Surface Ozone' },
  carbon_monoxide: { limit: 2000, unit: 'µg/m³', name: 'CO', formula: 'CO', fullName: 'Carbon Monoxide' },
};

function getBarColor(ratio: number): string {
  if (ratio <= 0.5) return '#059669'; // <= 50% of limit: Good green
  if (ratio <= 1.0) return '#16a34a'; // 50-100% of limit: Satisfactory green
  if (ratio <= 1.5) return '#d97706'; // 100-150% of limit: Moderate amber
  if (ratio <= 2.5) return '#ea580c'; // 150-250% of limit: Poor orange
  return '#dc2626'; // > 250% of limit: Severe red
}

function getStatusBadge(ratio: number): { label: string; textClass: string; bgClass: string; borderClass: string } {
  if (ratio <= 0.5) {
    return { label: 'Good', textClass: 'text-emerald-700', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-200' };
  }
  if (ratio <= 1.0) {
    return { label: 'Safe', textClass: 'text-emerald-800', bgClass: 'bg-emerald-50/80', borderClass: 'border-emerald-300' };
  }
  if (ratio <= 1.5) {
    return { label: 'Moderate', textClass: 'text-amber-800', bgClass: 'bg-amber-50', borderClass: 'border-amber-200' };
  }
  if (ratio <= 2.5) {
    return { label: 'Poor', textClass: 'text-orange-800', bgClass: 'bg-orange-50', borderClass: 'border-orange-300' };
  }
  return { label: 'Severe', textClass: 'text-rose-800', bgClass: 'bg-rose-50', borderClass: 'border-rose-300' };
}

export function UnifiedAnalyticsCard({ report }: UnifiedAnalyticsCardProps) {
  const [activeTab, setActiveTab] = useState<'limits' | 'trend'>('limits');
  const [showTable, setShowTable] = useState(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const isStation = report.sourceType === 'station';
  const pollutants = report.pollutants;
  const trend = report.historicalTrend;

  // Pollutants data parsing (top 3 critical CPCB criteria pollutants)
  const pollutantKeys: PollutantKey[] = ['pm2_5', 'pm10', 'ozone'];
  const availableItems = pollutants
    ? pollutantKeys
        .map((key) => {
          const item = pollutants[key];
          const standard = CPCB_24H_LIMITS[key];
          const conc = item?.concentration;
          if (conc === null || conc === undefined) return null;
          const ratio = conc / standard.limit;
          const pct = Math.min(100, Math.round(ratio * 100));
          const barColor = getBarColor(ratio);
          const isItemStation = isStation && Boolean(item.isStationMeasurement);
          const badge = getStatusBadge(ratio);
          return {
            key,
            formula: standard.formula,
            fullName: standard.fullName,
            conc,
            unit: standard.unit,
            limit: standard.limit,
            ratio,
            pct,
            barColor,
            isItemStation,
            badge,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : [];

  const exceededCount = availableItems.filter((item) => item.conc > item.limit).length;

  // Trend data parsing
  const points: readonly HistoricalAirshedPoint[] = trend && trend.length > 0 ? trend.slice(-7) : [];
  const hasTrend = points.length > 0;

  const currentAqi = points.length > 0 ? points[points.length - 1].aqi : (report.providerAqi ?? 100);
  const avgAqi = hasTrend ? Math.round(points.reduce((acc, p) => acc + p.aqi, 0) / points.length) : currentAqi;
  const minAqiPoint = hasTrend
    ? points.reduce((prev, curr) => (curr.aqi < prev.aqi ? curr : prev), points[0])
    : null;
  const maxAqiPoint = hasTrend
    ? points.reduce((prev, curr) => (curr.aqi > prev.aqi ? curr : prev), points[0])
    : null;

  const pctDiffFromAvg = avgAqi > 0 ? Math.round(((currentAqi - avgAqi) / avgAqi) * 100) : 0;

  // SVG Chart Dimensions (Expanded, generous viewBox)
  const svgWidth = 540;
  const svgHeight = 150;
  const paddingLeft = 32;
  const paddingRight = 24;
  const paddingTop = 20;
  const paddingBottom = 26;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const maxPlotScale = hasTrend ? Math.max(...points.map((p) => p.aqi), 220) * 1.1 : 250;
  const minPlotScale = 0;

  const getX = (index: number) => paddingLeft + (index / Math.max(1, points.length - 1)) * plotWidth;
  const getY = (val: number) => {
    const ratio = Math.min(1, Math.max(0, val / maxPlotScale));
    return svgHeight - paddingBottom - ratio * plotHeight;
  };

  const linePoints = hasTrend ? points.map((p, i) => `${getX(i).toFixed(1)},${getY(p.aqi).toFixed(1)}`).join(' ') : '';
  const areaPoints = hasTrend
    ? `${getX(0).toFixed(1)},${(svgHeight - paddingBottom).toFixed(1)} ${linePoints} ${getX(points.length - 1).toFixed(1)},${(svgHeight - paddingBottom).toFixed(1)}`
    : '';

  // Horizontal Threshold Guides
  const thresholdGuides = [
    { value: 50, label: '50 Safe', color: '#10b981' },
    { value: 100, label: '100 Mod', color: '#f59e0b' },
    { value: 200, label: '200 Poor', color: '#f97316' },
  ].filter((t) => t.value <= maxPlotScale);

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

          {hasTrend && (
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
      )}

      {/* VIEW 1: AGAINST SAFE LIMITS */}
      {activeTab === 'limits' && (
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
            <span className="text-[10px] text-slate-500 hidden sm:inline">NAAQS 2009 Standards</span>
          </div>
        </div>
      )}

      {/* VIEW 2: 7-DAY HISTORICAL TREND */}
      {activeTab === 'trend' && hasTrend && (
        <div
          id="panel-historical-trend"
          role="tabpanel"
          aria-labelledby="tab-historical-trend"
          className="space-y-3 animate-fadeIn"
        >
          {/* Executive Metric Callouts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Current AQI</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {currentAqi} <span className="text-xs font-semibold text-slate-600">AQI</span>
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">7-Day Average</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-sm font-bold text-slate-900">{avgAqi}</span>
                <span
                  className={`text-[10px] font-bold ${
                    pctDiffFromAvg > 0 ? 'text-rose-700' : pctDiffFromAvg < 0 ? 'text-emerald-700' : 'text-slate-600'
                  }`}
                >
                  {pctDiffFromAvg > 0 ? `▲ +${pctDiffFromAvg}%` : pctDiffFromAvg < 0 ? `▼ ${pctDiffFromAvg}%` : 'Stable'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Weekly Range</span>
              <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                {minAqiPoint?.aqi ?? 0} – {maxAqiPoint?.aqi ?? 0} AQI
              </p>
            </div>
          </div>

          {/* Expanded High-Resolution SVG Spline Chart */}
          <div className="relative p-2.5 rounded-xl bg-slate-50/50 border border-slate-200/80 overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto overflow-visible select-none"
              role="img"
              aria-label="7-Day Historical Air Quality Trend Line Chart"
            >
              <defs>
                <linearGradient id="unifiedTrendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Threshold Guide Dotted Lines */}
              {thresholdGuides.map((guide) => {
                const guideY = getY(guide.value);
                return (
                  <g key={guide.value} opacity="0.6">
                    <line
                      x1={paddingLeft}
                      y1={guideY}
                      x2={svgWidth - paddingRight}
                      y2={guideY}
                      stroke={guide.color}
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingLeft - 4}
                      y={guideY + 3}
                      textAnchor="end"
                      fontSize="9"
                      fontFamily="ui-monospace, monospace"
                      fill={guide.color}
                      fontWeight="600"
                    >
                      {guide.label}
                    </text>
                  </g>
                );
              })}

              {/* Area gradient fill */}
              <polygon points={areaPoints} fill="url(#unifiedTrendGradient)" />

              {/* Main Line */}
              <polyline
                points={linePoints}
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              {points.map((p, i) => {
                const cx = getX(i);
                const cy = getY(p.aqi);
                const isHovered = hoveredPointIndex === i;
                const isLast = i === points.length - 1;
                return (
                  <g
                    key={p.date}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPointIndex(i)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : isLast ? 4.5 : 3.5}
                      fill="#FFFFFF"
                      stroke="#0284c7"
                      strokeWidth={isHovered ? 3 : 2}
                      className="transition-all duration-200"
                    />
                    {isHovered && (
                      <g>
                        <rect
                          x={cx - 30}
                          y={cy - 24}
                          width="60"
                          height="18"
                          rx="4"
                          fill="#0f172a"
                          className="shadow-sm"
                        />
                        <text
                          x={cx}
                          y={cy - 12}
                          textAnchor="middle"
                          fontSize="9"
                          fontFamily="ui-monospace, monospace"
                          fill="#ffffff"
                          fontWeight="bold"
                        >
                          {p.aqi} AQI
                        </text>
                      </g>
                    )}
                    <title>{`${p.dayLabel} (${p.date}): AQI ${p.aqi} • PM₂.₅ ${p.pm25} µg/m³`}</title>
                  </g>
                );
              })}

              {/* X Axis Date Labels */}
              {points.map((p, i) => {
                const cx = getX(i);
                const isLast = i === points.length - 1;
                const label = isLast || p.dayLabel.toLowerCase().includes('today') ? 'Today' : p.dayLabel.slice(0, 3);
                return (
                  <text
                    key={p.date}
                    x={cx}
                    y={svgHeight - 6}
                    textAnchor="middle"
                    fontSize="10"
                    fontFamily="ui-monospace, monospace"
                    fill={isLast ? '#0284c7' : '#64748b'}
                    fontWeight={isLast ? 'bold' : 'normal'}
                  >
                    {label}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Weekly Insights Footer Callout */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2 rounded-xl bg-slate-100/70 border border-slate-200/80 text-[11px] font-mono text-slate-700">
            <span className="flex items-center gap-1.5">
              <span>🟢</span>
              <span>
                Cleanest: <strong>{minAqiPoint?.dayLabel ?? 'N/A'} ({minAqiPoint?.aqi ?? 0} AQI)</strong>
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span>🔴</span>
              <span>
                Peak: <strong>{maxAqiPoint?.dayLabel ?? 'N/A'} ({maxAqiPoint?.aqi ?? 0} AQI)</strong>
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
