import { describe, it, expect } from 'vitest';
import {
  calculateDeltaC,
  calculateAvoidedTransportEmissions,
  DELTA_C_DISCLAIMER,
  OPERATIONAL_EMISSION_FACTORS,
} from '@/domain/planner/impact-calculator';

describe('Impact Calculator — Scientific Integrity & Calculations', () => {
  describe('Personal Ambient Concentration Indicator (ΔC = C_original - C_adjusted)', () => {
    it('calculates positive ΔC when the adjusted window has lower ambient concentration', () => {
      const result = calculateDeltaC({
        pollutantKey: 'pm2_5',
        pollutantLabel: 'PM2.5',
        unit: 'μg/m³',
        originalConcentration: 85.4,
        suggestedConcentration: 42.1,
        providerTimestamp: '2026-11-19T14:00:00Z',
      });

      expect(result).not.toBeNull();
      expect(result?.deltaValue).toBe(43.3);
      expect(result?.pollutantKey).toBe('pm2_5');
      expect(result?.unit).toBe('μg/m³');
      expect(result?.originalConcentration).toBe(85.4);
      expect(result?.suggestedConcentration).toBe(42.1);
      expect(result?.cautionaryNote).toBe(DELTA_C_DISCLAIMER);
    });

    it('calculates negative or zero ΔC accurately without manipulation', () => {
      const result = calculateDeltaC({
        pollutantKey: 'pm10',
        pollutantLabel: 'PM10',
        unit: 'μg/m³',
        originalConcentration: 50.0,
        suggestedConcentration: 65.2,
        providerTimestamp: '2026-11-19T18:00:00Z',
      });

      expect(result).not.toBeNull();
      expect(result?.deltaValue).toBe(-15.2);
    });

    it('returns null if either concentration is null, undefined, NaN, negative, or infinite', () => {
      expect(
        calculateDeltaC({
          pollutantKey: 'pm2_5',
          pollutantLabel: 'PM2.5',
          unit: 'μg/m³',
          originalConcentration: null,
          suggestedConcentration: 30,
          providerTimestamp: '2026-11-19T10:00:00Z',
        })
      ).toBeNull();

      expect(
        calculateDeltaC({
          pollutantKey: 'pm2_5',
          pollutantLabel: 'PM2.5',
          unit: 'μg/m³',
          originalConcentration: 50,
          suggestedConcentration: undefined,
          providerTimestamp: '2026-11-19T10:00:00Z',
        })
      ).toBeNull();

      expect(
        calculateDeltaC({
          pollutantKey: 'pm2_5',
          pollutantLabel: 'PM2.5',
          unit: 'μg/m³',
          originalConcentration: -10,
          suggestedConcentration: 30,
          providerTimestamp: '2026-11-19T10:00:00Z',
        })
      ).toBeNull();

      expect(
        calculateDeltaC({
          pollutantKey: 'pm2_5',
          pollutantLabel: 'PM2.5',
          unit: 'μg/m³',
          originalConcentration: Infinity,
          suggestedConcentration: 30,
          providerTimestamp: '2026-11-19T10:00:00Z',
        })
      ).toBeNull();
    });

    it('explicitly includes the mandatory non-dosage disclosure', () => {
      const result = calculateDeltaC({
        pollutantKey: 'pm2_5',
        pollutantLabel: 'PM2.5',
        unit: 'μg/m³',
        originalConcentration: 60,
        suggestedConcentration: 30,
        providerTimestamp: '2026-11-19T12:00:00Z',
      });

      expect(result?.cautionaryNote).toContain('not a measurement of personal inhaled dose');
      expect(result?.cautionaryNote).toContain('does not guarantee an individual health outcome');
    });
  });

  describe('Transport Emission Reductions (Avoided CO2e)', () => {
    it('calculates avoided emissions for switching from private car to public transit', () => {
      const distanceKm = 10;
      const result = calculateAvoidedTransportEmissions({
        distanceKm,
        baselineMode: 'PRIVATE_CAR',
        alternativeMode: 'PUBLIC_TRANSIT',
      });

      // Car = 0.170 kg/km, Transit = 0.045 kg/km -> diff = 0.125 kg/km * 10 km = 1.25 kg CO2e
      expect(result).not.toBeNull();
      expect(result?.avoidedCo2eKg).toBe(1.25);
      expect(result?.distanceKm).toBe(10);
      expect(result?.sourceCitation).toContain('DEFRA');
      expect(result?.operationalScopeNote).toContain('operational tailpipe');
    });

    it('calculates avoided emissions for switching from private car to cycling (zero tailpipe)', () => {
      const distanceKm = 5;
      const result = calculateAvoidedTransportEmissions({
        distanceKm,
        baselineMode: 'PRIVATE_CAR',
        alternativeMode: 'CYCLING',
      });

      // Car = 0.170 kg/km, Cycling = 0.000 kg/km -> diff = 0.170 * 5 = 0.85 kg CO2e
      expect(result).not.toBeNull();
      expect(result?.avoidedCo2eKg).toBe(0.85);
      expect(OPERATIONAL_EMISSION_FACTORS.CYCLING.factorKgPerKm).toBe(0);
    });

    it('returns null when distance is zero, negative, extreme (>500km), or non-finite', () => {
      expect(
        calculateAvoidedTransportEmissions({
          distanceKm: 0,
          baselineMode: 'PRIVATE_CAR',
          alternativeMode: 'PUBLIC_TRANSIT',
        })
      ).toBeNull();

      expect(
        calculateAvoidedTransportEmissions({
          distanceKm: -5,
          baselineMode: 'PRIVATE_CAR',
          alternativeMode: 'PUBLIC_TRANSIT',
        })
      ).toBeNull();

      expect(
        calculateAvoidedTransportEmissions({
          distanceKm: 750,
          baselineMode: 'PRIVATE_CAR',
          alternativeMode: 'PUBLIC_TRANSIT',
        })
      ).toBeNull();

      expect(
        calculateAvoidedTransportEmissions({
          distanceKm: Infinity,
          baselineMode: 'PRIVATE_CAR',
          alternativeMode: 'PUBLIC_TRANSIT',
        })
      ).toBeNull();
    });

    it('returns null when alternative has higher or equal emissions than baseline', () => {
      const result = calculateAvoidedTransportEmissions({
        distanceKm: 10,
        baselineMode: 'WALKING',
        alternativeMode: 'PRIVATE_CAR',
      });
      expect(result).toBeNull();
    });
  });
});
