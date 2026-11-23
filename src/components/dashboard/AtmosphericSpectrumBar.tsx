'use client';

import { useState } from 'react';
import { AqiStandardKey } from '@/domain/types';

export interface AtmosphericSpectrumBarProps {
  readonly activeStandard?: AqiStandardKey;
  readonly hasAqi: boolean;
  readonly effectiveAqi: number | null;
  readonly effectiveTierLabel: string;
  readonly spectrumPercent: number;
  readonly aqiColor: string;
  readonly providerAqi: number | null;
  readonly tierLabel?: string;
}

export function AtmosphericSpectrumBar({
  activeStandard,
  hasAqi,
  effectiveAqi,
  effectiveTierLabel,
  spectrumPercent,
  aqiColor,
  providerAqi,
  tierLabel = 'Active',
}: AtmosphericSpectrumBarProps) {
  const [hoveredBand, setHoveredBand] = useState<string | null>(null);

  return (
    <div className="mt-8 pt-6 border-t border-slate-200/80 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 font-sans">
            Index Scale &amp; Position
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
            {activeStandard === 'EUROPEAN_EAQI' ? 'European EAQI (0–100+ Scale)' : 'US EPA AQI (0–500 Scale)'}
          </span>
        </div>
        <span className="text-slate-900 font-bold text-sm tabular-nums">
          Active Value: {hasAqi && effectiveAqi !== null && Number.isFinite(effectiveAqi) ? `${effectiveAqi} (${effectiveTierLabel})` : 'N/A'}
        </span>
      </div>

      {/* Segmented Gradient Bar with Dynamic Needle and Hover Tooltip */}
      <div className="relative pt-7 pb-1">
        {hasAqi && effectiveAqi !== null && Number.isFinite(effectiveAqi) && effectiveAqi >= 0 && (
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300 pointer-events-none z-20"
            style={{ left: `${spectrumPercent}%` }}
          >
            <span
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-black text-white shadow-md mb-1 whitespace-nowrap flex items-center gap-1"
              style={{ backgroundColor: aqiColor }}
            >
              <span>▼</span>
              <span>{providerAqi}</span>
              <span>•</span>
              <span>{tierLabel}</span>
            </span>
            <div
              className="w-4 h-4 bg-white border-3 rounded-full shadow-lg"
              style={{ borderColor: aqiColor }}
            />
          </div>
        )}

        {/* Hover Tooltip Overlay */}
        {hoveredBand && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-slate-900 text-white text-xs font-mono shadow-md z-30 pointer-events-none whitespace-nowrap">
            {hoveredBand}
          </div>
        )}

        {/* Interactive Bar */}
        <div className="h-5 w-full rounded-xl overflow-hidden flex shadow-inner bg-slate-200 border border-slate-300">
          {activeStandard === 'EUROPEAN_EAQI' ? (
            <>
              <div
                className="flex-1 bg-[#047857] hover:brightness-110 transition-all cursor-pointer"
                onMouseEnter={() => setHoveredBand('0–20: Good (Ideal for outdoor activities)')}
                onMouseLeave={() => setHoveredBand(null)}
              />
              <div
                className="flex-1 bg-[#10B981] hover:brightness-110 transition-all cursor-pointer"
                onMouseEnter={() => setHoveredBand('20–40: Fair (Air quality acceptable)')}
                onMouseLeave={() => setHoveredBand(null)}
              />
              <div
                className="flex-1 bg-[#92400E] hover:brightness-110 transition-all cursor-pointer"
                onMouseEnter={() => setHoveredBand('40–60: Moderate (Sensitive groups notice irritation)')}
                onMouseLeave={() => setHoveredBand(null)}
              />
              <div
                className="flex-1 bg-[#EA580C] hover:brightness-110 transition-all cursor-pointer"
                onMouseEnter={() => setHoveredBand('60–80: Poor (General public notice discomfort)')}
                onMouseLeave={() => setHoveredBand(null)}
              />
              <div
                className="flex-1 bg-[#DC2626] hover:brightness-110 transition-all cursor-pointer"
                onMouseEnter={() => setHoveredBand('80–100: Very Poor (Severe exposure warnings)')}
                onMouseLeave={() => setHoveredBand(null)}
              />
              <div
                className="flex-1 bg-[#7C3AED] hover:brightness-110 transition-all cursor-pointer"
                onMouseEnter={() => setHoveredBand('100+: Extremely Poor (Hazardous inversion smog)')}
                onMouseLeave={() => setHoveredBand(null)}
              />
            </>
          ) : (
            <>
              <div
                className="w-[10%] bg-[#047857] hover:brightness-110 transition-all cursor-pointer"
                onMouseEnter={() => setHoveredBand('0–50: Good • CPCB Good (Clean air, no restrictions)')}
                onMouseLeave={() => setHoveredBand(null)}
              />
              <div
                className="w-[10%] bg-[#92400E] hover:brightness-110 transition-all cursor-pointer"
                onMouseEnter={() => setHoveredBand('51–100: Moderate • CPCB Satisfactory (Acceptable air)')}
                onMouseLeave={() => setHoveredBand(null)}
              />
              <div
                className="w-[10%] bg-[#EA580C] hover:brightness-110 transition-all cursor-pointer"
                onMouseEnter={() => setHoveredBand('101–150: Sensitive • CPCB Moderate (Children & asthmatics limit exertion)')}
                onMouseLeave={() => setHoveredBand(null)}
              />
              <div
                className="w-[10%] bg-[#DC2626] hover:brightness-110 transition-all cursor-pointer"
                onMouseEnter={() => setHoveredBand('151–200: Unhealthy • CPCB Poor (Health effects for general population)')}
                onMouseLeave={() => setHoveredBand(null)}
              />
              <div
                className="w-[20%] bg-[#9333EA] hover:brightness-110 transition-all cursor-pointer"
                onMouseEnter={() => setHoveredBand('201–300: Very Unhealthy • CPCB Very Poor (Health alert: morning inversion)')}
                onMouseLeave={() => setHoveredBand(null)}
              />
              <div
                className="w-[40%] bg-[#7F1D1D] hover:brightness-110 transition-all cursor-pointer"
                onMouseEnter={() => setHoveredBand('301–500: Hazardous • CPCB Severe (Emergency conditions; stay indoors)')}
                onMouseLeave={() => setHoveredBand(null)}
              />
            </>
          )}
        </div>
      </div>

      {/* Dual-Scale Legend (US EPA / EAQI + 🇮🇳 India CPCB Scale) */}
      <div className="space-y-1 overflow-x-auto scrollbar-none pb-0.5">
        {activeStandard === 'EUROPEAN_EAQI' ? (
          <div className="flex justify-between text-xs font-mono text-slate-600 tabular-nums min-w-[340px]">
            <span>0 Good</span>
            <span>20 Fair</span>
            <span>40 Moderate</span>
            <span>60 Poor</span>
            <span>80 Very Poor</span>
            <span>100+ Extr.</span>
          </div>
        ) : (
          <div className="min-w-[480px] sm:min-w-0 space-y-1">
            <div className="flex justify-between text-xs font-mono font-bold text-slate-700 tabular-nums">
              <span>0 Good</span>
              <span>50 Mod</span>
              <span>100 Sens</span>
              <span>150 Unhealthy</span>
              <span>200 Very Unhealthy</span>
              <span>300+ Haz</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono text-emerald-800 font-semibold bg-emerald-50/70 px-2.5 py-1 rounded-lg border border-emerald-200 gap-1.5 whitespace-nowrap">
              <span>🇮🇳 CPCB Good (0–50)</span>
              <span>Satisfactory (51–100)</span>
              <span>Moderate (101–200)</span>
              <span>Poor (201–300)</span>
              <span>Very Poor (301–400)</span>
              <span>Severe (401–500+)</span>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs font-mono text-slate-500 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <span>
          {activeStandard === 'EUROPEAN_EAQI'
            ? 'European Air Quality Index (0–100+ continuous scale based on EEA 2024 concentration thresholds).'
            : 'US EPA Air Quality Index (0–500 continuous scale across 6 criteria pollutants; EPA-454/B-18-007).'}
        </span>
        <span className="text-slate-400">
          *AQI is strictly non-negative (0 to 500+). Minus signs in Choices reflect avoided emissions.
        </span>
      </div>
    </div>
  );
}
