import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIRAWARE_STORAGE_KEYS, clearAllAirAwareData } from '@/domain/constants/storage-keys';

describe('AirAware Privacy Data Clearing', () => {
  let mockLocal: Record<string, string> = {};
  let mockSession: Record<string, string> = {};

  beforeEach(() => {
    mockLocal = {};
    mockSession = {};

    const localStorageMock = {
      getItem: (key: string) => mockLocal[key] ?? null,
      setItem: (key: string, val: string) => {
        mockLocal[key] = val;
      },
      removeItem: (key: string) => {
        delete mockLocal[key];
      },
      clear: () => {
        mockLocal = {};
      },
      key: (i: number) => Object.keys(mockLocal)[i] ?? null,
      get length() {
        return Object.keys(mockLocal).length;
      },
    };

    const sessionStorageMock = {
      getItem: (key: string) => mockSession[key] ?? null,
      setItem: (key: string, val: string) => {
        mockSession[key] = val;
      },
      removeItem: (key: string) => {
        delete mockSession[key];
      },
      clear: () => {
        mockSession = {};
      },
      key: (i: number) => Object.keys(mockSession)[i] ?? null,
      get length() {
        return Object.keys(mockSession).length;
      },
    };

    vi.stubGlobal('window', {
      localStorage: localStorageMock,
      sessionStorage: sessionStorageMock,
    });
  });

  it('removes every key listed in AIRAWARE_STORAGE_KEYS and clears sessionStorage', () => {
    // Populate all registered keys
    for (const key of AIRAWARE_STORAGE_KEYS) {
      window.localStorage.setItem(key, 'test-data-value');
    }
    // Populate dynamic/prefixed keys and telemetry session cache
    window.localStorage.setItem('airaware_custom_dynamic_key', 'dynamic');
    window.sessionStorage.setItem('plan_telemetry_cache', 'cached-weather');

    // Verify populated
    for (const key of AIRAWARE_STORAGE_KEYS) {
      expect(window.localStorage.getItem(key)).toBe('test-data-value');
    }
    expect(window.sessionStorage.getItem('plan_telemetry_cache')).toBe('cached-weather');

    // Run clear
    clearAllAirAwareData();

    // Verify every registered key is removed
    for (const key of AIRAWARE_STORAGE_KEYS) {
      expect(window.localStorage.getItem(key)).toBeNull();
    }
    expect(window.localStorage.getItem('airaware_custom_dynamic_key')).toBeNull();
    expect(window.sessionStorage.getItem('plan_telemetry_cache')).toBeNull();
  });
});
