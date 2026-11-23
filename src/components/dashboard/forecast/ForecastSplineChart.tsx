'use client';

import React, { RefObject } from 'react';
import { ForecastPoint } from '@/domain/types';
import { SvgChartData, SvgPoint, formatDataAge } from './forecast-chart-math';

interface ForecastSplineChartProps {
  readonly forecast: readonly ForecastPoint[];
  readonly svgData: SvgChartData;
  readonly peakPoint: ForecastPoint | null;
  readonly bestPoint: ForecastPoint | null;
  readonly activeSvgPoint?: SvgPoint;
  readonly selectedIndex: number;
  readonly hoveredIndex: number | null;
  readonly onSelectIndex: (idx: number) => void;
  readonly onHoverIndex: (idx: number | null) => void;
  readonly onKeyDown: (e: React.KeyboardEvent, index: number) => void;
  readonly timelineContainerRef: RefObject<HTMLDivElement | null>;
  readonly localTime?: string;
  readonly modelTimestamp?: string;
}

export function ForecastSplineChart({
  forecast,
  svgData,
  peakPoint,
  bestPoint,
  activeSvgPoint,
  selectedIndex,
  hoveredIndex,
  onSelectIndex,
  onHoverIndex,
  onKeyDown,
  timelineContainerRef,
  localTime,
  modelTimestamp,
}: ForecastSplineChartProps) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 sm:p-5 shadow-xs overflow-hidden">
      <div className="relative w-full aspect-[16/7] min-h-[190px] max-h-[260px]">
        <svg
          viewBox="0 0 1000 220"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible select-none"
          role="img"
          aria-label="24-Hour Diurnal Forecast Continuous Spline Curve Chart"
        >
          <defs>
            <linearGradient id="diurnalWaveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--aqi-unhealthy)" stopOpacity="0.45" />
              <stop offset="60%" stopColor="var(--brand-primary)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--surface-card)" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="horizonBands" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(30, 27, 75, 0.05)" />
              <stop offset="28%" stopColor="rgba(244, 63, 94, 0.06)" />
              <stop offset="55%" stopColor="rgba(16, 185, 129, 0.07)" />
              <stop offset="80%" stopColor="rgba(245, 158, 11, 0.06)" />
              <stop offset="100%" stopColor="rgba(30, 27, 75, 0.05)" />
            </linearGradient>
          </defs>

          {/* Day-Night Horizon Shading Backdrop */}
          <rect x="35" y="20" width="930" height="165" fill="url(#horizonBands)" rx="8" />

          {/* Horizontal Regulatory Threshold Reference Lines */}
          {svgData.thresholds.map((th) => (
            <g key={th.val}>
              <line
                x1="35"
                y1={th.y}
                x2="965"
                y2={th.y}
                stroke={th.color}
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x="962"
                y={th.y - 4}
                textAnchor="end"
                className="text-[9px] font-mono fill-[var(--ink-muted)] opacity-80"
              >
                {th.label}
              </text>
            </g>
          ))}

          {/* Continuous Area Fill Under Curve */}
          {svgData.areaD && (
            <path d={svgData.areaD} fill="url(#diurnalWaveGradient)" />
          )}

          {/* The Smooth Continuous Spline Curve */}
          {svgData.splineD && (
            <path
              d={svgData.splineD}
              fill="none"
              stroke="var(--aqi-unhealthy)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* Peak Milestone Beacon */}
          {peakPoint && svgData.points.find((pt) => pt.point.time === peakPoint?.time) && (
            (() => {
              const pt = svgData.points.find((p) => p.point.time === peakPoint?.time)!;
              return (
                <g transform={`translate(${pt.x}, ${pt.y})`}>
                  <circle r="7" fill="var(--aqi-unhealthy)" fillOpacity="0.3" className="animate-ping" />
                  <circle r="4" fill="var(--aqi-unhealthy)" stroke="#ffffff" strokeWidth="1.5" />
                  <text
                    y="-10"
                    textAnchor="middle"
                    className="text-[9px] font-mono font-bold fill-[var(--aqi-unhealthy)]"
                  >
                    ▲ Peak: {pt.aqi}
                  </text>
                </g>
              );
            })()
          )}

          {/* Best Milestone Beacon */}
          {bestPoint && bestPoint.time !== peakPoint?.time && svgData.points.find((pt) => pt.point.time === bestPoint?.time) && (
            (() => {
              const pt = svgData.points.find((p) => p.point.time === bestPoint?.time)!;
              return (
                <g transform={`translate(${pt.x}, ${pt.y})`}>
                  <circle r="6" fill="#10b981" fillOpacity="0.4" />
                  <circle r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                  <text
                    y="-10"
                    textAnchor="middle"
                    className="text-[9px] font-mono font-bold fill-emerald-700"
                  >
                    ★ Best: {pt.aqi}
                  </text>
                </g>
              );
            })()
          )}

          {/* Vertical Interactive Scrubber Guideline */}
          {activeSvgPoint && (
            <g>
              <line
                x1={activeSvgPoint.x}
                y1="25"
                x2={activeSvgPoint.x}
                y2={svgData.chartBottom}
                stroke="var(--brand-primary)"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle
                cx={activeSvgPoint.x}
                cy={activeSvgPoint.y}
                r="6"
                fill="var(--brand-primary)"
                stroke="#ffffff"
                strokeWidth="2"
                className="shadow-sm"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Interactive Timeline Buttons Strip */}
      <div
        ref={timelineContainerRef}
        role="region"
        aria-label="24-hour air quality forecast timeline strip"
        className="mt-2 pt-2 border-t border-[var(--border-subtle)]/70 flex items-center justify-between gap-1 overflow-x-auto scrollbar-thin"
      >
        {forecast.map((point, index) => {
          const tier = point.tier;
          const aqi = point.activeAqi;
          const isSelected = selectedIndex === index;
          const isHovered = hoveredIndex === index;
          const isHighlighted = isSelected || isHovered;

          return (
            <button
              key={point.time}
              type="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onClick={() => onSelectIndex(index)}
              onMouseEnter={() => onHoverIndex(index)}
              onMouseLeave={() => onHoverIndex(null)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={`flex-1 min-w-[32px] py-1.5 px-1 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
                isSelected
                  ? 'bg-[var(--brand-surface)] text-[var(--brand-primary)] font-bold ring-1 ring-[var(--brand-primary)]/40 shadow-2xs'
                  : isHighlighted
                  ? 'bg-[var(--surface-subtle)] text-[var(--ink-primary)]'
                  : 'text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)]/60'
              }`}
            >
              <span className="text-[10px] font-mono leading-none">
                {point.displayTime}
              </span>
              <span
                className={`text-[9px] font-mono tabular-nums mt-1 font-bold ${
                  point.isCurrentHour ? 'text-[var(--brand-primary)] underline' : ''
                }`}
              >
                {aqi !== null ? aqi : '—'}
              </span>
              <span className="sr-only">
                {aqi !== null ? ' AQI' : ' Not Reported'}, {tier?.label || 'Unknown Category'}{point.isCurrentHour ? ', Current Model Hour' : ''}
              </span>
            </button>
          );
        })}
      </div>

      {/* Scientific Provenance and Model Resolution Disclosures */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-[var(--border-subtle)]/70 pt-2.5 px-1 mt-2 text-[10px] font-mono text-[var(--ink-muted)] gap-1">
        <span>
          Observation Time: {localTime || modelTimestamp || forecast[0]?.time.replace('T', ' ')} (Age: {formatDataAge(modelTimestamp)})
        </span>
        <span>
          Modeled estimate (Copernicus CAMS via Open-Meteo, ~45 km grid)
        </span>
      </div>
    </div>
  );
}
