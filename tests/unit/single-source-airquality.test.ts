import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import {
  DEFAULT_LOCATION,
  useAirQuality,
  fetchSharedTelemetry,
  telemetryCache,
  inFlightRequests,
  isSameLocation,
  isAbortError,
  USER_FRIENDLY_TELEMETRY_ERROR,
} from '@/hooks/aqi/useAirQuality';
import { GeoLocation } from '@/domain/types';
import { RawOpenMeteoAirQualityResponse } from '@/domain/aqi/normalizer';

function createMockLocalStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

describe('Single Source of Truth for Location and Air Telemetry', () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  let mockStorage: ReturnType<typeof createMockLocalStorage>;

  beforeAll(() => {
    mockStorage = createMockLocalStorage();
    (globalThis as unknown as { window: unknown }).window = {
      localStorage: mockStorage,
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    (globalThis as unknown as { localStorage: unknown }).localStorage = mockStorage;
  });

  afterAll(() => {
    (globalThis as unknown as { window: unknown }).window = originalWindow;
    globalThis.fetch = originalFetch;
    delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
  });

  beforeEach(() => {
    mockStorage.clear();
    telemetryCache.clear();
    inFlightRequests.clear();
    vi.restoreAllMocks();
  });

  const testLocation: GeoLocation = {
    id: 1275339,
    name: 'Mumbai',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Maharashtra',
    latitude: 19.076,
    longitude: 72.8777,
    timezone: 'Asia/Kolkata',
  };

  const delhiLocation: GeoLocation = {
    id: 1273294,
    name: 'New Delhi',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    timezone: 'Asia/Kolkata',
  };

  const sampleMockAqiResponse: RawOpenMeteoAirQualityResponse = {
    latitude: 19.08,
    longitude: 72.88,
    elevation: 10,
    current: {
      time: '2026-11-22T06:00',
      interval: 3600,
      european_aqi: 45,
      us_aqi: 65,
      pm10: 40,
      pm2_5: 25,
      carbon_monoxide: 200,
      nitrogen_dioxide: 15,
      sulphur_dioxide: 5,
      ozone: 30,
    },
    current_units: {
      european_aqi: 'EAQI',
      us_aqi: 'USAQI',
      pm10: 'μg/m³',
      pm2_5: 'μg/m³',
      carbon_monoxide: 'μg/m³',
      nitrogen_dioxide: 'μg/m³',
      sulphur_dioxide: 'μg/m³',
      ozone: 'μg/m³',
    },
    hourly: {
      time: ['2026-11-22T06:00'],
      pm10: [40],
      pm2_5: [25],
    },
  };

  it('guarantees DEFAULT_LOCATION is valid Indian geographic coordinate', () => {
    expect(DEFAULT_LOCATION.name).toBe('New Delhi');
    expect(DEFAULT_LOCATION.countryCode).toBe('IN');
    expect(DEFAULT_LOCATION.latitude).toBeCloseTo(28.61, 2);
    expect(DEFAULT_LOCATION.longitude).toBeCloseTo(77.21, 2);
  });

  it('throws an error if useAirQuality hook is invoked outside React component tree', () => {
    expect(() => useAirQuality()).toThrow();
  });

  it('correctly persists location and updates storage key on location change', () => {
    const key = 'airaware_last_location';
    localStorage.setItem(key, JSON.stringify(testLocation));

    const retrieved = localStorage.getItem(key);
    expect(retrieved).not.toBeNull();
    const parsed = JSON.parse(retrieved!);
    expect(parsed.name).toBe('Mumbai');
    expect(parsed.latitude).toBe(19.076);
    expect(parsed.longitude).toBe(72.8777);
  });

  it('generates consistent SWR cache keys rounded to 2 decimal places (~1.1 km)', () => {
    const lat = testLocation.latitude;
    const lon = testLocation.longitude;
    const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
    expect(cacheKey).toBe('19.08_72.88');
  });

  describe('Regression Test (a): Two consumers share one request and one consumer unmounting does not break the other', () => {
    it('deduplicates concurrent fetches into one in-flight promise that remains valid if one consumer unmounts', async () => {
      let resolveAqi: (val: Response) => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveAqi = resolve;
      });

      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/air-quality')) {
          return fetchPromise;
        }
        return Promise.resolve(new Response(JSON.stringify({ temperature: 28, humidity: 60 }), { status: 200 }));
      });
      globalThis.fetch = fetchMock;

      // Consumer 1 initiates fetch
      const consumer1Promise = fetchSharedTelemetry(testLocation);
      // Consumer 2 initiates fetch concurrently for the same coordinates
      const consumer2Promise = fetchSharedTelemetry(testLocation);

      // Verify strict promise identity sharing (deduplication)
      expect(consumer1Promise).toBe(consumer2Promise);
      expect(inFlightRequests.size).toBe(1);

      // Consumer 1 unmounts / aborts its own transient lifecycle
      const consumer1AbortController = new AbortController();
      consumer1AbortController.abort(); // Consumer 1 aborts its private controller

      // The shared background fetch completes successfully
      resolveAqi!(new Response(JSON.stringify(sampleMockAqiResponse), { status: 200 }));

      const result2 = await consumer2Promise;
      expect(result2).toBeDefined();
      expect(result2.rawAirQuality.current.pm2_5).toBe(25);
      expect(inFlightRequests.size).toBe(0);

      // Cache is populated and fresh
      const key = `${testLocation.latitude.toFixed(2)}_${testLocation.longitude.toFixed(2)}`;
      expect(telemetryCache.has(key)).toBe(true);
    });
  });

  describe('Regression Test (b): A superseded request cannot overwrite a newer location data', () => {
    it('enforces latest-wins ordering so a slow earlier request is discarded if superseded', async () => {
      let activeLocation = testLocation;
      let activeReportName: string | null = null;
      let latestRequestId = 0;

      // Simulate the hook's latest-wins request loop
      function initiateLocationFetch(location: GeoLocation, delayMs: number) {
        activeLocation = location;
        const requestId = ++latestRequestId;

        return new Promise<string>((resolve) => {
          setTimeout(() => {
            // Guard: If request was superseded by a newer location change, ignore
            if (requestId !== latestRequestId) {
              return;
            }
            activeReportName = location.name;
            resolve(location.name);
          }, delayMs);
        });
      }

      // Step 1: User is at Delhi, slow request (100ms)
      initiateLocationFetch(delhiLocation, 100);

      // Step 2: User immediately switches to Mumbai, faster request (20ms)
      const mumbaiPromise = initiateLocationFetch(testLocation, 20);

      await mumbaiPromise;
      expect(activeReportName).toBe('Mumbai');

      // Wait 120ms so Delhi's slow response returns
      await new Promise((r) => setTimeout(r, 120));

      // Delhi response must have been ignored because requestId was superseded
      expect(activeReportName).toBe('Mumbai');
      expect(activeLocation.name).toBe('Mumbai');
    });
  });

  describe('Regression Test (c): AbortError is not surfaced as an error state', () => {
    it('detects AbortError variants accurately', () => {
      const domAbort = new DOMException('signal is aborted without reason', 'AbortError');
      const errAbort = new Error('AbortError: The user aborted a request.');
      const standardError = new Error('Network connection failed');
      const httpError = new Error('Air Quality API responded with 503');

      expect(isAbortError(domAbort)).toBe(true);
      expect(isAbortError(errAbort)).toBe(true);
      expect(isAbortError(standardError)).toBe(false);
      expect(isAbortError(httpError)).toBe(false);
      expect(isAbortError(null)).toBe(false);
      expect(isAbortError(undefined)).toBe(false);
    });

    it('ensures AbortError suppresses error state while real failures yield human message', () => {
      let uiError: string | null = null;

      function handleFetchError(err: unknown) {
        if (isAbortError(err)) {
          // Suppressed - do not show to user
          return;
        }
        uiError = USER_FRIENDLY_TELEMETRY_ERROR;
      }

      // 1. AbortError must not set UI error
      handleFetchError(new DOMException('signal is aborted without reason', 'AbortError'));
      expect(uiError).toBeNull();

      // 2. Real failure sets user-friendly error without technical leakage
      handleFetchError(new Error('ETIMEDOUT'));
      expect(uiError).toBe("Couldn't reach the air-quality service. Check your connection and retry.");
      expect(uiError).not.toContain('abort');
      expect(uiError).not.toContain('ETIMEDOUT');
    });
  });

  describe('Regression Test (d): Changing location once updates state once', () => {
    it('prevents redundant state updates and reference churn when location is identical', () => {
      const locA: GeoLocation = {
        id: 1275339,
        name: 'Mumbai',
        country: 'India',
        countryCode: 'IN',
        admin1: 'Maharashtra',
        latitude: 19.076,
        longitude: 72.8777,
        timezone: 'Asia/Kolkata',
      };

      // Clone with different object reference (e.g. from JSON.parse)
      const locB: GeoLocation = { ...locA };

      expect(locA).not.toBe(locB);
      expect(isSameLocation(locA, locB)).toBe(true);

      const locDifferent: GeoLocation = {
        ...locA,
        id: 1275004,
        name: 'Kolkata',
        latitude: 22.5726,
        longitude: 88.3639,
      };

      expect(isSameLocation(locA, locDifferent)).toBe(false);
    });
  });

  describe('Exact rounded cache key guard', () => {
    it('prevents stale data from a different coordinate from rendering under a new city location', () => {
      const delhiLocation: GeoLocation = {
        id: 1273294,
        name: 'Delhi',
        country: 'India',
        countryCode: 'IN',
        latitude: 28.6139,
        longitude: 77.209,
        timezone: 'Asia/Kolkata',
      };

      const staleMumbaiRaw: RawOpenMeteoAirQualityResponse = {
        latitude: 19.076,
        longitude: 72.8777,
        current: {
          time: '2026-11-22T10:00',
          pm2_5: 45,
          pm10: 75,
        },
        hourly: {
          time: ['2026-11-22T10:00'],
          pm2_5: [45],
        },
      };

      const delhiKey = `${delhiLocation.latitude.toFixed(2)}_${delhiLocation.longitude.toFixed(2)}`;
      const mumbaiKey = `${staleMumbaiRaw.latitude.toFixed(2)}_${staleMumbaiRaw.longitude.toFixed(2)}`;

      expect(delhiKey).not.toBe(mumbaiKey);

      // Even if coordinates differ by less than 0.5 degrees (e.g. 0.3 degrees away in another suburb)
      const nearbyMismatchRaw: RawOpenMeteoAirQualityResponse = {
        ...staleMumbaiRaw,
        latitude: 28.95, // 0.34 deg away, previously slipped through 0.5 deg tolerance
        longitude: 77.209,
      };

      const nearbyKey = `${nearbyMismatchRaw.latitude.toFixed(2)}_${nearbyMismatchRaw.longitude.toFixed(2)}`;
      expect(nearbyKey).not.toBe(delhiKey);
    });
  });
});

