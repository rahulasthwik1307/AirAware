'use client';

import React, { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import { z } from 'zod';
import { AqiStandardKey, GeoLocation } from '@/domain/types';
import { normalizeAirQualityReport, RawOpenMeteoAirQualityResponse } from '@/domain/aqi/normalizer';
import { LocationSearch } from './LocationSearch';
import { AqiHeroCard } from './AqiHeroCard';
import { PollutantGrid } from './PollutantGrid';
import { ForecastTimeline } from './ForecastTimeline';
import { ScientificGrounding } from './ScientificGrounding';
import { ProvenanceFooter } from './ProvenanceFooter';

const GeoLocationSchema = z.object({
  id: z.number(),
  name: z.string(),
  country: z.string(),
  countryCode: z.string(),
  admin1: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  isPrimary: z.boolean().optional(),
});

const STORAGE_KEY = 'airaware_last_location';

function subscribeToStorage(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getClientStorageSnapshot(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerStorageSnapshot(): null {
  return null;
}

export function AirQualityDashboard() {
  // Read cached location using React's official useSyncExternalStore (zero SSR mismatch, zero cascading effects)
  const storedJson = useSyncExternalStore(
    subscribeToStorage,
    getClientStorageSnapshot,
    getServerStorageSnapshot
  );

  const initialLocation = useMemo<GeoLocation | null>(() => {
    if (!storedJson) return null;
    try {
      const parsed = JSON.parse(storedJson);
      const valid = GeoLocationSchema.safeParse(parsed);
      return valid.success ? valid.data : null;
    } catch {
      return null;
    }
  }, [storedJson]);

  const [overrideLocation, setOverrideLocation] = useState<GeoLocation | null>(null);
  const selectedLocation = overrideLocation ?? initialLocation;

  const [activeStandardOverride, setActiveStandardOverride] = useState<AqiStandardKey | undefined>(undefined);
  const [rawAirQuality, setRawAirQuality] = useState<RawOpenMeteoAirQualityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state computed during render
  const report = useMemo(() => {
    if (!rawAirQuality || !selectedLocation) return null;
    return normalizeAirQualityReport(
      rawAirQuality,
      selectedLocation,
      activeStandardOverride
    );
  }, [rawAirQuality, selectedLocation, activeStandardOverride]);

  // Fetch air quality telemetry when selectedLocation changes
  useEffect(() => {
    if (!selectedLocation) return;

    let isCancelled = false;
    const loc = selectedLocation;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const url = `/api/air-quality?latitude=${loc.latitude}&longitude=${loc.longitude}&timezone=${encodeURIComponent(
          loc.timezone || 'auto'
        )}`;

        const res = await fetch(url);
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `Server responded with status ${res.status}`);
        }

        const rawData: RawOpenMeteoAirQualityResponse = await res.json();
        if (!isCancelled) {
          setRawAirQuality(rawData);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
          } catch {
            // Ignore localStorage write failure
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Unable to retrieve environmental telemetry for this coordinate.');
          setRawAirQuality(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [selectedLocation]);

  const handleSelectLocation = useCallback((loc: GeoLocation) => {
    setOverrideLocation(loc);
    setActiveStandardOverride(undefined); // Reset to intelligent geographic default for new location
  }, []);

  const handleSwitchStandard = useCallback((standard: AqiStandardKey) => {
    setActiveStandardOverride(standard);
  }, []);

  const handleRetry = useCallback(() => {
    if (selectedLocation) {
      setOverrideLocation({ ...selectedLocation });
    }
  }, [selectedLocation]);

  return (
    <div className="w-full space-y-6">
      {/* 1. Global City Search & Location Selector */}
      <LocationSearch
        onSelectLocation={handleSelectLocation}
        selectedLocation={selectedLocation}
        isLoading={isLoading}
      />

      {/* Loading Skeletons */}
      {isLoading && (
        <div aria-busy="true" aria-label="Acquiring atmospheric telemetry..." className="space-y-4">
          <div className="h-44 sm:h-52 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] animate-pulse"
              />
            ))}
          </div>
          <div className="h-32 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] animate-pulse" />
        </div>
      )}

      {/* Error State with Manual Retry */}
      {!isLoading && error && (
        <div
          role="alert"
          className="rounded-lg border border-[var(--aqi-unhealthy-border)] bg-[var(--aqi-unhealthy-bg)] p-5 text-center"
        >
          <span className="text-xl font-mono" aria-hidden="true">
            ⚠️
          </span>
          <h3 className="text-sm font-bold font-mono text-[var(--aqi-unhealthy)] mt-1.5 uppercase tracking-wide">
            Atmospheric Telemetry Offline
          </h3>
          <p className="text-xs text-[var(--ink-secondary)] mt-1 max-w-md mx-auto">
            {error}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-3 px-3.5 py-1.5 rounded-md bg-[var(--brand-primary)] text-white text-xs font-mono font-bold shadow-xs hover:bg-[var(--brand-hover)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-primary)]"
          >
            RECONNECT SENSOR FEED
          </button>
        </div>
      )}

      {/* Initial Welcome Discovery State (No location selected yet) */}
      {!isLoading && !error && !selectedLocation && (
        <section
          aria-labelledby="welcome-discovery-heading"
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 sm:p-10 text-center shadow-xs"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--brand-surface)] text-xl text-[var(--brand-primary)] border border-[var(--border-subtle)] mb-3 shadow-xs font-mono">
            🌍
          </div>
          <h3
            id="welcome-discovery-heading"
            className="text-lg sm:text-xl font-extrabold text-[var(--ink-primary)] tracking-tight font-sans"
          >
            Futuristic Environmental Intelligence
          </h3>
          <p className="mt-1.5 text-xs text-[var(--ink-secondary)] max-w-lg mx-auto leading-relaxed">
            Real-time atmospheric telemetry across 6 core criteria pollutants, 24-hour predictive
            modelling, and transparent open-science standards for any location on Earth.
          </p>
          <p className="mt-3 text-[11px] font-mono font-bold text-[var(--ink-muted)] uppercase tracking-wider">
            Enter a city name above or select a preset to initialize telemetry.
          </p>
        </section>
      )}

      {/* Main Environmental Intelligence Content */}
      {!isLoading && !error && report && (
        <div className="space-y-6 animate-fadeIn">
          {/* 2. Prominent Current AQI Hero Section */}
          <AqiHeroCard
            report={report}
            onSwitchStandard={handleSwitchStandard}
            isLoading={isLoading}
          />

          {/* 3. Six Criteria Pollutant Telemetry Cards */}
          <PollutantGrid
            pollutants={report.pollutants}
            activeStandard={report.activeStandard}
          />

          {/* 4. 24-Hour Telemetry Forecast */}
          <ForecastTimeline
            forecast={report.forecast}
            activeStandard={report.activeStandard}
          />

          {/* 5. Scientific Grounding & Multi-Standard Calibration */}
          <ScientificGrounding report={report} />

          {/* 6. Source Attribution & Data Provenance */}
          <ProvenanceFooter report={report} />
        </div>
      )}
    </div>
  );
}
