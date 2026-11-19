import { describe, it, expect } from 'vitest';
import { classifyCpcbPm25 } from '@/domain/aqi/cpcb-benchmark';
import { normalizeAirQualityReport } from '@/domain/aqi/normalizer';
import { RawOpenMeteoAirQualityResponse } from '@/domain/aqi/normalizer';
import { GeoLocation } from '@/domain/types';

describe('India CPCB NAQI PM2.5 Benchmark Resolver', () => {
  describe('Boundary Value Tests across all 6 CPCB Tiers', () => {
    it('classifies 0–30 μg/m³ as Good (AQI 0–50)', () => {
      const lower = classifyCpcbPm25(0);
      expect(lower.category).toBe('Good');
      expect(lower.aqiRange).toBe('0–50');
      expect(lower.concentrationRange).toBe('0–30 μg/m³');

      const mid = classifyCpcbPm25(15);
      expect(mid.category).toBe('Good');
      expect(mid.aqiRange).toBe('0–50');

      const upper = classifyCpcbPm25(30);
      expect(upper.category).toBe('Good');
      expect(upper.aqiRange).toBe('0–50');
      expect(upper.concentrationRange).toBe('0–30 μg/m³');

      // Crucial requirement: values <= 30 must NEVER be classified as Satisfactory
      expect(upper.category).not.toBe('Satisfactory');
    });

    it('classifies 31–60 μg/m³ as Satisfactory (AQI 51–100)', () => {
      const justAboveGood = classifyCpcbPm25(30.1);
      expect(justAboveGood.category).toBe('Satisfactory');
      expect(justAboveGood.aqiRange).toBe('51–100');
      expect(justAboveGood.concentrationRange).toBe('31–60 μg/m³');

      const boundary31 = classifyCpcbPm25(31);
      expect(boundary31.category).toBe('Satisfactory');

      const mid = classifyCpcbPm25(45);
      expect(mid.category).toBe('Satisfactory');

      const upper = classifyCpcbPm25(60);
      expect(upper.category).toBe('Satisfactory');
      expect(upper.aqiRange).toBe('51–100');
    });

    it('classifies 61–90 μg/m³ as Moderate (AQI 101–200)', () => {
      const justAboveSatisfactory = classifyCpcbPm25(60.1);
      expect(justAboveSatisfactory.category).toBe('Moderate');
      expect(justAboveSatisfactory.aqiRange).toBe('101–200');
      expect(justAboveSatisfactory.concentrationRange).toBe('61–90 μg/m³');

      const mid = classifyCpcbPm25(75);
      expect(mid.category).toBe('Moderate');

      const upper = classifyCpcbPm25(90);
      expect(upper.category).toBe('Moderate');
      expect(upper.aqiRange).toBe('101–200');
    });

    it('classifies 91–120 μg/m³ as Poor (AQI 201–300)', () => {
      const justAboveModerate = classifyCpcbPm25(90.1);
      expect(justAboveModerate.category).toBe('Poor');
      expect(justAboveModerate.aqiRange).toBe('201–300');
      expect(justAboveModerate.concentrationRange).toBe('91–120 μg/m³');

      const mid = classifyCpcbPm25(105);
      expect(mid.category).toBe('Poor');

      const upper = classifyCpcbPm25(120);
      expect(upper.category).toBe('Poor');
      expect(upper.aqiRange).toBe('201–300');
    });

    it('classifies 121–250 μg/m³ as Very Poor (AQI 301–400)', () => {
      const justAbovePoor = classifyCpcbPm25(120.1);
      expect(justAbovePoor.category).toBe('Very Poor');
      expect(justAbovePoor.aqiRange).toBe('301–400');
      expect(justAbovePoor.concentrationRange).toBe('121–250 μg/m³');

      const mid = classifyCpcbPm25(185);
      expect(mid.category).toBe('Very Poor');

      const upper = classifyCpcbPm25(250);
      expect(upper.category).toBe('Very Poor');
      expect(upper.aqiRange).toBe('301–400');
    });

    it('classifies > 250 μg/m³ as Severe (AQI 401–500)', () => {
      const justAboveVeryPoor = classifyCpcbPm25(250.1);
      expect(justAboveVeryPoor.category).toBe('Severe');
      expect(justAboveVeryPoor.aqiRange).toBe('401–500');
      expect(justAboveVeryPoor.concentrationRange).toBe('> 250 μg/m³');

      const extreme = classifyCpcbPm25(380);
      expect(extreme.category).toBe('Severe');
      expect(extreme.aqiRange).toBe('401–500');

      const hazardous = classifyCpcbPm25(500);
      expect(hazardous.category).toBe('Severe');
    });

    it('gracefully handles missing, NaN, null, and negative values as Unavailable', () => {
      const nullVal = classifyCpcbPm25(null);
      expect(nullVal.category).toBe('Unavailable');
      expect(nullVal.aqiRange).toBe('N/A');
      expect(nullVal.concentrationRange).toBe('Data not reported');
      expect(nullVal.methodologyNote).toContain('unavailable');

      const undefinedVal = classifyCpcbPm25(undefined);
      expect(undefinedVal.category).toBe('Unavailable');
      expect(undefinedVal.aqiRange).toBe('N/A');
      expect(undefinedVal.concentrationRange).toBe('Data not reported');

      const nanVal = classifyCpcbPm25(NaN);
      expect(nanVal.category).toBe('Unavailable');

      const negativeVal = classifyCpcbPm25(-10);
      expect(negativeVal.category).toBe('Unavailable');

      const infVal = classifyCpcbPm25(Infinity);
      expect(infVal.category).toBe('Unavailable');
    });
  });

  describe('Methodology Disclosures & Station Context', () => {
    it('discloses that CPCB comparison is a single-pollutant PM2.5 reference and not official composite NAQI', () => {
      const result = classifyCpcbPm25(25);
      expect(result.methodologyNote).toContain('Single-pollutant PM2.5 benchmark');
      expect(result.methodologyNote).toContain('physical CAAQMS stations');
    });

    it('integrates properly into normalized Indian location reports', () => {
      const indianLocation: GeoLocation = {
        id: 1273294,
        name: 'New Delhi',
        latitude: 28.6139,
        longitude: 77.209,
        country: 'India',
        countryCode: 'IN',
        timezone: 'Asia/Kolkata',
      };

      const rawData: RawOpenMeteoAirQualityResponse = {
        latitude: 28.6139,
        longitude: 77.209,
        elevation: 216,
        current: {
          time: '2026-11-19T12:00',
          interval: 3600,
          us_aqi: 165,
          pm2_5: 25.0, // Should be classified as Good (0–30)
          pm10: 55.0,
          nitrogen_dioxide: 40.0,
          ozone: 30.0,
          sulphur_dioxide: 10.0,
          carbon_monoxide: 450.0,
        },
        current_units: {
          us_aqi: 'AQI',
          pm2_5: 'μg/m³',
          pm10: 'μg/m³',
          nitrogen_dioxide: 'μg/m³',
          ozone: 'μg/m³',
          sulphur_dioxide: 'μg/m³',
          carbon_monoxide: 'μg/m³',
        },
        hourly: {
          time: [],
        },
      };

      const report = normalizeAirQualityReport(rawData, indianLocation);
      expect(report.cpcbComparison).not.toBeNull();
      expect(report.cpcbComparison?.equivalentCategory).toBe('Good');
      expect(report.cpcbComparison?.estimatedAqiRange).toBe('0–50');
      expect(report.cpcbComparison?.stationContext).toContain('CAAQMS');
      expect(report.cpcbComparison?.stationContext).toContain('Live physical station observations are not provided');
      expect(report.cpcbComparison?.methodologyDifference).toContain('Single-pollutant PM2.5 benchmark');
    });

    it('correctly classifies an Indian location with 55 μg/m³ as Satisfactory (31–60)', () => {
      const indianLocation: GeoLocation = {
        id: 1269843,
        name: 'Hyderabad',
        latitude: 17.385,
        longitude: 78.4867,
        country: 'India',
        countryCode: 'IN',
        timezone: 'Asia/Kolkata',
      };

      const rawData: RawOpenMeteoAirQualityResponse = {
        latitude: 17.385,
        longitude: 78.4867,
        elevation: 505,
        current: {
          time: '2026-11-19T12:00',
          interval: 3600,
          us_aqi: 140,
          pm2_5: 55.0, // Should be Satisfactory (31–60)
        },
        current_units: {
          us_aqi: 'AQI',
          pm2_5: 'μg/m³',
        },
        hourly: {
          time: [],
        },
      };

      const report = normalizeAirQualityReport(rawData, indianLocation);
      expect(report.cpcbComparison?.equivalentCategory).toBe('Satisfactory');
      expect(report.cpcbComparison?.estimatedAqiRange).toBe('51–100');
    });
  });
});
