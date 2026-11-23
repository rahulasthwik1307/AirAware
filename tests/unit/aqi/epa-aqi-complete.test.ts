import { describe, it, expect } from 'vitest';
import {
  calculateEpaSubIndex,
  calculatePollutantEpaSubIndex,
  getEpaTierFromValue,
  EPA_PM25_BREAKPOINTS,
  EPA_TIERS,
} from '@/domain/aqi/epa-aqi';
import { PollutantKey } from '@/domain/types';

describe('EPA AQI Sub-Index & Tier Resolver Completeness', () => {
  describe('calculateEpaSubIndex', () => {
    it('throws RangeError for negative or non-finite concentrations', () => {
      expect(() => calculateEpaSubIndex(-1, EPA_PM25_BREAKPOINTS)).toThrow(RangeError);
      expect(() => calculateEpaSubIndex(NaN, EPA_PM25_BREAKPOINTS)).toThrow(RangeError);
      expect(() => calculateEpaSubIndex(Infinity, EPA_PM25_BREAKPOINTS)).toThrow(RangeError);
    });

    it('calculates expected sub-indices on linear breakpoints', () => {
      // 0 ug/m3 PM2.5 -> 0
      expect(calculateEpaSubIndex(0, EPA_PM25_BREAKPOINTS)).toBe(0);
      // 12.0 ug/m3 PM2.5 -> 50
      expect(calculateEpaSubIndex(12.0, EPA_PM25_BREAKPOINTS)).toBe(50);
      // 35.4 ug/m3 PM2.5 -> 100
      expect(calculateEpaSubIndex(35.4, EPA_PM25_BREAKPOINTS)).toBe(100);
      // 55.4 ug/m3 PM2.5 -> 150
      expect(calculateEpaSubIndex(55.4, EPA_PM25_BREAKPOINTS)).toBe(150);
    });

    it('caps beyond highest breakpoint at 500', () => {
      expect(calculateEpaSubIndex(600, EPA_PM25_BREAKPOINTS)).toBe(500);
      expect(calculateEpaSubIndex(1000, EPA_PM25_BREAKPOINTS)).toBe(500);
    });
  });

  describe('calculatePollutantEpaSubIndex', () => {
    it('returns null and "No data" for null, negative or non-finite values', () => {
      expect(calculatePollutantEpaSubIndex('pm2_5', null)).toEqual({
        subIndex: null,
        averagingNote: 'No data',
      });
      expect(calculatePollutantEpaSubIndex('pm2_5', -5)).toEqual({
        subIndex: null,
        averagingNote: 'No data',
      });
      expect(calculatePollutantEpaSubIndex('pm2_5', NaN)).toEqual({
        subIndex: null,
        averagingNote: 'No data',
      });
    });

    it('calculates sub-index for all 6 criteria pollutants with units and notes', () => {
      // PM2.5
      const pm25 = calculatePollutantEpaSubIndex('pm2_5', 25.0);
      expect(pm25.subIndex).toBeGreaterThan(50);
      expect(pm25.averagingNote).toContain('24-hour average');

      // PM10
      const pm10 = calculatePollutantEpaSubIndex('pm10', 80.0);
      expect(pm10.subIndex).toBeGreaterThan(50);
      expect(pm10.averagingNote).toContain('24-hour average');

      // Ozone (converted from ug/m3 to ppm)
      const o3 = calculatePollutantEpaSubIndex('ozone', 120.0);
      expect(o3.subIndex).toBeGreaterThan(0);
      expect(o3.averagingNote).toContain('8-hour running average');

      // Nitrogen Dioxide (converted to ppb)
      const no2 = calculatePollutantEpaSubIndex('nitrogen_dioxide', 60.0);
      expect(no2.subIndex).toBeGreaterThan(0);
      expect(no2.averagingNote).toContain('1-hour primary standard');

      // Sulphur Dioxide (converted to ppb)
      const so2 = calculatePollutantEpaSubIndex('sulphur_dioxide', 40.0);
      expect(so2.subIndex).toBeGreaterThan(0);
      expect(so2.averagingNote).toContain('1-hour primary standard');

      // Carbon Monoxide (converted to ppm)
      const co = calculatePollutantEpaSubIndex('carbon_monoxide', 5000.0);
      expect(co.subIndex).toBeGreaterThan(0);
      expect(co.averagingNote).toContain('8-hour running average');
    });

    it('returns standard not applicable for unsupported pollutant keys', () => {
      const result = calculatePollutantEpaSubIndex('unsupported_gas' as PollutantKey, 50);
      expect(result.subIndex).toBeNull();
      expect(result.averagingNote).toBe('Standard not applicable');
    });
  });

  describe('getEpaTierFromValue', () => {
    it('maps numerical AQI into standard EPA tiers across full spectrum', () => {
      expect(getEpaTierFromValue(0)?.label).toBe('Good');
      expect(getEpaTierFromValue(25)?.label).toBe('Good');
      expect(getEpaTierFromValue(50)?.label).toBe('Good');
      expect(getEpaTierFromValue(75)?.label).toBe('Moderate');
      expect(getEpaTierFromValue(100)?.label).toBe('Moderate');
      expect(getEpaTierFromValue(125)?.label).toBe('Unhealthy for Sensitive Groups');
      expect(getEpaTierFromValue(150)?.label).toBe('Unhealthy for Sensitive Groups');
      expect(getEpaTierFromValue(175)?.label).toBe('Unhealthy');
      expect(getEpaTierFromValue(200)?.label).toBe('Unhealthy');
      expect(getEpaTierFromValue(250)?.label).toBe('Very Unhealthy');
      expect(getEpaTierFromValue(300)?.label).toBe('Very Unhealthy');
      expect(getEpaTierFromValue(350)?.label).toBe('Hazardous');
      expect(getEpaTierFromValue(500)?.label).toBe('Hazardous');
    });

    it('returns null for null, negative or non-finite inputs', () => {
      expect(getEpaTierFromValue(null)).toBeNull();
      expect(getEpaTierFromValue(-10)).toBeNull();
      expect(getEpaTierFromValue(NaN)).toBeNull();
    });
  });
});
