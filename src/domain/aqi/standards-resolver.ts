/**
 * Geographic AQI Standards Resolver
 * Enforces authoritative geographic classification without falsely claiming national official status
 * for unsupported jurisdictions.
 */

import {
  AqiStandardKey,
  AqiStandardMetadata,
  AtmosphericModelMetadata,
  StandardRole,
} from '../types';

/**
 * European countries/territories covered by the European Environment Agency (EEA) / CAMS European ensemble.
 */
const EUROPEAN_COUNTRY_CODES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES',
  'SE', 'GB', 'IS', 'NO', 'CH', 'LI'
]);

export function isEuropeanDomainCountry(countryCode: string): boolean {
  return EUROPEAN_COUNTRY_CODES.has(countryCode.toUpperCase());
}

export function getAtmosphericModelMetadata(countryCode: string): AtmosphericModelMetadata {
  const isEurope = isEuropeanDomainCountry(countryCode);
  if (isEurope) {
    return {
      domain: 'CAMS_EUROPE',
      domainName: 'CAMS European Air Quality Ensemble',
      spatialResolution: '0.1° (~11 km horizontal grid)',
      temporalResolution: 'Hourly forecasts (1h intervals)',
      updateCadence: 'Daily (24h update cycle)',
    };
  }

  return {
    domain: 'CAMS_GLOBAL',
    domainName: 'CAMS Global Atmospheric Composition (ECMWF IFS)',
    spatialResolution: '0.4° (~45 km horizontal grid)',
    temporalResolution: '3-hourly native, interpolated hourly in API',
    updateCadence: '12-hourly update cycle',
  };
}

export function getDefaultStandardForCountry(countryCode: string): AqiStandardKey {
  const code = countryCode.toUpperCase();
  if (code === 'US') {
    return 'US_EPA';
  }
  if (EUROPEAN_COUNTRY_CODES.has(code)) {
    return 'EUROPEAN_EAQI';
  }
  // For India and other global locations, US EPA AQI is provided as the international reference
  return 'US_EPA';
}

export function resolveStandardMetadata(
  standard: AqiStandardKey,
  countryCode: string
): AqiStandardMetadata {
  const code = countryCode.toUpperCase();
  const isUS = code === 'US';
  const isEurope = EUROPEAN_COUNTRY_CODES.has(code);

  if (standard === 'US_EPA') {
    let role: StandardRole = 'INTERNATIONAL_REFERENCE';
    let roleLabel = 'International Reference Index';
    let description =
      'US EPA Air Quality Index (0–500 scale). Provided as an international reference benchmark.';

    if (isUS) {
      role = 'LOCAL_OFFICIAL';
      roleLabel = 'US Local Official Standard';
      description =
        'Official United States Environmental Protection Agency (EPA) Air Quality Index (0–500 scale).';
    } else if (code === 'IN') {
      description =
        'US EPA Air Quality Index (0–500 scale). Displayed as an international comparison index; official Indian CPCB National AQI is not integrated in this phase.';
    }

    return {
      key: 'US_EPA',
      name: 'US EPA Air Quality Index',
      shortLabel: 'US EPA AQI',
      scaleRange: '0–500',
      role,
      roleLabel,
      description,
    };
  }

  // European EAQI
  let role: StandardRole = 'INTERNATIONAL_REFERENCE';
  let roleLabel = 'International Reference Index';
  let description =
    'European Air Quality Index (EEA 2024). Provided as an international reference benchmark.';

  if (isEurope) {
    role = 'REGIONAL_INDEX';
    roleLabel = 'European Regional Index';
    description =
      'European Environment Agency (EEA) regional index based on 5 core pollutants (PM2.5, PM10, NO2, O3, SO2).';
  }

  return {
    key: 'EUROPEAN_EAQI',
    name: 'European Air Quality Index',
    shortLabel: 'European EAQI',
    scaleRange: '0–100+',
    role,
    roleLabel,
    description,
  };
}
