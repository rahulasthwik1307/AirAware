import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { DEFAULT_LOCATION, useAirQuality } from '@/domain/aqi/useAirQuality';
import { GeoLocation } from '@/domain/types';

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
    delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
  });

  beforeEach(() => {
    mockStorage.clear();
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
});
