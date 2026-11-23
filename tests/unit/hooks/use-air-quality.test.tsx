// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useAirQuality,
  AirQualityProvider,
  telemetryCache,
  inFlightRequests,
  USER_FRIENDLY_TELEMETRY_ERROR,
} from '@/domain/aqi/useAirQuality';
import { GeoLocation } from '@/domain/types';

describe('useAirQuality Hook Telemetry Contract', () => {
  const originalFetch = globalThis.fetch;

  const locMumbai: GeoLocation = {
    id: 1275339,
    name: 'Mumbai',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Maharashtra',
    latitude: 19.076,
    longitude: 72.8777,
    timezone: 'Asia/Kolkata',
  };

  const createMockAqiResponse = (lat: number, lon: number, pm25: number) => ({
    latitude: lat,
    longitude: lon,
    generationtime_ms: 0.5,
    utc_offset_seconds: 19800,
    timezone: 'Asia/Kolkata',
    timezone_abbreviation: 'IST',
    elevation: 216,
    current: {
      time: '2026-11-23T10:00',
      interval: 3600,
      pm2_5: pm25,
      pm10: pm25 * 1.5,
      us_aqi: pm25 * 2,
    },
    hourly: {
      time: ['2026-11-23T10:00', '2026-11-23T11:00'],
      pm2_5: [pm25, pm25 - 5],
      pm10: [pm25 * 1.5, (pm25 - 5) * 1.5],
      us_aqi: [pm25 * 2, (pm25 - 5) * 2],
    },
    sourceType: 'model' as const,
  });

  const createMockWeatherResponse = () => ({
    temperature: 24,
    apparentTemperature: 25,
    relativeHumidity: 50,
    windSpeed: 10,
    windDirection: 180,
    surfacePressure: 1012,
    visibilityMeters: 5000,
    uvIndex: 4,
    boundaryLayerHeightMeters: 800,
    pblHeight: 800,
    inversionStrength: 'NONE',
    stagnationIndex: 20,
    ventilationIndex: 8000,
    weatherCode: 0,
    ventilationCategory: 'GOOD',
    isStagnant: false,
    ventilationDescription: 'Good dispersion',
    airMassOrigin: 'LOCAL',
    timestamp: '2026-11-23T10:00:00Z',
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AirQualityProvider>{children}</AirQualityProvider>
  );

  beforeEach(() => {
    localStorage.clear();
    telemetryCache.clear();
    inFlightRequests.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('updates data on ONE call when location changes', async () => {
    let fetchCallCount = 0;
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      fetchCallCount++;
      if (url.includes('/api/air-quality')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => createMockAqiResponse(28.61, 77.21, 65),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => createMockWeatherResponse(),
      } as Response);
    });

    const { result } = renderHook(() => useAirQuality(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.report).not.toBeNull();
    });

    const callsAfterDelhi = fetchCallCount;
    expect(callsAfterDelhi).toBeGreaterThan(0);

    // Switch location to Mumbai
    act(() => {
      result.current.setLocation(locMumbai);
    });

    await waitFor(() => {
      expect(result.current.location?.name).toBe('Mumbai');
      expect(result.current.report?.location.name).toBe('Mumbai');
    });

    // Verify it fetched Mumbai telemetry
    expect(fetchCallCount).toBeGreaterThan(callsAfterDelhi);
  });

  it('latest-wins: ignores a slower earlier request when a newer location resolves first', async () => {
    let resolveDelhi: (value: Response) => void;
    const delhiPromise = new Promise<Response>((resolve) => {
      resolveDelhi = resolve;
    });

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('latitude=28.6139')) {
        // Slow Delhi response
        return delhiPromise;
      }
      // Fast Mumbai response
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () =>
          url.includes('/api/air-quality')
            ? createMockAqiResponse(19.076, 72.8777, 42)
            : createMockWeatherResponse(),
      } as Response);
    });

    const { result } = renderHook(() => useAirQuality(), { wrapper });

    // Immediately switch to Mumbai while Delhi is still in flight
    act(() => {
      result.current.setLocation(locMumbai);
    });

    // Mumbai should complete and render
    await waitFor(() => {
      expect(result.current.report?.location.name).toBe('Mumbai');
      expect(result.current.report?.pollutants.pm2_5.concentration).toBe(42);
    });

    // Now resolve the late Delhi response
    act(() => {
      resolveDelhi!({
        ok: true,
        status: 200,
        json: async () => createMockAqiResponse(28.6139, 77.209, 180),
      } as Response);
    });

    // Wait a tick and verify state was NOT overwritten by late Delhi response
    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.report?.location.name).toBe('Mumbai');
    expect(result.current.report?.pollutants.pm2_5.concentration).toBe(42);
  });

  it('does not display an error when a request is aborted', async () => {
    globalThis.fetch = vi.fn().mockImplementation(() => {
      const abortError = new DOMException('The user aborted a request.', 'AbortError');
      return Promise.reject(abortError);
    });

    const { result } = renderHook(() => useAirQuality(), { wrapper });

    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.error).toBeNull();
  });

  it('displays user-friendly error message on a real network failure', async () => {
    globalThis.fetch = vi.fn().mockImplementation(() => {
      return Promise.reject(new Error('Connection reset by peer'));
    });

    const { result } = renderHook(() => useAirQuality(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe(USER_FRIENDLY_TELEMETRY_ERROR);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
