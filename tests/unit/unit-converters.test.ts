import { describe, it, expect } from 'vitest';
import { convertCoUgM3ToPpm, POLLUTANT_METADATA } from '@/domain/aqi/unit-converters';

describe('Unit Converters & Chemical Metadata', () => {
  it('contains metadata for all 6 required pollutants', () => {
    expect(Object.keys(POLLUTANT_METADATA)).toEqual([
      'pm2_5',
      'pm10',
      'nitrogen_dioxide',
      'ozone',
      'sulphur_dioxide',
      'carbon_monoxide',
    ]);
    expect(POLLUTANT_METADATA.pm2_5.chemicalFormula).toBe('PM₂.₅');
    expect(POLLUTANT_METADATA.carbon_monoxide.chemicalFormula).toBe('CO');
  });

  it('converts CO concentration from μg/m³ to ppm at STP correctly', () => {
    // 1 ppm ≈ 1,145.6 μg/m³
    expect(convertCoUgM3ToPpm(1145.6)).toBe(1.0);
    expect(convertCoUgM3ToPpm(2291.2)).toBe(2.0);
    expect(convertCoUgM3ToPpm(572.8)).toBe(0.5);
    expect(convertCoUgM3ToPpm(0)).toBe(0);
  });

  it('handles null, negative, or invalid values safely', () => {
    expect(convertCoUgM3ToPpm(null)).toBeNull();
    expect(convertCoUgM3ToPpm(-100)).toBeNull();
    expect(convertCoUgM3ToPpm(NaN)).toBeNull();
  });
});
