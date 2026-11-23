/**
 * Air Quality Data Normalizer
 * Transforms validated Open-Meteo payloads into authoritative AirQualityReport aggregates.
 */

import {
  AirQualityReport,
  AqiStandardKey,
  CpcbComparisonContext,
  GeoLocation,
  HistoricalAirshedPoint,
} from '../types';
import {
  getDefaultStandardForCountry,
  resolveStandardMetadata,
  getAtmosphericModelMetadata,
} from './standards-resolver';
import { getEaqiTierFromValue } from './european-aqi';
import { getEpaTierFromValue } from './epa-aqi';
import { calculateCompositeCpcbAqi } from './cpcb-benchmark';
import { normalizePollutants } from './normalizer-pollutants';
import { buildForecastTimeline, deriveHistoricalTrend } from './normalizer-forecast';

export { deriveHistoricalTrend };

export interface RawOpenMeteoAirQualityResponse {
  readonly latitude: number;
  readonly longitude: number;
  readonly elevation?: number;
  readonly timezone?: string;
  readonly sourceType?: 'station' | 'model';
  readonly stationName?: string | null;
  readonly distanceKm?: number | null;
  readonly observedAt?: string | null;
  readonly stationPm25?: number | null;
  readonly stationPm10?: number | null;
  readonly modelFallbackReason?: string | null;
  readonly queryCacheKey?: string;
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

function resolveEffectiveCurrent(raw: RawOpenMeteoAirQualityResponse, isStation: boolean) {
  if (!isStation) return raw.current;
  return {
    ...raw.current,
    pm2_5: raw.stationPm25!,
    ...(raw.stationPm10 !== null && raw.stationPm10 !== undefined ? { pm10: raw.stationPm10 } : {}),
  };
}

function buildCpcbComparison(
  location: GeoLocation,
  current: RawOpenMeteoAirQualityResponse['current'],
  raw: RawOpenMeteoAirQualityResponse,
  isStation: boolean,
  stationName: string | null,
  distanceKm: number | null,
  observedAt: string | null
): CpcbComparisonContext | null {
  if (location.countryCode.toUpperCase() !== 'IN') return null;

  const cpcbResult = calculateCompositeCpcbAqi(
    current.pm2_5,
    isStation ? (raw.stationPm10 ?? null) : current.pm10,
    isStation
  );

  const stationContext = isStation
    ? `Ground station: ${stationName || 'Nearby Monitor'}, ${distanceKm !== null ? `${distanceKm} km away` : ''} · OpenAQ · Observed ${observedAt || current.time}`
    : 'Modelled ~45km regional grid (CAMS Global IFS). Physical CAAQMS monitors measure localized ground plumes which typically report higher concentrations during thermal inversions. Live physical station observations are not provided via this open model API. Modeled estimate (Copernicus CAMS via Open-Meteo, ~45 km grid) · no recent station within 25 km';

  return {
    equivalentCategory: cpcbResult.category,
    estimatedAqiRange: cpcbResult.aqiRange,
    stationContext,
    methodologyDifference: cpcbResult.methodologyNote,
    compositeAqi: cpcbResult.aqi,
    indexLabel: cpcbResult.indexLabel,
  };
}

/**
 * Transforms raw atmospheric and ground telemetry into an authoritative AirQualityReport.
 */
export function normalizeAirQualityReport(
  raw: RawOpenMeteoAirQualityResponse,
  location: GeoLocation,
  requestedStandard?: AqiStandardKey
): AirQualityReport {
  const activeStandard = requestedStandard ?? getDefaultStandardForCountry(location.countryCode);
  const standardMetadata = resolveStandardMetadata(activeStandard, location.countryCode);

  const isStation = raw.sourceType === 'station' && raw.stationPm25 !== null && raw.stationPm25 !== undefined;
  const effectiveSourceType: 'station' | 'model' = isStation ? 'station' : 'model';
  const stationName = isStation ? (raw.stationName ?? null) : null;
  const distanceKm = isStation ? (raw.distanceKm ?? null) : null;
  const observedAt = isStation ? (raw.observedAt ?? null) : null;

  const current = resolveEffectiveCurrent(raw, isStation);
  const currentUnits = raw.current_units ?? {};

  const providerAqi =
    activeStandard === 'EUROPEAN_EAQI' ? (current.european_aqi ?? null) : (current.us_aqi ?? null);

  const tier =
    activeStandard === 'EUROPEAN_EAQI' ? getEaqiTierFromValue(providerAqi) : getEpaTierFromValue(providerAqi);

  const { pollutants, dominantPollutant } = normalizePollutants(
    current,
    currentUnits,
    activeStandard,
    isStation,
    raw.stationPm10
  );

  const forecast = buildForecastTimeline(raw.hourly, current.time, activeStandard);
  const localTime = current.time.includes('T') ? current.time.replace('T', ' ') : current.time;

  const averagingPeriodNote =
    activeStandard === 'US_EPA'
      ? 'The overall US EPA AQI reflects Open-Meteo modelled 24-hour rolling averages for particulate matter and 8-hour rolling averages for ozone/CO from CAMS grid simulations. This is an atmospheric model estimate, not an in-situ station NowCast.'
      : 'The European EAQI reflects 1-hour and 8-hour worst-case pollutant indices according to European Environment Agency (EEA) guidelines. Carbon monoxide is not evaluated under EAQI.';

  const cpcbComparison = buildCpcbComparison(
    location,
    current,
    raw,
    isStation,
    stationName,
    distanceKm,
    observedAt
  );

  return {
    location,
    modelTimestamp: isStation && observedAt ? observedAt : current.time,
    localTime,
    intervalSeconds: current.interval || 3600,
    dataSource: isStation ? 'OPENAQ_GROUND_STATION' : 'OPEN_METEO_CAMS',
    isModelled: !isStation,
    isStale: false,
    activeStandard,
    standardMetadata,
    providerAqi,
    tier,
    dominantPollutant,
    pollutants,
    forecast,
    historicalTrend: deriveHistoricalTrend(raw.hourly, activeStandard),
    coordinates: {
      latitude: raw.latitude,
      longitude: raw.longitude,
      elevationMeters: raw.elevation,
    },
    averagingPeriodNote,
    cpcbComparison,
    modelMetadata: getAtmosphericModelMetadata(location.countryCode),
    stationName,
    distanceKm,
    observedAt,
    sourceType: effectiveSourceType,
    modelFallbackReason: isStation ? null : (raw.modelFallbackReason ?? 'no recent station within 25 km'),
  };
}

export { normalizeAirQualityReport as normalizeAirQualityData };
