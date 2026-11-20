/**
 * AirAware Domain Types — Cleaner Choices & Impact (Phase 6)
 * Authoritative types for sustainable mobility comparisons, criteria pollutant modeling,
 * low-emission habit adoption, and dual-impact accounting.
 *
 * Adheres to Master Specification Section 4.5, Section 4.6, and Section 11:
 * - Deterministic, auditable formulas.
 * - Strict separation of Personal Exposure Defense (ΔC) from Environmental Emissions (CO2e).
 * - Full disclosure of factors, distances, and occupancy baselines.
 */

import { CommuteMode } from '../household/types';

export type CleanerTransitMode =
  | 'PRIVATE_CAR'
  | 'CARPOOL'
  | 'PUBLIC_TRANSIT'
  | 'CYCLING'
  | 'WALKING';

export interface TransitModeMetadata {
  readonly mode: CleanerTransitMode;
  readonly label: string;
  readonly shortLabel: string;
  readonly icon: string;
  readonly category: 'PRIVATE' | 'SHARED' | 'ACTIVE';
  readonly factorKgCo2ePerKm: number;
  readonly factorGramsNoxPerKm: number;
  readonly factorGramsPm25PerKm: number;
  readonly typicalOccupancy: number;
  readonly description: string;
  readonly sourceCitation: string;
}

export interface CommuteComparisonResult {
  readonly distanceKm: number;
  readonly tripsPerWeek: number;
  readonly baselineMode: CleanerTransitMode;
  readonly alternativeMode: CleanerTransitMode;
  readonly baselineKgCo2eWeekly: number;
  readonly alternativeKgCo2eWeekly: number;
  readonly avoidedKgCo2eWeekly: number;
  readonly avoidedKgCo2eMonthly: number;
  readonly percentageCo2eReduction: number;
  readonly avoidedNoxGramsWeekly: number;
  readonly avoidedPm25GramsWeekly: number;
  readonly equivalentUrbanCarKmWeekly: number;
  readonly isCleanAlternative: boolean;
}

export type HabitCategory =
  | 'COMMUTE'
  | 'SMOG_TIMING'
  | 'INDOOR_DEFENSE'
  | 'ENERGY_COOKING';

export interface CleanerHabit {
  readonly id: string;
  readonly title: string;
  readonly category: HabitCategory;
  readonly icon: string;
  readonly description: string;
  readonly exposureDefenseBenefit: string; // Plain-language breathing zone benefit
  readonly estimatedWeeklyCo2eSavingsKg: number;
  readonly weeklyExposureHoursProtected: number;
  readonly isAdopted: boolean;
  /** 7-element boolean array for Mon (0) through Sun (6) of current week */
  readonly weeklyCompletions: readonly boolean[];
  readonly currentStreakDays: number;
}

export interface DualImpactSummary {
  // Personal Exposure Defense (Health & Breathing Zone)
  readonly exposureHoursShiftedWeekly: number;
  readonly exposureTargetHoursWeekly: number;
  readonly exposureDefenseProgressPercent: number;
  readonly relativeAmbientDeltaC: number; // In µg/m³
  readonly personalDefenseBadge: string;

  // Planetary Emissions Avoided (Climate & Urban Airshed)
  readonly avoidedCo2eKgMonthly: number;
  readonly avoidedCo2eTargetMonthly: number;
  readonly avoidedCo2eProgressPercent: number;
  readonly avoidedNoxGramsMonthly: number;
  readonly avoidedPm25GramsMonthly: number;
  readonly equivalentCarKmSavedMonthly: number;

  // Scientific Disclaimers
  readonly personalDisclaimer: string;
  readonly planetaryDisclaimer: string;
}

export interface CleanerChoicesPreferences {
  readonly commuteDistanceKm: number;
  readonly tripsPerWeek: number;
  readonly baselineMode: CleanerTransitMode;
  readonly selectedAlternative: CleanerTransitMode;
  readonly habits: readonly CleanerHabit[];
  readonly lastActiveTimestamp: string;
}
