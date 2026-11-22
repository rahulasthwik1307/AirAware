import { describe, it, expect } from 'vitest';
import { getPrimaryAqiFacts } from '@/domain/aqi/primary-aqi';
import { AirQualityReport } from '@/domain/types';

function createMockReport(overrides: Partial<AirQualityReport> = {}): AirQualityReport {
  return {
    location: {
      id: 1,
      name: 'New Delhi',
      country: 'India',
      countryCode: 'IN',
      latitude: 28.6139,
      longitude: 77.209,
      timezone: 'Asia/Kolkata',
    },
    modelTimestamp: '2026-11-22T10:00:00Z',
    localTime: '15:30',
    intervalSeconds: 3600,
    dataSource: 'OPENAQ_GROUND_STATION',
    isModelled: false,
    isStale: false,
    activeStandard: 'US_EPA',
    standardMetadata: {
      key: 'US_EPA',
      name: 'US EPA AQI',
      shortLabel: 'AQI',
      scaleRange: '0–500',
      role: 'INTERNATIONAL_REFERENCE',
      roleLabel: 'Reference',
      description: 'US EPA scale',
    },
    providerAqi: 154,
    tier: {
      level: 3,
      label: 'Unhealthy for Sensitive Groups',
      colorToken: '#EA580C',
      bgToken: '#FFF7ED',
      borderToken: '#FDBA74',
      description: 'Members of sensitive groups may experience health effects.',
      healthAdvisory: 'Sensitive individuals limit prolonged outdoor exertion.',
    },
    dominantPollutant: 'pm2_5',
    pollutants: {
      pm2_5: {
        key: 'pm2_5',
        label: 'PM2.5',
        chemicalFormula: 'PM₂.₅',
        concentration: 39.8,
        unit: 'µg/m³',
        subIndex: 66,
        tier: null,
        isEvaluatedInActiveStandard: true,
        whoGuideline: 15,
        whoRatio: 2.7,
        isStationMeasurement: true,
      },
      pm10: {
        key: 'pm10',
        label: 'PM10',
        chemicalFormula: 'PM₁₀',
        concentration: 65,
        unit: 'µg/m³',
        subIndex: 65,
        tier: null,
        isEvaluatedInActiveStandard: true,
        whoGuideline: 45,
        whoRatio: 1.4,
        isStationMeasurement: true,
      },
      carbon_monoxide: {
        key: 'carbon_monoxide',
        label: 'Carbon Monoxide',
        chemicalFormula: 'CO',
        concentration: 0.5,
        unit: 'mg/m³',
        subIndex: null,
        tier: null,
        isEvaluatedInActiveStandard: false,
        whoGuideline: 4,
        whoRatio: 0.1,
      },
      nitrogen_dioxide: {
        key: 'nitrogen_dioxide',
        label: 'Nitrogen Dioxide',
        chemicalFormula: 'NO₂',
        concentration: 20,
        unit: 'µg/m³',
        subIndex: null,
        tier: null,
        isEvaluatedInActiveStandard: true,
        whoGuideline: 25,
        whoRatio: 0.8,
      },
      sulphur_dioxide: {
        key: 'sulphur_dioxide',
        label: 'Sulphur Dioxide',
        chemicalFormula: 'SO₂',
        concentration: 10,
        unit: 'µg/m³',
        subIndex: null,
        tier: null,
        isEvaluatedInActiveStandard: true,
        whoGuideline: 40,
        whoRatio: 0.25,
      },
      ozone: {
        key: 'ozone',
        label: 'Ozone',
        chemicalFormula: 'O₃',
        concentration: 40,
        unit: 'µg/m³',
        subIndex: null,
        tier: null,
        isEvaluatedInActiveStandard: true,
        whoGuideline: 100,
        whoRatio: 0.4,
      },
    },
    forecast: [],
    coordinates: { latitude: 28.6139, longitude: 77.209 },
    averagingPeriodNote: '1-hour instantaneous reading',
    cpcbComparison: {
      equivalentCategory: 'Satisfactory',
      estimatedAqiRange: '51–100',
      stationContext: 'In-situ ground monitor',
      methodologyDifference: 'CPCB 24h average breakpoints',
      compositeAqi: 66,
      indexLabel: 'CPCB AQI (PM2.5/PM10 sub-index)',
    },
    modelMetadata: {
      domain: 'CAMS_GLOBAL',
      domainName: 'CAMS',
      spatialResolution: '0.4°',
      temporalResolution: '1 hour',
      updateCadence: 'Daily',
    },
    stationName: 'Anand Vihar, Delhi - DPCC',
    distanceKm: 4.2,
    observedAt: '2026-11-22T09:45:00Z',
    sourceType: 'station',
    modelFallbackReason: null,
    ...overrides,
  };
}

describe('getPrimaryAqiFacts', () => {
  it('defaults to CPCB NAQI for Indian locations', () => {
    const report = createMockReport();
    const facts = getPrimaryAqiFacts(report);

    expect(facts.isCpcb).toBe(true);
    expect(facts.scaleName).toBe('CPCB NAQI (India)');
    expect(facts.aqi).toBe(66);
    expect(facts.category).toBe('Satisfactory');
    expect(facts.resolvedDataSource).toContain('Anand Vihar');
    expect(facts.resolvedDataSource).toContain('4.2 km');
  });

  it('honors explicit US_EPA selection even in India', () => {
    const report = createMockReport();
    const facts = getPrimaryAqiFacts(report, 'US_EPA');

    expect(facts.isCpcb).toBe(false);
    expect(facts.scaleName).toBe('US EPA AQI');
    expect(facts.aqi).toBe(154);
    expect(facts.category).toBe('Unhealthy for Sensitive Groups');
  });

  it('reads exact modelFallbackReason when data is modeled', () => {
    const report = createMockReport({
      sourceType: 'model',
      stationName: null,
      distanceKm: null,
      modelFallbackReason: 'nearest station reported no data in the last 24h',
    });
    const facts = getPrimaryAqiFacts(report);

    expect(facts.modelFallbackReason).toBe('nearest station reported no data in the last 24h');
    expect(facts.resolvedDataSource).toContain('nearest station reported no data in the last 24h');
  });
});
