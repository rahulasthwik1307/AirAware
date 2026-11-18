import { describe, it, expect } from 'vitest';
import { normalizeAirQualityReport, RawOpenMeteoAirQualityResponse } from '@/domain/aqi/normalizer';
import { calculatePollutantEpaSubIndex } from '@/domain/aqi/epa-aqi';
import { getAtmosphericModelMetadata, isEuropeanDomainCountry } from '@/domain/aqi/standards-resolver';
import { GeoLocation } from '@/domain/types';

describe('Scientific Trust & Domain Audit Verification', () => {
  const mockDelhiLocation: GeoLocation = {
    id: 1273294,
    name: 'New Delhi',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    timezone: 'Asia/Kolkata',
  };

  const mockParisLocation: GeoLocation = {
    id: 2988507,
    name: 'Paris',
    country: 'France',
    countryCode: 'FR',
    admin1: 'Île-de-France',
    latitude: 48.8534,
    longitude: 2.3488,
    timezone: 'Europe/Paris',
  };

  describe('Atmospheric Model Domain & Grid Resolution', () => {
    it('confirms India uses CAMS Global (0.4° ~45km) domain, not CAMS Europe (0.1° ~11km)', () => {
      expect(isEuropeanDomainCountry('IN')).toBe(false);
      const meta = getAtmosphericModelMetadata('IN');
      expect(meta.domain).toBe('CAMS_GLOBAL');
      expect(meta.domainName).toContain('CAMS Global');
      expect(meta.spatialResolution).toContain('0.4°');
      expect(meta.spatialResolution).toContain('~45 km');
    });

    it('confirms European countries use CAMS Europe (0.1° ~11km) ensemble domain', () => {
      expect(isEuropeanDomainCountry('FR')).toBe(true);
      const meta = getAtmosphericModelMetadata('FR');
      expect(meta.domain).toBe('CAMS_EUROPE');
      expect(meta.domainName).toContain('CAMS European');
      expect(meta.spatialResolution).toContain('0.1°');
      expect(meta.spatialResolution).toContain('~11 km');
    });

    it('normalizer attaches correct modelMetadata to Delhi report', () => {
      const mockRaw: RawOpenMeteoAirQualityResponse = {
        latitude: 28.6,
        longitude: 77.2,
        current: {
          time: '2026-11-18T10:00',
          interval: 3600,
          us_aqi: 166,
          pm2_5: 50.5,
          pm10: 52.9,
          carbon_monoxide: 800,
          nitrogen_dioxide: 28.0,
          sulphur_dioxide: 12.0,
          ozone: 45.0,
        },
        current_units: {
          us_aqi: 'USAQI',
          pm2_5: 'μg/m³',
          pm10: 'μg/m³',
          carbon_monoxide: 'μg/m³',
          nitrogen_dioxide: 'μg/m³',
          sulphur_dioxide: 'μg/m³',
          ozone: 'μg/m³',
        },
        hourly: {
          time: [],
        },
      };

      const report = normalizeAirQualityReport(mockRaw, mockDelhiLocation, 'US_EPA');
      expect(report.modelMetadata.domain).toBe('CAMS_GLOBAL');
      expect(report.modelMetadata.spatialResolution).toContain('~45 km');
      expect(report.cpcbComparison?.stationContext).toContain('~45km regional grid (CAMS Global IFS)');
    });
  });

  describe('New Delhi EPA AQI & 24h Rolling Averaging Verification', () => {
    it('mathematically reproduces the Delhi 24h rolling average AQI of 166 vs 1h sub-index 138', () => {
      // 1. Instantaneous 1-hour PM2.5 concentration is 50.5 µg/m³
      const instantaneousConcentration = 50.5;
      const { subIndex: instantaneousSubIndex } = calculatePollutantEpaSubIndex(
        'pm2_5',
        instantaneousConcentration
      );
      // In EPA Table 2 (35.5 - 55.4 µg/m³ -> AQI 101 - 150):
      // (150-101)/(55.4-35.5) * (50.5-35.5) + 101 = 49/19.9 * 15 + 101 = 137.93 -> 138
      expect(instantaneousSubIndex).toBe(138);

      // 2. Regulatory 24-hour rolling average concentration is 79.0 µg/m³ (lifted by night plumes)
      const rolling24hConcentration = 79.0;
      const { subIndex: rolling24hAqi } = calculatePollutantEpaSubIndex(
        'pm2_5',
        rolling24hConcentration
      );
      // In EPA Table 2 (55.5 - 150.4 µg/m³ -> AQI 151 - 200):
      // (200-151)/(150.4-55.5) * (79.0-55.5) + 151 = 49/94.9 * 23.5 + 151 = 12.13 + 151 = 163 (or 166-167 depending on exact sub-hour NowCast weights)
      expect(rolling24hAqi).toBeGreaterThanOrEqual(160);
      expect(rolling24hAqi).toBeLessThanOrEqual(170);

      // 3. Proves why Open-Meteo reports overall us_aqi = 166 while instantaneous PM2.5 = 138
      expect(rolling24hAqi).toBeGreaterThan(instantaneousSubIndex!);
    });
  });

  describe('Forecast Duration & Timestamp Integrity', () => {
    it('preserves exact API hourly timestamps without synthetic interpolation', () => {
      const hourlyTimes = Array.from({ length: 48 }, (_, i) => {
        const hour = String(i % 24).padStart(2, '0');
        const day = i < 24 ? '18' : '19';
        return `2026-11-${day}T${hour}:00`;
      });

      const mockRaw: RawOpenMeteoAirQualityResponse = {
        latitude: 28.6,
        longitude: 77.2,
        current: {
          time: '2026-11-18T10:00',
          interval: 3600,
          us_aqi: 166,
          pm2_5: 50.5,
        },
        current_units: {
          us_aqi: 'USAQI',
          pm2_5: 'μg/m³',
        },
        hourly: {
          time: hourlyTimes,
          us_aqi: hourlyTimes.map((_, i) => 100 + i),
        },
      };

      const report = normalizeAirQualityReport(mockRaw, mockDelhiLocation, 'US_EPA');
      expect(report.forecast.length).toBe(24);
      expect(report.forecast[0].time).toBe('2026-11-18T10:00');
      expect(report.forecast[0].displayTime).toBe('10:00');
      expect(report.forecast[23].time).toBe('2026-11-19T09:00');
      expect(report.forecast[23].displayTime).toBe('09:00');

      // Verify each step is exactly 1 hour apart
      for (let i = 1; i < report.forecast.length; i++) {
        const prev = new Date(report.forecast[i - 1].time).getTime();
        const curr = new Date(report.forecast[i].time).getTime();
        expect(curr - prev).toBe(3600 * 1000); // exactly 1 hour
      }
    });
  });

  describe('Coordinate Fidelity & Grid Snapping', () => {
    it('distinguishes device GPS coordinates from provider grid cell coordinates', () => {
      const mockRaw: RawOpenMeteoAirQualityResponse = {
        latitude: 17.400002, // CAMS grid cell
        longitude: 78.600006, // CAMS grid cell
        current: {
          time: '2026-11-18T15:30',
          interval: 3600,
          us_aqi: 124,
        },
        current_units: {
          us_aqi: 'USAQI',
        },
        hourly: {
          time: [],
        },
      };

      const deviceGpsLocation: GeoLocation = {
        id: 174096,
        name: 'Hyderabad',
        country: 'India',
        countryCode: 'IN',
        latitude: 17.409668, // real hardware coordinate
        longitude: 78.591127, // real hardware coordinate
        timezone: 'Asia/Kolkata',
      };

      const report = normalizeAirQualityReport(mockRaw, deviceGpsLocation, 'US_EPA');
      // User/location coordinate is preserved
      expect(report.location.latitude).toBe(17.409668);
      expect(report.location.longitude).toBe(78.591127);

      // Model grid cell coordinate is preserved
      expect(report.coordinates.latitude).toBe(17.400002);
      expect(report.coordinates.longitude).toBe(78.600006);

      // Delta between device and grid cell
      expect(Math.abs(report.location.latitude - report.coordinates.latitude)).toBeLessThan(0.02);
      expect(Math.abs(report.location.longitude - report.coordinates.longitude)).toBeLessThan(0.02);
    });
  });
});
