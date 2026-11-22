'use client';

import React, { useState } from 'react';
import { HistoricalAirshedPoint } from '@/domain/types';

interface SevenDayTrendProps {
  readonly trend?: readonly HistoricalAirshedPoint[];
}

export function SevenDayTrend({ trend }: SevenDayTrendProps) {
  const [showTable, setShowTable] = useState(false);

  if (!trend || trend.length === 0) {
    return null;
  }

  const points = trend.slice(-7);
  const maxAqi = Math.max(...points.map((p) => p.aqi), 200);
  const minAqi = Math.min(...points.map((p) => p.aqi), 20);

  const width = 360;
  const height = 120;
  const paddingX = 24;
  const paddingY = 16;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingY * 2;

  const getX = (index: number) => {
    return paddingX + (index / (points.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const range = maxAqi - minAqi || 1;
    return height - paddingY - ((val - minAqi) / range) * plotHeight;
  };

  const linePoints = points.map((p, i) => `${getX(i)},${getY(p.aqi)}`).join(' ');
  const areaPoints = `${getX(0)},${height - paddingY} ${linePoints} ${getX(
    points.length - 1
  )},${height - paddingY}`;

  return (
    <div
      role="region"
      aria-label="7-Day Historical Trend chart"
      className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2 font-sans h-full flex flex-col justify-between"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm select-none" aria-hidden="true">
            📈
          </span>
          <h4 className="text-xs font-bold text-slate-900 font-sans truncate">
            7-Day Historical Trend
          </h4>
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

      {/* Inline SVG Chart */}
      <div className="relative pt-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          role="img"
          aria-label="7-Day Historical Air Quality Trend Line Chart"
        >
          <defs>
            <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <polygon points={areaPoints} fill="url(#trendAreaGradient)" />

          {/* Sparkline */}
          <polyline
            points={linePoints}
            fill="none"
            stroke="#0284C7"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p, i) => {
            const cx = getX(i);
            const cy = getY(p.aqi);
            return (
              <g key={p.date} className="group cursor-pointer">
                <circle
                  cx={cx}
                  cy={cy}
                  r="4"
                  fill="#FFFFFF"
                  stroke="#0284C7"
                  strokeWidth="2"
                  className="transition-transform group-hover:scale-150"
                />
                <title>{`${p.dayLabel}: AQI ${p.aqi}`}</title>
              </g>
            );
          })}

          {/* X Axis Labels */}
          {points.map((p, i) => {
            const cx = getX(i);
            const isLast = i === points.length - 1;
            const label = isLast || p.dayLabel.toLowerCase().includes('today') ? 'Today' : p.dayLabel.slice(0, 3);
            return (
              <text
                key={p.date}
                x={cx}
                y={height - 2}
                textAnchor="middle"
                fontSize="9"
                fontFamily="ui-monospace, monospace"
                fill={isLast ? '#0284C7' : '#64748B'}
                fontWeight={isLast ? 'bold' : 'normal'}
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Accessible Table Alternative */}
      {showTable && (
        <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 text-[10px] font-mono">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="p-1">Date</th>
                <th className="p-1">Daily AQI</th>
                <th className="p-1">PM2.5</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.date} className="border-b border-slate-100 last:border-0 text-slate-700">
                  <td className="p-1">{p.dayLabel}</td>
                  <td className="p-1 font-bold">{p.aqi}</td>
                  <td className="p-1">{p.pm25} µg/m³</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
