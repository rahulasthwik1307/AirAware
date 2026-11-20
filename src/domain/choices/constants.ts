/**
 * AirAware Domain Constants — Cleaner Choices & Impact
 * Authoritative emission factors, criteria pollutant factors, and default winter smog habits.
 *
 * Citations:
 * - UK Department for Energy Security and Net Zero / DEFRA Conversion Factors (2023).
 * - Central Electricity Authority (CEA) India CO2 Baseline Database (Ver 19, 2023).
 * - EEA / EMEP Air Pollutant Emission Inventory Guidebook (2023) for urban road transport NOx/PM.
 */

import { CleanerTransitMode, TransitModeMetadata, CleanerHabit } from './types';

export const TRANSIT_MODES: Record<CleanerTransitMode, TransitModeMetadata> = {
  PRIVATE_CAR: {
    mode: 'PRIVATE_CAR',
    label: 'Solo Petrol/Diesel Car',
    shortLabel: 'Solo Car',
    icon: '🚗',
    category: 'PRIVATE',
    factorKgCo2ePerKm: 0.170, // DEFRA 2023 average single-occupancy passenger car
    factorGramsNoxPerKm: 0.450, // EEA 2023 Euro 5/6 urban blend
    factorGramsPm25PerKm: 0.025, // Direct tailpipe exhaust soot
    typicalOccupancy: 1,
    description: 'Single-occupancy passenger car running on fossil fuel.',
    sourceCitation: 'UK DESNZ / DEFRA (2023) passenger road factors; EEA EMEP (2023).',
  },
  CARPOOL: {
    mode: 'CARPOOL',
    label: 'Shared Carpool (3 Persons)',
    shortLabel: 'Carpool',
    icon: '👥',
    category: 'SHARED',
    factorKgCo2ePerKm: 0.057, // 0.170 / 3 passengers
    factorGramsNoxPerKm: 0.150, // 0.450 / 3 passengers
    factorGramsPm25PerKm: 0.008, // 0.025 / 3 passengers
    typicalOccupancy: 3,
    description: 'Shared passenger car sharing trip energy across 3 commuters.',
    sourceCitation: 'Occupancy-allocated DEFRA (2023) passenger car benchmark.',
  },
  PUBLIC_TRANSIT: {
    mode: 'PUBLIC_TRANSIT',
    label: 'Electric Metro / Urban Rail',
    shortLabel: 'Metro',
    icon: '🚇',
    category: 'SHARED',
    factorKgCo2ePerKm: 0.035, // CEA India Grid + DEFRA urban electric rail blend
    factorGramsNoxPerKm: 0.015, // Negligible direct urban street-level emissions
    factorGramsPm25PerKm: 0.002, // Negligible street-level tailpipe soot
    typicalOccupancy: 85,
    description: 'High-capacity electric urban rail powered by municipal grid.',
    sourceCitation: 'CEA India CO2 Baseline Database (v19, 2023); DEFRA (2023).',
  },
  CYCLING: {
    mode: 'CYCLING',
    label: 'Bicycle / Cargo Bike',
    shortLabel: 'Cycle',
    icon: '🚲',
    category: 'ACTIVE',
    factorKgCo2ePerKm: 0.000,
    factorGramsNoxPerKm: 0.000,
    factorGramsPm25PerKm: 0.000,
    typicalOccupancy: 1,
    description: 'Human-powered bicycle with zero operational exhaust emissions.',
    sourceCitation: 'IPCC direct operational scope: 0 tailpipe emissions.',
  },
  WALKING: {
    mode: 'WALKING',
    label: 'Pedestrian Walking',
    shortLabel: 'Walk',
    icon: '🚶',
    category: 'ACTIVE',
    factorKgCo2ePerKm: 0.000,
    factorGramsNoxPerKm: 0.000,
    factorGramsPm25PerKm: 0.000,
    typicalOccupancy: 1,
    description: 'Zero operational emission active foot travel for short trips.',
    sourceCitation: 'IPCC direct operational scope: 0 tailpipe emissions.',
  },
};

export const DEFAULT_CLEANER_HABITS: readonly CleanerHabit[] = [
  {
    id: 'habit-transit-two-step',
    title: 'Transit Two-Step (Metro/Bus 2x/Week)',
    category: 'COMMUTE',
    icon: '🚇',
    description: 'Substitute solo car with electric metro or clean transit 2 days/week.',
    exposureDefenseBenefit: 'Reduces time trapped inside street-level traffic exhaust canyons.',
    estimatedWeeklyCo2eSavingsKg: 4.8,
    weeklyExposureHoursProtected: 2.0,
    isAdopted: true,
    weeklyCompletions: [true, false, true, false, false, false, false],
    currentStreakDays: 3,
  },
  {
    id: 'habit-smog-timing-shift',
    title: 'Off-Peak Smog Departure (+40 Min)',
    category: 'SMOG_TIMING',
    icon: '⏱️',
    description: 'Delay morning departure until inversion thermal breakup after 9:15 AM.',
    exposureDefenseBenefit: 'Avoids 45–60% peak morning PM2.5 concentrations during thermal trapping.',
    estimatedWeeklyCo2eSavingsKg: 0.5,
    weeklyExposureHoursProtected: 3.5,
    isAdopted: true,
    weeklyCompletions: [true, true, true, true, false, false, false],
    currentStreakDays: 4,
  },
  {
    id: 'habit-errand-consolidation',
    title: 'Chained Errand Trips (1 Multi-Stop Run)',
    category: 'COMMUTE',
    icon: '📦',
    description: 'Combine weekend errands into one continuous warm-engine loop.',
    exposureDefenseBenefit: 'Eliminates 3 repeated cold-engine combustion start phases where catalytic converters are cold.',
    estimatedWeeklyCo2eSavingsKg: 2.1,
    weeklyExposureHoursProtected: 1.0,
    isAdopted: true,
    weeklyCompletions: [false, false, false, false, true, false, false],
    currentStreakDays: 1,
  },
  {
    id: 'habit-clean-simmer',
    title: 'Ventilated Indoor Cooking Protocol',
    category: 'INDOOR_DEFENSE',
    icon: '🍳',
    description: 'Run kitchen exhaust and switch boiling to electric induction.',
    exposureDefenseBenefit: 'Prevents indoor NO2 and ultrafine particle spikes above WHO 24-hr guidelines.',
    estimatedWeeklyCo2eSavingsKg: 0.8,
    weeklyExposureHoursProtected: 2.5,
    isAdopted: false,
    weeklyCompletions: [false, false, false, false, false, false, false],
    currentStreakDays: 0,
  },
];

export const PERSONAL_DEFENSE_DISCLAIMER =
  'Personal exposure protection reflects modelled ambient concentration differences (ΔC) and avoided peak inversion hours. It does not measure personal inhaled dose or guarantee medical health outcomes.';

export const PLANETARY_AVOIDANCE_DISCLAIMER =
  'Emissions avoided reflect direct tailpipe operational combustion factors (DEFRA 2023 / CEA India). Individual transport choices reduce your environmental footprint, but do not directly clean the measured ambient air quality of your neighborhood.';
