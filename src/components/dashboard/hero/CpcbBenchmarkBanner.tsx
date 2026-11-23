'use client';

import React from 'react';
import { AirQualityReport } from '@/domain/types';

interface CpcbBenchmarkBannerProps {
  readonly cpcbComparison: NonNullable<AirQualityReport['cpcbComparison']>;
  readonly isStation: boolean;
  readonly stationMeasuredPm10?: number | null;
}

export function CpcbBenchmarkBanner({
  cpcbComparison,
  isStation,
  stationMeasuredPm10,
}: CpcbBenchmarkBannerProps) {
  const subIndexLabel = stationMeasuredPm10 === null || stationMeasuredPm10 === undefined
    ? 'PM2.5 sub-index only'
    : cpcbComparison.indexLabel || (isStation ? 'CPCB AQI (PM2.5/PM10 sub-index)' : 'PM2.5 sub-index, modeled');

  return (
    <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-emerald-50/90 border border-emerald-300 shadow-xs">
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">🇮🇳</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-mono font-semibold text-emerald-800">
            CPCB NAQI:
          </span>
          <strong className="text-sm font-bold text-emerald-950">
            {cpcbComparison.equivalentCategory}
          </strong>
          <span className="text-xs font-mono text-emerald-700 font-semibold">
            (AQI {cpcbComparison.compositeAqi ?? cpcbComparison.estimatedAqiRange})
          </span>
        </div>
      </div>
      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-white text-emerald-800 border border-emerald-200 shrink-0 shadow-2xs">
        {subIndexLabel}
      </span>
    </div>
  );
}
