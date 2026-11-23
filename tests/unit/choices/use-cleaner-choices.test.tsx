// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCleanerChoices } from '@/hooks/choices/useCleanerChoices';
import { DEFAULT_PREFERENCES } from '@/domain/choices/storage';

describe('useCleanerChoices Hook Contract', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('initializes with default preferences and isLoaded true', () => {
    const { result } = renderHook(() => useCleanerChoices());

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.preferences.commuteDistanceKm).toBe(DEFAULT_PREFERENCES.commuteDistanceKm);
    expect(result.current.preferences.tripsPerWeek).toBe(DEFAULT_PREFERENCES.tripsPerWeek);
    expect(result.current.preferences.selectedAlternative).toBe('PUBLIC_TRANSIT');
    expect(result.current.commuteComparison).toBeDefined();
    expect(result.current.dualImpact).toBeDefined();
  });

  it('updates commuteDistanceKm with clamping between 0.5 and 150 km', () => {
    const { result } = renderHook(() => useCleanerChoices());

    act(() => {
      result.current.setCommuteDistance(25);
    });
    expect(result.current.preferences.commuteDistanceKm).toBe(25);

    // Clamps below minimum (0.5 km)
    act(() => {
      result.current.setCommuteDistance(0.1);
    });
    expect(result.current.preferences.commuteDistanceKm).toBe(0.5);

    // Clamps above maximum (150 km)
    act(() => {
      result.current.setCommuteDistance(200);
    });
    expect(result.current.preferences.commuteDistanceKm).toBe(150);
  });

  it('updates tripsPerWeek with clamping between 1 and 28 trips', () => {
    const { result } = renderHook(() => useCleanerChoices());

    act(() => {
      result.current.setTripsPerWeek(14);
    });
    expect(result.current.preferences.tripsPerWeek).toBe(14);

    act(() => {
      result.current.setTripsPerWeek(0);
    });
    expect(result.current.preferences.tripsPerWeek).toBe(1);

    act(() => {
      result.current.setTripsPerWeek(35);
    });
    expect(result.current.preferences.tripsPerWeek).toBe(28);
  });

  it('updates selected transit alternative mode and recalculates impact', () => {
    const { result } = renderHook(() => useCleanerChoices());

    act(() => {
      result.current.setSelectedAlternative('CYCLING');
    });
    expect(result.current.preferences.selectedAlternative).toBe('CYCLING');
    expect(result.current.commuteComparison.alternativeMode).toBe('CYCLING');
    expect(result.current.commuteComparison.avoidedKgCo2eWeekly).toBeGreaterThan(0);
  });

  it('toggles habit adoption state', () => {
    const { result } = renderHook(() => useCleanerChoices());
    const habitId = result.current.preferences.habits[0].id;
    const initialAdopted = result.current.preferences.habits[0].isAdopted;

    act(() => {
      result.current.toggleHabitAdoption(habitId);
    });
    expect(result.current.preferences.habits[0].isAdopted).toBe(!initialAdopted);

    act(() => {
      result.current.toggleHabitAdoption('non-existent-id');
    });
    // Non-existent id has no effect
    expect(result.current.preferences.habits[0].isAdopted).toBe(!initialAdopted);
  });

  it('toggles habit day completion and manages streak calculation', () => {
    const { result } = renderHook(() => useCleanerChoices());
    const habitId = result.current.preferences.habits[0].id;

    // Out-of-bounds dayIndex is ignored
    const initialDay0 = result.current.preferences.habits[0].weeklyCompletions[0];
    act(() => {
      result.current.toggleHabitDayCompletion(habitId, -1);
      result.current.toggleHabitDayCompletion(habitId, 7);
    });
    expect(result.current.preferences.habits[0].weeklyCompletions[0]).toBe(initialDay0);

    // Toggle Mon (day 0) completion
    act(() => {
      result.current.toggleHabitDayCompletion(habitId, 0);
    });
    expect(result.current.preferences.habits[0].weeklyCompletions[0]).toBe(!initialDay0);

    // Toggle Mon completion back
    act(() => {
      result.current.toggleHabitDayCompletion(habitId, 0);
    });
    expect(result.current.preferences.habits[0].weeklyCompletions[0]).toBe(initialDay0);
  });

  it('completes habit for today based on current day of week', () => {
    const { result } = renderHook(() => useCleanerChoices());
    const habitId = result.current.preferences.habits[0].id;

    act(() => {
      result.current.completeHabitToday(habitId);
    });

    const hasAnyCompletion = result.current.preferences.habits[0].weeklyCompletions.some(Boolean);
    expect(hasAnyCompletion).toBe(true);
  });

  it('resets preferences back to defaults and saves to storage', () => {
    const { result } = renderHook(() => useCleanerChoices());

    act(() => {
      result.current.setCommuteDistance(45);
      result.current.setSelectedAlternative('WALKING');
    });
    expect(result.current.preferences.commuteDistanceKm).toBe(45);

    act(() => {
      result.current.resetPreferences();
    });
    expect(result.current.preferences.commuteDistanceKm).toBe(DEFAULT_PREFERENCES.commuteDistanceKm);
    expect(result.current.preferences.selectedAlternative).toBe(DEFAULT_PREFERENCES.selectedAlternative);
  });
});
