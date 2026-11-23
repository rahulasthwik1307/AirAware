import { describe, it, expect } from 'vitest';
import {
  classifyCpcbPm25,
  calculateCompositeCpcbAqi,
} from '@/domain/aqi/cpcb-benchmark';
import { findBestDaytimeWindow } from '@/domain/aqi/best-window';
import { convertCoUgM3ToPpm, POLLUTANT_METADATA } from '@/domain/aqi/unit-converters';
import { getEpaTierFromValue } from '@/domain/aqi/epa-aqi';
import { ForecastPoint } from '@/domain/types';

describe('Domain Edge Cases & Robustness Matrix', () => {
  describe('CPCB Index Tier Boundaries (30/31, 60/61, 90/91, 120/121, 250/251)', () => {
    it('30 vs 31: 30 is Good, 31 is Satisfactory', () => {
      const good30 = classifyCpcbPm25(30);
      expect(good30.category).toBe('Good');
      expect(good30.aqiRange).toBe('0–50');

      const sat31 = classifyCpcbPm25(31);
      expect(sat31.category).toBe('Satisfactory');
      expect(sat31.aqiRange).toBe('51–100');
    });

    it('60 vs 61: 60 is Satisfactory, 61 is Moderate', () => {
      const sat60 = classifyCpcbPm25(60);
      expect(sat60.category).toBe('Satisfactory');
      expect(sat60.aqiRange).toBe('51–100');

      const mod61 = classifyCpcbPm25(61);
      expect(mod61.category).toBe('Moderate');
      expect(mod61.aqiRange).toBe('101–200');
    });

    it('90 vs 91: 90 is Moderate, 91 is Poor', () => {
      const mod90 = classifyCpcbPm25(90);
      expect(mod90.category).toBe('Moderate');
      expect(mod90.aqiRange).toBe('101–200');

      const poor91 = classifyCpcbPm25(91);
      expect(poor91.category).toBe('Poor');
      expect(poor91.aqiRange).toBe('201–300');
    });

    it('120 vs 121: 120 is Poor, 121 is Very Poor', () => {
      const poor120 = classifyCpcbPm25(120);
      expect(poor120.category).toBe('Poor');
      expect(poor120.aqiRange).toBe('201–300');

      const veryPoor121 = classifyCpcbPm25(121);
      expect(veryPoor121.category).toBe('Very Poor');
      expect(veryPoor121.aqiRange).toBe('301–400');
    });

    it('250 vs 251: 250 is Very Poor, 251 is Severe', () => {
      const veryPoor250 = classifyCpcbPm25(250);
      expect(veryPoor250.category).toBe('Very Poor');
      expect(veryPoor250.aqiRange).toBe('301–400');

      const severe251 = classifyCpcbPm25(251);
      expect(severe251.category).toBe('Severe');
      expect(severe251.aqiRange).toBe('401–500');
    });
  });

  describe('Composite PM2.5/PM10 Sub-index when PM10 is missing or present', () => {
    it('computes PM2.5 sub-index correctly when PM10 is null on ground station', () => {
      const res = calculateCompositeCpcbAqi(75, null, true);

      expect(res.aqi).toBeGreaterThanOrEqual(101);
      expect(res.aqi).toBeLessThanOrEqual(200);
      expect(res.category).toBe('Moderate');
      expect(res.indexLabel).toBe('PM2.5 sub-index only');
      expect(res.dominantSubIndexPollutant).toBe('PM2.5');
    });

    it('computes maximum sub-index when both PM2.5 and PM10 are reported', () => {
      // PM2.5 = 30 (sub-index 50, Good), PM10 = 200 (sub-index ~167, Moderate)
      const res = calculateCompositeCpcbAqi(30, 200, true);

      expect(res.category).toBe('Moderate');
      expect(res.dominantSubIndexPollutant).toBe('PM10');
      expect(res.indexLabel).toBe('CPCB AQI (PM2.5/PM10 sub-index)');
    });

    it('returns Unavailable when both PM2.5 and PM10 are null', () => {
      const res = calculateCompositeCpcbAqi(null, null, true);

      expect(res.aqi).toBeNull();
      expect(res.category).toBe('Unavailable');
      expect(res.dominantSubIndexPollutant).toBeNull();
    });
  });

  describe('findBestDaytimeWindow Edge Cases (Flat and Missing Forecast Data)', () => {
    it('handles flat forecast (identical AQI across all 24 hours)', () => {
      const flatForecast: ForecastPoint[] = Array.from({ length: 24 }).map((_, i) => ({
        time: `2026-11-23T${String(i).padStart(2, '0')}:00:00Z`,
        displayTime: `${String(i).padStart(2, '0')}:00`,
        activeAqi: 120,
        usAqi: 120,
        europeanAqi: null,
        tier: null,
        pm25: 65,
      }));

      const window = findBestDaytimeWindow(flatForecast, 2);
      expect(window).not.toBeNull();
      expect(window?.averageAqi).toBe(120);
      expect(window?.displayWindow).toBeDefined();
    });

    it('handles forecast points with null or undefined activeAqi without throwing NaN', () => {
      const missingForecast: ForecastPoint[] = Array.from({ length: 24 }).map((_, i) => ({
        time: `2026-11-23T${String(i).padStart(2, '0')}:00:00Z`,
        displayTime: `${String(i).padStart(2, '0')}:00`,
        activeAqi: i >= 12 && i <= 14 ? 50 : (null as unknown as number),
        usAqi: null,
        europeanAqi: null,
        tier: null,
        pm25: null as unknown as number,
      }));

      const window = findBestDaytimeWindow(missingForecast, 2);
      expect(window).not.toBeNull();
      expect(Number.isNaN(window?.averageAqi)).toBe(false);
      expect(window?.averageAqi).toBeGreaterThan(0);
    });

    it('returns null when forecast array is empty or undefined, and falls back gracefully for night-only data', () => {
      expect(findBestDaytimeWindow([], 2)).toBeNull();
      expect(findBestDaytimeWindow(null as unknown as ForecastPoint[], 2)).toBeNull();

      // Only night hours (01:00) -> falls back to default 2 PM - 4 PM window gracefully without throwing
      const nightOnly: ForecastPoint[] = [
        {
          time: '2026-11-23T01:00:00Z',
          displayTime: '01:00',
          activeAqi: 80,
          usAqi: 80,
          europeanAqi: null,
          tier: null,
          pm25: 40,
        },
      ];
      const fallbackWindow = findBestDaytimeWindow(nightOnly, 2);
      expect(fallbackWindow).not.toBeNull();
      expect(fallbackWindow?.startHour).toBe('14:00');
      expect(fallbackWindow?.endHour).toBe('16:00');
    });
  });

  describe('Unit Converters & NaN / Extreme Edge Cases', () => {
    it('convertCoUgM3ToPpm converts standard concentration under STP', () => {
      // 2000 µg/m³ CO ≈ 1.7 ppm
      const ppm = convertCoUgM3ToPpm(2000);
      expect(ppm).toBe(1.7);
    });

    it('convertCoUgM3ToPpm safely handles null, NaN, negative, and infinite inputs', () => {
      expect(convertCoUgM3ToPpm(null)).toBeNull();
      expect(convertCoUgM3ToPpm(NaN)).toBeNull();
      expect(convertCoUgM3ToPpm(-50)).toBeNull();
      expect(convertCoUgM3ToPpm(Infinity)).toBeNull();
      expect(convertCoUgM3ToPpm(-Infinity)).toBeNull();
      expect(convertCoUgM3ToPpm(0)).toBe(0);
    });

    it('verifies WHO 2021 air quality guideline metadata completeness', () => {
      expect(POLLUTANT_METADATA.pm2_5.whoGuideline).toBe(15.0);
      expect(POLLUTANT_METADATA.pm10.whoGuideline).toBe(45.0);
      expect(POLLUTANT_METADATA.nitrogen_dioxide.whoGuideline).toBe(25.0);
      expect(POLLUTANT_METADATA.ozone.whoGuideline).toBe(100.0);
      expect(POLLUTANT_METADATA.sulphur_dioxide.whoGuideline).toBe(40.0);
      expect(POLLUTANT_METADATA.carbon_monoxide.whoGuideline).toBe(4000.0);
    });

    it('getEpaTierFromValue safely handles null, negative, and extreme AQI', () => {
      expect(getEpaTierFromValue(null)).toBeNull();
      expect(getEpaTierFromValue(-10)).toBeNull();
      expect(getEpaTierFromValue(25)?.label).toBe('Good');
      expect(getEpaTierFromValue(75)?.label).toBe('Moderate');
      expect(getEpaTierFromValue(125)?.label).toBe('Unhealthy for Sensitive Groups');
      expect(getEpaTierFromValue(175)?.label).toBe('Unhealthy');
      expect(getEpaTierFromValue(250)?.label).toBe('Very Unhealthy');
      expect(getEpaTierFromValue(450)?.label).toBe('Hazardous');
      expect(getEpaTierFromValue(999)?.label).toBe('Hazardous');
    });
  });
});
