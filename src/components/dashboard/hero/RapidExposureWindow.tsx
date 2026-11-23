'use client';

import React from 'react';
import { ForecastPoint } from '@/domain/types';

interface RapidExposureWindowProps {
  readonly forecast: readonly ForecastPoint[];
}

export function RapidExposureWindow({ forecast }: RapidExposureWindowProps) {
  return (
    <div className="mt-8 pt-6 border-t border-slate-200/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-3 mb-4 gap-2">
        <div>
          <h2 className="text-base font-bold font-sans text-slate-900 flex items-center gap-2">
            <span>⏱️ Rapid 6-Hour Exposure Window</span>
            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
              Forecast: modeled
            </span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Hourly atmospheric trajectory from numerical forecast models for routine and commute planning.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Hourly resolution
          </span>
        </div>
      </div>

      {/* Hourly forecast quick cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {forecast.slice(0, 6).map((point, idx) => {
          const ptAqi = point.activeAqi ?? 100;
          const ptColor = point.tier?.colorToken || '#047857';
          return (
            <div
              key={point.time || idx}
              className="rounded-2xl p-3 border border-slate-200/80 bg-white hover:border-slate-300 transition-all text-center space-y-1 shadow-2xs"
            >
              <span className="text-xs font-mono font-bold text-slate-700 block">
                {point.displayTime}
                {point.isCurrentHour ? ' (Now)' : ''}
              </span>
              <span
                className="text-2xl font-black font-mono tabular-nums block"
                style={{ color: ptColor }}
              >
                {ptAqi}
              </span>
              <span
                className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase"
                style={{
                  backgroundColor: `${ptColor}18`,
                  color: ptColor,
                }}
              >
                {point.tier?.label || 'Moderate'}
              </span>
              {point.pm25 !== null && point.pm25 !== undefined && (
                <span className="text-[10px] text-slate-600 block font-mono">
                  PM₂.₅: {point.pm25.toFixed(1)} µg/m³
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
