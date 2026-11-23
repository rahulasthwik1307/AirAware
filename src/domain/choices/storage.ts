/**
 * AirAware Local Storage — Cleaner Choices Preferences
 * Resilient, local-first persistence for commute preferences and adopted clean-air habits.
 * Zero external telemetry or remote cloud dependencies.
 */

import { z } from 'zod';
import { DEFAULT_CLEANER_HABITS } from './constants';
import { CleanerChoicesPreferences, CleanerTransitMode } from './types';

const STORAGE_KEY = 'airaware_cleaner_choices_v1';

const CleanerTransitModeSchema = z.enum([
  'PRIVATE_CAR',
  'CARPOOL',
  'PUBLIC_TRANSIT',
  'CYCLING',
  'WALKING',
]);

const HabitCategorySchema = z.enum([
  'COMMUTE',
  'SMOG_TIMING',
  'INDOOR_DEFENSE',
  'ENERGY_COOKING',
]);

const CleanerHabitSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: HabitCategorySchema,
  icon: z.string(),
  description: z.string(),
  exposureDefenseBenefit: z.string(),
  estimatedWeeklyCo2eSavingsKg: z.number().nonnegative(),
  weeklyExposureHoursProtected: z.number().nonnegative(),
  isAdopted: z.boolean(),
  weeklyCompletions: z.array(z.boolean()),
  currentStreakDays: z.number().int().nonnegative(),
});

export const DEFAULT_PREFERENCES: CleanerChoicesPreferences = {
  commuteDistanceKm: 15,
  tripsPerWeek: 10, // 5 days roundtrip
  baselineMode: 'PRIVATE_CAR',
  selectedAlternative: 'PUBLIC_TRANSIT',
  habits: DEFAULT_CLEANER_HABITS,
  lastActiveTimestamp: new Date().toISOString(),
};

const CleanerChoicesPreferencesSchema = z.object({
  commuteDistanceKm: z.number().min(0.5).max(150).default(15),
  tripsPerWeek: z.number().int().min(1).max(28).default(10),
  baselineMode: CleanerTransitModeSchema.default('PRIVATE_CAR'),
  selectedAlternative: CleanerTransitModeSchema.default('PUBLIC_TRANSIT'),
  habits: z.array(CleanerHabitSchema).default(() => DEFAULT_PREFERENCES.habits as unknown as z.infer<typeof CleanerHabitSchema>[]),
  lastActiveTimestamp: z.string().default(() => new Date().toISOString()),
});

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

    const parsed = JSON.parse(raw);
    const validated = CleanerChoicesPreferencesSchema.safeParse(parsed);
    if (validated.success) {
      return validated.data as CleanerChoicesPreferences;
    }
    return DEFAULT_PREFERENCES;
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
