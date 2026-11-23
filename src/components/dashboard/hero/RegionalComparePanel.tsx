'use client';

import React from 'react';
import { GeoLocation } from '@/domain/types';
import { GLOBE_REFERENCE_CITIES, GlobeCityPin } from '@/components/globe/world-landmass';
import type { RegionalCityEstimate } from '@/app/api/regional-hotspots/route';
import { useRegionalHotspots } from './useRegionalHotspots';

interface RegionalComparePanelProps {
  readonly location: GeoLocation;
  readonly onSelectLocation: (loc: GeoLocation) => void;
  readonly onSwitchToOverview: () => void;
  readonly aqiColor: string;
  readonly effectiveTierLabel: string;
  readonly displayAqi: number | null;
  readonly effectiveAqi: number | null;
  readonly isStation: boolean;
}

export function RegionalComparePanel({
  location,
  onSelectLocation,
  onSwitchToOverview,
  aqiColor,
  effectiveTierLabel,
  displayAqi,
  effectiveAqi,
  isStation,
}: RegionalComparePanelProps) {
  const { regionalHotspots, isHotspotsLoading, hotspotsError, retryHotspots } =
    useRegionalHotspots(true);

  return (
    <div
      id="panel-compare"
      role="tabpanel"
      aria-labelledby="tab-compare"
      className="w-full h-[540px] sm:h-[620px] lg:h-[680px] rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 overflow-y-auto space-y-4 shadow-lg animate-fadeIn"
    >
      <div className="border-b border-slate-200/80 pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-base font-bold font-sans text-slate-900 flex items-center gap-2">
            <span>🇮🇳 Regional Air Quality Comparison</span>
          </h3>
          <span className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300 shadow-2xs">
            Modeled estimates
          </span>
        </div>
        <p className="text-xs text-slate-600 mt-1 font-sans">
          Live modeled estimates from Copernicus Atmosphere Monitoring Service (CAMS) via Open-Meteo (~45 km horizontal grid). Click any city to switch your active location.
        </p>
      </div>

      {isHotspotsLoading && (
        <div className="p-8 text-center space-y-3">
          <div className="h-7 w-7 animate-spin rounded-full border-3 border-sky-600 border-t-transparent mx-auto" />
          <p className="text-xs font-mono text-slate-500">
            Loading live regional comparison estimates...
          </p>
        </div>
      )}

      {hotspotsError && !isHotspotsLoading && (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2">
          <span className="text-xl">⚠️</span>
          <p className="text-xs font-sans text-amber-900 font-semibold">
            {hotspotsError}
          </p>
          <button
            type="button"
            onClick={retryHotspots}
            className="px-3 py-1 text-xs font-mono font-bold bg-amber-200 text-amber-900 rounded-lg hover:bg-amber-300 transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {!isHotspotsLoading && !hotspotsError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {(regionalHotspots.length > 0 ? regionalHotspots : GLOBE_REFERENCE_CITIES).map((c) => {
            const typedItem = c as RegionalCityEstimate | (GlobeCityPin & { aqi?: number | null; pm25?: number | null; pm10?: number | null; tierLabel?: string; colorToken?: string });
            const isCurrent = location.name.toLowerCase() === typedItem.name.toLowerCase();
            const flag = typedItem.countryCode === 'GB' ? '🇬🇧' : typedItem.countryCode === 'JP' ? '🇯🇵' : '🇮🇳';
            const cityAqi = typeof typedItem.aqi === 'number' ? typedItem.aqi : null;

            return (
              <div
                key={typedItem.name}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-sky-50/90 border-sky-400 shadow-sm ring-2 ring-sky-300'
                    : 'bg-slate-50/80 border-slate-200/80 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900 font-sans flex items-center gap-1.5">
                    <span aria-hidden="true">{flag}</span>
                    <span>{typedItem.name}</span>
                  </span>
                  {cityAqi !== null ? (
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold text-white shadow-xs tabular-nums"
                      style={{ backgroundColor: typedItem.colorToken || aqiColor }}
                    >
                      AQI {cityAqi}
                    </span>
                  ) : isCurrent ? (
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold text-white shadow-xs tabular-nums"
                      style={{ backgroundColor: aqiColor }}
                    >
                      AQI {displayAqi ?? effectiveAqi}
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Modeled
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-600 mb-2">
                  <span className="text-slate-500">{typedItem.admin1}, {typedItem.country}</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      isCurrent
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200/70 text-slate-700'
                    }`}
                  >
                    {isCurrent
                      ? (isStation ? '● Active Ground Station' : '● Active Model Grid')
                      : (typedItem.tierLabel || 'Modeled')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-3">
                  <span className="font-semibold" style={{ color: isCurrent ? aqiColor : (typedItem.colorToken || 'inherit') }}>
                    {isCurrent
                      ? effectiveTierLabel
                      : typedItem.pm25 !== null && typedItem.pm25 !== undefined
                      ? `PM₂.₅: ${typedItem.pm25} µg/m³`
                      : `${typedItem.latitude.toFixed(2)}°N, ${typedItem.longitude.toFixed(2)}°E`}
                  </span>
                  <span className="tabular-nums">
                    {typedItem.pm10 !== null && typedItem.pm10 !== undefined
                      ? `PM₁₀: ${typedItem.pm10} µg/m³`
                      : `${typedItem.latitude.toFixed(1)}°, ${typedItem.longitude.toFixed(1)}°`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectLocation({
                      id: typedItem.id,
                      name: typedItem.name,
                      latitude: typedItem.latitude,
                      longitude: typedItem.longitude,
                      country: typedItem.country,
                      countryCode: typedItem.countryCode,
                      admin1: typedItem.admin1,
                      timezone: 'timezone' in typedItem && typeof typedItem.timezone === 'string' ? typedItem.timezone : 'UTC',
                    });
                    onSwitchToOverview();
                  }}
                  disabled={isCurrent}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs tactile-btn'
                  }`}
                >
                  {isCurrent ? 'Current Active Location' : 'Select as Active Location ↵'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
