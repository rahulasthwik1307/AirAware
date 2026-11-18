'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, useSyncExternalStore } from 'react';
import { z } from 'zod';
import { AqiStandardKey, GeoLocation } from '@/domain/types';
import { normalizeAirQualityReport, RawOpenMeteoAirQualityResponse } from '@/domain/aqi/normalizer';
import { WeatherData } from '@/app/api/weather/route';
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

interface CacheEntry {
  readonly rawAirQuality: RawOpenMeteoAirQualityResponse;
  readonly weather: WeatherData | null;
  readonly timestamp: number;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes client cache

export function AirQualityDashboard() {
  // Read cached location using React's official useSyncExternalStore (zero SSR mismatch)
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
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In-memory request deduplication and response cache
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  // Derived state computed during render
  const report = useMemo(() => {
    if (!rawAirQuality || !selectedLocation) return null;
    return normalizeAirQualityReport(
      rawAirQuality,
      selectedLocation,
      activeStandardOverride
    );
  }, [rawAirQuality, selectedLocation, activeStandardOverride]);

  // Fetch telemetry & weather in parallel with caching and AbortController
  useEffect(() => {
    if (!selectedLocation) return;

    const loc = selectedLocation;
    const cacheKey = `${loc.latitude.toFixed(2)}_${loc.longitude.toFixed(2)}`;

    // Check in-memory cache first for instant navigation without network hit
    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      setRawAirQuality(cached.rawAirQuality);
      setWeatherData(cached.weather);
      setIsLoading(false);
      setError(null);
      return;
    }

    const abortController = new AbortController();

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const aqiUrl = `/api/air-quality?latitude=${loc.latitude}&longitude=${loc.longitude}&timezone=${encodeURIComponent(
          loc.timezone || 'auto'
        )}`;

        const weatherUrl = `/api/weather?latitude=${loc.latitude}&longitude=${loc.longitude}&timezone=${encodeURIComponent(
          loc.timezone || 'auto'
        )}`;

        // Parallel non-waterfall data fetching
        const [aqiRes, weatherRes] = await Promise.all([
          fetch(aqiUrl, { signal: abortController.signal }),
          fetch(weatherUrl, { signal: abortController.signal }).catch(() => null),
        ]);

        if (!aqiRes.ok) {
          const errJson = await aqiRes.json().catch(() => ({}));
          throw new Error(errJson.error || `Server responded with status ${aqiRes.status}`);
        }

        const rawData: RawOpenMeteoAirQualityResponse = await aqiRes.json();
        let wData: WeatherData | null = null;
        if (weatherRes && weatherRes.ok) {
          wData = await weatherRes.json().catch(() => null);
        }

        if (!abortController.signal.aborted) {
          setRawAirQuality(rawData);
          setWeatherData(wData);

          // Store in in-memory cache
          cacheRef.current.set(cacheKey, {
            rawAirQuality: rawData,
            weather: wData,
            timestamp: Date.now(),
          });

          // Persist current location to localStorage
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
          } catch {
            // Ignore localStorage write quota/permission errors
          }
        }
      } catch (err: any) {
        if (!abortController.signal.aborted) {
          setError(err.message || 'Unable to retrieve environmental telemetry for this coordinate.');
          setRawAirQuality(null);
          setWeatherData(null);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      abortController.abort();
    };
  }, [selectedLocation]);

  const handleSelectLocation = useCallback((loc: GeoLocation) => {
    setOverrideLocation(loc);
    setActiveStandardOverride(undefined); // Reset to geographic default for new location
  }, []);

  const handleSwitchStandard = useCallback((standard: AqiStandardKey) => {
    setActiveStandardOverride(standard);
  }, []);

  const handleRetry = useCallback(() => {
    if (selectedLocation) {
      // Invalidate cache on manual retry to force fresh fetch
      const cacheKey = `${selectedLocation.latitude.toFixed(2)}_${selectedLocation.longitude.toFixed(2)}`;
      cacheRef.current.delete(cacheKey);
      setOverrideLocation({ ...selectedLocation });
    }
  }, [selectedLocation]);

  return (
    <div className="w-full space-y-7">
      {/* 1. Global City Search & Location Selector */}
      <LocationSearch
        onSelectLocation={handleSelectLocation}
        selectedLocation={selectedLocation}
        isLoading={isLoading}
      />

      {/* Loading Skeletons */}
      {isLoading && (
        <div aria-busy="true" aria-label="Acquiring atmospheric telemetry..." className="space-y-4">
          <div className="h-56 sm:h-64 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] animate-pulse"
              />
            ))}
          </div>
          <div className="h-36 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] animate-pulse" />
        </div>
      )}

      {/* Error State with Manual Retry */}
      {!isLoading && error && (
        <div
          role="alert"
          className="rounded-xl border border-[var(--aqi-unhealthy-border)] bg-[var(--aqi-unhealthy-bg)] p-6 text-center shadow-xs"
        >
          <span className="text-2xl select-none" aria-hidden="true">
            ⚠️
          </span>
          <h3 className="text-sm font-bold font-mono text-[var(--aqi-unhealthy)] mt-2 uppercase tracking-wide">
            Atmospheric Telemetry Offline
          </h3>
          <p className="text-xs text-[var(--ink-secondary)] mt-1.5 max-w-md mx-auto">
            {error}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-3.5 px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-xs font-mono font-bold shadow-xs hover:bg-[var(--brand-hover)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          >
            Reconnect Sensor Feed
          </button>
        </div>
      )}

      {/* Initial Welcome Discovery State (No location selected yet) */}
      {!isLoading && !error && !selectedLocation && (
        <section
          aria-labelledby="welcome-discovery-heading"
          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-8 sm:p-12 text-center shadow-sm"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-surface)] text-3xl border border-[var(--border-subtle)] mb-4 shadow-xs">
            🌍
          </div>
          <h3
            id="welcome-discovery-heading"
            className="text-xl sm:text-2xl font-extrabold text-[var(--ink-primary)] tracking-tight font-sans"
          >
            Global Environmental Intelligence
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-[var(--ink-secondary)] max-w-xl mx-auto leading-relaxed">
            Real-time atmospheric telemetry across 6 criteria pollutants, 24-hour predictive
            modelling, interactive 3D Earth projection, and transparent public science standards.
          </p>
          <p className="mt-4 text-xs font-mono font-bold text-[var(--brand-primary)] uppercase tracking-wider">
            Enter a city name above or select a preset to initialize telemetry.
          </p>
        </section>
      )}

      {/* Main Environmental Intelligence Content */}
      {!isLoading && !error && report && (
        <div className="space-y-7 animate-fadeIn">
          {/* 2. Signature Asymmetric Hero: Primary Telemetry + Interactive Earth Globe */}
          <AqiHeroCard
            report={report}
            weather={weatherData}
            onSwitchStandard={handleSwitchStandard}
            onSelectLocation={handleSelectLocation}
            isLoading={isLoading}
          />

          {/* 3. Six Criteria Pollutant Telemetry Cards */}
          <PollutantGrid
            pollutants={report.pollutants}
            activeStandard={report.activeStandard}
          />

          {/* 4. 24-Hour Telemetry Forecast with Interactive Hourly Inspection */}
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
