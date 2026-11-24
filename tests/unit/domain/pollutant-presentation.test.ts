import { describe, it, expect } from 'vitest';
import {
  formatBadgeTier,
  getRegulatoryMethodDisclosure,
  calculateDominantPollutant,
  derivePollutantThreatRanking,
  ORDERED_POLLUTANT_KEYS,
  POLLUTANT_SOURCE_TAGS,
} from '@/domain/aqi/pollutant-presentation';
import { PollutantKey, PollutantMeasurement, AqiTier } from '@/domain/types';

describe('pollutant-presentation domain helpers', () => {
  const createMeasurement = (
    key: PollutantKey = 'pm2_5',
    subIndex: number | null = 100,
    isEvaluated = true,
    conc: number | null = 50,
    tier: AqiTier | null = null
  ): PollutantMeasurement => ({
    key,
    label: key.toUpperCase(),
    chemicalFormula: key,
    concentration: conc,
    unit: 'µg/m³',
    subIndex,
    tier,
    isEvaluatedInActiveStandard: isEvaluated,
    whoGuideline: 15,
    whoRatio: conc !== null ? conc / 15 : null,
    isStationMeasurement: true,
  });

  describe('formatBadgeTier', () => {
    it('normalizes various standard category labels to badge tiers', () => {
      expect(formatBadgeTier('Unhealthy for Sensitive Groups')).toBe('Sensitive');
      expect(formatBadgeTier('Very Unhealthy')).toBe('Very Unhealthy');
      expect(formatBadgeTier('Very Poor')).toBe('Very Unhealthy');
      expect(formatBadgeTier('Hazardous')).toBe('Hazardous');
      expect(formatBadgeTier('Unhealthy')).toBe('Unhealthy');
      expect(formatBadgeTier('Poor')).toBe('Unhealthy');
      expect(formatBadgeTier('Moderate')).toBe('Moderate');
      expect(formatBadgeTier('Fair')).toBe('Moderate');
      expect(formatBadgeTier('Good')).toBe('Good');
    });

    it('returns original string when label does not match known keywords', () => {
      expect(formatBadgeTier('Custom Benchmark Tier')).toBe('Custom Benchmark Tier');
      expect(formatBadgeTier('')).toBe('');
    });
  });

  describe('getRegulatoryMethodDisclosure', () => {
    it('returns EAQI specific disclosure for carbon monoxide', () => {
      const disclosure = getRegulatoryMethodDisclosure('carbon_monoxide', true);
      expect(disclosure).toContain('Not evaluated under European EAQI');
    });

    it('returns EAQI 5-pollutant hourly disclosure for other pollutants', () => {
      const pm25Disclosure = getRegulatoryMethodDisclosure('pm2_5', true);
      expect(pm25Disclosure).toContain('EAQI method: evaluates five pollutant indices');
    });

    it('returns US EPA 24-hour rolling average disclosure for particulate matter', () => {
      expect(getRegulatoryMethodDisclosure('pm2_5', false)).toContain('24-hour rolling average');
      expect(getRegulatoryMethodDisclosure('pm10', false)).toContain('24-hour rolling average');
    });

    it('returns US EPA 8-hour rolling average disclosure for CO and Ozone', () => {
      expect(getRegulatoryMethodDisclosure('carbon_monoxide', false)).toContain('8-hour rolling average');
      expect(getRegulatoryMethodDisclosure('ozone', false)).toContain('8-hour rolling average');
    });

    it('returns US EPA 1-hour maximum disclosure for NO2 and SO2', () => {
      expect(getRegulatoryMethodDisclosure('nitrogen_dioxide', false)).toContain('1-hour daily maximum');
      expect(getRegulatoryMethodDisclosure('sulphur_dioxide', false)).toContain('1-hour daily maximum');
    });
  });

  describe('calculateDominantPollutant', () => {
    it('identifies the pollutant with the highest positive sub-index', () => {
      const pollutants: Record<PollutantKey, PollutantMeasurement> = {
        pm2_5: createMeasurement('pm2_5', 120),
        pm10: createMeasurement('pm10', 80),
        nitrogen_dioxide: createMeasurement('nitrogen_dioxide', 45),
        ozone: createMeasurement('ozone', 165),
        sulphur_dioxide: createMeasurement('sulphur_dioxide', 20),
        carbon_monoxide: createMeasurement('carbon_monoxide', 30),
      };

      const result = calculateDominantPollutant(pollutants);
      expect(result.dominantKey).toBe('ozone');
      expect(result.highestSubIndex).toBe(165);
    });

    it('ignores unevaluated pollutants or pollutants with null / negative / zero sub-indices', () => {
      const pollutants: Record<PollutantKey, PollutantMeasurement> = {
        pm2_5: createMeasurement('pm2_5', 250, false), // Not evaluated
        pm10: createMeasurement('pm10', null),
        nitrogen_dioxide: createMeasurement('nitrogen_dioxide', -10),
        ozone: createMeasurement('ozone', 0),
        sulphur_dioxide: createMeasurement('sulphur_dioxide', 95),
        carbon_monoxide: createMeasurement('carbon_monoxide', NaN),
      };

      const result = calculateDominantPollutant(pollutants);
      expect(result.dominantKey).toBe('sulphur_dioxide');
      expect(result.highestSubIndex).toBe(95);
    });

    it('returns dominantKey null and highestSubIndex -1 if no valid sub-indices exist', () => {
      const pollutants: Record<PollutantKey, PollutantMeasurement> = {
        pm2_5: createMeasurement('pm2_5', null),
        pm10: createMeasurement('pm10', 0),
        nitrogen_dioxide: createMeasurement('nitrogen_dioxide', null),
        ozone: createMeasurement('ozone', null),
        sulphur_dioxide: createMeasurement('sulphur_dioxide', null),
        carbon_monoxide: createMeasurement('carbon_monoxide', null),
      };

      const result = calculateDominantPollutant(pollutants);
      expect(result.dominantKey).toBeNull();
      expect(result.highestSubIndex).toBe(-1);
    });
  });

  describe('derivePollutantThreatRanking', () => {
    it('sorts pollutants descending by WHO guideline exceedance ratio', () => {
      const sampleTier: AqiTier = {
        level: 4,
        label: 'Unhealthy',
        colorToken: '#ea580c',
        bgToken: '#fff',
        borderToken: '#000',
        description: 'Unhealthy air',
        healthAdvisory: 'Wear mask',
      };

      const pollutants: Record<PollutantKey, PollutantMeasurement> = {
        pm2_5: createMeasurement('pm2_5', 150, true, 75, sampleTier), // 75 / 15 = 5.0
        pm10: createMeasurement('pm10', 90, true, 90), // 90 / 45 = 2.0
        nitrogen_dioxide: createMeasurement('nitrogen_dioxide', 20, true, 10),
        ozone: createMeasurement('ozone', 120, true, 200), // 200 / 100 = 2.0
        sulphur_dioxide: createMeasurement('sulphur_dioxide', 10, true, 5),
        carbon_monoxide: createMeasurement('carbon_monoxide', 15, true, 500),
      };

      const ranking = derivePollutantThreatRanking(pollutants);
      expect(ranking).toHaveLength(6);
      expect(ranking[0].key).toBe('pm2_5');
      expect(ranking[0].ratio).toBe(5);
      expect(ranking[0].tierColor).toBe('#ea580c');

      // Verify all items have required metadata
      for (const item of ranking) {
        expect(ORDERED_POLLUTANT_KEYS).toContain(item.key);
        expect(POLLUTANT_SOURCE_TAGS[item.key].sourceName).toBe(item.sourceName);
        expect(typeof item.ratio).toBe('number');
      }
    });

    it('handles zero, negative, or missing concentrations gracefully', () => {
      const emptyPollutants = {} as Record<PollutantKey, PollutantMeasurement>;
      const ranking = derivePollutantThreatRanking(emptyPollutants);
      expect(ranking).toHaveLength(6);
      expect(ranking.every((r) => r.ratio === 0)).toBe(true);
      expect(ranking.every((r) => r.tierColor === 'var(--aqi-good)')).toBe(true);
    });
  });
});
