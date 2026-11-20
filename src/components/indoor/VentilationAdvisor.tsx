'use client';

import React, { useState } from 'react';
import { AirQualityReport } from '@/domain/types';
import { evaluateVentilationCurve, RawHourlyDataPoint } from '@/domain/indoor/calculations';
import { VentilationHourlyPoint } from '@/domain/indoor/types';

interface VentilationAdvisorProps {
  readonly report: AirQualityReport | null;
  readonly onAskCopilot?: (question: string) => void;
}

export function VentilationAdvisor({ report, onAskCopilot }: VentilationAdvisorProps) {
  // Map ForecastPoint array to RawHourlyDataPoint
  const rawHourlyList: RawHourlyDataPoint[] = report?.forecast
    ? report.forecast.map((f) => ({
        time: f.time,
        pm25: f.pm25 ?? undefined,
        pm10: f.pm10 ?? undefined,
        ozone: report.pollutants?.ozone?.concentration ?? undefined,
        no2: report.pollutants?.nitrogen_dioxide?.concentration ?? undefined,
        temperatureC: f.temperature ?? undefined,
        humidityPercent: undefined,
      }))
    : [];

  const curve = evaluateVentilationCurve(rawHourlyList);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showOzone, setShowOzone] = useState(false);

  // Active point defaults to current hour or hovered point
  const currentHourString = new Date().getHours().toString().padStart(2, '0') + ':00';
  const currentIndex = curve.findIndex((p) => p.hour === currentHourString);
  const activeIdx = hoveredIndex !== null ? hoveredIndex : currentIndex >= 0 ? currentIndex : 0;
  const activePoint: VentilationHourlyPoint | null = curve[activeIdx] || curve[0] || null;

  // Calculate SVG spline curve coordinates (viewBox 0 0 540 175)
  const svgWidth = 540;
  const svgHeight = 175;
  const paddingLeft = 32;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 25;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const maxPm25 = Math.max(160, ...curve.map((p) => p.pm25Concentration || 0));

  const points = curve.map((pt, i) => {
    const x = paddingLeft + (i / Math.max(1, curve.length - 1)) * plotWidth;
    const y = paddingTop + plotHeight - (Math.min(maxPm25, pt.pm25Concentration || 0) / maxPm25) * plotHeight;
    return { ...pt, x, y };
  });

  // Build smooth cubic bezier path for PM2.5
  let splinePath = '';
  if (points.length > 0) {
    splinePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      splinePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
  }

  const fillAreaPath = points.length > 0
    ? `${splinePath} L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${paddingTop + plotHeight} Z`
    : '';

  // Active point SVG coordinates
  const activeSvgPoint = points[activeIdx] || points[0];

  return (
    <section
      aria-labelledby="ventilation-advisor-heading"
      className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3 sm:space-y-3.5 flex flex-col justify-start overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-slate-100 pb-2.5 space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0" aria-hidden="true">🪟</span>
            <h2
              id="ventilation-advisor-heading"
              className="text-base sm:text-lg font-bold text-slate-900 font-sans tracking-tight truncate"
            >
              Outdoor-to-Indoor Ventilation Advisor
            </h2>
          </div>

          {onAskCopilot && (
            <button
              type="button"
              onClick={() =>
                onAskCopilot(
                  `When is the best window-opening time today considering outdoor PM2.5 of ${activePoint?.pm25Concentration.toFixed(0) || 0} µg/m³?`
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 text-sky-800 text-xs font-mono font-bold border border-sky-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
            >
              <span className="text-sm">🤖</span>
              <span>Ask Copilot</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
            24-Hour Diurnal Wave
          </span>
          <p className="text-xs text-slate-500 whitespace-nowrap">
            Window timing against smog &amp; ozone.
          </p>
        </div>
      </div>

      {/* Active Hour Snapshot Banner */}
      {activePoint ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-3.5 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                Forecast Hour: <strong className="text-slate-900">{activePoint.hour}</strong>
              </span>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  activePoint.suitability === 'FAVORABLE'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : activePoint.suitability === 'MODERATE'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-rose-100 text-rose-900 border-rose-300'
                }`}
              >
                {activePoint.suitability === 'FAVORABLE'
                  ? '✓ Favorable Airing (15–20 min)'
                  : activePoint.suitability === 'MODERATE'
                  ? '⚠️ Brief Flush Only (5–10 min)'
                  : '✕ Keep Windows Closed'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-700">
                Outdoor PM₂.₅: <strong>{Math.round(activePoint.pm25Concentration)} µg/m³</strong>
              </span>
              {typeof activePoint.ozoneConcentration === 'number' && (
                <span className="text-slate-500">
                  O₃: <strong>{Math.round(activePoint.ozoneConcentration)} µg/m³</strong>
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-700 font-sans leading-snug">
            {activePoint.summary}
          </p>
        </div>
      ) : null}

      {/* 24-Hour Continuous Spline Chart with Scrubber - Expanded to Fill Height */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 space-y-3 flex-1 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span className="font-bold uppercase tracking-wider text-slate-700">
            24-Hour Diurnal Forecast Wave
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOzone(!showOzone)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                showOzone
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70'
              }`}
            >
              {showOzone ? '✓ Ozone Active' : '+ Overlay Ozone'}
            </button>
            <span className="text-[10px] text-sky-700 font-medium hidden sm:inline">
              Hover curve to scrub
            </span>
          </div>
        </div>

        {points.length > 0 ? (
          <div className="relative w-full">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-44 sm:h-48 select-none overflow-visible cursor-crosshair"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
                const closestIdx = points.reduce(
                  (prev, curr, idx) =>
                    Math.abs(curr.x - mouseX) < Math.abs(points[prev].x - mouseX) ? idx : prev,
                  0
                );
                setHoveredIndex(closestIdx);
              }}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <defs>
                <linearGradient id="ventilationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Threshold Reference Lines */}
              <line
                x1={paddingLeft}
                y1={paddingTop + plotHeight * (1 - 60 / maxPm25)}
                x2={svgWidth - paddingRight}
                y2={paddingTop + plotHeight * (1 - 60 / maxPm25)}
                stroke="#10b981"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text
                x={paddingLeft - 4}
                y={paddingTop + plotHeight * (1 - 60 / maxPm25) + 3}
                fontSize="8"
                fill="#10b981"
                textAnchor="end"
                fontFamily="monospace"
              >
                60
              </text>

              <line
                x1={paddingLeft}
                y1={paddingTop + plotHeight * (1 - 120 / maxPm25)}
                x2={svgWidth - paddingRight}
                y2={paddingTop + plotHeight * (1 - 120 / maxPm25)}
                stroke="#f43f5e"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text
                x={paddingLeft - 4}
                y={paddingTop + plotHeight * (1 - 120 / maxPm25) + 3}
                fontSize="8"
                fill="#f43f5e"
                textAnchor="end"
                fontFamily="monospace"
              >
                120
              </text>

              {/* Area & Spline Wave */}
              <path d={fillAreaPath} fill="url(#ventilationGradient)" />
              <path d={splinePath} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />

              {/* Optional Ozone Curve */}
              {showOzone && (
                <path
                  d={points.reduce((acc, pt, i) => {
                    const o3Y = paddingTop + plotHeight - (Math.min(maxPm25, pt.ozoneConcentration || 0) / maxPm25) * plotHeight;
                    return i === 0 ? `M ${pt.x} ${o3Y}` : `${acc} L ${pt.x} ${o3Y}`;
                  }, '')}
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                />
              )}

              {/* Interactive Crosshair & Point Indicator */}
              {activeSvgPoint && (
                <g>
                  <line
                    x1={activeSvgPoint.x}
                    y1={paddingTop}
                    x2={activeSvgPoint.x}
                    y2={paddingTop + plotHeight}
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                  />
                  <circle
                    cx={activeSvgPoint.x}
                    cy={activeSvgPoint.y}
                    r="5"
                    fill="#0284c7"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="shadow-sm"
                  />
                </g>
              )}

              {/* X-Axis Hour Labels */}
              {points.filter((_, i) => i % 4 === 0 || i === points.length - 1).map((pt, idx) => (
                <text
                  key={idx}
                  x={pt.x}
                  y={svgHeight - 5}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#64748b"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {pt.hour}
                </text>
              ))}
            </svg>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400 font-mono">
            Atmospheric model forecast curve loading...
          </div>
        )}

        {/* Legend Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>&lt;60 µg/m³ Favorable</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>60–120 µg/m³ Brief Flush</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>&gt;120 µg/m³ Keep Closed</span>
            </span>
          </div>
          <span className="text-slate-400">
            Copernicus CAMS IFS (~45km grid)
          </span>
        </div>
      </div>
    </section>
  );
}
