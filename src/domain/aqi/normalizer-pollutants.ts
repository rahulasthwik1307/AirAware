import { PollutantKey, PollutantMeasurement, AqiStandardKey } from '../types';
import { POLLUTANT_METADATA } from './unit-converters';
import { getEaqiPollutantLevel, getEaqiTierFromValue } from './european-aqi';
import { calculatePollutantEpaSubIndex, getEpaTierFromValue } from './epa-aqi';
import type { RawOpenMeteoAirQualityResponse } from './normalizer';

export interface NormalizedPollutantsResult {
  readonly pollutants: Record<PollutantKey, PollutantMeasurement>;
  readonly dominantPollutant: string | null;
  readonly highestSubIndex: number;
}

const POLLUTANT_KEYS: readonly PollutantKey[] = [
  'pm2_5',
  'pm10',
  'nitrogen_dioxide',
  'ozone',
  'sulphur_dioxide',
  'carbon_monoxide',
];

function buildEaqiPollutantMeasurement(
  key: PollutantKey,
  rawVal: number | null | undefined,
  current: RawOpenMeteoAirQualityResponse['current'],
  currentUnits: Record<string, string>
): { measurement: PollutantMeasurement; isDominantCandidate: boolean; subIndex: number | null } {
  const meta = POLLUTANT_METADATA[key];
  const concentration = rawVal !== undefined && rawVal !== null && Number.isFinite(rawVal) ? rawVal : null;
  const unit = currentUnits[key] || meta.standardUnit;
  const whoRatio = concentration !== null ? Math.round((concentration / meta.whoGuideline) * 10) / 10 : null;

  if (key === 'carbon_monoxide') {
    return {
      measurement: {
        key,
        label: meta.label,
        chemicalFormula: meta.chemicalFormula,
        concentration,
        unit,
        subIndex: null,
        tier: null,
        isEvaluatedInActiveStandard: false,
        note: 'Not evaluated under European EAQI standard (EEA convention)',
        whoGuideline: meta.whoGuideline,
        whoRatio,
      },
      isDominantCandidate: false,
      subIndex: null,
    };
  }

  const providerSubKey = `european_aqi_${key}` as keyof typeof current;
  const providerSub = current[providerSubKey] as number | null | undefined;
  const subIndex =
    providerSub !== undefined && providerSub !== null && Number.isFinite(providerSub)
      ? providerSub
      : getEaqiPollutantLevel(key, concentration);

  const pollutantTier = subIndex !== null ? getEaqiTierFromValue(subIndex) : null;
  const note =
    providerSub !== undefined && providerSub !== null
      ? 'Modelled European EAQI sub-index (EEA regulatory window)'
      : 'Calculated European EAQI breakpoint level';

  return {
    measurement: {
      key,
      label: meta.label,
      chemicalFormula: meta.chemicalFormula,
      concentration,
      unit,
      subIndex,
      tier: pollutantTier,
      isEvaluatedInActiveStandard: true,
      note,
      whoGuideline: meta.whoGuideline,
      whoRatio,
    },
    isDominantCandidate: true,
    subIndex,
  };
}

function resolveEpaAveragingNote(key: PollutantKey, providerSub?: number | null): string {
  if (providerSub !== undefined && providerSub !== null && Number.isFinite(providerSub)) {
    if (key === 'pm2_5' || key === 'pm10') return 'Modelled 24-hour rolling average (EPA standard window)';
    if (key === 'ozone') return 'Modelled max 1h / 8h rolling average (EPA standard window)';
    if (key === 'carbon_monoxide') return 'Modelled 8-hour rolling average (EPA standard window)';
    if (key === 'sulphur_dioxide') return 'Modelled max 1h / 24h rolling average (EPA standard window)';
    return '1-hour primary model concentration';
  }
  return '';
}

function buildEpaPollutantMeasurement(
  key: PollutantKey,
  rawVal: number | null | undefined,
  current: RawOpenMeteoAirQualityResponse['current'],
  currentUnits: Record<string, string>,
  isStation: boolean,
  stationPm10?: number | null
): { measurement: PollutantMeasurement; subIndex: number | null } {
  const meta = POLLUTANT_METADATA[key];
  const concentration = rawVal !== undefined && rawVal !== null && Number.isFinite(rawVal) ? rawVal : null;
  const unit = currentUnits[key] || meta.standardUnit;
  const whoRatio = concentration !== null ? Math.round((concentration / meta.whoGuideline) * 10) / 10 : null;

  const providerSubKey = `us_aqi_${key}` as keyof typeof current;
  const providerSub = current[providerSubKey] as number | null | undefined;

  let subIndex: number | null = null;
  let averagingNote = '';

  if (providerSub !== undefined && providerSub !== null && Number.isFinite(providerSub)) {
    subIndex = providerSub;
    averagingNote = resolveEpaAveragingNote(key, providerSub);
  } else {
    const calc = calculatePollutantEpaSubIndex(key, concentration);
    subIndex = calc.subIndex;
    averagingNote = `${calc.averagingNote} (instantaneous calc)`;
  }

  const pollutantTier = subIndex !== null ? getEpaTierFromValue(subIndex) : null;
  const isStationMeasurement =
    isStation && (key === 'pm2_5' || (key === 'pm10' && stationPm10 !== null && stationPm10 !== undefined));

  return {
    measurement: {
      key,
      label: meta.label,
      chemicalFormula: meta.chemicalFormula,
      concentration,
      unit,
      subIndex,
      tier: pollutantTier,
      isEvaluatedInActiveStandard: true,
      note: averagingNote,
      whoGuideline: meta.whoGuideline,
      whoRatio,
      isStationMeasurement,
    },
    subIndex,
  };
}

/**
 * Normalizes raw atmospheric pollutant concentrations into validated measurements with WHO 2021 ratios.
 */
export function normalizePollutants(
  current: RawOpenMeteoAirQualityResponse['current'],
  currentUnits: Record<string, string>,
  activeStandard: AqiStandardKey,
  isStation: boolean,
  stationPm10?: number | null
): NormalizedPollutantsResult {
  const pollutants = {} as Record<PollutantKey, PollutantMeasurement>;
  let dominantPollutant: string | null = null;
  let highestSubIndex = -1;

  for (const key of POLLUTANT_KEYS) {
    const meta = POLLUTANT_METADATA[key];
    const rawVal = current[key];

    if (activeStandard === 'EUROPEAN_EAQI') {
      const { measurement, isDominantCandidate, subIndex } = buildEaqiPollutantMeasurement(
        key,
        rawVal,
        current,
        currentUnits
      );
      pollutants[key] = measurement;
      if (isDominantCandidate && subIndex !== null && subIndex > highestSubIndex) {
        highestSubIndex = subIndex;
        dominantPollutant = meta.chemicalFormula;
      }
    } else {
      const { measurement, subIndex } = buildEpaPollutantMeasurement(
        key,
        rawVal,
        current,
        currentUnits,
        isStation,
        stationPm10
      );
      pollutants[key] = measurement;
      if (subIndex !== null && subIndex > highestSubIndex) {
        highestSubIndex = subIndex;
        dominantPollutant = meta.chemicalFormula;
      }
    }
  }

  return { pollutants, dominantPollutant, highestSubIndex };
}
