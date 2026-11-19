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
            className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink-primary)] flex items-center gap-2"
          >
            <span>Surface Meteorology • Atmospheric Context</span>
            <span className="text-[9px] font-normal text-[var(--ink-muted)] bg-[var(--surface-card)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
              Open-Meteo Feed
            </span>
          </h3>
          <p className="text-[11px] text-[var(--ink-secondary)] mt-0.5">
            Modelled surface parameters at ground level.
          </p>
        </div>

        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--ink-secondary)] self-start sm:self-auto">
          Surface Observations
        </span>
      </div>

      {/* Core Independent Weather Variables */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Temperature at 2m */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)]">
          <span className="text-xl select-none" aria-hidden="true">🌡️</span>
          <div>
            <span className="text-[10px] font-mono font-bold text-[var(--ink-muted)] uppercase block">
              Temperature (2m)
            </span>
            <span className="text-sm font-mono font-bold tabular-nums text-[var(--ink-primary)]">
              {weather.temperature !== null ? `${weather.temperature.toFixed(1)}°C` : 'Not Reported'}
            </span>
          </div>
        </div>

        {/* Relative Humidity at 2m */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)]">
          <span className="text-xl select-none" aria-hidden="true">💧</span>
          <div>
            <span className="text-[10px] font-mono font-bold text-[var(--ink-muted)] uppercase block">
              Relative Humidity (2m)
            </span>
            <span className="text-sm font-mono font-bold tabular-nums text-[var(--ink-primary)]">
              {weather.humidity !== null ? `${weather.humidity}%` : 'Not Reported'}
            </span>
          </div>
        </div>

        {/* Wind Speed and Direction at 10m */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)]">
          <span className="text-xl select-none" aria-hidden="true">💨</span>
          <div>
            <span className="text-[10px] font-mono font-bold text-[var(--ink-muted)] uppercase block">
              Surface Wind (10m)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-mono font-bold tabular-nums text-[var(--ink-primary)]">
                {weather.windSpeed !== null ? `${weather.windSpeed.toFixed(1)} km/h` : 'Not Reported'}
              </span>
              <span className="text-[10px] font-mono font-bold text-[var(--brand-primary)] bg-[var(--brand-surface)] px-1.5 py-0.2 rounded border border-[var(--brand-primary)]/30">
                {weather.windDirectionCardinal}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Clearly Separated Educational Explanation */}
      <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)]/60 text-[11px] leading-relaxed text-[var(--ink-muted)]">
        <strong className="font-mono text-[10px] uppercase text-[var(--ink-secondary)] block mb-0.5">
          General Atmospheric Science (Educational Reference)
        </strong>
        <p>
          Surface meteorological parameters reflect horizontal air flow at 10 metres and temperature/humidity at 2 metres. While calm surface winds and cold weather can coincide with shallow thermal temperature inversions that concentrate local smoke and vehicle exhaust, confirming vertical thermal inversions or planetary boundary-layer mixing height requires vertical upper-air atmospheric soundings (such as meteorological balloons or lidar) that are not captured in ground surface feeds.
        </p>
      </div>
    </section>
  );
}
