import { describe, it, expect } from 'vitest';
import { normalizeAirQualityReport, RawOpenMeteoAirQualityResponse } from '@/domain/aqi/normalizer';
import { GeoLocation } from '@/domain/types';

describe('Air Quality Data Normalizer', () => {
  const mockLondonLocation: GeoLocation = {
    id: 2643743,
    name: 'London',
    country: 'United Kingdom',
    countryCode: 'GB',
    admin1: 'England',
    latitude: 51.5085,
    longitude: -0.1257,
    timezone: 'Europe/London',
  };

  const mockDelhiLocation: GeoLocation = {
    id: 1273294,
    name: 'Delhi',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    timezone: 'Asia/Kolkata',
  };

  const sampleRawPayload: RawOpenMeteoAirQualityResponse = {
    latitude: 51.5,
    longitude: -0.12,
    elevation: 25,
    current: {
      time: '2026-11-18T06:00',
      interval: 3600,
      european_aqi: 19,
      us_aqi: 26,
      pm10: 6.7,
      pm2_5: 3.0,
      carbon_monoxide: 135,
      nitrogen_dioxide: 8.6,
      sulphur_dioxide: 0.9,
      ozone: 57.0,
    },
    current_units: {
      european_aqi: 'EAQI',
      us_aqi: 'USAQI',
      pm10: 'μg/m³',
      pm2_5: 'μg/m³',
      carbon_monoxide: 'μg/m³',
      nitrogen_dioxide: 'μg/m³',
      sulphur_dioxide: 'μg/m³',
      ozone: 'μg/m³',
    },
    hourly: {
      time: ['2026-11-18T06:00', '2026-11-18T07:00', '2026-11-18T08:00'],
      european_aqi: [19, 20, 22],
      us_aqi: [26, 28, 30],
      pm10: [6.7, 7.0, 7.5],
      pm2_5: [3.0, 3.2, 3.5],
    },
  };

  it('normalizes London data defaulting to European EAQI (Regional Index)', () => {
    const report = normalizeAirQualityReport(sampleRawPayload, mockLondonLocation);
    expect(report.activeStandard).toBe('EUROPEAN_EAQI');
    expect(report.standardMetadata.role).toBe('REGIONAL_INDEX');
    expect(report.providerAqi).toBe(19);
    expect(report.tier?.label).toBe('Good');

    // CO should be excluded from EAQI calculation
    expect(report.pollutants.carbon_monoxide.isEvaluatedInActiveStandard).toBe(false);
    expect(report.pollutants.carbon_monoxide.concentration).toBe(135);
    expect(report.pollutants.carbon_monoxide.tier).toBeNull();

    // 5 EAQI pollutants evaluated
    expect(report.pollutants.pm2_5.isEvaluatedInActiveStandard).toBe(true);
    expect(report.pollutants.pm2_5.concentration).toBe(3.0);
    expect(report.pollutants.pm2_5.whoRatio).toBe(0.2); // 3.0 / 15.0
  });

  it('normalizes Delhi data with US EPA as International Reference & evaluates CPCB context', () => {
    const report = normalizeAirQualityReport(sampleRawPayload, mockDelhiLocation);
    expect(report.activeStandard).toBe('US_EPA');
    expect(report.standardMetadata.role).toBe('INTERNATIONAL_REFERENCE');
    expect(report.providerAqi).toBe(26);
    expect(report.tier?.label).toBe('Good');
    expect(report.cpcbComparison).toBeDefined();
    expect(report.cpcbComparison?.equivalentCategory).toBe('Good');
  });

  it('evaluates sub-indices for ALL 6 pollutants under US EPA standard', () => {
    const report = normalizeAirQualityReport(sampleRawPayload, mockLondonLocation, 'US_EPA');
    expect(report.activeStandard).toBe('US_EPA');
    expect(report.pollutants.pm2_5.subIndex).toBeDefined();
    expect(report.pollutants.pm10.subIndex).toBeDefined();
    expect(report.pollutants.ozone.subIndex).toBeDefined();
    expect(report.pollutants.nitrogen_dioxide.subIndex).toBeDefined();
    expect(report.pollutants.sulphur_dioxide.subIndex).toBeDefined();
    expect(report.pollutants.carbon_monoxide.subIndex).toBeDefined();
  });

  it('preserves coordinates and elevation', () => {
    const report = normalizeAirQualityReport(sampleRawPayload, mockLondonLocation);
    expect(report.coordinates.latitude).toBe(51.5);
    expect(report.coordinates.longitude).toBe(-0.12);
    expect(report.coordinates.elevationMeters).toBe(25);
  });

  it('derives real historical trend points from past hourly data and avoids mock numbers', () => {
    const pastHourlyPayload: RawOpenMeteoAirQualityResponse = {
      ...sampleRawPayload,
      hourly: {
        time: [
          '2026-11-15T12:00',
          '2026-11-16T12:00',
          '2026-11-17T12:00',
        ],
        us_aqi: [250, 310, 420],
        pm2_5: [140, 180, 260],
        nitrogen_dioxide: [45, 55, 80],
      },
    };

    const report = normalizeAirQualityReport(pastHourlyPayload, mockDelhiLocation);
    expect(report.historicalTrend).toBeDefined();
    expect(report.historicalTrend?.length).toBe(3);
    expect(report.historicalTrend?.[0].aqi).toBe(250);
    expect(report.historicalTrend?.[1].aqi).toBe(310);
    expect(report.historicalTrend?.[2].aqi).toBe(420);
    expect(report.historicalTrend?.[2].isSevereDay).toBe(true);
  });
});
