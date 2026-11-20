import { describe, it, expect } from 'vitest';
import { calculateCommuteComparison, calculateDualImpactSummary } from '../calculator';
import { DEFAULT_CLEANER_HABITS } from '../constants';
import { CleanerHabit } from '../types';

describe('Cleaner Choices Calculator — Scientific Integrity Tests', () => {
  describe('calculateCommuteComparison', () => {
    it('calculates significant operational CO2e savings when switching from Solo Car to Electric Metro', () => {
      const result = calculateCommuteComparison({
        distanceKm: 15,
        tripsPerWeek: 10, // 5 days roundtrip = 150 km weekly
        baselineMode: 'PRIVATE_CAR',
        alternativeMode: 'PUBLIC_TRANSIT',
      });

      // Weekly km = 150
      // Baseline = 150 * 0.170 = 25.5 kg CO2e
      // Metro = 150 * 0.035 = 5.25 kg CO2e
      // Avoided = 25.5 - 5.25 = 20.25 kg CO2e
      expect(result.baselineKgCo2eWeekly).toBe(25.5);
      expect(result.alternativeKgCo2eWeekly).toBe(5.25);
      expect(result.avoidedKgCo2eWeekly).toBe(20.25);
      expect(result.percentageCo2eReduction).toBe(79); // 20.25 / 25.5 ≈ 79.4% -> 79%
      expect(result.isCleanAlternative).toBe(true);

      // Criteria pollutants avoided
      // Baseline NOx = 150 * 0.45 = 67.5g; Alt NOx = 150 * 0.015 = 2.25g; Diff ≈ 65.25 -> 65.3g
      expect(result.avoidedNoxGramsWeekly).toBe(65.3);
      // Baseline PM2.5 = 150 * 0.025 = 3.75g; Alt PM2.5 = 150 * 0.002 = 0.3g; Diff ≈ 3.45g
      expect(result.avoidedPm25GramsWeekly).toBe(3.45);
    });

    it('calculates 100% emission reduction for active walking or cycling', () => {
      const result = calculateCommuteComparison({
        distanceKm: 5,
        tripsPerWeek: 10, // 50 km weekly
        baselineMode: 'PRIVATE_CAR',
        alternativeMode: 'CYCLING',
      });

      expect(result.alternativeKgCo2eWeekly).toBe(0);
      expect(result.percentageCo2eReduction).toBe(100);
      expect(result.avoidedKgCo2eWeekly).toBe(result.baselineKgCo2eWeekly);
      expect(result.avoidedNoxGramsWeekly).toBeGreaterThan(0);
      expect(result.avoidedPm25GramsWeekly).toBeGreaterThan(0);
    });

    it('returns zero savings when comparing baseline against baseline', () => {
      const result = calculateCommuteComparison({
        distanceKm: 12,
        tripsPerWeek: 10,
        baselineMode: 'PRIVATE_CAR',
        alternativeMode: 'PRIVATE_CAR',
      });

      expect(result.avoidedKgCo2eWeekly).toBe(0);
      expect(result.percentageCo2eReduction).toBe(0);
      expect(result.avoidedNoxGramsWeekly).toBe(0);
      expect(result.avoidedPm25GramsWeekly).toBe(0);
      expect(result.isCleanAlternative).toBe(false);
    });

    it('safely clamps extreme input distances and trips', () => {
      const resultExtreme = calculateCommuteComparison({
        distanceKm: 999999, // Should clamp to 150 km
        tripsPerWeek: 100, // Should clamp to 28 trips
        baselineMode: 'PRIVATE_CAR',
        alternativeMode: 'PUBLIC_TRANSIT',
      });

      expect(resultExtreme.distanceKm).toBe(150);
      expect(resultExtreme.tripsPerWeek).toBe(28);
      expect(Number.isFinite(resultExtreme.avoidedKgCo2eWeekly)).toBe(true);

      const resultNegative = calculateCommuteComparison({
        distanceKm: -50, // Should clamp to 0.5 km
        tripsPerWeek: -10, // Should clamp to 1 trip
        baselineMode: 'PRIVATE_CAR',
        alternativeMode: 'PUBLIC_TRANSIT',
      });

      expect(resultNegative.distanceKm).toBe(0.5);
      expect(resultNegative.tripsPerWeek).toBe(1);
    });
  });

  describe('calculateDualImpactSummary', () => {
    it('aggregates adopted habit exposure hours and avoided emissions', () => {
      const commuteImpact = calculateCommuteComparison({
        distanceKm: 15,
        tripsPerWeek: 10,
        baselineMode: 'PRIVATE_CAR',
        alternativeMode: 'PUBLIC_TRANSIT',
      });

      const habits: CleanerHabit[] = [
        {
          id: 'test-habit-1',
          title: 'Timing Shift',
          category: 'SMOG_TIMING',
          icon: '⏱️',
          description: 'Shift departure',
          exposureDefenseBenefit: 'Avoids morning inversion',
          estimatedWeeklyCo2eSavingsKg: 2.0,
          weeklyExposureHoursProtected: 3.5,
          isAdopted: true,
          weeklyCompletions: [true, true, true, true, true, true, true], // 7/7
          currentStreakDays: 7,
        },
        {
          id: 'test-habit-2',
          title: 'Unadopted Habit',
          category: 'COMMUTE',
          icon: '🚲',
          description: 'Not adopted',
          exposureDefenseBenefit: 'None',
          estimatedWeeklyCo2eSavingsKg: 5.0,
          weeklyExposureHoursProtected: 4.0,
          isAdopted: false,
          weeklyCompletions: [true, true, true, true, true, true, true],
          currentStreakDays: 0,
        },
      ];

      const summary = calculateDualImpactSummary(habits, commuteImpact);

      expect(summary.exposureHoursShiftedWeekly).toBe(3.5);
      expect(summary.exposureDefenseProgressPercent).toBe(Math.round((3.5 / 6.0) * 100));
      expect(summary.relativeAmbientDeltaC).toBeGreaterThan(0);
      expect(summary.avoidedCo2eKgMonthly).toBeGreaterThan(0);
      expect(summary.personalDisclaimer).toBeDefined();
      expect(summary.planetaryDisclaimer).toBeDefined();
    });
  });
});
