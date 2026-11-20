import { describe, it, expect } from 'vitest';
import {
  calculateCadrAch,
  evaluateVentilationPoint,
  evaluateVentilationCurve,
  getStandardRoomProfiles,
} from '@/domain/indoor/calculations';

describe('Indoor Air Calculations — CADR and ACH Sizer', () => {
  it('correctly calculates volume, required CADR, and estimated ACH', () => {
    // 20 m² room, 2.5m ceiling -> 50 m³ volume
    // Target: 4 ACH -> Required CADR = 200 m³/h
    // Purifier CADR = 250 m³/h -> Estimated ACH = 5.0
    const calc = calculateCadrAch(20, 2.5, 4.0, 250);

    expect(calc.roomVolumeM3).toBe(50);
    expect(calc.requiredCadrM3h).toBe(200);
    expect(calc.estimatedAch).toBe(5.0);
    expect(calc.isTargetMet).toBe(true);
    expect(calc.isUnderpowered).toBe(false);
    expect(calc.deratedSleepAch).toBe(2.0); // 250 * 0.4 / 50 = 2.0
  });

  it('flags an underpowered purifier delivering less than 2.0 ACH', () => {
    // 30 m² room, 3.0m ceiling -> 90 m³ volume
    // Purifier CADR = 100 m³/h -> Estimated ACH = 1.1 (< 2.0 ACH)
    const calc = calculateCadrAch(30, 3.0, 4.0, 100);

    expect(calc.roomVolumeM3).toBe(90);
    expect(calc.estimatedAch).toBe(1.1);
    expect(calc.isUnderpowered).toBe(true);
    expect(calc.isTargetMet).toBe(false);
  });

  it('handles edge cases safely without throwing or NaN', () => {
    const calc = calculateCadrAch(0, 0, 0, 0);

    expect(calc.roomVolumeM3).toBeGreaterThan(0);
    expect(calc.estimatedAch).toBe(0);
    expect(calc.isUnderpowered).toBe(true);
  });
});

describe('Multi-Factor Ventilation Curve Evaluation', () => {
  it('evaluates favorable window when outdoor PM2.5 and ozone are low', () => {
    const point = evaluateVentilationPoint({
      time: '2026-11-20T14:00',
      pm25: 18,
      ozone: 45,
      temperatureC: 22,
      humidityPercent: 55,
    });

    expect(point.suitability).toBe('FAVORABLE');
    expect(point.summary).toContain('Outdoor air is favorable');
    expect(point.factors.length).toBeGreaterThanOrEqual(2);
    expect(point.factors.find((f) => f.name.includes('PM2.5'))?.status).toBe('good');
  });

  it('evaluates caution when outdoor PM2.5 is elevated during thermal inversion', () => {
    const point = evaluateVentilationPoint({
      time: '2026-11-20T21:00',
      pm25: 145,
      ozone: 30,
      temperatureC: 15,
      humidityPercent: 70,
    });

    expect(point.suitability).toBe('CAUTION');
    expect(point.summary).toContain('Keep windows closed');
    expect(point.factors.find((f) => f.name.includes('PM2.5'))?.status).toBe('caution');
  });

  it('evaluates caution when afternoon photochemical ozone exceeds threshold', () => {
    const point = evaluateVentilationPoint({
      time: '2026-11-20T15:00',
      pm25: 25,
      ozone: 130, // Elevated O3
      temperatureC: 32,
      humidityPercent: 40,
    });

    expect(point.suitability).toBe('CAUTION');
    expect(point.factors.find((f) => f.name.includes('Ozone'))?.status).toBe('caution');
  });

  it('returns empty array when hourly dataset is empty', () => {
    expect(evaluateVentilationCurve([])).toEqual([]);
  });
});

describe('Standard Room Profiles', () => {
  it('supplies 4 foundational room types with practical non-fabricated guidance', () => {
    const rooms = getStandardRoomProfiles();
    expect(rooms.length).toBe(4);

    const kitchen = rooms.find((r) => r.id === 'kitchen');
    expect(kitchen).toBeDefined();
    expect(kitchen?.practicalMitigations.some((m) => m.action.includes('rear burners'))).toBe(true);
    expect(kitchen?.practicalMitigations.some((m) => m.action.includes('exhaust hood'))).toBe(true);

    const bedroom = rooms.find((r) => r.id === 'bedroom');
    expect(bedroom).toBeDefined();
    expect(bedroom?.primaryPollutantRisks.some((p) => p.pollutant.includes('CO2'))).toBe(true);
  });
});
