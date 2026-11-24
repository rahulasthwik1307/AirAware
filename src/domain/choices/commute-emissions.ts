/**
 * AirAware — Commute Emissions & Impact Pure Domain Module
 * Pure TypeScript helpers for transit distance tiers, tangible impact savings,
 * fuel conservation, and financial offsets.
 * Strictly 0 React or UI dependencies.
 */

export interface DistanceTierInfo {
  readonly tier: string;
  readonly subtext: string;
  readonly badgeClass: string;
  readonly dotClass: string;
}

export const DISTANCE_PRESETS: readonly number[] = [5, 12, 20, 35];

export interface CommuteDaysPreset {
  readonly label: string;
  readonly trips: number;
  readonly subtext: string;
}

export const DAYS_PRESETS: readonly CommuteDaysPreset[] = [
  { label: '2 days', trips: 4, subtext: 'Partial' },
  { label: '3 days', trips: 6, subtext: 'Hybrid' },
  { label: '5 days', trips: 10, subtext: 'Standard' },
  { label: '7 days', trips: 14, subtext: 'Full' },
];

/**
 * Classifies one-way commute distance into transit infrastructure tiers.
 *
 * @param km - One-way commute distance in kilometers
 * @returns Tier classification and styling metadata
 */
export function getDistanceTier(km: number): DistanceTierInfo {
  if (km <= 8) {
    return {
      tier: 'Active Mobility Zone',
      subtext: 'Walking & Cycling Peak Efficiency',
      badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      dotClass: 'bg-emerald-500',
    };
  }
  if (km <= 18) {
    return {
      tier: 'Urban Transit Corridor',
      subtext: 'Electric Metro & Bus Prime Range',
      badgeClass: 'text-cyan-700 bg-cyan-50 border-cyan-200',
      dotClass: 'bg-cyan-500',
    };
  }
  if (km <= 30) {
    return {
      tier: 'Suburban Commuter Trunk',
      subtext: 'Carpool & Rapid Rail Corridor',
      badgeClass: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      dotClass: 'bg-indigo-500',
    };
  }
  return {
    tier: 'Regional Highway Corridor',
    subtext: 'High Tailpipe Winter Exposure',
    badgeClass: 'text-amber-800 bg-amber-50 border-amber-200',
    dotClass: 'bg-amber-500',
  };
}

export interface CommuteImpactSavings {
  readonly weeklyKm: number;
  readonly fuelSavedLitresWeekly: number;
  readonly directRupeesSavedMonthly: number;
}

/**
 * Calculates concrete, tangible savings conversions based on DEFRA and Indian urban transit averages.
 *
 * @param distanceKm - One-way trip distance
 * @param tripsPerWeek - Number of trips per week
 * @param avoidedKgCo2eWeekly - Avoided weekly CO2 emissions in kg
 * @returns Derived kilometers, litres of petrol conserved, and monthly financial savings in INR
 */
export function calculateCommuteImpactSavings(
  distanceKm: number,
  tripsPerWeek: number,
  avoidedKgCo2eWeekly: number
): CommuteImpactSavings {
  const weeklyKm = distanceKm * tripsPerWeek;
  const fuelSavedLitresWeekly = Number((avoidedKgCo2eWeekly / 2.31).toFixed(1));
  const directRupeesSavedMonthly = Math.round(fuelSavedLitresWeekly * 4.33 * 104); // ₹104/L avg petrol

  return {
    weeklyKm,
    fuelSavedLitresWeekly,
    directRupeesSavedMonthly,
  };
}

/**
 * Calculates visual relative bar widths for comparative emission charts.
 *
 * @param baselineKg - Baseline emissions in kg CO2e
 * @param alternativeKg - Alternative emissions in kg CO2e
 * @returns Width percentages capped at 100%
 */
export function calculateComparativeBarWidths(
  baselineKg: number,
  alternativeKg: number
): { baselineBarWidth: number; altBarWidth: number } {
  const baselineMax = Math.max(baselineKg, 1);
  const baselineBarWidth = 100;
  const altBarWidth = Math.min(100, Math.round((alternativeKg / baselineMax) * 100));
  return { baselineBarWidth, altBarWidth };
}
