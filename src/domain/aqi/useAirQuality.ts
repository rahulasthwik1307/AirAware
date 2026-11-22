'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useSyncExternalStore,
  createContext,
  useContext,
  useRef,
} from 'react';
import { z } from 'zod';
import { AirQualityReport, AqiStandardKey, GeoLocation } from '@/domain/types';
import { normalizeAirQualityReport, RawOpenMeteoAirQualityResponse } from './normalizer';
import { WeatherData } from '@/app/api/weather/route';
import { TELEMETRY_CACHE_TTL_MS, TELEMETRY_FETCH_TIMEOUT_MS } from '../constants/telemetry';

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
const CACHE_TTL_MS = TELEMETRY_CACHE_TTL_MS;

export const USER_FRIENDLY_TELEMETRY_ERROR =
  "Couldn't reach the air-quality service. Check your connection and retry.";

export function isSameLocation(
  a: GeoLocation | null | undefined,
  b: GeoLocation | null | undefined
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.name === b.name &&
    Math.abs(a.latitude - b.latitude) < 0.0001 &&
    Math.abs(a.longitude - b.longitude) < 0.0001
  );
}

export function isAbortError(err: unknown): boolean {
  if (!err) return false;
  if (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError') {
    return true;
  }
  if (err instanceof Error) {
    return err.name === 'AbortError' || err.message.toLowerCase().includes('abort');
  }
  return false;
}

export interface TelemetryData {
  readonly rawAirQuality: RawOpenMeteoAirQualityResponse;
  readonly weather: WeatherData | null;
}

export interface CacheEntry extends TelemetryData {
  readonly timestamp: number;
}

// Module-level global singletons for cross-component SWR cache & in-flight deduplication
export const telemetryCache = new Map<string, CacheEntry>();
export const inFlightRequests = new Map<string, Promise<TelemetryData>>();

export function getTelemetryCacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
}

/**
 * Shared in-flight deduplicated telemetry fetcher with 10-minute client caching.
 * @param location - Target location.
 * @param options - Optional flags (e.g. forceRefresh).
 * @returns Promise resolving raw air quality and weather telemetry. Never throws unhandled network errors.
 */
export function fetchSharedTelemetry(
  location: GeoLocation,
  options?: { forceRefresh?: boolean }
): Promise<TelemetryData> {
  const cacheKey = getTelemetryCacheKey(location.latitude, location.longitude);

  if (!options?.forceRefresh) {
    const cached = telemetryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return Promise.resolve({ rawAirQuality: cached.rawAirQuality, weather: cached.weather });
    }
  }

  const existingInFlight = inFlightRequests.get(cacheKey);
  if (existingInFlight && !options?.forceRefresh) {
    return existingInFlight;
  }

  let timedOut = false;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TELEMETRY_FETCH_TIMEOUT_MS);

  const aqiUrl = `/api/air-quality?latitude=${location.latitude}&longitude=${location.longitude}&timezone=${encodeURIComponent(
    location.timezone || 'auto'
  )}`;
  const weatherUrl = `/api/weather?latitude=${location.latitude}&longitude=${location.longitude}&timezone=${encodeURIComponent(
    location.timezone || 'auto'
  )}`;

  const fetchPromise = Promise.all([
    fetch(aqiUrl, { signal: controller.signal }),
    fetch(weatherUrl, { signal: controller.signal }).catch(() => null),
  ])
    .then(async ([aqiRes, weatherRes]) => {
      clearTimeout(timeoutId);
      if (!aqiRes.ok) {
        const errJson = await aqiRes.json().catch(() => ({}));
        throw new Error(errJson.error || `Air Quality API responded with ${aqiRes.status}`);
      }

      const rawAqiData = await aqiRes.json();
      const rawAqi: RawOpenMeteoAirQualityResponse = {
        ...rawAqiData,
        queryCacheKey: cacheKey,
      };
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
    .catch((err: unknown) => {
      clearTimeout(timeoutId);
      if (timedOut) {
        throw new Error('Connection timed out while fetching air-quality telemetry');
      }
      throw err;
    })
    .finally(() => {
      clearTimeout(timeoutId);
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

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

  const storedLocation = useMemo<GeoLocation | null>(() => {
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

  // Sync external storage changes (e.g. from other tabs or direct localStorage changes)
  // only if different from current overrideLocation to avoid redundant render loops
  useEffect(() => {
    if (storedLocation && (!overrideLocation || !isSameLocation(storedLocation, overrideLocation))) {
      setOverrideLocation(storedLocation);
    }
  }, [storedLocation, overrideLocation]);

  const location = overrideLocation ?? storedLocation ?? DEFAULT_LOCATION;

  const [activeStandard, setActiveStandard] = useState<AqiStandardKey | undefined>(standardOverride);
  const [rawAirQuality, setRawAirQuality] = useState<RawOpenMeteoAirQualityResponse | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const latestRequestIdRef = useRef(0);

  // SWR-style telemetry loading with latest-wins deduplication
  useEffect(() => {
    if (!location) return;

    const requestId = ++latestRequestIdRef.current;
    const cacheKey = `${location.latitude.toFixed(2)}_${location.longitude.toFixed(2)}`;
    const cached = telemetryCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS && fetchTrigger === 0) {
      setRawAirQuality(cached.rawAirQuality);
      setWeather(cached.weather);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchSharedTelemetry(location, { forceRefresh: fetchTrigger > 0 })
      .then((data) => {
        // Latest-wins guard: discard response if a newer location request was initiated
        if (requestId !== latestRequestIdRef.current) {
          return;
        }
        setRawAirQuality(data.rawAirQuality);
        setWeather(data.weather);
        setIsLoading(false);
        setError(null);
      })
      .catch((err: unknown) => {
        // Latest-wins guard: ignore errors from superseded requests
        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        // Never surface AbortError as an error state
        if (isAbortError(err)) {
          return;
        }

        // Real failure (network, HTTP error, timeout) -> show friendly human error
        setError(USER_FRIENDLY_TELEMETRY_ERROR);
        setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.id, location.latitude, location.longitude, location.timezone, fetchTrigger]);

  const report = useMemo(() => {
    if (!rawAirQuality || !location) return null;
    // Exact match on rounded cache key so stale data from another place can never render under a new city name
    const rawKey = rawAirQuality.queryCacheKey ?? getTelemetryCacheKey(rawAirQuality.latitude, rawAirQuality.longitude);
    const locKey = getTelemetryCacheKey(location.latitude, location.longitude);
    if (rawKey !== locKey) {
      return null;
    }
    return normalizeAirQualityReport(rawAirQuality, location, activeStandard);
  }, [rawAirQuality, location, activeStandard]);

  const setLocation = useCallback((loc: GeoLocation) => {
    setOverrideLocation((prev) => (isSameLocation(prev, loc) ? prev : loc));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
      window.dispatchEvent(new CustomEvent(LOCATION_CHANGED_EVENT));
    } catch {
      // LocalStorage write fallback
    }

    const cacheKey = `${loc.latitude.toFixed(2)}_${loc.longitude.toFixed(2)}`;
    const cached = telemetryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setRawAirQuality(cached.rawAirQuality);
      setWeather(cached.weather);
      setIsLoading(false);
      setError(null);
    } else {
      // Clear mismatched old data immediately so UI shows clean loading skeleton
      setRawAirQuality(null);
      setWeather(null);
      setIsLoading(true);
      setError(null);
    }
  }, []);

  const refetch = useCallback(() => {
    if (location) {
      const cacheKey = `${location.latitude.toFixed(2)}_${location.longitude.toFixed(2)}`;
      telemetryCache.delete(cacheKey);
      inFlightRequests.delete(cacheKey);
    }
    setFetchTrigger((prev) => prev + 1);
  }, [location]);

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

/**
 * Primary reactive hook consuming the single source of truth for location and telemetry.
 * @returns Reactive UseAirQualityReturn state with location, report, weather, and setters. Never executes outside AirQualityProvider.
 */
export function useAirQuality(): UseAirQualityReturn {
  const context = useContext(AirQualityContext);
  if (!context) {
    throw new Error('useAirQuality must be used within an AirQualityProvider');
  }
  return context;
}

