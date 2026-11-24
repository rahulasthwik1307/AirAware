import { describe, it, expect } from 'vitest';
import {
  getDistanceTier,
  calculateCommuteImpactSavings,
  calculateComparativeBarWidths,
  DISTANCE_PRESETS,
  DAYS_PRESETS,
} from '@/domain/choices/commute-emissions';

describe('commute-emissions domain module', () => {
  describe('presets', () => {
    it('defines standard distance and frequency presets', () => {
      expect(DISTANCE_PRESETS).toEqual([5, 12, 20, 35]);
      expect(DAYS_PRESETS).toHaveLength(4);
      expect(DAYS_PRESETS[2].trips).toBe(10); // 5 days * 2 trips
    });
  });

  describe('getDistanceTier', () => {
    it('categorizes distance into transit infrastructure tiers', () => {
      const active = getDistanceTier(5);
      expect(active.tier).toBe('Active Mobility Zone');
      expect(active.badgeClass).toContain('emerald');

      const urban = getDistanceTier(15);
      expect(urban.tier).toBe('Urban Transit Corridor');
      expect(urban.badgeClass).toContain('cyan');

      const suburban = getDistanceTier(25);
      expect(suburban.tier).toBe('Suburban Commuter Trunk');
      expect(suburban.badgeClass).toContain('indigo');

      const regional = getDistanceTier(40);
      expect(regional.tier).toBe('Regional Highway Corridor');
      expect(regional.badgeClass).toContain('amber');
    });
  });

  describe('calculateCommuteImpactSavings', () => {
    it('calculates weekly kilometers, conserved fuel, and monthly monetary savings', () => {
      const distanceKm = 15;
      const tripsPerWeek = 10;
      const avoidedKgCo2e = 23.1; // 23.1 / 2.31 = 10 litres

      const savings = calculateCommuteImpactSavings(distanceKm, tripsPerWeek, avoidedKgCo2e);
      expect(savings.weeklyKm).toBe(150);
      expect(savings.fuelSavedLitresWeekly).toBe(10);
      // 10 * 4.33 * 104 = 4503.2 -> rounded to 4503
      expect(savings.directRupeesSavedMonthly).toBe(4503);
    });

    it('handles zero avoided emissions gracefully', () => {
      const savings = calculateCommuteImpactSavings(10, 4, 0);
      expect(savings.weeklyKm).toBe(40);
      expect(savings.fuelSavedLitresWeekly).toBe(0);
      expect(savings.directRupeesSavedMonthly).toBe(0);
    });
  });

  describe('calculateComparativeBarWidths', () => {
    it('calculates relative widths capped at 100%', () => {
      const { baselineBarWidth, altBarWidth } = calculateComparativeBarWidths(50, 20);
      expect(baselineBarWidth).toBe(100);
      expect(altBarWidth).toBe(40);
    });

    it('caps alternative width at 100% when alternative exceeds baseline', () => {
      const { baselineBarWidth, altBarWidth } = calculateComparativeBarWidths(20, 30);
      expect(baselineBarWidth).toBe(100);
      expect(altBarWidth).toBe(100);
    });

    it('handles zero baseline gracefully without division by zero', () => {
      const { baselineBarWidth, altBarWidth } = calculateComparativeBarWidths(0, 0);
      expect(baselineBarWidth).toBe(100);
      expect(altBarWidth).toBe(0);
    });
  });
});
