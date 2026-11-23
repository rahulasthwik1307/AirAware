import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadHouseholdState } from '@/domain/household/storage';
import { loadIndoorState } from '@/domain/indoor/storage';
import { loadCommunityState } from '@/domain/community/storage';
import { loadCleanerChoicesPreferences } from '@/domain/choices/storage';
import { loadActivePlanState } from '@/domain/planner/storage';
import { loadChatSessions } from '@/lib/ai/chat-storage';
import { clearAllAirAwareData, AIRAWARE_STORAGE_KEYS } from '@/domain/constants/storage-keys';

describe('Storage Safety & Corruption Resilience', () => {
  let mockLocalStorage: Record<string, string> = {};
  let mockSessionStorage: Record<string, string> = {};

  beforeEach(() => {
    mockLocalStorage = {};
    mockSessionStorage = {};

    const localStorageMock = {
      getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
      setItem: vi.fn((key: string, val: string) => {
        mockLocalStorage[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
      key: vi.fn((i: number) => Object.keys(mockLocalStorage)[i] ?? null),
      get length() {
        return Object.keys(mockLocalStorage).length;
      },
    };

    const sessionStorageMock = {
      getItem: vi.fn((key: string) => mockSessionStorage[key] ?? null),
      setItem: vi.fn((key: string, val: string) => {
        mockSessionStorage[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockSessionStorage[key];
      }),
      clear: vi.fn(() => {
        mockSessionStorage = {};
      }),
      key: vi.fn((i: number) => Object.keys(mockSessionStorage)[i] ?? null),
      get length() {
        return Object.keys(mockSessionStorage).length;
      },
    };

    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('sessionStorage', sessionStorageMock);
    vi.stubGlobal('window', {
      localStorage: localStorageMock,
      sessionStorage: sessionStorageMock,
      dispatchEvent: vi.fn(),
      CustomEvent: class {},
    });
  });

  it('safely handles corrupted JSON without crashing across all storage adapters', () => {
    mockLocalStorage['airaware_household_v1'] = 'INVALID_MALICIOUS_JSON_}{[';
    mockLocalStorage['airaware_indoor_v1'] = 'CORRUPTED_INDOOR_DATA';
    mockLocalStorage['airaware_community_v1'] = '{"version": 999, "corrupt": true}';
    mockLocalStorage['airaware_cleaner_choices_v1'] = 'null';
    mockLocalStorage['airaware_active_plan'] = '{badJson';
    mockLocalStorage['airaware_copilot_sessions_v1'] = '{"corrupted": true}';

    expect(() => loadHouseholdState()).not.toThrow();
    expect(() => loadIndoorState()).not.toThrow();
    expect(() => loadCommunityState()).not.toThrow();
    expect(() => loadCleanerChoicesPreferences()).not.toThrow();
    expect(() => loadActivePlanState()).not.toThrow();
    expect(() => loadChatSessions()).not.toThrow();

    const household = loadHouseholdState();
    expect(household).toBeDefined();
    expect(Array.isArray(household.members)).toBe(true);
    expect(household.version).toBe(1);

    const indoor = loadIndoorState();
    expect(indoor).toBeDefined();
    expect(indoor.selectedRoomId).toBe('living_room');

    const community = loadCommunityState();
    expect(community.version).toBe(1);

    const choices = loadCleanerChoicesPreferences();
    expect(choices.baselineMode).toBe('PRIVATE_CAR');
  });

  it('clearAllAirAwareData removes every registered key and clears session storage', () => {
    // Populate all known keys plus dynamic ones
    for (const key of AIRAWARE_STORAGE_KEYS) {
      mockLocalStorage[key] = 'dummy_value';
    }
    mockLocalStorage['airaware_custom_dynamic_key'] = 'dynamic_value';
    mockLocalStorage['other_app_unrelated_key'] = 'preserve_this';

    mockSessionStorage['telemetry_cache'] = 'cached_telemetry';

    clearAllAirAwareData();

    // Check that all AirAware keys are deleted
    for (const key of AIRAWARE_STORAGE_KEYS) {
      expect(mockLocalStorage[key]).toBeUndefined();
    }
    expect(mockLocalStorage['airaware_custom_dynamic_key']).toBeUndefined();
    // Non-AirAware keys should be preserved
    expect(mockLocalStorage['other_app_unrelated_key']).toBe('preserve_this');

    // Session storage should be cleared
    expect(Object.keys(mockSessionStorage).length).toBe(0);
  });
});
