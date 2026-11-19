/**
 * European Air Quality Index (EAQI) Domain Module
 * Authoritative implementation of the European Environment Agency (EEA 2024) methodology.
 *
 * Requirements:
 * - Evaluates exclusively across 5 pollutants: PM2.5, PM10, NO2, O3, SO2.
 * - CO is strictly excluded from EAQI calculations.
 * - Overall EAQI level is determined by the worst level among the supported 5 pollutants.
 */

import { AqiTier, PollutantKey } from '../types';

export interface EaqiBreakpoint {
  readonly min: number;
  readonly max: number;
}

export type EaqiPollutantKey = 'pm2_5' | 'pm10' | 'nitrogen_dioxide' | 'ozone' | 'sulphur_dioxide';

// EEA 2024 Concentration Breakpoint Bands (μg/m³) for 5 levels (1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor, 6=Extremely Poor)
export const EEA_BREAKPOINTS: Record<EaqiPollutantKey, readonly EaqiBreakpoint[]> = {
  pm2_5: [
    { min: 0, max: 10 },    // Good (1)
    { min: 10, max: 20 },   // Fair (2)
    { min: 20, max: 25 },   // Moderate (3)
    { min: 25, max: 50 },   // Poor (4)
    { min: 50, max: 75 },   // Very Poor (5)
    { min: 75, max: 800 },  // Extremely Poor (6)
  ],
  pm10: [
    { min: 0, max: 20 },
    { min: 20, max: 40 },
    { min: 40, max: 50 },
    { min: 50, max: 100 },
    { min: 100, max: 150 },
    { min: 150, max: 1200 },
  ],
  nitrogen_dioxide: [
    { min: 0, max: 40 },
    { min: 40, max: 90 },
    { min: 90, max: 120 },
    { min: 120, max: 230 },
    { min: 230, max: 340 },
    { min: 340, max: 1000 },
  ],
  ozone: [
    { min: 0, max: 50 },
    { min: 50, max: 100 },
    { min: 100, max: 130 },
    { min: 130, max: 240 },
    { min: 240, max: 380 },
    { min: 380, max: 800 },
  ],
  sulphur_dioxide: [
    { min: 0, max: 100 },
    { min: 100, max: 200 },
    { min: 200, max: 350 },
    { min: 350, max: 500 },
    { min: 500, max: 750 },
    { min: 750, max: 1250 },
  ],
};

export const EAQI_TIERS: readonly AqiTier[] = [
  {
    level: 1,
    label: 'Good',
    colorToken: 'var(--aqi-good)',
    bgToken: 'var(--aqi-good-bg)',
    borderToken: 'var(--aqi-good-border)',
    description: 'Air quality is good. Environmental pollution poses little or no risk.',
    healthAdvisory: 'Enjoy your normal outdoor activities.',
  },
  {
    level: 2,
    label: 'Fair',
    colorToken: 'var(--aqi-good)',
    bgToken: 'var(--aqi-good-bg)',
    borderToken: 'var(--aqi-good-border)',
    description: 'Air quality is fair under European standards.',
    healthAdvisory: 'Individuals with sensitivities may consider pacing outdoor exertion.',
  },
  {
    level: 3,
    label: 'Moderate',
    colorToken: 'var(--aqi-moderate)',
    bgToken: 'var(--aqi-moderate-bg)',
    borderToken: 'var(--aqi-moderate-border)',
    description: 'Air quality is moderate. Slight risk for highly vulnerable individuals.',
    healthAdvisory: 'Consider reducing intense prolonged outdoor exertion if experiencing symptoms.',
  },
  {
    level: 4,
    label: 'Poor',
    colorToken: 'var(--aqi-sensitive)',
    bgToken: 'var(--aqi-sensitive-bg)',
    borderToken: 'var(--aqi-sensitive-border)',
    description: 'Air quality is poor. Noticeable effects on sensitive groups.',
    healthAdvisory: 'Anyone experiencing symptoms should reduce heavy outdoor exertion.',
  },
  {
    level: 5,
    label: 'Very Poor',
    colorToken: 'var(--aqi-very-unhealthy)',
    bgToken: 'var(--aqi-very-unhealthy-bg)',
    borderToken: 'var(--aqi-very-unhealthy-border)',
    description: 'Air quality is very poor. High adverse health impacts across population.',
    healthAdvisory: 'Avoid prolonged outdoor activities; stay indoors if sensitive.',
  },
  {
    level: 6,
    label: 'Extremely Poor',
    colorToken: 'var(--aqi-hazardous)',
    bgToken: 'var(--aqi-hazardous-bg)',
    borderToken: 'var(--aqi-hazardous-border)',
    description: 'Air quality is extremely poor. Emergency environmental alert.',
    healthAdvisory: 'All individuals should avoid all outdoor physical activity.',
  },
] as const;

/**
 * Returns the EAQI level (1 to 6) for a single pollutant based on its concentration in μg/m³.
 * Returns null if concentration is null or negative.
 */
export function getEaqiPollutantLevel(
  key: PollutantKey,
  concentration: number | null
): number | null {
  if (concentration === null || !Number.isFinite(concentration) || concentration < 0) {
    return null;
  }
  // CO is strictly not part of European EAQI
  if (key === 'carbon_monoxide') {
    return null;
  }

  const pollutantKey = key as EaqiPollutantKey;
  const bands = EEA_BREAKPOINTS[pollutantKey];
  if (!bands) {
    return null;
  }

  for (let i = 0; i < bands.length; i++) {
    const band = bands[i];
    // Upper boundary is inclusive for category assignment
    if (concentration <= band.max || i === bands.length - 1) {
      return i + 1; // Level 1 through 6
    }
  }

  return 6;
}

/**
 * Maps a continuous European EAQI numeric value (0 to 100+) to its tier.
 * Open-Meteo provides continuous EAQI values where:
 * 0-20 -> Good
 * 20-40 -> Fair
 * 40-60 -> Moderate
 * 60-80 -> Poor
 * 80-100 -> Very Poor
 * >100 -> Extremely Poor
 */
export function getEaqiTierFromValue(eaqiValue: number | null): AqiTier | null {
  if (eaqiValue === null || !Number.isFinite(eaqiValue) || eaqiValue < 0) {
    return null;
  }
  if (eaqiValue <= 20) return EAQI_TIERS[0];
  if (eaqiValue <= 40) return EAQI_TIERS[1];
  if (eaqiValue <= 60) return EAQI_TIERS[2];
  if (eaqiValue <= 80) return EAQI_TIERS[3];
  if (eaqiValue <= 100) return EAQI_TIERS[4];
  return EAQI_TIERS[5];
}
