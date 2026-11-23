'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CleanerChoicesPreferences,
  CleanerTransitMode,
  CommuteComparisonResult,
  DualImpactSummary,
} from '@/domain/choices/types';
import {
  DEFAULT_PREFERENCES,
  loadCleanerChoicesPreferences,
  saveCleanerChoicesPreferences,
} from '@/domain/choices/storage';
import { calculateCommuteComparison, calculateDualImpactSummary } from '@/domain/choices/calculator';

export interface UseCleanerChoicesReturn {
  readonly preferences: CleanerChoicesPreferences;
  readonly commuteComparison: CommuteComparisonResult;
  readonly dualImpact: DualImpactSummary;
  readonly isLoaded: boolean;
  readonly setCommuteDistance: (km: number) => void;
  readonly setTripsPerWeek: (trips: number) => void;
  readonly setSelectedAlternative: (mode: CleanerTransitMode) => void;
  readonly toggleHabitAdoption: (habitId: string) => void;
  readonly toggleHabitDayCompletion: (habitId: string, dayIndex: number) => void;
  readonly completeHabitToday: (habitId: string) => void;
  readonly resetPreferences: () => void;
}

/**
 * Reactive hook managing user cleaner commute preferences, habit streaks, and dual impact metrics.
 * Preserves local-first persistence under 'airaware_cleaner_choices_v1'.
 */
export function useCleanerChoices(): UseCleanerChoicesReturn {
  const [preferences, setPreferences] = useState<CleanerChoicesPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const loaded = loadCleanerChoicesPreferences();
    setPreferences(loaded);
    setIsLoaded(true);
  }, []);

  // Update preferences and persist
  const updateAndSave = useCallback((updater: (prev: CleanerChoicesPreferences) => CleanerChoicesPreferences) => {
    setPreferences((prev) => {
      const next = updater(prev);
      saveCleanerChoicesPreferences(next);
      return next;
    });
  }, []);

  const setCommuteDistance = useCallback((km: number) => {
    updateAndSave((prev) => ({
      ...prev,
      commuteDistanceKm: Math.min(Math.max(0.5, km), 150),
    }));
  }, [updateAndSave]);

  const setTripsPerWeek = useCallback((trips: number) => {
    updateAndSave((prev) => ({
      ...prev,
      tripsPerWeek: Math.min(Math.max(1, trips), 28),
    }));
  }, [updateAndSave]);

  const setSelectedAlternative = useCallback((mode: CleanerTransitMode) => {
    updateAndSave((prev) => ({
      ...prev,
      selectedAlternative: mode,
    }));
  }, [updateAndSave]);

  const toggleHabitAdoption = useCallback((habitId: string) => {
    updateAndSave((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== habitId) return h;
        return {
          ...h,
          isAdopted: !h.isAdopted,
        };
      }),
    }));
  }, [updateAndSave]);

  const toggleHabitDayCompletion = useCallback((habitId: string, dayIndex: number) => {
    if (dayIndex < 0 || dayIndex > 6) return;

    updateAndSave((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== habitId) return h;
        const nextCompletions = [...h.weeklyCompletions];
        nextCompletions[dayIndex] = !nextCompletions[dayIndex];

        // Recalculate streak
        const completedCount = nextCompletions.filter(Boolean).length;
        const currentStreakDays = nextCompletions[dayIndex]
          ? Math.max(h.currentStreakDays + 1, completedCount)
          : Math.max(0, h.currentStreakDays - 1);

        return {
          ...h,
          weeklyCompletions: nextCompletions,
          currentStreakDays,
        };
      }),
    }));
  }, [updateAndSave]);

  const completeHabitToday = useCallback((habitId: string) => {
    // Determine today's day of week: Sunday=0 -> 6, Monday=1 -> 0, etc.
    const now = new Date();
    const day = now.getDay();
    const adjustedDayIndex = (day + 6) % 7; // Mon=0 ... Sun=6

    toggleHabitDayCompletion(habitId, adjustedDayIndex);
  }, [toggleHabitDayCompletion]);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    saveCleanerChoicesPreferences(DEFAULT_PREFERENCES);
  }, []);

  // Compute reactive comparisons
  const commuteComparison = useMemo(() => {
    return calculateCommuteComparison({
      distanceKm: preferences.commuteDistanceKm,
      tripsPerWeek: preferences.tripsPerWeek,
      baselineMode: preferences.baselineMode,
      alternativeMode: preferences.selectedAlternative,
    });
  }, [
    preferences.commuteDistanceKm,
    preferences.tripsPerWeek,
    preferences.baselineMode,
    preferences.selectedAlternative,
  ]);

  // Compute dual impact summary
  const dualImpact = useMemo(() => {
    return calculateDualImpactSummary(preferences.habits, commuteComparison);
  }, [preferences.habits, commuteComparison]);

  return {
    preferences,
    commuteComparison,
    dualImpact,
    isLoaded,
    setCommuteDistance,
    setTripsPerWeek,
    setSelectedAlternative,
    toggleHabitAdoption,
    toggleHabitDayCompletion,
    completeHabitToday,
    resetPreferences,
  };
}
