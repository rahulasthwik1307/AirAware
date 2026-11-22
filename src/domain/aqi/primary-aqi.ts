/**
 * AirAware — Authoritative Primary AQI Resolver
 * Single source of truth for the primary AQI value, category, scale name,
 * and data provenance across the Dashboard, Copilot, and Family Planner.
 */

import { AirQualityReport } from '../types';
import { calculateCompositeCpcbAqi } from './cpcb-benchmark';

export interface PrimaryAqiFacts {
  readonly aqi: number;
  readonly category: string;
  readonly scaleName: string;
  readonly isCpcb: boolean;
  readonly indexLabel: string;
  readonly dominantPollutant: string;
  readonly pm25Concentration: number | null;
  readonly pm10Concentration: number | null;
  readonly colorToken: string;
  readonly bgToken: string;
  readonly resolvedDataSource: string;
  readonly modelFallbackReason: string | null;
}

/**
 * Returns the authoritative primary AQI facts from a single AirQualityReport object.
 *
 * Rules:
 * 1. For Indian locations (or when CPCB comparison is available), default to CPCB NAQI (India)
 *    unless the user has explicitly requested 'US_EPA'.
 * 2. For non-Indian locations, default to US EPA AQI unless CPCB is explicitly requested.
 * 3. Fallback reason is read directly from report.modelFallbackReason (never re-derived).
 */
export function getPrimaryAqiFacts(
  report: AirQualityReport,
  requestedStandard?: 'CPCB_NAQI' | 'US_EPA'
): PrimaryAqiFacts {
  const isIndia =
    report.location.countryCode === 'IN' ||
    report.location.country.toLowerCase().includes('india') ||
    Boolean(report.cpcbComparison);

  const isCpcb = requestedStandard ? requestedStandard === 'CPCB_NAQI' : isIndia;
  const isStation = report.sourceType === 'station';

  const pm25 = report.pollutants?.pm2_5?.concentration ?? null;
  const pm10 = isStation
    ? (report.pollutants?.pm10?.isStationMeasurement ? report.pollutants?.pm10?.concentration : null)
    : (report.pollutants?.pm10?.concentration ?? null);

  const fallbackReason = report.modelFallbackReason ?? null;

  const resolvedDataSource = isStation
    ? `Ground station: ${report.stationName || 'Nearby Station'}${
        report.distanceKm !== null && report.distanceKm !== undefined ? `, ${report.distanceKm} km away` : ''
      } · OpenAQ`
    : `Modeled estimate: Copernicus CAMS via Open-Meteo (~45 km grid) · ${
        fallbackReason || 'no recent station within 25 km'
      }`;

  if (isCpcb) {
    // Calculate or use normalized CPCB NAQI
    const cpcbResult = calculateCompositeCpcbAqi(pm25, pm10, isStation);
    const aqi = cpcbResult.aqi ?? report.cpcbComparison?.compositeAqi ?? report.providerAqi ?? 50;
    const category =
      cpcbResult.category !== 'Unavailable'
        ? cpcbResult.category
        : (report.cpcbComparison?.equivalentCategory ?? report.tier?.label ?? 'Moderate');

    const indexLabel =
      report.cpcbComparison?.indexLabel ||
      (pm10 === null || pm10 === undefined
        ? 'PM2.5 sub-index only'
        : isStation
        ? 'CPCB AQI (PM2.5/PM10 sub-index)'
        : 'PM2.5 sub-index, modeled');

    return {
      aqi,
      category,
      scaleName: 'CPCB NAQI (India)',
      isCpcb: true,
      indexLabel,
      dominantPollutant: cpcbResult.dominantSubIndexPollutant || report.dominantPollutant || 'PM2.5',
      pm25Concentration: pm25,
      pm10Concentration: pm10,
      colorToken: cpcbResult.colorToken !== 'var(--ink-muted)' ? cpcbResult.colorToken : '#059669',
      bgToken: cpcbResult.bgToken,
      resolvedDataSource,
      modelFallbackReason: fallbackReason,
    };
  }

  // US EPA AQI
  const aqi = report.providerAqi ?? 50;
  const category = report.tier?.label ?? 'Moderate';

  return {
    aqi,
    category,
    scaleName: 'US EPA AQI',
    isCpcb: false,
    indexLabel: 'US EPA AQI',
    dominantPollutant: report.dominantPollutant || 'PM2.5',
    pm25Concentration: pm25,
    pm10Concentration: pm10,
    colorToken: report.tier?.colorToken ?? '#059669',
    bgToken: report.tier?.bgToken ?? '#F1F5F9',
    resolvedDataSource,
    modelFallbackReason: fallbackReason,
  };
}
