/**
 * US EPA Air Quality Index (AQI) Domain Module
 * Implements authoritative EPA-454/B-18-007 specifications and 40 CFR Part 58 Appendix G.
 *
 * Requirements:
 * - Open-Meteo's supplied us_aqi is the primary displayed value.
 * - This module provides reference calculations, sub-index evaluations, and tier mappings
 *   for ALL 6 criteria pollutants (PM2.5, PM10, O3, NO2, SO2, CO).
 */

import { AqiTier, PollutantKey } from '../types';

export interface EpaBreakpoint {
  readonly bpLo: number;
  readonly bpHi: number;
  readonly iLo: number;
  readonly iHi: number;
  readonly category: string;
}

// EPA PM2.5 Breakpoints (24-hour average in μg/m³) - EPA-454/B-18-007 Table 2
export const EPA_PM25_BREAKPOINTS: readonly EpaBreakpoint[] = [
  { bpLo: 0.0, bpHi: 12.0, iLo: 0, iHi: 50, category: 'Good' },
  { bpLo: 12.1, bpHi: 35.4, iLo: 51, iHi: 100, category: 'Moderate' },
  { bpLo: 35.5, bpHi: 55.4, iLo: 101, iHi: 150, category: 'Unhealthy for Sensitive Groups' },
  { bpLo: 55.5, bpHi: 150.4, iLo: 151, iHi: 200, category: 'Unhealthy' },
  { bpLo: 150.5, bpHi: 250.4, iLo: 201, iHi: 300, category: 'Very Unhealthy' },
  { bpLo: 250.5, bpHi: 350.4, iLo: 301, iHi: 400, category: 'Hazardous' },
  { bpLo: 350.5, bpHi: 500.4, iLo: 401, iHi: 500, category: 'Hazardous' },
] as const;

// EPA PM10 Breakpoints (24-hour average in μg/m³)
export const EPA_PM10_BREAKPOINTS: readonly EpaBreakpoint[] = [
  { bpLo: 0, bpHi: 54, iLo: 0, iHi: 50, category: 'Good' },
  { bpLo: 55, bpHi: 154, iLo: 51, iHi: 100, category: 'Moderate' },
  { bpLo: 155, bpHi: 254, iLo: 101, iHi: 150, category: 'Unhealthy for Sensitive Groups' },
  { bpLo: 255, bpHi: 354, iLo: 151, iHi: 200, category: 'Unhealthy' },
  { bpLo: 355, bpHi: 424, iLo: 201, iHi: 300, category: 'Very Unhealthy' },
  { bpLo: 425, bpHi: 504, iLo: 301, iHi: 400, category: 'Hazardous' },
  { bpLo: 505, bpHi: 604, iLo: 401, iHi: 500, category: 'Hazardous' },
] as const;

// EPA Ozone (O3) Breakpoints (8-hour average in ppm)
export const EPA_O3_8H_BREAKPOINTS: readonly EpaBreakpoint[] = [
  { bpLo: 0.000, bpHi: 0.054, iLo: 0, iHi: 50, category: 'Good' },
  { bpLo: 0.055, bpHi: 0.070, iLo: 51, iHi: 100, category: 'Moderate' },
  { bpLo: 0.071, bpHi: 0.085, iLo: 101, iHi: 150, category: 'Unhealthy for Sensitive Groups' },
  { bpLo: 0.086, bpHi: 0.105, iLo: 151, iHi: 200, category: 'Unhealthy' },
  { bpLo: 0.106, bpHi: 0.200, iLo: 201, iHi: 300, category: 'Very Unhealthy' },
] as const;

// EPA Nitrogen Dioxide (NO2) Breakpoints (1-hour in ppb)
export const EPA_NO2_1H_BREAKPOINTS: readonly EpaBreakpoint[] = [
  { bpLo: 0, bpHi: 53, iLo: 0, iHi: 50, category: 'Good' },
  { bpLo: 54, bpHi: 100, iLo: 51, iHi: 100, category: 'Moderate' },
  { bpLo: 101, bpHi: 360, iLo: 101, iHi: 150, category: 'Unhealthy for Sensitive Groups' },
  { bpLo: 361, bpHi: 649, iLo: 151, iHi: 200, category: 'Unhealthy' },
  { bpLo: 650, bpHi: 1249, iLo: 201, iHi: 300, category: 'Very Unhealthy' },
] as const;

// EPA Sulphur Dioxide (SO2) Breakpoints (1-hour in ppb)
export const EPA_SO2_1H_BREAKPOINTS: readonly EpaBreakpoint[] = [
  { bpLo: 0, bpHi: 35, iLo: 0, iHi: 50, category: 'Good' },
  { bpLo: 36, bpHi: 75, iLo: 51, iHi: 100, category: 'Moderate' },
  { bpLo: 76, bpHi: 185, iLo: 101, iHi: 150, category: 'Unhealthy for Sensitive Groups' },
  { bpLo: 186, bpHi: 304, iLo: 151, iHi: 200, category: 'Unhealthy' },
  { bpLo: 305, bpHi: 604, iLo: 201, iHi: 300, category: 'Very Unhealthy' },
] as const;

// EPA Carbon Monoxide (CO) Breakpoints (8-hour average in ppm)
export const EPA_CO_BREAKPOINTS: readonly EpaBreakpoint[] = [
  { bpLo: 0.0, bpHi: 4.4, iLo: 0, iHi: 50, category: 'Good' },
  { bpLo: 4.5, bpHi: 9.4, iLo: 51, iHi: 100, category: 'Moderate' },
  { bpLo: 9.5, bpHi: 12.4, iLo: 101, iHi: 150, category: 'Unhealthy for Sensitive Groups' },
  { bpLo: 12.5, bpHi: 15.4, iLo: 151, iHi: 200, category: 'Unhealthy' },
  { bpLo: 15.5, bpHi: 30.4, iLo: 201, iHi: 300, category: 'Very Unhealthy' },
  { bpLo: 30.5, bpHi: 40.4, iLo: 301, iHi: 400, category: 'Hazardous' },
  { bpLo: 40.5, bpHi: 50.4, iLo: 401, iHi: 500, category: 'Hazardous' },
] as const;

export const EPA_TIERS: readonly AqiTier[] = [
  {
    level: 1,
    label: 'Good',
    colorToken: 'var(--aqi-good)',
    bgToken: 'var(--aqi-good-bg)',
    borderToken: 'var(--aqi-good-border)',
    description: 'Air quality is satisfactory; air pollution poses little or no risk.',
    healthAdvisory: 'Air quality is ideal for all outdoor activities.',
  },
  {
    level: 2,
    label: 'Moderate',
    colorToken: 'var(--aqi-moderate)',
    bgToken: 'var(--aqi-moderate-bg)',
    borderToken: 'var(--aqi-moderate-border)',
    description: 'Air quality is acceptable; slight concern for very sensitive people.',
    healthAdvisory: 'Unusually sensitive individuals should consider reducing prolonged outdoor exertion.',
  },
  {
    level: 3,
    label: 'Unhealthy for Sensitive Groups',
    colorToken: 'var(--aqi-sensitive)',
    bgToken: 'var(--aqi-sensitive-bg)',
    borderToken: 'var(--aqi-sensitive-border)',
    description: 'Members of sensitive groups may experience adverse health effects.',
    healthAdvisory: 'Children, older adults, and people with respiratory conditions should limit exertion.',
  },
  {
    level: 4,
    label: 'Unhealthy',
    colorToken: 'var(--aqi-unhealthy)',
    bgToken: 'var(--aqi-unhealthy-bg)',
    borderToken: 'var(--aqi-unhealthy-border)',
    description: 'Some members of the general public may experience health effects.',
    healthAdvisory: 'Everyone should reduce prolonged or heavy outdoor exertion.',
  },
  {
    level: 5,
    label: 'Very Unhealthy',
    colorToken: 'var(--aqi-very-unhealthy)',
    bgToken: 'var(--aqi-very-unhealthy-bg)',
    borderToken: 'var(--aqi-very-unhealthy-border)',
    description: 'Health alert: The risk of health effects is increased for everyone.',
    healthAdvisory: 'Avoid heavy or prolonged outdoor exertion; consider moving activities indoors.',
  },
  {
    level: 6,
    label: 'Hazardous',
    colorToken: 'var(--aqi-hazardous)',
    bgToken: 'var(--aqi-hazardous-bg)',
    borderToken: 'var(--aqi-hazardous-border)',
    description: 'Health warning of emergency conditions: Everyone is more likely to be affected.',
    healthAdvisory: 'All outdoor physical activities should be avoided.',
  },
] as const;

/**
 * Maps a numeric US EPA AQI value (0 to 500) to its corresponding AqiTier.
 */
export function getEpaTierFromValue(aqiValue: number | null): AqiTier | null {
  if (aqiValue === null || !Number.isFinite(aqiValue) || aqiValue < 0) {
    return null;
  }
  if (aqiValue <= 50) return EPA_TIERS[0];
  if (aqiValue <= 100) return EPA_TIERS[1];
  if (aqiValue <= 150) return EPA_TIERS[2];
  if (aqiValue <= 200) return EPA_TIERS[3];
  if (aqiValue <= 300) return EPA_TIERS[4];
  return EPA_TIERS[5];
}

/**
 * Pure TypeScript reference calculation of EPA piecewise linear formula.
 * Used for independent verification and testing.
 */
export function calculateEpaSubIndex(
  concentration: number,
  breakpoints: readonly EpaBreakpoint[]
): number {
  if (!Number.isFinite(concentration) || concentration < 0) {
    throw new RangeError(`Invalid concentration: ${concentration}. Must be non-negative finite.`);
  }

  const segment = breakpoints.find((bp) => concentration >= bp.bpLo && concentration <= bp.bpHi);

  if (!segment) {
    const highest = breakpoints[breakpoints.length - 1];
    if (concentration > highest.bpHi) {
      return 500; // Beyond the AQI
    }
    throw new RangeError(`Concentration ${concentration} falls outside breakpoint bounds.`);
  }

  const { bpLo, bpHi, iLo, iHi } = segment;
  const raw = ((iHi - iLo) / (bpHi - bpLo)) * (concentration - bpLo) + iLo;
  return Math.round(raw);
}

/**
 * Evaluates the EPA sub-index for any supported pollutant given its concentration in μg/m³.
 * Applies appropriate STP gas conversions (O3, NO2, SO2, CO) before breakpoint lookup.
 */
export function calculatePollutantEpaSubIndex(
  key: PollutantKey,
  concentrationUgM3: number | null
): { subIndex: number | null; averagingNote: string } {
  if (concentrationUgM3 === null || !Number.isFinite(concentrationUgM3) || concentrationUgM3 < 0) {
    return { subIndex: null, averagingNote: 'No data' };
  }

  try {
    switch (key) {
      case 'pm2_5':
        return {
          subIndex: calculateEpaSubIndex(concentrationUgM3, EPA_PM25_BREAKPOINTS),
          averagingNote: '24-hour average breakpoint (EPA Table 2)',
        };
      case 'pm10':
        return {
          subIndex: calculateEpaSubIndex(concentrationUgM3, EPA_PM10_BREAKPOINTS),
          averagingNote: '24-hour average breakpoint (EPA Table 2)',
        };
      case 'ozone': {
        // 1 ppm O3 ≈ 1,963 μg/m³ at 25°C, 1 atm
        const ppm = Math.round((concentrationUgM3 / 1963.0) * 1000) / 1000;
        return {
          subIndex: calculateEpaSubIndex(ppm, EPA_O3_8H_BREAKPOINTS),
          averagingNote: '8-hour running average breakpoint (EPA Table 2)',
        };
      }
      case 'nitrogen_dioxide': {
        // 1 ppb NO2 ≈ 1.88 μg/m³ at 25°C, 1 atm
        const ppb = Math.round(concentrationUgM3 / 1.88);
        return {
          subIndex: calculateEpaSubIndex(ppb, EPA_NO2_1H_BREAKPOINTS),
          averagingNote: '1-hour primary standard breakpoint',
        };
      }
      case 'sulphur_dioxide': {
        // 1 ppb SO2 ≈ 2.62 μg/m³ at 25°C, 1 atm
        const ppb = Math.round(concentrationUgM3 / 2.62);
        return {
          subIndex: calculateEpaSubIndex(ppb, EPA_SO2_1H_BREAKPOINTS),
          averagingNote: '1-hour primary standard breakpoint',
        };
      }
      case 'carbon_monoxide': {
        // 1 ppm CO ≈ 1,145.6 μg/m³ at 25°C, 1 atm
        const ppm = Math.round((concentrationUgM3 / 1145.6) * 10) / 10;
        return {
          subIndex: calculateEpaSubIndex(ppm, EPA_CO_BREAKPOINTS),
          averagingNote: '8-hour running average breakpoint (EPA Table 2)',
        };
      }
      default:
        return { subIndex: null, averagingNote: 'Standard not applicable' };
    }
  } catch {
    return { subIndex: null, averagingNote: 'Outside defined bounds' };
  }
}
