/**
 * AirAware Impact Calculator — Scientific Integrity Engine
 * Strictly separates Personal Ambient Concentration Indicators (ΔC)
 * from Environmental Greenhouse Gas Emissions Reductions (CO2e).
 *
 * Adheres to Master Specification Section 3.5 & Section 11:
 * - ΔC = C_original - C_adjusted (same pollutant, compatible units & averaging periods).
 * - Never claims inhaled dose, lung deposition, or health percentage guarantees from ambient ΔC.
 * - Transport emissions avoided: discloses distance, baseline/alternative factors, and data source.
 * - Never claims that individual travel emissions clean the city's ambient AQI.
 */

import { CommuteMode } from '../household/types';
import { PollutantKey } from '../types';
import { DeltaCIndicator, TransportEmissionIndicator } from './types';

export const DELTA_C_DISCLAIMER =
  'ΔC represents a difference in modelled ambient concentration derived from Open-Meteo CAMS forecast data. It is not a measurement of personal inhaled dose and does not guarantee an individual health outcome.';

export const AIR_QUALITY_NOT_CLEANED_DISCLAIMER =
  'Avoided transport emissions reduce collective carbon footprint, but do not directly clean the measured ambient air quality of your neighborhood.';

/**
 * Calculates ambient concentration difference ΔC = C_original - C_adjusted.
 * Returns null if data is missing, incomplete, or incompatible.
 */
export function calculateDeltaC(params: {
  readonly pollutantKey: PollutantKey;
  readonly pollutantLabel: string;
  readonly unit: string;
  readonly originalConcentration: number | null | undefined;
  readonly suggestedConcentration: number | null | undefined;
  readonly providerTimestamp: string;
}): DeltaCIndicator | null {
  const {
    pollutantKey,
    pollutantLabel,
    unit,
    originalConcentration,
    suggestedConcentration,
    providerTimestamp,
  } = params;

  if (
    originalConcentration === null ||
    originalConcentration === undefined ||
    suggestedConcentration === null ||
    suggestedConcentration === undefined ||
    !Number.isFinite(originalConcentration) ||
    !Number.isFinite(suggestedConcentration) ||
    originalConcentration < 0 ||
    suggestedConcentration < 0
  ) {
    return null;
  }

  // ΔC = C_original - C_adjusted
  // Positive value indicates that adjusted window has lower ambient concentration
  const deltaValue = Number((originalConcentration - suggestedConcentration).toFixed(1));

  return {
    pollutantKey,
    pollutantLabel,
    deltaValue,
    unit,
    originalConcentration: Number(originalConcentration.toFixed(1)),
    suggestedConcentration: Number(suggestedConcentration.toFixed(1)),
    providerTimestamp,
    cautionaryNote: DELTA_C_DISCLAIMER,
  };
}

/**
 * Verified direct operational emission factors (kg CO2e per passenger-kilometer).
 * Sources:
 * - UK Department for Energy Security and Net Zero / DEFRA Conversion Factors (2023).
 * - Central Electricity Authority (CEA) India CO2 Baseline Database (Ver 19, 2023) for electric transit.
 * Note: These factors reflect direct operational/fuel combustion emissions per passenger-km.
 */
export const OPERATIONAL_EMISSION_FACTORS: Record<CommuteMode, {
  readonly factorKgPerKm: number;
  readonly description: string;
}> = {
  PRIVATE_CAR: {
    factorKgPerKm: 0.170, // Average single-occupant petrol/diesel car
    description: 'Single-occupancy passenger car (operational tailpipe)',
  },
  CARPOOL: {
    factorKgPerKm: 0.057, // 3-person carpool allocation
    description: 'Shared passenger car (~3 passengers per vehicle)',
  },
  PUBLIC_TRANSIT: {
    factorKgPerKm: 0.045, // Blended urban electric rail / bus passenger-km
    description: 'Urban electric rail / public bus fleet average',
  },
  CYCLING: {
    factorKgPerKm: 0.000, // Direct tailpipe exhaust is zero
    description: 'Bicycle (zero direct operational emissions)',
  },
  WALKING: {
    factorKgPerKm: 0.000, // Direct tailpipe exhaust is zero
    description: 'Walking (zero direct operational emissions)',
  },
};

/**
 * Calculates avoided greenhouse gas emissions (kg CO2e) for a transport shift.
 * Returns null if distance is invalid or not defensible.
 */
export function calculateAvoidedTransportEmissions(params: {
  readonly distanceKm: number | null | undefined;
  readonly baselineMode: CommuteMode;
  readonly alternativeMode: CommuteMode;
}): TransportEmissionIndicator | null {
  const { distanceKm, baselineMode, alternativeMode } = params;

  if (
    distanceKm === null ||
    distanceKm === undefined ||
    !Number.isFinite(distanceKm) ||
    distanceKm <= 0 ||
    distanceKm > 500
  ) {
    return null;
  }

  const baseline = OPERATIONAL_EMISSION_FACTORS[baselineMode];
  const alternative = OPERATIONAL_EMISSION_FACTORS[alternativeMode];

  if (!baseline || !alternative) {
    return null;
  }

  // E_avoided = Distance * (EF_baseline - EF_alternative)
  const diffPerKm = baseline.factorKgPerKm - alternative.factorKgPerKm;
  if (diffPerKm <= 0) {
    // If alternative does not have lower emissions than baseline, no savings indicated
    return null;
  }

  const avoidedCo2eKg = Number((distanceKm * diffPerKm).toFixed(2));

  return {
    distanceKm,
    baselineMode,
    alternativeMode,
    baselineFactorKgPerKm: baseline.factorKgPerKm,
    alternativeFactorKgPerKm: alternative.factorKgPerKm,
    avoidedCo2eKg,
    sourceCitation:
      'UK DESNZ / DEFRA (2023) conversion factors for road transport; CEA India Grid Emission Database (v19, 2023) for electric traction benchmark.',
    operationalScopeNote:
      'Direct operational tailpipe emissions comparison. Excludes vehicle lifecycle, battery embodied carbon, and road infrastructure overhead. Walking and cycling reflect zero direct operational exhaust emissions.',
  };
}
