import { describe, it, expect } from 'vitest';
import {
  EEA_BREAKPOINTS,
  getEaqiPollutantLevel,
  getEaqiTierFromValue,
} from '@/domain/aqi/european-aqi';

describe('European Air Quality Index (EEA 2024) Domain Module', () => {
  describe('Breakpoints & Pollutant Coverage', () => {
    it('verifies that exactly 5 pollutants are defined in EEA_BREAKPOINTS', () => {
      const pollutants = Object.keys(EEA_BREAKPOINTS);
      expect(pollutants).toEqual([
        'pm2_5',
        'pm10',
        'nitrogen_dioxide',
        'ozone',
        'sulphur_dioxide',
      ]);
      expect(pollutants).not.toContain('carbon_monoxide');
    });

    it('strictly returns null for carbon_monoxide (CO excluded from EAQI)', () => {
      expect(getEaqiPollutantLevel('carbon_monoxide', 500)).toBeNull();
      expect(getEaqiPollutantLevel('carbon_monoxide', 0)).toBeNull();
    });

    it('evaluates PM2.5 levels across all 6 EEA bands correctly', () => {
      expect(getEaqiPollutantLevel('pm2_5', 5)).toBe(1); // Good: 0-10
      expect(getEaqiPollutantLevel('pm2_5', 10)).toBe(1); // Boundary Good
      expect(getEaqiPollutantLevel('pm2_5', 15)).toBe(2); // Fair: 10-20
      expect(getEaqiPollutantLevel('pm2_5', 22)).toBe(3); // Moderate: 20-25
      expect(getEaqiPollutantLevel('pm2_5', 35)).toBe(4); // Poor: 25-50
      expect(getEaqiPollutantLevel('pm2_5', 60)).toBe(5); // Very Poor: 50-75
      expect(getEaqiPollutantLevel('pm2_5', 90)).toBe(6); // Extremely Poor: >75
    });

    it('evaluates NO2 levels correctly', () => {
      expect(getEaqiPollutantLevel('nitrogen_dioxide', 25)).toBe(1); // Good: 0-40
      expect(getEaqiPollutantLevel('nitrogen_dioxide', 60)).toBe(2); // Fair: 40-90
      expect(getEaqiPollutantLevel('nitrogen_dioxide', 100)).toBe(3); // Moderate: 90-120
      expect(getEaqiPollutantLevel('nitrogen_dioxide', 180)).toBe(4); // Poor: 120-230
      expect(getEaqiPollutantLevel('nitrogen_dioxide', 280)).toBe(5); // Very Poor: 230-340
      expect(getEaqiPollutantLevel('nitrogen_dioxide', 400)).toBe(6); // Extremely Poor: >340
    });
  });

  describe('EAQI Continuous Numeric Value Mapping', () => {
    it('maps continuous Open-Meteo EAQI values to correct EAQI tiers', () => {
      expect(getEaqiTierFromValue(10)?.label).toBe('Good');
      expect(getEaqiTierFromValue(20)?.label).toBe('Good');
      expect(getEaqiTierFromValue(25)?.label).toBe('Fair');
      expect(getEaqiTierFromValue(40)?.label).toBe('Fair');
      expect(getEaqiTierFromValue(50)?.label).toBe('Moderate');
      expect(getEaqiTierFromValue(60)?.label).toBe('Moderate');
      expect(getEaqiTierFromValue(70)?.label).toBe('Poor');
      expect(getEaqiTierFromValue(80)?.label).toBe('Poor');
      expect(getEaqiTierFromValue(90)?.label).toBe('Very Poor');
      expect(getEaqiTierFromValue(100)?.label).toBe('Very Poor');
      expect(getEaqiTierFromValue(120)?.label).toBe('Extremely Poor');
    });

    it('handles null and invalid EAQI values safely without crashing', () => {
      expect(getEaqiTierFromValue(null)).toBeNull();
      expect(getEaqiTierFromValue(-5)).toBeNull();
      expect(getEaqiTierFromValue(NaN)).toBeNull();
    });
  });
});
