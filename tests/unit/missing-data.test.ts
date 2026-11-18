import { describe, it, expect } from 'vitest';
import { normalizeAirQualityReport, RawOpenMeteoAirQualityResponse } from '@/domain/aqi/normalizer';
import { GeoLocation } from '@/domain/types';

describe('Missing Data & Boundary Handling', () => {
  const mockLocation: GeoLocation = {
    id: 9999,
    name: 'Test Location',
    country: 'Global',
    countryCode: 'XX',
    latitude: 0,
    longitude: 0,
    timezone: 'UTC',
  };

  const payloadWithMissingPollutants: RawOpenMeteoAirQualityResponse = {
    latitude: 0,
    longitude: 0,
    current: {
      time: '2026-11-18T00:00',
      interval: 3600,
      us_aqi: null, // AQI unavailable
      european_aqi: null,
      pm2_5: 12.0,
      pm10: null, // missing PM10
      carbon_monoxide: null, // missing CO
      nitrogen_dioxide: undefined as any, // missing NO2
      sulphur_dioxide: null,
      ozone: null,
    },
    hourly: {
      time: [],
    },
  };

  it('preserves null for missing measurements and NEVER coerces them to zero', () => {
    const report = normalizeAirQualityReport(payloadWithMissingPollutants, mockLocation);

    expect(report.pollutants.pm10.concentration).toBeNull();
    expect(report.pollutants.carbon_monoxide.concentration).toBeNull();
    expect(report.pollutants.nitrogen_dioxide.concentration).toBeNull();
    expect(report.pollutants.sulphur_dioxide.concentration).toBeNull();
    expect(report.pollutants.ozone.concentration).toBeNull();

    // Verify PM2.5 is preserved
    expect(report.pollutants.pm2_5.concentration).toBe(12.0);
  });

  it('handles null provider AQI safely without crashing', () => {
    const report = normalizeAirQualityReport(payloadWithMissingPollutants, mockLocation);
    expect(report.providerAqi).toBeNull();
    expect(report.tier).toBeNull();
  });
});
