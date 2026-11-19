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
import {
  getDefaultStandardForCountry,
  resolveStandardMetadata,
  getAtmosphericModelMetadata,
} from './standards-resolver';
import {
  EAQI_TIERS,
  getEaqiPollutantLevel,
  getEaqiTierFromValue,
} from './european-aqi';
import {
  calculatePollutantEpaSubIndex,
  getEpaTierFromValue,
} from './epa-aqi';
import { classifyCpcbPm25 } from './cpcb-benchmark';
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
    readonly us_aqi_pm2_5?: number | null;
    readonly us_aqi_pm10?: number | null;
    readonly us_aqi_carbon_monoxide?: number | null;
    readonly us_aqi_nitrogen_dioxide?: number | null;
    readonly us_aqi_sulphur_dioxide?: number | null;
    readonly us_aqi_ozone?: number | null;
    readonly european_aqi_pm2_5?: number | null;
    readonly european_aqi_pm10?: number | null;
    readonly european_aqi_nitrogen_dioxide?: number | null;
    readonly european_aqi_sulphur_dioxide?: number | null;
    readonly european_aqi_ozone?: number | null;
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
        const providerSubKey = `european_aqi_${key}` as keyof typeof current;
        const providerSub = current[providerSubKey] as number | null | undefined;
        const subIndex =
          providerSub !== undefined && providerSub !== null && Number.isFinite(providerSub)
            ? providerSub
            : getEaqiPollutantLevel(key, concentration);

        const pollutantTier = subIndex !== null ? getEaqiTierFromValue(subIndex) : null;

        if (subIndex !== null && subIndex > highestSubIndex) {
          highestSubIndex = subIndex;
          dominantPollutant = meta.chemicalFormula;
        }

        const note =
          providerSub !== undefined && providerSub !== null
            ? 'Modelled European EAQI sub-index (EEA regulatory window)'
            : 'Calculated European EAQI breakpoint level';

        pollutants[key] = {
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
        };
      }
    } else {
      // US EPA AQI: Prioritize provider-supplied sub-index incorporating EPA regulatory rolling averages
      const providerSubKey = `us_aqi_${key}` as keyof typeof current;
      const providerSub = current[providerSubKey] as number | null | undefined;

      let subIndex: number | null = null;
      let averagingNote = '';

      if (providerSub !== undefined && providerSub !== null && Number.isFinite(providerSub)) {
        subIndex = providerSub;
        if (key === 'pm2_5' || key === 'pm10') {
          averagingNote = 'Modelled 24-hour rolling average (EPA standard window)';
        } else if (key === 'ozone') {
          averagingNote = 'Modelled max 1h / 8h rolling average (EPA standard window)';
        } else if (key === 'carbon_monoxide') {
          averagingNote = 'Modelled 8-hour rolling average (EPA standard window)';
        } else if (key === 'sulphur_dioxide') {
          averagingNote = 'Modelled max 1h / 24h rolling average (EPA standard window)';
        } else {
          averagingNote = '1-hour primary model concentration';
        }
      } else {
        const calc = calculatePollutantEpaSubIndex(key, concentration);
        subIndex = calc.subIndex;
        averagingNote = `${calc.averagingNote} (instantaneous calc)`;
      }

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
      const isCurrentHour = i === startIndex || timeStr === currentTimeStr;
      const pm25 = hourly.pm2_5 ? hourly.pm2_5[i] ?? null : null;
      const pm10 = hourly.pm10 ? hourly.pm10[i] ?? null : null;

      forecast.push({
        time: timeStr,
        displayTime,
        usAqi,
        europeanAqi,
        activeAqi,
        tier: pointTier,
        isCurrentHour,
        pm25,
        pm10,
      });
    }
  }

  // Format local time display
  const localTime = current.time.includes('T')
    ? current.time.replace('T', ' ')
    : current.time;

  const averagingPeriodNote =
    activeStandard === 'US_EPA'
      ? 'The overall US EPA AQI reflects Open-Meteo modelled 24-hour rolling averages for particulate matter and 8-hour rolling averages for ozone/CO from CAMS grid simulations. This is an atmospheric model estimate, not an in-situ station NowCast.'
      : 'The European EAQI reflects 1-hour and 8-hour worst-case pollutant indices according to European Environment Agency (EEA) guidelines. Carbon monoxide is not evaluated under EAQI.';

  // CPCB Comparison Context for Indian Locations
  let cpcbComparison: CpcbComparisonContext | null = null;
  if (location.countryCode.toUpperCase() === 'IN') {
    const cpcbResult = classifyCpcbPm25(current.pm2_5);

    cpcbComparison = {
      equivalentCategory: cpcbResult.category,
      estimatedAqiRange: cpcbResult.aqiRange,
      stationContext:
        'Modelled ~45km regional grid (CAMS Global IFS). Physical CAAQMS monitors (e.g. Sanathnagar, Zoo Park, Central University) measure localized ground plumes which typically report higher concentrations during thermal inversions. Live physical station observations are not provided via this open model API.',
      methodologyDifference: cpcbResult.methodologyNote,
    };
  }

  const modelMetadata = getAtmosphericModelMetadata(location.countryCode);

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
    modelMetadata,
  };
}

export { normalizeAirQualityReport as normalizeAirQualityData };
