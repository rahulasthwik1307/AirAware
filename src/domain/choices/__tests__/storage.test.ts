import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import {
  loadCleanerChoicesPreferences,
  saveCleanerChoicesPreferences,
  DEFAULT_PREFERENCES,
} from '../storage';
import { CleanerChoicesPreferences } from '../types';

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

describe('Cleaner Choices Local Storage Tests', () => {
  const originalWindow = globalThis.window;
  let mockStorage: ReturnType<typeof createMockLocalStorage>;

  beforeAll(() => {
    mockStorage = createMockLocalStorage();
    (globalThis as unknown as { window: unknown }).window = {
      localStorage: mockStorage,
    };
  });

  afterAll(() => {
    (globalThis as unknown as { window: unknown }).window = originalWindow;
  });

  beforeEach(() => {
    mockStorage.clear();
  });

  it('returns default preferences when localStorage is empty', () => {
    const prefs = loadCleanerChoicesPreferences();
    expect(prefs.commuteDistanceKm).toBe(DEFAULT_PREFERENCES.commuteDistanceKm);
    expect(prefs.baselineMode).toBe('PRIVATE_CAR');
    expect(prefs.selectedAlternative).toBe('PUBLIC_TRANSIT');
    expect(prefs.habits.length).toBeGreaterThan(0);
  });

  it('correctly persists and retrieves modified preferences', () => {
    const modified: CleanerChoicesPreferences = {
      ...DEFAULT_PREFERENCES,
      commuteDistanceKm: 22.5,
      tripsPerWeek: 6,
      selectedAlternative: 'CYCLING',
    };

    const saved = saveCleanerChoicesPreferences(modified);
    expect(saved).toBe(true);

    const loaded = loadCleanerChoicesPreferences();
    expect(loaded.commuteDistanceKm).toBe(22.5);
    expect(loaded.tripsPerWeek).toBe(6);
    expect(loaded.selectedAlternative).toBe('CYCLING');
  });

  it('safely handles corrupted or invalid JSON in storage', () => {
    mockStorage.setItem('airaware_cleaner_choices_v1', '{corrupt json...');
    const loaded = loadCleanerChoicesPreferences();
    expect(loaded.commuteDistanceKm).toBe(DEFAULT_PREFERENCES.commuteDistanceKm);
  });
});
