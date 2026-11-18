import { describe, it, expect } from 'vitest';

function calculateDispersion(windSpeed: number | null, humidity: number | null): {
  dispersionIndex: 'POOR' | 'MODERATE' | 'GOOD';
  dispersionNote: string;
} {
  if (windSpeed !== null && windSpeed < 6 && humidity !== null && humidity > 70) {
    return {
      dispersionIndex: 'POOR',
      dispersionNote: 'Stagnant boundary layer • High humidity traps ground particulates.',
    };
  }
  if (windSpeed !== null && windSpeed > 18) {
    return {
      dispersionIndex: 'GOOD',
      dispersionNote: 'Active atmospheric ventilation • High wind aids pollutant dispersal.',
    };
  }
  if (windSpeed !== null && windSpeed < 8) {
    return {
      dispersionIndex: 'POOR',
      dispersionNote: 'Calm winds • Slow vertical dispersion promotes localized buildup.',
    };
  }
  return {
    dispersionIndex: 'MODERATE',
    dispersionNote: 'Normal atmospheric mixing conditions.',
  };
}

describe('Atmospheric Dispersion Vector Logic', () => {
  it('correctly detects thermal inversion conditions (calm wind + high humidity)', () => {
    const result = calculateDispersion(3.2, 85);
    expect(result.dispersionIndex).toBe('POOR');
    expect(result.dispersionNote).toContain('Stagnant boundary layer');
  });

  it('correctly detects active ventilation during strong winds', () => {
    const result = calculateDispersion(22.5, 45);
    expect(result.dispersionIndex).toBe('GOOD');
    expect(result.dispersionNote).toContain('Active atmospheric ventilation');
  });

  it('classifies normal conditions as moderate', () => {
    const result = calculateDispersion(12.0, 50);
    expect(result.dispersionIndex).toBe('MODERATE');
  });
});
