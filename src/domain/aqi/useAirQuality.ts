'use client';

import React, { useState, useEffect, useMemo, useCallback, useSyncExternalStore, createContext, useContext } from 'react';
import { z } from 'zod';
import { AirQualityReport, AqiStandardKey, GeoLocation } from '@/domain/types';
import { normalizeAirQualityReport, RawOpenMeteoAirQualityResponse } from './normalizer';
import { WeatherData } from '@/app/api/weather/route';

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

export const DEFAULT_LOCATION: GeoLocation = {
  id: 1273294,
  name: 'New Delhi',
  country: 'India',
  countryCode: 'IN',
  admin1: 'Delhi',
  latitude: 28.6139,
  longitude: 77.209,
  timezone: 'Asia/Kolkata',
};

const STORAGE_KEY = 'airaware_last_location';
const LOCATION_CHANGED_EVENT = 'airaware_location_changed';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15-minute SWR caching

interface CacheEntry {
  readonly rawAirQuality: RawOpenMeteoAirQualityResponse;
  readonly weather: WeatherData | null;
  readonly timestamp: number;
}

// Module-level global singletons for cross-component SWR cache & in-flight deduplication
const telemetryCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<
  string,
  Promise<{ rawAirQuality: RawOpenMeteoAirQualityResponse; weather: WeatherData | null }>
>();

function subscribeToLocationStorage(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener(LOCATION_CHANGED_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(LOCATION_CHANGED_EVENT, callback);
  };
}

function getStoredLocationSnapshot(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerLocationSnapshot(): null {
  return null;
}

export interface UseAirQualityReturn {
  readonly location: GeoLocation | null;
  readonly report: AirQualityReport | null;
  readonly weather: WeatherData | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly setLocation: (loc: GeoLocation) => void;
  readonly refetch: () => void;
  readonly activeStandard?: AqiStandardKey;
  readonly setActiveStandard: (std: AqiStandardKey) => void;
}

const AirQualityContext = createContext<UseAirQualityReturn | null>(null);

function useAirQualityState(standardOverride?: AqiStandardKey): UseAirQualityReturn {
  const storedJson = useSyncExternalStore(
    subscribeToLocationStorage,
    getStoredLocationSnapshot,
    getServerLocationSnapshot
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

  useEffect(() => {
    if (initialLocation) {
      setOverrideLocation(initialLocation);
    }
  }, [initialLocation]);

  const location = overrideLocation ?? initialLocation ?? DEFAULT_LOCATION;

  const [activeStandard, setActiveStandard] = useState<AqiStandardKey | undefined>(standardOverride);
  const [rawAirQuality, setRawAirQuality] = useState<RawOpenMeteoAirQualityResponse | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const cacheKey = useMemo(() => {
    if (!location) return '';
    return `${location.latitude.toFixed(2)}_${location.longitude.toFixed(2)}`;
  }, [location]);

  // SWR-style telemetry loading with deduplication
  useEffect(() => {
    if (!location || !cacheKey) return;

    const cached = telemetryCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL_MS && fetchTrigger === 0) {
      setRawAirQuality(cached.rawAirQuality);
      setWeather(cached.weather);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isAborted = false;
    const abortController = new AbortController();

    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        let promise = inFlightRequests.get(cacheKey);

        if (!promise) {
          const aqiUrl = `/api/air-quality?latitude=${location!.latitude}&longitude=${location!.longitude}&timezone=${encodeURIComponent(
            location!.timezone || 'auto'
          )}`;
          const weatherUrl = `/api/weather?latitude=${location!.latitude}&longitude=${location!.longitude}&timezone=${encodeURIComponent(
            location!.timezone || 'auto'
          )}`;

          promise = Promise.all([
            fetch(aqiUrl, { signal: abortController.signal }),
            fetch(weatherUrl, { signal: abortController.signal }).catch(() => null),
          ])
            .then(async ([aqiRes, weatherRes]) => {
              if (!aqiRes.ok) {
                const errJson = await aqiRes.json().catch(() => ({}));
                throw new Error(errJson.error || `Air Quality API responded with ${aqiRes.status}`);
              }

              const rawAqi: RawOpenMeteoAirQualityResponse = await aqiRes.json();
              let wData: WeatherData | null = null;
              if (weatherRes && weatherRes.ok) {
                wData = await weatherRes.json().catch(() => null);
              }

              telemetryCache.set(cacheKey, {
                rawAirQuality: rawAqi,
                weather: wData,
                timestamp: Date.now(),
              });

              return { rawAirQuality: rawAqi, weather: wData };
            })
            .finally(() => {
              inFlightRequests.delete(cacheKey);
            });

          inFlightRequests.set(cacheKey, promise);
        }

        const result = await promise;

        if (!isAborted) {
          setRawAirQuality(result.rawAirQuality);
          setWeather(result.weather);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!isAborted) {
          const msg = err instanceof Error ? err.message : 'Failed to fetch environmental data';
          setError(msg);
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isAborted = true;
      abortController.abort();
    };
  }, [location, cacheKey, fetchTrigger]);

  const report = useMemo(() => {
    if (!rawAirQuality || !location) return null;
    return normalizeAirQualityReport(rawAirQuality, location, activeStandard);
  }, [rawAirQuality, location, activeStandard]);

  const setLocation = useCallback((loc: GeoLocation) => {
    setOverrideLocation(loc);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
      window.dispatchEvent(new CustomEvent(LOCATION_CHANGED_EVENT));
    } catch {
      // LocalStorage write fallback
    }
  }, []);

  const refetch = useCallback(() => {
    if (cacheKey) {
      telemetryCache.delete(cacheKey);
    }
    setFetchTrigger((prev) => prev + 1);
  }, [cacheKey]);

  return {
    location,
    report,
    weather,
    isLoading,
    error,
    setLocation,
    refetch,
    activeStandard,
    setActiveStandard,
  };
}

export function AirQualityProvider({ children }: { readonly children: React.ReactNode }) {
  const value = useAirQualityState();
  return React.createElement(AirQualityContext.Provider, { value }, children);
}

export function useAirQuality(): UseAirQualityReturn {
  const context = useContext(AirQualityContext);
  if (!context) {
    throw new Error('useAirQuality must be used within an AirQualityProvider');
  }
  return context;
}
