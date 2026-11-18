/**
 * Air Quality Data Normalizer
 * Transforms validated Open-Meteo payloads into authoritative AirQualityReport aggregates.
 *
 * Rules:
 * - Provider AQI is preserved as the primary displayed metric.
 * - All 6 criteria pollutants have evaluated sub-indices and WHO 2021 guideline ratios.
 * - Missing pollutant measurements remain null (never coerced to 0).
 * - CO is explicitly excluded from European EAQI evaluation.
 * - Explicit distinction between regulatory 24h rolling averages and instantaneous 1h sub-indices.
 * - Scientific comparison context provided for Indian CPCB and CAMS regional grid models.
 */

import {
  AirQualityReport,
  AqiStandardKey,
  CpcbComparisonContext,
  ForecastPoint,
  GeoLocation,
  PollutantKey,
  PollutantMeasurement,
} from '../types';
import { getDefaultStandardForCountry, resolveStandardMetadata } from './standards-resolver';
import {
  EAQI_TIERS,
  getEaqiPollutantLevel,
  getEaqiTierFromValue,
} from './european-aqi';
import {
  calculatePollutantEpaSubIndex,
  getEpaTierFromValue,
} from './epa-aqi';
import { POLLUTANT_METADATA } from './unit-converters';

export interface RawOpenMeteoAirQualityResponse {
  readonly latitude: number;
  readonly longitude: number;
  readonly elevation?: number;
  readonly timezone?: string;
  readonly current: {
    readonly time: string;
    readonly interval?: number;
    readonly european_aqi?: number | null;
    readonly us_aqi?: number | null;
    readonly pm10?: number | null;
    readonly pm2_5?: number | null;
    readonly carbon_monoxide?: number | null;
    readonly nitrogen_dioxide?: number | null;
    readonly sulphur_dioxide?: number | null;
    readonly ozone?: number | null;
  };
  readonly current_units?: Record<string, string>;
  readonly hourly: {
    readonly time: readonly string[];
    readonly european_aqi?: readonly (number | null)[];
    readonly us_aqi?: readonly (number | null)[];
    readonly pm10?: readonly (number | null)[];
    readonly pm2_5?: readonly (number | null)[];
    readonly carbon_monoxide?: readonly (number | null)[];
    readonly nitrogen_dioxide?: readonly (number | null)[];
    readonly sulphur_dioxide?: readonly (number | null)[];
    readonly ozone?: readonly (number | null)[];
  };
}

export function normalizeAirQualityReport(
  raw: RawOpenMeteoAirQualityResponse,
  location: GeoLocation,
  requestedStandard?: AqiStandardKey
): AirQualityReport {
  const activeStandard = requestedStandard ?? getDefaultStandardForCountry(location.countryCode);
  const standardMetadata = resolveStandardMetadata(activeStandard, location.countryCode);

  const current = raw.current;
  const currentUnits = raw.current_units ?? {};

  // Primary Provider AQI
  const providerAqi =
    activeStandard === 'EUROPEAN_EAQI'
      ? (current.european_aqi ?? null)
      : (current.us_aqi ?? null);

  // Overall Tier
  const tier =
    activeStandard === 'EUROPEAN_EAQI'
      ? getEaqiTierFromValue(providerAqi)
      : getEpaTierFromValue(providerAqi);

  // Normalize Pollutants (PM2.5, PM10, NO2, O3, SO2, CO)
  const pollutantKeys: readonly PollutantKey[] = [
    'pm2_5',
    'pm10',
    'nitrogen_dioxide',
    'ozone',
    'sulphur_dioxide',
    'carbon_monoxide',
  ];

  const pollutants: Record<PollutantKey, PollutantMeasurement> = {} as any;
  let dominantPollutant: string | null = null;
  let highestSubIndex = -1;

  for (const key of pollutantKeys) {
    const meta = POLLUTANT_METADATA[key];
    const rawVal = current[key];
    const concentration =
      rawVal !== undefined && rawVal !== null && Number.isFinite(rawVal) ? rawVal : null;
    const unit = currentUnits[key] || meta.standardUnit;

    const whoRatio =
      concentration !== null
        ? Math.round((concentration / meta.whoGuideline) * 10) / 10
        : null;

    if (activeStandard === 'EUROPEAN_EAQI') {
      if (key === 'carbon_monoxide') {
        pollutants[key] = {
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
        };
      } else {
        const level = getEaqiPollutantLevel(key, concentration);
        const pollutantTier = level ? EAQI_TIERS[level - 1] : null;

        if (level && level > highestSubIndex) {
          highestSubIndex = level;
          dominantPollutant = meta.chemicalFormula;
        }

        pollutants[key] = {
          key,
          label: meta.label,
          chemicalFormula: meta.chemicalFormula,
          concentration,
          unit,
          subIndex: level,
          tier: pollutantTier,
          isEvaluatedInActiveStandard: true,
          whoGuideline: meta.whoGuideline,
          whoRatio,
        };
      }
    } else {
      // US EPA AQI: Evaluate ALL pollutants using official breakpoints
      const { subIndex, averagingNote } = calculatePollutantEpaSubIndex(key, concentration);
      let pollutantTier = null;

      if (subIndex !== null) {
        pollutantTier = getEpaTierFromValue(subIndex);
        if (subIndex > highestSubIndex) {
          highestSubIndex = subIndex;
          dominantPollutant = meta.chemicalFormula;
        }
      }

      pollutants[key] = {
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
      };
    }
  }

  // Format 24-Hour Forecast Timeline
  const hourly = raw.hourly;
  const forecast: ForecastPoint[] = [];

  if (hourly && Array.isArray(hourly.time)) {
    const currentTimeStr = current.time;
    let startIndex = hourly.time.findIndex((t) => t >= currentTimeStr);
    if (startIndex === -1) startIndex = 0;

    const pointsToTake = Math.min(24, hourly.time.length - startIndex);

    for (let i = startIndex; i < startIndex + pointsToTake; i++) {
      const timeStr = hourly.time[i];
      const usAqi = hourly.us_aqi ? hourly.us_aqi[i] ?? null : null;
      const europeanAqi = hourly.european_aqi ? hourly.european_aqi[i] ?? null : null;

      const activeAqi = activeStandard === 'EUROPEAN_EAQI' ? europeanAqi : usAqi;
      const pointTier =
        activeStandard === 'EUROPEAN_EAQI'
          ? getEaqiTierFromValue(activeAqi)
          : getEpaTierFromValue(activeAqi);

      const displayTime = timeStr.includes('T') ? timeStr.split('T')[1].slice(0, 5) : timeStr;

      forecast.push({
        time: timeStr,
        displayTime,
        usAqi,
        europeanAqi,
        activeAqi,
        tier: pointTier,
      });
    }
  }

  // Format local time display
  const localTime = current.time.includes('T')
    ? current.time.replace('T', ' ')
    : current.time;

  const averagingPeriodNote =
    activeStandard === 'US_EPA'
      ? 'The overall US EPA AQI reflects regulatory 24-hour running averages for particulate matter and 8-hour averages for ozone/CO. Instantaneous 1-hour sub-indices are shown in each pollutant telemetry card.'
      : 'The European EAQI reflects 1-hour and 8-hour worst-case pollutant indices according to European Environment Agency (EEA) guidelines. Carbon monoxide is not evaluated under EAQI.';

  // CPCB Comparison Context for Indian Locations
  let cpcbComparison: CpcbComparisonContext | null = null;
  if (location.countryCode.toUpperCase() === 'IN') {
    const pm25Val = current.pm2_5;
    let cpcbCat = 'Moderate';
    let cpcbRange = '101–200';
    if (pm25Val !== null && pm25Val !== undefined) {
      if (pm25Val <= 30) {
        cpcbCat = 'Good';
        cpcbRange = '0–50';
      } else if (pm25Val <= 60) {
        cpcbCat = 'Satisfactory';
        cpcbRange = '51–100';
      } else if (pm25Val <= 90) {
        cpcbCat = 'Moderate';
        cpcbRange = '101–200';
      } else if (pm25Val <= 120) {
        cpcbCat = 'Poor';
        cpcbRange = '201–300';
      } else if (pm25Val <= 250) {
        cpcbCat = 'Very Poor';
        cpcbRange = '301–400';
      } else {
        cpcbCat = 'Severe';
        cpcbRange = '401–500';
      }
    }

    cpcbComparison = {
      equivalentCategory: cpcbCat,
      estimatedAqiRange: cpcbRange,
      stationContext:
        'Modelled ~11km regional grid. Physical CAAQMS monitors (e.g. Anand Vihar, RK Puram) measure localized ground plumes which typically report higher concentrations during thermal inversions.',
      methodologyDifference:
        'India CPCB NAQI permits up to 60 μg/m³ PM2.5 for "Satisfactory" (51–100), whereas US EPA classifies >35.4 μg/m³ as Unhealthy for Sensitive Groups (>100).',
    };
  }

  return {
    location,
    modelTimestamp: current.time,
    localTime,
    intervalSeconds: current.interval || 3600,
    dataSource: 'OPEN_METEO_CAMS',
    isModelled: true,
    isStale: false,
    activeStandard,
    standardMetadata,
    providerAqi,
    tier,
    dominantPollutant,
    pollutants,
    forecast,
    coordinates: {
      latitude: raw.latitude,
      longitude: raw.longitude,
      elevationMeters: raw.elevation,
    },
    averagingPeriodNote,
    cpcbComparison,
  };
}
