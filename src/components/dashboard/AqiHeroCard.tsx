'use client';

import React from 'react';
import { AirQualityReport, AqiStandardKey } from '@/domain/types';

interface AqiHeroCardProps {
  readonly report: AirQualityReport;
  readonly onSwitchStandard: (standard: AqiStandardKey) => void;
  readonly isLoading?: boolean;
}

export function AqiHeroCard({ report, onSwitchStandard, isLoading = false }: AqiHeroCardProps) {
  const {
    location,
    activeStandard,
    standardMetadata,
    providerAqi,
    tier,
    dominantPollutant,
    localTime,
    modelTimestamp,
    coordinates,
    averagingPeriodNote,
  } = report;

  const hasAqi = providerAqi !== null;

  // Calculate percentage along the spectrum for the visual marker
  let spectrumPercent = 0;
  if (hasAqi) {
    if (activeStandard === 'EUROPEAN_EAQI') {
      // 0 to 120 scale
      spectrumPercent = Math.min(100, Math.max(0, (providerAqi / 120) * 100));
    } else {
      // 0 to 500 scale
      spectrumPercent = Math.min(100, Math.max(0, (providerAqi / 500) * 100));
    }
  }

  return (
    <article
      aria-labelledby="hero-aqi-heading"
      className="relative overflow-hidden rounded-xl border border-(--border-subtle) bg-(--surface-card) shadow-sm transition-all"
    >
      {/* Precision Telemetry Status Ribbon */}
      <div className="flex flex-wrap items-center justify-between border-b border-(--border-subtle) bg-(--surface-subtle)/70 px-4 py-2 sm:px-6 text-[11px] font-mono text-(--ink-muted)">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 font-bold text-(--ink-primary)">
            <span className="h-2 w-2 rounded-full bg-(--brand-primary) animate-pulse" />
            TELEMETRY FEED // CAMS ENSEMBLE
          </span>
          <span className="hidden sm:inline text-(--border-strong)">|</span>
          <span className="hidden sm:inline">
            COORDS: {coordinates.latitude.toFixed(2)}°N, {coordinates.longitude.toFixed(2)}°E
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>MODEL RUN: {modelTimestamp}</span>
          <span className="hidden sm:inline text-(--border-strong)">|</span>
          <span className="font-semibold text-(--ink-secondary)">LOCAL TIME: {localTime}</span>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        {/* Top Header: Location, Standard Status, and In-Card Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-(--border-subtle) pb-5 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-(--ink-primary) text-white">
                {standardMetadata.roleLabel}
              </span>
              <span className="text-xs font-mono text-(--ink-muted)">
                {activeStandard === 'EUROPEAN_EAQI' ? 'REGIONAL AIR INDEX' : 'GLOBAL REFERENCE'}
              </span>
            </div>
            <h1
              id="hero-aqi-heading"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-(--ink-primary) font-sans"
            >
              {location.name}
              {location.admin1 && (
                <span className="text-(--ink-secondary) font-normal text-xl sm:text-2xl">
                  , {location.admin1}
                </span>
              )}
              <span className="text-(--ink-muted) font-normal text-base sm:text-lg ml-2 font-mono">
                [{location.countryCode || 'INTL'}]
              </span>
            </h1>
          </div>

          {/* Precision In-Card Standard Switcher */}
          <div className="flex flex-col items-start md:items-end gap-1">
            <span className="text-[10px] font-mono font-bold text-(--ink-muted) uppercase tracking-wider">
              INDEX STANDARD // SWITCHER
            </span>
            <div
              role="radiogroup"
              aria-label="Active Air Quality Index Standard"
              className="inline-flex p-0.5 rounded-lg bg-(--surface-subtle) border border-(--border-subtle)"
            >
              <button
                type="button"
                role="radio"
                aria-checked={activeStandard === 'EUROPEAN_EAQI'}
                onClick={() => onSwitchStandard('EUROPEAN_EAQI')}
                className={`px-3 py-1 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
                  activeStandard === 'EUROPEAN_EAQI'
                    ? 'bg-(--surface-card) text-(--brand-primary) shadow-xs border border-(--border-subtle)'
                    : 'text-(--ink-muted) hover:text-(--ink-primary)'
                }`}
              >
                European EAQI [0–100+]
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={activeStandard === 'US_EPA'}
                onClick={() => onSwitchStandard('US_EPA')}
                className={`px-3 py-1 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
                  activeStandard === 'US_EPA'
                    ? 'bg-(--surface-card) text-(--brand-primary) shadow-xs border border-(--border-subtle)'
                    : 'text-(--ink-muted) hover:text-(--ink-primary)'
                }`}
              >
                US EPA AQI [0–500]
              </button>
            </div>
          </div>
        </div>

        {/* Hero Metric Centerpiece */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Focal Metric & Category */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-(--ink-muted) mb-1">
              {standardMetadata.name}
            </span>
            <div className="flex items-baseline gap-3">
              <span
                className="text-6xl sm:text-7xl font-black font-mono tracking-tight tabular-nums"
                style={{ color: tier ? tier.colorToken : 'var(--ink-primary)' }}
              >
                {hasAqi ? providerAqi : '—'}
              </span>
              <span className="text-xs font-mono font-semibold text-(--ink-muted)">
                / {standardMetadata.scaleRange}
              </span>
            </div>

            {tier && (
              <div className="mt-3 flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded text-xs font-extrabold font-mono uppercase tracking-wider border shadow-xs"
                  style={{
                    color: tier.colorToken,
                    backgroundColor: tier.bgToken,
                    borderColor: tier.borderToken,
                  }}
                >
                  {tier.label}
                </span>
                {dominantPollutant && (
                  <span className="text-xs font-mono text-(--ink-secondary) bg-(--surface-subtle) px-2 py-1 rounded border border-(--border-subtle)">
                    Dominant: <strong>{dominantPollutant}</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Scientific Rationale & Health Advisory */}
          <div className="lg:col-span-7 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-(--border-subtle) pt-4 lg:pt-0 lg:pl-6">
            {tier ? (
              <div>
                <p className="text-base sm:text-lg font-bold text-(--ink-primary) leading-snug">
                  {tier.description}
                </p>
                <p className="text-xs sm:text-sm text-(--ink-secondary) mt-1.5 leading-relaxed">
                  {tier.healthAdvisory}
                </p>
              </div>
            ) : (
              <p className="text-sm text-(--ink-muted)">
                Air quality calculations are temporarily unavailable for this coordinate grid.
              </p>
            )}

            <p className="text-[11px] text-(--ink-muted) mt-3 leading-relaxed border-t border-(--border-subtle) pt-2.5">
              {averagingPeriodNote}
            </p>
          </div>
        </div>

        {/* Continuous Linear Atmospheric Spectrum Bar */}
        <div className="mt-6 pt-5 border-t border-(--border-subtle)">
          <div className="flex items-center justify-between text-[10px] font-mono text-(--ink-muted) uppercase mb-1.5">
            <span>AQI SPECTRUM RANGE</span>
            <span>CURRENT VALUE: {hasAqi ? `${providerAqi} (${tier?.label})` : 'N/A'}</span>
          </div>

          {/* Multi-tiered spectrum track */}
          <div className="relative h-2.5 w-full rounded-sm bg-linear-to-r from-[#047857] via-[#C2410C] via-70% to-[#6D28D9] overflow-visible">
            {/* Position Marker */}
            {hasAqi && (
              <div
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${spectrumPercent}%` }}
              >
                <div className="w-1.5 h-3.5 bg-white border border-(--ink-primary) rounded-xs shadow-xs" />
              </div>
            )}
          </div>

          <div className="flex justify-between text-[10px] font-mono text-(--ink-muted) mt-1.5">
            <span>0 Good</span>
            <span>50 Mod</span>
            <span>100 USG</span>
            <span>150 Unhealthy</span>
            <span>200 Very Unhealthy</span>
            <span>300+ Haz</span>
          </div>
        </div>
      </div>
    </article>
  );
}
