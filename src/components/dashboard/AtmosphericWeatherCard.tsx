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
      <div className="w-full mt-3 p-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] animate-pulse h-14" />
    );
  }

  if (!weather || weather.temperature === null) {
    return null;
  }

  const getDispersionBadgeStyle = (dispersion: WeatherData['dispersionIndex']) => {
    switch (dispersion) {
      case 'GOOD':
        return 'text-[var(--aqi-good)] bg-[var(--aqi-good-bg)] border-[var(--aqi-good-border)]';
      case 'POOR':
        return 'text-[var(--aqi-unhealthy)] bg-[var(--aqi-unhealthy-bg)] border-[var(--aqi-unhealthy-border)]';
      case 'MODERATE':
      default:
        return 'text-[var(--aqi-moderate)] bg-[var(--aqi-moderate-bg)] border-[var(--aqi-moderate-border)]';
    }
  };

  return (
    <div className="w-full mt-3 p-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Core Weather Vector Pills */}
        <div className="flex items-center gap-4 text-[var(--ink-primary)]">
          {/* Temperature */}
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-sm select-none" aria-hidden="true">🌡️</span>
            <span className="font-bold text-sm tabular-nums">
              {weather.temperature !== null ? `${weather.temperature.toFixed(1)}°C` : '—'}
            </span>
          </div>

          {/* Humidity */}
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-sm select-none" aria-hidden="true">💧</span>
            <span className="font-bold tabular-nums">
              {weather.humidity !== null ? `${weather.humidity}%` : '—'}
            </span>
            <span className="text-[10px] text-[var(--ink-muted)]">Humidity</span>
          </div>

          {/* Wind Speed & Direction */}
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-sm select-none" aria-hidden="true">💨</span>
            <span className="font-bold tabular-nums">
              {weather.windSpeed !== null ? `${weather.windSpeed.toFixed(1)} km/h` : '—'}
            </span>
            <span className="text-[10px] font-bold text-[var(--brand-primary)] bg-[var(--surface-card)] px-1.5 py-0.2 rounded border border-[var(--border-subtle)]">
              {weather.windDirectionCardinal}
            </span>
          </div>
        </div>

        {/* Dispersion Condition Callout */}
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getDispersionBadgeStyle(
              weather.dispersionIndex
            )}`}
          >
            Dispersion: {weather.dispersionIndex}
          </span>
          <span className="hidden md:inline text-[11px] text-[var(--ink-secondary)]">
            {weather.dispersionNote}
          </span>
        </div>
      </div>
    </div>
  );
}
