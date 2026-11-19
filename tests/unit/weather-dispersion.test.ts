import { describe, it, expect } from 'vitest';

/**
 * Surface Meteorology Domain Test Suite
 * Scientific Audit: Surface weather observations (2m temperature & humidity, 10m wind)
 * must be presented neutrally and must NEVER claim proof of thermal inversion or boundary-layer mixing
 * without validated upper-air sounding/lapse-rate observations.
 */

function getWindCardinal(degrees: number | null): string {
  if (degrees === null || !Number.isFinite(degrees)) return 'N/A';
  const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees % 360) / 22.5)) % 16;
  return cardinals[index];
}

interface SurfaceWeatherContext {
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDirectionCardinal: string;
  hasInversionClaim: boolean;
  hasMixingClaim: boolean;
  scientificExplorationNote: string;
}

function evaluateSurfaceWeather(
  temperature: number | null,
  humidity: number | null,
  windSpeed: number | null,
  windDirectionDegrees: number | null
): SurfaceWeatherContext {
  return {
    temperature,
    humidity,
    windSpeed,
    windDirectionCardinal: getWindCardinal(windDirectionDegrees),
    hasInversionClaim: false, // Inversion requires upper-air temperature lapse rates
    hasMixingClaim: false,    // Boundary-layer mixing requires PBL height soundings
    scientificExplorationNote:
      'Surface weather parameters from numerical forecast models. Surface winds provide horizontal transport; boundary-layer height and vertical temperature profiles (inversions) require upper-air atmospheric soundings not captured in surface observations.',
  };
}

describe('Surface Meteorology & Scientific Honesty', () => {
  it('correctly maps 16-point compass cardinals from degrees', () => {
    expect(getWindCardinal(0)).toBe('N');
    expect(getWindCardinal(90)).toBe('E');
    expect(getWindCardinal(180)).toBe('S');
    expect(getWindCardinal(270)).toBe('W');
    expect(getWindCardinal(315)).toBe('NW');
    expect(getWindCardinal(null)).toBe('N/A');
    expect(getWindCardinal(NaN)).toBe('N/A');
  });

  it('rejects unvalidated inversion and mixing claims from surface observations alone', () => {
    // Under calm surface winds and high humidity, ensure no ungrounded inversion claim is made
    const result = evaluateSurfaceWeather(14.5, 88, 3.2, 280);

    expect(result.hasInversionClaim).toBe(false);
    expect(result.hasMixingClaim).toBe(false);
    expect(result.scientificExplorationNote).toContain('boundary-layer height');
    expect(result.scientificExplorationNote).toContain('upper-air atmospheric soundings');
  });

  it('maintains neutral presentation across diverse surface conditions', () => {
    const briskWind = evaluateSurfaceWeather(28.0, 42, 25.5, 90);
    expect(briskWind.temperature).toBe(28.0);
    expect(briskWind.humidity).toBe(42);
    expect(briskWind.windSpeed).toBe(25.5);
    expect(briskWind.windDirectionCardinal).toBe('E');
    expect(briskWind.hasInversionClaim).toBe(false);

    const missingData = evaluateSurfaceWeather(null, null, null, null);
    expect(briskWind.hasInversionClaim).toBe(false);
    expect(missingData.windDirectionCardinal).toBe('N/A');
  });
});
