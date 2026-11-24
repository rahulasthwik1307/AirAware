'use client';

import React, { useState } from 'react';
import { TrendChartGeometry, SvgChartDimensions, DEFAULT_CHART_DIMENSIONS } from './chart-geometry';

export interface HistoricalTrendPanelProps {
  readonly trendGeometry: TrendChartGeometry;
  readonly dimensions?: SvgChartDimensions;
}

/**
 * 7-Day Historical Air Quality Trend view featuring high-resolution SVG spline chart,
 * threshold guidelines, interactive point hover inspection, and weekly insights callout.
 *
 * @param props - computed trend geometry and optional SVG dimensions
 */
export function HistoricalTrendPanel({
  trendGeometry,
  dimensions = DEFAULT_CHART_DIMENSIONS,
}: HistoricalTrendPanelProps) {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const {
    points,
    currentAqi,
    avgAqi,
    minAqiPoint,
    maxAqiPoint,
    pctDiffFromAvg,
    linePoints,
    areaPoints,
    thresholdGuides,
    getX,
    getY,
  } = trendGeometry;

  const { svgWidth, svgHeight, paddingLeft, paddingRight } = dimensions;

  return (
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
  );
}
