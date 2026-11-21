'use client';

import React from 'react';
import { WeatherData } from '@/app/api/weather/route';

interface AtmosphericWeatherCardProps {
  readonly weather: WeatherData | null;
  readonly isLoading?: boolean;
}

export function AtmosphericWeatherCard({
  weather,
  isLoading = false,
}: AtmosphericWeatherCardProps) {
  if (isLoading) {
    return (
      <div className="w-full mt-3 p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] animate-pulse h-20" />
    );
  }

  if (!weather || weather.temperature === null) {
    return null;
  }

  return (
    <section
      aria-labelledby="surface-weather-heading"
      className="w-full mt-3 p-4 rounded-xl bg-[var(--surface-subtle)]/80 border border-[var(--border-subtle)] text-xs font-sans"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5 mb-3">
        <div>
          <h3
            id="surface-weather-heading"
            className="text-xs font-semibold text-[var(--ink-primary)] font-sans flex items-center gap-2"
          >
            <span>Surface Meteorology &amp; Atmospheric Context</span>
            <span className="text-[9px] font-normal text-[var(--ink-muted)] bg-[var(--surface-card)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
              Open-Meteo Feed
            </span>
          </h3>
          <p className="text-[11px] text-[var(--ink-secondary)] mt-0.5">
            Modelled surface parameters at ground level.
          </p>
        </div>

        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--ink-secondary)] self-start sm:self-auto">
          Surface Observations
        </span>
      </div>

      {/* Core Independent Weather Variables */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Temperature at 2m */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-2xs">
          <div className="p-2 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
            <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-[var(--ink-muted)] uppercase block">
              Temperature (2m)
            </span>
            <span className="text-base font-mono font-bold tabular-nums text-[var(--ink-primary)]">
              {weather.temperature !== null ? `${weather.temperature.toFixed(1)}°C` : 'Not Reported'}
            </span>
          </div>
        </div>

        {/* Relative Humidity at 2m */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-2xs">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
            <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-[var(--ink-muted)] uppercase block">
              Relative Humidity (2m)
            </span>
            <span className="text-base font-mono font-bold tabular-nums text-[var(--ink-primary)]">
              {weather.humidity !== null ? `${weather.humidity}%` : 'Not Reported'}
            </span>
          </div>
        </div>

        {/* Wind Speed and Direction at 10m */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-2xs">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
            <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.7 7.7A7.1 7.1 0 0 0 5 10.8" />
              <path d="M18 10h4" />
              <path d="M15 14h6" />
              <path d="M13 18h8" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-[var(--ink-muted)] uppercase block">
              Surface Wind (10m)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-mono font-bold tabular-nums text-[var(--ink-primary)]">
                {weather.windSpeed !== null ? `${weather.windSpeed.toFixed(1)} km/h` : 'Not Reported'}
              </span>
              <span className="text-[10px] font-mono font-bold text-[var(--brand-primary)] bg-[var(--brand-surface)] px-1.5 py-0.2 rounded border border-[var(--brand-primary)]/30">
                {weather.windDirectionCardinal}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Smog Dispersion Indicator Gauge (Visual Physical Context) */}
      <div className="mt-3.5 p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="font-bold text-[var(--ink-primary)]">
            Horizontal Air Movement &amp; Smog Trapping
          </span>
          <span
            className={`font-bold px-2 py-0.5 rounded text-[10px] ${
              weather.windSpeed !== null && weather.windSpeed < 2.5
                ? 'bg-rose-50 text-rose-800 border border-rose-300'
                : weather.windSpeed !== null && weather.windSpeed < 8.0
                ? 'bg-amber-50 text-amber-800 border border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
            }`}
          >
            {weather.windSpeed !== null && weather.windSpeed < 2.5
              ? 'Calm Surface Flow (Low Dispersal)'
              : weather.windSpeed !== null && weather.windSpeed < 8.0
              ? 'Moderate Air Movement'
              : 'Active Air Movement'}
          </span>
        </div>

        {/* 3-Step Visual Dispersion Track */}
        <div className="grid grid-cols-3 gap-1.5 text-[9px] font-mono text-center">
          <div
            className={`py-1 rounded font-bold transition-all ${
              weather.windSpeed !== null && weather.windSpeed < 2.5
                ? 'bg-rose-100 text-rose-900 border border-rose-300 shadow-2xs'
                : 'bg-slate-100/70 text-slate-400'
            }`}
          >
            ● Trapping / Calm Air
          </div>
          <div
            className={`py-1 rounded font-bold transition-all ${
              weather.windSpeed !== null && weather.windSpeed >= 2.5 && weather.windSpeed < 8.0
                ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                : 'bg-slate-100/70 text-slate-400'
            }`}
          >
            ● Moderate Flow
          </div>
          <div
            className={`py-1 rounded font-bold transition-all ${
              weather.windSpeed !== null && weather.windSpeed >= 8.0
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs'
                : 'bg-slate-100/70 text-slate-400'
            }`}
          >
            ● Active Clearing
          </div>
        </div>

        <p className="text-xs text-[var(--ink-secondary)] leading-relaxed pt-0.5 font-sans">
          {weather.windSpeed !== null && weather.windSpeed < 2.5
            ? 'Near-calm winds and high winter relative humidity limit particulate dispersal, keeping combustion smoke trapped close to ground level.'
            : 'Sufficient ambient wind speed aids horizontal pollutant transport, helping reduce localized smoke and particulate concentrations.'}
        </p>
      </div>

      {/* Accessible Expandable Educational Details */}
      <details className="group mt-3 pt-2.5 border-t border-[var(--border-subtle)]/60 text-[11px] leading-relaxed text-[var(--ink-muted)]">
        <summary className="cursor-pointer list-none font-mono text-[10px] uppercase font-bold text-[var(--ink-secondary)] hover:text-[var(--brand-primary)] flex items-center justify-between select-none py-0.5">
          <span>General Atmospheric Science</span>
          <span aria-hidden="true" className="group-open:rotate-180 transition-transform duration-200">
            ▼
          </span>
        </summary>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--ink-muted)]">
          Surface meteorological parameters reflect horizontal air flow at 10 metres and temperature/humidity at 2 metres. While calm surface winds and cold weather can coincide with shallow thermal temperature inversions that concentrate local smoke and vehicle exhaust, confirming vertical thermal inversions or planetary boundary-layer mixing height requires vertical upper-air atmospheric soundings (such as meteorological balloons or lidar) that are not captured in ground surface feeds.
        </p>
      </details>
    </section>
  );
}
