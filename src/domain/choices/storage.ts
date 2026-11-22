/**
 * AirAware Local Storage — Cleaner Choices Preferences
 * Resilient, local-first persistence for commute preferences and adopted clean-air habits.
 * Zero external telemetry or remote cloud dependencies.
 */

import { DEFAULT_CLEANER_HABITS } from './constants';
import { CleanerChoicesPreferences, CleanerTransitMode } from './types';

const STORAGE_KEY = 'airaware_cleaner_choices_v1';

export const DEFAULT_PREFERENCES: CleanerChoicesPreferences = {
  commuteDistanceKm: 15,
  tripsPerWeek: 10, // 5 days roundtrip
  baselineMode: 'PRIVATE_CAR',
  selectedAlternative: 'PUBLIC_TRANSIT',
  habits: DEFAULT_CLEANER_HABITS,
  lastActiveTimestamp: new Date().toISOString(),
};

/**
 * Loads saved cleaner choices preferences from localStorage.
 * Safely falls back to default values if unavailable or corrupted.
 */
export function loadCleanerChoicesPreferences(): CleanerChoicesPreferences {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<CleanerChoicesPreferences>;

    // Validate and sanitize parsed values
    const commuteDistanceKm =
      typeof parsed.commuteDistanceKm === 'number' && Number.isFinite(parsed.commuteDistanceKm)
        ? Math.min(Math.max(0.5, parsed.commuteDistanceKm), 150)
        : DEFAULT_PREFERENCES.commuteDistanceKm;

    const tripsPerWeek =
      typeof parsed.tripsPerWeek === 'number' && Number.isFinite(parsed.tripsPerWeek)
        ? Math.min(Math.max(1, parsed.tripsPerWeek), 28)
        : DEFAULT_PREFERENCES.tripsPerWeek;

    const baselineMode: CleanerTransitMode =
      parsed.baselineMode === 'PRIVATE_CAR' ? 'PRIVATE_CAR' : DEFAULT_PREFERENCES.baselineMode;

    const validAlts: CleanerTransitMode[] = [
      'CARPOOL',
      'PUBLIC_TRANSIT',
      'CYCLING',
      'WALKING',
      'PRIVATE_CAR',
    ];
    const selectedAlternative: CleanerTransitMode =
      parsed.selectedAlternative && validAlts.includes(parsed.selectedAlternative)
        ? parsed.selectedAlternative
        : DEFAULT_PREFERENCES.selectedAlternative;

    // Validate habits array
    let habits = DEFAULT_PREFERENCES.habits;
    if (Array.isArray(parsed.habits) && parsed.habits.length > 0) {
      // Merge with default habits in case new habits were introduced
      habits = DEFAULT_CLEANER_HABITS.map((defHabit) => {
        const found = parsed.habits?.find((h) => h.id === defHabit.id);
        if (!found) return defHabit;

        return {
          ...defHabit,
          isAdopted: Boolean(found.isAdopted),
          weeklyCompletions:
            Array.isArray(found.weeklyCompletions) && found.weeklyCompletions.length === 7
              ? found.weeklyCompletions.map(Boolean)
              : defHabit.weeklyCompletions,
          currentStreakDays:
            typeof found.currentStreakDays === 'number'
              ? Math.max(0, found.currentStreakDays)
              : defHabit.currentStreakDays,
        };
      });
    }

    return {
      commuteDistanceKm,
      tripsPerWeek,
      baselineMode,
      selectedAlternative,
      habits,
      lastActiveTimestamp: parsed.lastActiveTimestamp || new Date().toISOString(),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Saves cleaner choices preferences to localStorage.
 */
export function saveCleanerChoicesPreferences(prefs: CleanerChoicesPreferences): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const payload = JSON.stringify({
      ...prefs,
      lastActiveTimestamp: new Date().toISOString(),
    });
    window.localStorage.setItem(STORAGE_KEY, payload);
    return true;
  } catch {
    return false;
  }
}
