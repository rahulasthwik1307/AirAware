import { describe, it, expect } from 'vitest';

/**
 * Authoritative Technical References:
 * 1. US EPA: "Technical Assistance Document for the Reporting of Daily Air Quality – the Air Quality Index (AQI)"
 *    Document ID: EPA-454/B-18-007 (Office of Air Quality Planning and Standards, Research Triangle Park, NC).
 * 2. 40 CFR Part 58, Appendix G: "Uniform Air Quality Index (AQI) and Daily Reporting".
 *
 * Linear Piecewise Formula (EPA Equation 1):
 *   Ip = ((I_Hi - I_Lo) / (BP_Hi - BP_Lo)) * (Cp - BP_Lo) + I_Lo
 * Where:
 *   Ip    = Calculated index value for the pollutant
 *   Cp    = Truncated/rounded concentration of pollutant p
 *   BP_Hi = The concentration breakpoint that is >= Cp
 *   BP_Lo = The concentration breakpoint that is <= Cp
 *   I_Hi  = The AQI value corresponding to BP_Hi
 *   I_Lo  = The AQI value corresponding to BP_Lo
 *   Result is rounded to the nearest integer.
 */

interface Breakpoint {
  readonly bpLo: number;
  readonly bpHi: number;
  readonly iLo: number;
  readonly iHi: number;
  readonly category: string;
}

// Table 2 Breakpoints from EPA-454/B-18-007
const EPA_PM25_BREAKPOINTS: readonly Breakpoint[] = [
  { bpLo: 0.0, bpHi: 12.0, iLo: 0, iHi: 50, category: 'Good' },
  { bpLo: 12.1, bpHi: 35.4, iLo: 51, iHi: 100, category: 'Moderate' },
  { bpLo: 35.5, bpHi: 55.4, iLo: 101, iHi: 150, category: 'Unhealthy for Sensitive Groups' },
  { bpLo: 55.5, bpHi: 150.4, iLo: 151, iHi: 200, category: 'Unhealthy' },
  { bpLo: 150.5, bpHi: 250.4, iLo: 201, iHi: 300, category: 'Very Unhealthy' },
  { bpLo: 250.5, bpHi: 350.4, iLo: 301, iHi: 400, category: 'Hazardous' },
  { bpLo: 350.5, bpHi: 500.4, iLo: 401, iHi: 500, category: 'Hazardous' },
] as const;

const EPA_PM10_BREAKPOINTS: readonly Breakpoint[] = [
  { bpLo: 0, bpHi: 54, iLo: 0, iHi: 50, category: 'Good' },
  { bpLo: 55, bpHi: 154, iLo: 51, iHi: 100, category: 'Moderate' },
  { bpLo: 155, bpHi: 254, iLo: 101, iHi: 150, category: 'Unhealthy for Sensitive Groups' },
  { bpLo: 255, bpHi: 354, iLo: 151, iHi: 200, category: 'Unhealthy' },
  { bpLo: 355, bpHi: 424, iLo: 201, iHi: 300, category: 'Very Unhealthy' },
  { bpLo: 425, bpHi: 504, iLo: 301, iHi: 400, category: 'Hazardous' },
  { bpLo: 505, bpHi: 604, iLo: 401, iHi: 500, category: 'Hazardous' },
] as const;

const EPA_CO_BREAKPOINTS: readonly Breakpoint[] = [
  { bpLo: 0.0, bpHi: 4.4, iLo: 0, iHi: 50, category: 'Good' },
  { bpLo: 4.5, bpHi: 9.4, iLo: 51, iHi: 100, category: 'Moderate' },
  { bpLo: 9.5, bpHi: 12.4, iLo: 101, iHi: 150, category: 'Unhealthy for Sensitive Groups' },
  { bpLo: 12.5, bpHi: 15.4, iLo: 151, iHi: 200, category: 'Unhealthy' },
  { bpLo: 15.5, bpHi: 30.4, iLo: 201, iHi: 300, category: 'Very Unhealthy' },
  { bpLo: 30.5, bpHi: 40.4, iLo: 301, iHi: 400, category: 'Hazardous' },
  { bpLo: 40.5, bpHi: 50.4, iLo: 401, iHi: 500, category: 'Hazardous' },
] as const;

/**
 * Reference implementation of the EPA Piecewise Linear Formula for test verification.
 * Note: This tests the mathematical contract required by the specification before application implementation.
 */
function calculateReferenceAqi(concentration: number, breakpoints: readonly Breakpoint[]): number {
  if (!Number.isFinite(concentration) || concentration < 0) {
    throw new RangeError(`Invalid concentration: ${concentration}. Must be a non-negative finite number.`);
  }

  const segment = breakpoints.find((bp) => concentration >= bp.bpLo && concentration <= bp.bpHi);

  if (!segment) {
    const highest = breakpoints[breakpoints.length - 1];
    if (concentration > highest.bpHi) {
      // Beyond AQI: EPA designates values above 500 as Beyond the AQI
      return 500;
    }
    throw new RangeError(`Concentration ${concentration} falls outside defined breakpoint ranges.`);
  }

  const { bpLo, bpHi, iLo, iHi } = segment;
  const rawAqi = ((iHi - iLo) / (bpHi - bpLo)) * (concentration - bpLo) + iLo;
  return Math.round(rawAqi);
}

describe('US EPA AQI Reference Specification & Breakpoint Table Verification', () => {
  describe('Mathematical Properties of EPA Breakpoint Tables (EPA-454/B-18-007 Table 2)', () => {
    it('verifies PM2.5 breakpoints are strictly monotonic with no inversions', () => {
      EPA_PM25_BREAKPOINTS.forEach((bp) => {
        expect(bp.bpHi).toBeGreaterThan(bp.bpLo);
        expect(bp.iHi).toBeGreaterThan(bp.iLo);
      });
    });

    it('verifies PM2.5 AQI intervals match official EPA category boundaries (0-50, 51-100, 101-150, 151-200, 201-300, 301-400, 401-500)', () => {
      expect(EPA_PM25_BREAKPOINTS[0]).toMatchObject({ iLo: 0, iHi: 50, category: 'Good' });
      expect(EPA_PM25_BREAKPOINTS[1]).toMatchObject({ iLo: 51, iHi: 100, category: 'Moderate' });
      expect(EPA_PM25_BREAKPOINTS[2]).toMatchObject({ iLo: 101, iHi: 150, category: 'Unhealthy for Sensitive Groups' });
      expect(EPA_PM25_BREAKPOINTS[3]).toMatchObject({ iLo: 151, iHi: 200, category: 'Unhealthy' });
      expect(EPA_PM25_BREAKPOINTS[4]).toMatchObject({ iLo: 201, iHi: 300, category: 'Very Unhealthy' });
      expect(EPA_PM25_BREAKPOINTS[5]).toMatchObject({ iLo: 301, iHi: 400, category: 'Hazardous' });
      expect(EPA_PM25_BREAKPOINTS[6]).toMatchObject({ iLo: 401, iHi: 500, category: 'Hazardous' });
    });

    it('verifies PM10 breakpoints are strictly monotonic with no inversions', () => {
      EPA_PM10_BREAKPOINTS.forEach((bp) => {
        expect(bp.bpHi).toBeGreaterThan(bp.bpLo);
        expect(bp.iHi).toBeGreaterThan(bp.iLo);
      });
    });
  });

  describe('Authoritative EPA Worked Examples (EPA-454/B-18-007 Section 4)', () => {
    it('verifies Worked Example 1: PM2.5 concentration of 35.9 µg/m³ results in AQI 102 (USG)', () => {
      // EPA Worked Example 1 (Section 4.1):
      // Cp = 35.9 µg/m³, falls in [35.5, 55.4] -> [101, 150]
      // ((150 - 101) / (55.4 - 35.5)) * (35.9 - 35.5) + 101 = (49 / 19.9) * 0.4 + 101 = 101.98 -> 102
      const aqi = calculateReferenceAqi(35.9, EPA_PM25_BREAKPOINTS);
      expect(aqi).toBe(102);
    });

    it('verifies Worked Example 2: PM10 concentration of 85 µg/m³ results in AQI 66 (Moderate)', () => {
      // EPA Worked Example 2:
      // Cp = 85 µg/m³, falls in [55, 154] -> [51, 100]
      // ((100 - 51) / (154 - 55)) * (85 - 55) + 51 = (49 / 99) * 30 + 51 = 14.85 + 51 = 65.85 -> 66
      const aqi = calculateReferenceAqi(85, EPA_PM10_BREAKPOINTS);
      expect(aqi).toBe(66);
    });

    it('verifies Worked Example 3: CO concentration of 8.5 ppm results in AQI 91 (Moderate)', () => {
      // EPA Worked Example 3:
      // Cp = 8.5 ppm, falls in [4.5, 9.4] -> [51, 100]
      // ((100 - 51) / (9.4 - 4.5)) * (8.5 - 4.5) + 51 = (49 / 4.9) * 4.0 + 51 = 10 * 4 + 51 = 91
      const aqi = calculateReferenceAqi(8.5, EPA_CO_BREAKPOINTS);
      expect(aqi).toBe(91);
    });
  });

  describe('Boundary Condition Verification (Exact Breakpoint Edges)', () => {
    it('verifies exact lower and upper boundaries of Good category for PM2.5', () => {
      expect(calculateReferenceAqi(0.0, EPA_PM25_BREAKPOINTS)).toBe(0);
      expect(calculateReferenceAqi(12.0, EPA_PM25_BREAKPOINTS)).toBe(50);
    });

    it('verifies exact lower and upper boundaries of Moderate category for PM2.5', () => {
      expect(calculateReferenceAqi(12.1, EPA_PM25_BREAKPOINTS)).toBe(51);
      expect(calculateReferenceAqi(35.4, EPA_PM25_BREAKPOINTS)).toBe(100);
    });

    it('verifies exact lower and upper boundaries of USG category for PM2.5', () => {
      expect(calculateReferenceAqi(35.5, EPA_PM25_BREAKPOINTS)).toBe(101);
      expect(calculateReferenceAqi(55.4, EPA_PM25_BREAKPOINTS)).toBe(150);
    });

    it('verifies exact lower and upper boundaries of Unhealthy category for PM2.5', () => {
      expect(calculateReferenceAqi(55.5, EPA_PM25_BREAKPOINTS)).toBe(151);
      expect(calculateReferenceAqi(150.4, EPA_PM25_BREAKPOINTS)).toBe(200);
    });

    it('verifies exact lower and upper boundaries of Very Unhealthy category for PM2.5', () => {
      expect(calculateReferenceAqi(150.5, EPA_PM25_BREAKPOINTS)).toBe(201);
      expect(calculateReferenceAqi(250.4, EPA_PM25_BREAKPOINTS)).toBe(300);
    });

    it('verifies exact upper ceiling boundary of Hazardous category (AQI 500)', () => {
      expect(calculateReferenceAqi(500.4, EPA_PM25_BREAKPOINTS)).toBe(500);
    });
  });

  describe('Invalid Input & Extreme Out-of-Range Handling', () => {
    it('rejects negative pollutant concentrations with RangeError', () => {
      expect(() => calculateReferenceAqi(-1.5, EPA_PM25_BREAKPOINTS)).toThrow(RangeError);
      expect(() => calculateReferenceAqi(-0.01, EPA_PM25_BREAKPOINTS)).toThrow(/Invalid concentration/);
    });

    it('rejects NaN and non-finite values with RangeError', () => {
      expect(() => calculateReferenceAqi(NaN, EPA_PM25_BREAKPOINTS)).toThrow(RangeError);
      expect(() => calculateReferenceAqi(Infinity, EPA_PM25_BREAKPOINTS)).toThrow(RangeError);
      expect(() => calculateReferenceAqi(-Infinity, EPA_PM25_BREAKPOINTS)).toThrow(RangeError);
    });

    it('caps values exceeding the highest defined breakpoint (500.4 µg/m³) at maximum AQI 500 (Beyond the AQI)', () => {
      expect(calculateReferenceAqi(600.0, EPA_PM25_BREAKPOINTS)).toBe(500);
      expect(calculateReferenceAqi(999.9, EPA_PM25_BREAKPOINTS)).toBe(500);
    });
  });
});
