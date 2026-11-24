import { describe, it, expect } from 'vitest';
import {
  getBarColor,
  getStatusBadge,
  calculatePollutantLimitItems,
  computeTrendGeometry,
  CPCB_24H_LIMITS,
  DEFAULT_CHART_DIMENSIONS,
} from '@/components/charts/unified/chart-geometry';
import { HistoricalAirshedPoint, PollutantKey, PollutantMeasurement } from '@/domain/types';

describe('chart-geometry domain helpers', () => {
  const createMockMeasurement = (
    key: PollutantKey,
    concentration: number | null,
    isStation = true
  ): PollutantMeasurement => ({
    key,
    label: key.toUpperCase(),
    chemicalFormula: key,
    concentration,
    unit: 'µg/m³',
    subIndex: concentration ? concentration * 1.5 : null,
    tier: null,
    isEvaluatedInActiveStandard: true,
    whoGuideline: 15,
    whoRatio: concentration ? concentration / 15 : null,
    isStationMeasurement: isStation,
  });

  describe('getBarColor', () => {
    it('returns correct color tokens for ratio bands', () => {
      expect(getBarColor(0.2)).toBe('#047857'); // <= 0.5 Good green
      expect(getBarColor(0.5)).toBe('#047857');
      expect(getBarColor(0.8)).toBe('#4d7c0f'); // <= 1.0 Satisfactory green
      expect(getBarColor(1.0)).toBe('#4d7c0f');
      expect(getBarColor(1.2)).toBe('#92400e'); // <= 1.5 Moderate amber
      expect(getBarColor(1.5)).toBe('#92400e');
      expect(getBarColor(2.0)).toBe('#ea580c'); // <= 2.5 Poor orange
      expect(getBarColor(2.5)).toBe('#ea580c');
      expect(getBarColor(3.0)).toBe('#dc2626'); // > 2.5 Severe red
    });
  });

  describe('getStatusBadge', () => {
    it('returns appropriate accessible badge labels and classes', () => {
      expect(getStatusBadge(0.4).label).toBe('Good');
      expect(getStatusBadge(0.9).label).toBe('Safe');
      expect(getStatusBadge(1.3).label).toBe('Moderate');
      expect(getStatusBadge(2.2).label).toBe('Poor');
      expect(getStatusBadge(3.5).label).toBe('Severe');
    });
  });

  describe('calculatePollutantLimitItems', () => {
    it('returns empty array when pollutants is undefined or empty', () => {
      expect(calculatePollutantLimitItems(undefined, false)).toEqual([]);
    });

    it('computes correct ratio, percentage cap, and station status for key pollutants', () => {
      const pollutants: Record<PollutantKey, PollutantMeasurement> = {
        pm2_5: createMockMeasurement('pm2_5', 120, true), // 120 / 60 = 2.0 (200% -> capped to 100 pct)
        pm10: createMockMeasurement('pm10', 50, false), // 50 / 100 = 0.5 (50 pct)
        ozone: createMockMeasurement('ozone', 80, true), // 80 / 100 = 0.8 (80 pct)
        nitrogen_dioxide: createMockMeasurement('nitrogen_dioxide', 40, true),
        sulphur_dioxide: createMockMeasurement('sulphur_dioxide', 20, true),
        carbon_monoxide: createMockMeasurement('carbon_monoxide', 400, true),
      };

      const items = calculatePollutantLimitItems(pollutants, true);
      expect(items).toHaveLength(3); // pm2_5, pm10, ozone

      const pm25Item = items.find((i) => i.key === 'pm2_5');
      expect(pm25Item).toBeDefined();
      expect(pm25Item?.conc).toBe(120);
      expect(pm25Item?.limit).toBe(CPCB_24H_LIMITS.pm2_5.limit);
      expect(pm25Item?.ratio).toBe(2);
      expect(pm25Item?.pct).toBe(100);
      expect(pm25Item?.isItemStation).toBe(true);
      expect(pm25Item?.badge.label).toBe('Poor');

      const pm10Item = items.find((i) => i.key === 'pm10');
      expect(pm10Item?.ratio).toBe(0.5);
      expect(pm10Item?.pct).toBe(50);
      expect(pm10Item?.isItemStation).toBe(false);
      expect(pm10Item?.badge.label).toBe('Good');
    });

    it('filters out pollutants with null or undefined concentration', () => {
      const pollutants = {
        pm2_5: createMockMeasurement('pm2_5', null, true),
        pm10: createMockMeasurement('pm10', 80, true),
      } as Record<PollutantKey, PollutantMeasurement>;

      const items = calculatePollutantLimitItems(pollutants, true);
      expect(items).toHaveLength(1);
      expect(items[0].key).toBe('pm10');
    });
  });

  describe('computeTrendGeometry', () => {
    it('handles empty trend data with provider fallback', () => {
      const geom = computeTrendGeometry([], 125);
      expect(geom.hasTrend).toBe(false);
      expect(geom.currentAqi).toBe(125);
      expect(geom.avgAqi).toBe(125);
      expect(geom.minAqiPoint).toBeNull();
      expect(geom.maxAqiPoint).toBeNull();
      expect(geom.linePoints).toBe('');
      expect(geom.areaPoints).toBe('');
      expect(geom.thresholdGuides.length).toBeGreaterThan(0);
    });

    it('computes accurate coordinates, limits, and SVG path strings for 7-day trend', () => {
      const mockPoints: HistoricalAirshedPoint[] = [
        { date: '2026-11-18', dayLabel: 'Wed 18', aqi: 110, pm25: 75, nox: 45, inversionCeilingMeters: 450, isSevereDay: false },
        { date: '2026-11-19', dayLabel: 'Thu 19', aqi: 130, pm25: 85, nox: 50, inversionCeilingMeters: 400, isSevereDay: false },
        { date: '2026-11-20', dayLabel: 'Fri 20', aqi: 90, pm25: 55, nox: 35, inversionCeilingMeters: 550, isSevereDay: false },
        { date: '2026-11-21', dayLabel: 'Sat 21', aqi: 80, pm25: 45, nox: 30, inversionCeilingMeters: 600, isSevereDay: false },
        { date: '2026-11-22', dayLabel: 'Sun 22', aqi: 150, pm25: 100, nox: 60, inversionCeilingMeters: 350, isSevereDay: false },
        { date: '2026-11-23', dayLabel: 'Mon 23', aqi: 170, pm25: 115, nox: 70, inversionCeilingMeters: 300, isSevereDay: true },
        { date: '2026-11-24', dayLabel: 'Tue 24', aqi: 140, pm25: 95, nox: 55, inversionCeilingMeters: 380, isSevereDay: false },
      ];

      const geom = computeTrendGeometry(mockPoints, null, DEFAULT_CHART_DIMENSIONS);
      expect(geom.hasTrend).toBe(true);
      expect(geom.points).toHaveLength(7);
      expect(geom.currentAqi).toBe(140);
      expect(geom.minAqiPoint?.aqi).toBe(80);
      expect(geom.maxAqiPoint?.aqi).toBe(170);
      expect(geom.avgAqi).toBe(124); // 870 / 7 = 124.28 -> 124
      expect(geom.linePoints).not.toBe('');
      expect(geom.areaPoints).toContain(geom.linePoints);

      // Verify projection functions
      const x0 = geom.getX(0);
      const x6 = geom.getX(6);
      expect(x0).toBe(DEFAULT_CHART_DIMENSIONS.paddingLeft);
      expect(x6).toBe(DEFAULT_CHART_DIMENSIONS.svgWidth - DEFAULT_CHART_DIMENSIONS.paddingRight);

      const yHigh = geom.getY(200);
      const yLow = geom.getY(50);
      expect(yHigh).toBeLessThan(yLow); // Higher AQI is higher on the chart (smaller Y)
    });

    it('slices only the last 7 points when more are provided', () => {
      const tenPoints: HistoricalAirshedPoint[] = Array.from({ length: 10 }, (_, i) => ({
        date: `2026-11-${10 + i}`,
        dayLabel: `Day ${i}`,
        aqi: 100 + i * 5,
        pm25: 60 + i * 3,
        nox: 30 + i * 2,
        inversionCeilingMeters: 400,
        isSevereDay: false,
      }));

      const geom = computeTrendGeometry(tenPoints, 100);
      expect(geom.points).toHaveLength(7);
      expect(geom.currentAqi).toBe(145);
    });
  });
});
