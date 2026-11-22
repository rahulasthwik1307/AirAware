/**
 * AirAware Domain Types — Global Air Intelligence
 * Authoritative domain models for locations, pollutants, AQI standards, and scientific telemetry.
 */

export interface GeoLocation {
  readonly id: number;
  readonly name: string;
  readonly country: string;
  readonly countryCode: string; // ISO 3166-1 alpha-2 (e.g. 'IN', 'US', 'GB')
  readonly admin1?: string; // State / Province / Region
  readonly latitude: number;
  readonly longitude: number;
  readonly timezone: string;
  readonly isPrimary?: boolean;
}

export type AqiStandardKey = 'EUROPEAN_EAQI' | 'US_EPA';

export type WorkspaceKey =
  | 'air-intelligence'
  | 'family-planner'
  | 'indoor-air'
  | 'cleaner-choices'
  | 'community-alerts';

/**
 * StandardRole defines the regulatory/scientific context of the index for a location:
 * - 'LOCAL_OFFICIAL': An officially recognized national index (e.g. US EPA AQI in the US).
 * - 'REGIONAL_INDEX': An official regional index (e.g. European EAQI across Europe).
 * - 'INTERNATIONAL_REFERENCE': Used as an international comparison benchmark in jurisdictions
 *   where the national standard (e.g. CPCB in India) is not yet directly integrated.
 */
export type StandardRole = 'LOCAL_OFFICIAL' | 'REGIONAL_INDEX' | 'INTERNATIONAL_REFERENCE';

export interface AqiStandardMetadata {
  readonly key: AqiStandardKey;
  readonly name: string;
  readonly shortLabel: string;
  readonly scaleRange: string;
  readonly role: StandardRole;
  readonly roleLabel: string;
  readonly description: string;
}

export interface AqiTier {
  readonly level: number; // 1 to 6
  readonly label: string;
  readonly colorToken: string;
  readonly bgToken: string;
  readonly borderToken: string;
  readonly description: string;
  readonly healthAdvisory: string;
}

export type PollutantKey =
  | 'pm2_5'
  | 'pm10'
  | 'carbon_monoxide'
  | 'nitrogen_dioxide'
  | 'sulphur_dioxide'
  | 'ozone';

export interface PollutantMetadata {
  readonly key: PollutantKey;
  readonly label: string;
  readonly chemicalFormula: string;
  readonly standardUnit: string; // e.g. 'μg/m³'
  readonly description: string;
  readonly whoGuideline: number; // WHO 2021 Air Quality Guideline level (μg/m³)
}

export interface PollutantMeasurement {
  readonly key: PollutantKey;
  readonly label: string;
  readonly chemicalFormula: string;
  readonly concentration: number | null; // null represents missing / Not Reported (never 0)
  readonly unit: string;
  readonly subIndex: number | null;
  readonly tier: AqiTier | null;
  readonly isEvaluatedInActiveStandard: boolean; // false for CO under European EAQI
  readonly note?: string;
  readonly whoGuideline: number;
  readonly whoRatio: number | null; // e.g. 3.4x WHO guideline
}

export interface ForecastPoint {
  readonly time: string; // ISO 8601 string from provider
  readonly displayTime: string; // formatted e.g. "06:00"
  readonly usAqi: number | null;
  readonly europeanAqi: number | null;
  readonly activeAqi: number | null;
  readonly tier: AqiTier | null;
  readonly isCurrentHour?: boolean;
  readonly pm25?: number | null;
  readonly pm10?: number | null;
  readonly temperature?: number | null;
  readonly windSpeed?: number | null;
}

export interface HistoricalAirshedPoint {
  readonly date: string; // YYYY-MM-DD
  readonly dayLabel: string; // e.g. 'Thu 14', 'Fri 15'
  readonly aqi: number; // Daily average AQI
  readonly pm25: number; // µg/m³
  readonly nox: number; // µg/m³
  readonly inversionCeilingMeters: number; // Estimated winter mixing height in meters
  readonly isSevereDay: boolean;
}

export interface CpcbComparisonContext {
  readonly equivalentCategory: string;
  readonly estimatedAqiRange: string;
  readonly stationContext: string;
  readonly methodologyDifference: string;
  readonly compositeAqi?: number | null;
  readonly indexLabel?: string;
}

export type AtmosphericModelDomain = 'CAMS_EUROPE' | 'CAMS_GLOBAL';

export interface AtmosphericModelMetadata {
  readonly domain: AtmosphericModelDomain;
  readonly domainName: string;
  readonly spatialResolution: string;
  readonly temporalResolution: string;
  readonly updateCadence: string;
}

export interface AirQualityReport {
  readonly location: GeoLocation;
  readonly modelTimestamp: string;
  readonly localTime: string;
  readonly intervalSeconds: number;
  readonly dataSource: 'OPEN_METEO_CAMS' | 'OPENAQ_GROUND_STATION';
  readonly isModelled: boolean;
  readonly isStale: boolean;
  readonly activeStandard: AqiStandardKey;
  readonly standardMetadata: AqiStandardMetadata;
  readonly providerAqi: number | null;
  readonly tier: AqiTier | null;
  readonly dominantPollutant: string | null;
  readonly pollutants: Record<PollutantKey, PollutantMeasurement>;
  readonly forecast: readonly ForecastPoint[];
  readonly historicalTrend?: readonly HistoricalAirshedPoint[];
  readonly coordinates: {
    readonly latitude: number;
    readonly longitude: number;
    readonly elevationMeters?: number;
  };
  readonly averagingPeriodNote: string;
  readonly cpcbComparison: CpcbComparisonContext | null;
  readonly modelMetadata: AtmosphericModelMetadata;
  readonly stationName?: string | null;
  readonly distanceKm?: number | null;
  readonly observedAt?: string | null;
  readonly sourceType: 'station' | 'model';
}
