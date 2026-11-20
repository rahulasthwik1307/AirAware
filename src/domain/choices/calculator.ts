/**
 * AirAware Domain Engine — Cleaner Choices & Impact Calculator
 * Deterministic, mathematically defensible calculations for transport emissions,
 * criteria pollutants (NOx, PM2.5), and dual-impact accounting.
 *
 * Adheres strictly to Master Specification Section 4.5, Section 4.6, and Section 11:
 * - Deterministic formulas with visible parameters.
 * - Zero hallucinated or speculative medical claims.
 * - Clear separation of exposure defense from tailpipe emissions.
 */

import { TRANSIT_MODES, PERSONAL_DEFENSE_DISCLAIMER, PLANETARY_AVOIDANCE_DISCLAIMER } from './constants';
import {
  CleanerTransitMode,
  CommuteComparisonResult,
  CleanerHabit,
  DualImpactSummary,
} from './types';

/**
 * Calculates comparative operational emissions between a baseline vehicle and a cleaner alternative.
 *
 * @param distanceKm One-way commute distance in kilometers (valid range 0.5 - 150 km)
 * @param tripsPerWeek Total one-way trips per week (e.g., 5 days commuting roundtrip = 10 trips)
 * @param baselineMode The baseline transport mode (typically PRIVATE_CAR)
 * @param alternativeMode The candidate alternative mode (e.g., PUBLIC_TRANSIT, CARPOOL, CYCLING)
 */
export function calculateCommuteComparison(params: {
  readonly distanceKm: number;
  readonly tripsPerWeek: number;
  readonly baselineMode?: CleanerTransitMode;
  readonly alternativeMode: CleanerTransitMode;
}): CommuteComparisonResult {
  const {
    distanceKm,
    tripsPerWeek,
    baselineMode = 'PRIVATE_CAR',
    alternativeMode,
  } = params;

  // Sanitize and bound inputs
  const safeDistance = Math.min(Math.max(0.5, Number.isFinite(distanceKm) ? distanceKm : 10), 150);
  const safeTrips = Math.min(Math.max(1, Number.isFinite(tripsPerWeek) ? tripsPerWeek : 10), 28);

  const baselineMeta = TRANSIT_MODES[baselineMode] ?? TRANSIT_MODES.PRIVATE_CAR;
  const altMeta = TRANSIT_MODES[alternativeMode] ?? TRANSIT_MODES.PUBLIC_TRANSIT;

  const weeklyKm = Number((safeDistance * safeTrips).toFixed(1));

  // CO2e Calculations (kg)
  const baselineKgCo2eWeekly = Number((weeklyKm * baselineMeta.factorKgCo2ePerKm).toFixed(2));
  const alternativeKgCo2eWeekly = Number((weeklyKm * altMeta.factorKgCo2ePerKm).toFixed(2));

  const diffWeekly = baselineKgCo2eWeekly - alternativeKgCo2eWeekly;
  const avoidedKgCo2eWeekly = diffWeekly > 0 ? Number(diffWeekly.toFixed(2)) : 0;
  const avoidedKgCo2eMonthly = Number((avoidedKgCo2eWeekly * 4.33).toFixed(1));

  const percentageCo2eReduction =
    baselineKgCo2eWeekly > 0
      ? Math.min(100, Math.max(0, Math.round((avoidedKgCo2eWeekly / baselineKgCo2eWeekly) * 100)))
      : 0;

  // Criteria Pollutants Avoided (g)
  const baselineNoxGrams = weeklyKm * baselineMeta.factorGramsNoxPerKm;
  const altNoxGrams = weeklyKm * altMeta.factorGramsNoxPerKm;
  const avoidedNoxGramsWeekly = Number(Math.max(0, baselineNoxGrams - altNoxGrams).toFixed(1));

  const baselinePm25Grams = weeklyKm * baselineMeta.factorGramsPm25PerKm;
  const altPm25Grams = weeklyKm * altMeta.factorGramsPm25PerKm;
  const avoidedPm25GramsWeekly = Number(Math.max(0, baselinePm25Grams - altPm25Grams).toFixed(2));

  // Equivalent solo car km avoided
  const equivalentUrbanCarKmWeekly =
    baselineMeta.factorKgCo2ePerKm > 0
      ? Number((avoidedKgCo2eWeekly / baselineMeta.factorKgCo2ePerKm).toFixed(1))
      : 0;

  const isCleanAlternative = avoidedKgCo2eWeekly > 0 || percentageCo2eReduction > 0;

  return {
    distanceKm: safeDistance,
    tripsPerWeek: safeTrips,
    baselineMode,
    alternativeMode,
    baselineKgCo2eWeekly,
    alternativeKgCo2eWeekly,
    avoidedKgCo2eWeekly,
    avoidedKgCo2eMonthly,
    percentageCo2eReduction,
    avoidedNoxGramsWeekly,
    avoidedPm25GramsWeekly,
    equivalentUrbanCarKmWeekly,
    isCleanAlternative,
  };
}

/**
 * Aggregates personal exposure defense and planetary emissions avoided across
 * adopted habits and the active commute alternative.
 */
export function calculateDualImpactSummary(
  habits: readonly CleanerHabit[],
  commuteImpact: CommuteComparisonResult
): DualImpactSummary {
  const adoptedHabits = habits.filter((h) => h.isAdopted);

  // Calculate habit-derived weekly exposure hours and habit-derived CO2e
  let habitExposureHoursWeekly = 0;
  let habitCo2eSavingsWeekly = 0;

  for (const habit of adoptedHabits) {
    const completionsCount = habit.weeklyCompletions.filter(Boolean).length;
    const completionFraction = completionsCount / 7;

    habitExposureHoursWeekly += habit.weeklyExposureHoursProtected * completionFraction;
    habitCo2eSavingsWeekly += habit.estimatedWeeklyCo2eSavingsKg * completionFraction;
  }

  // Personal Exposure Defense (Hours and relative ΔC)
  const exposureHoursShiftedWeekly = Number(habitExposureHoursWeekly.toFixed(1));
  const exposureTargetHoursWeekly = 6.0; // Benchmark recommended 6 hours shifted from peak smog/week
  const exposureDefenseProgressPercent = Math.min(
    100,
    Math.round((exposureHoursShiftedWeekly / exposureTargetHoursWeekly) * 100)
  );

  // Modelled average ΔC reduction (µg/m³) from shifted outdoor intervals
  const relativeAmbientDeltaC = Number((exposureHoursShiftedWeekly * 5.4).toFixed(1));

  let personalDefenseBadge = 'Baseline Schedule';
  if (exposureDefenseProgressPercent >= 75) {
    personalDefenseBadge = 'High Smog Shield';
  } else if (exposureDefenseProgressPercent >= 35) {
    personalDefenseBadge = 'Active Smog Buffer';
  }

  // Planetary Emissions Avoided (CO2e, NOx, PM2.5)
  const totalWeeklyCo2e = commuteImpact.avoidedKgCo2eWeekly + habitCo2eSavingsWeekly;
  const avoidedCo2eKgMonthly = Number((totalWeeklyCo2e * 4.33).toFixed(1));
  const avoidedCo2eTargetMonthly = 30.0; // 30 kg CO2e monthly family target
  const avoidedCo2eProgressPercent = Math.min(
    100,
    Math.round((avoidedCo2eKgMonthly / avoidedCo2eTargetMonthly) * 100)
  );

  const avoidedNoxGramsMonthly = Number((commuteImpact.avoidedNoxGramsWeekly * 4.33).toFixed(1));
  const avoidedPm25GramsMonthly = Number((commuteImpact.avoidedPm25GramsWeekly * 4.33).toFixed(1));
  const equivalentCarKmSavedMonthly = Number((commuteImpact.equivalentUrbanCarKmWeekly * 4.33).toFixed(0));

  return {
    exposureHoursShiftedWeekly,
    exposureTargetHoursWeekly,
    exposureDefenseProgressPercent,
    relativeAmbientDeltaC,
    personalDefenseBadge,

    avoidedCo2eKgMonthly,
    avoidedCo2eTargetMonthly,
    avoidedCo2eProgressPercent,
    avoidedNoxGramsMonthly,
    avoidedPm25GramsMonthly,
    equivalentCarKmSavedMonthly,

    personalDisclaimer: PERSONAL_DEFENSE_DISCLAIMER,
    planetaryDisclaimer: PLANETARY_AVOIDANCE_DISCLAIMER,
  };
}
