import { describe, it, expect } from 'vitest';
import {
  parseHourFromTimeString,
  findForecastPointForHour,
  deriveForecastExtremes,
  deriveConditionSummary,
  triageActivitiesNeedingAttention,
  calculateExposureGaugeData,
} from '@/domain/planner/briefing-derivations';
import { ForecastPoint } from '@/domain/types';
import { HouseholdMember } from '@/domain/household/types';
import { PlannerRecommendation, ActiveActionItem } from '@/domain/planner/types';

describe('briefing-derivations domain module', () => {
  const createForecastPoint = (
    displayTime: string,
    pm25: number | null,
    time = '2026-11-24T00:00:00Z'
  ): ForecastPoint => ({
    time,
    displayTime,
    usAqi: pm25 ? pm25 * 2 : null,
    europeanAqi: null,
    activeAqi: pm25 ? pm25 * 2 : null,
    tier: null,
    pm25,
  });

  describe('parseHourFromTimeString', () => {
    it('parses valid 24h time strings correctly', () => {
      expect(parseHourFromTimeString('00:00')).toBe(0);
      expect(parseHourFromTimeString('07:30')).toBe(7);
      expect(parseHourFromTimeString('14:45')).toBe(14);
      expect(parseHourFromTimeString('23:59')).toBe(23);
    });

    it('clamps values outside 0-23 and defaults malformed input to 0', () => {
      expect(parseHourFromTimeString('25:00')).toBe(23);
      expect(parseHourFromTimeString('-2:00')).toBe(0);
      expect(parseHourFromTimeString('invalid')).toBe(0);
      expect(parseHourFromTimeString('')).toBe(0);
    });
  });

  describe('findForecastPointForHour', () => {
    const forecast: ForecastPoint[] = [
      createForecastPoint('06:00', 65, '2026-11-24T06:00:00Z'),
      createForecastPoint('12:00', 35, '2026-11-24T12:00:00Z'),
      createForecastPoint('18:00', 110, '2026-11-24T18:00:00Z'),
    ];

    it('finds forecast point matching displayTime prefix', () => {
      const match = findForecastPointForHour(forecast, 12);
      expect(match).not.toBeNull();
      expect(match?.pm25).toBe(35);
    });

    it('finds forecast point matching ISO timestamp when displayTime is missing', () => {
      const pointsWithoutDisplayTime: ForecastPoint[] = [
        createForecastPoint('', 50, '2026-11-24T08:00:00Z'),
      ];
      const match = findForecastPointForHour(pointsWithoutDisplayTime, 8);
      expect(match).not.toBeNull();
      expect(match?.pm25).toBe(50);
    });

    it('returns null if no forecast point matches or list is empty', () => {
      expect(findForecastPointForHour([], 12)).toBeNull();
      expect(findForecastPointForHour(forecast, 22)).toBeNull();
    });
  });

  describe('deriveForecastExtremes', () => {
    it('identifies highest and lowest PM2.5 concentrations in forecast', () => {
      const forecast: ForecastPoint[] = [
        createForecastPoint('06:00', 75, 'T06:00'),
        createForecastPoint('14:00', 22, 'T14:00'),
        createForecastPoint('20:00', 140, 'T20:00'),
      ];

      const extremes = deriveForecastExtremes(forecast);
      expect(extremes.highestPm25).toBe(140);
      expect(extremes.highestPoint?.displayTime).toBe('20:00');
      expect(extremes.lowestPm25).toBe(22);
      expect(extremes.lowestPoint?.displayTime).toBe('14:00');
    });

    it('handles empty forecast or all-null PM2.5 points gracefully', () => {
      const empty = deriveForecastExtremes([]);
      expect(empty.highestPoint).toBeNull();
      expect(empty.lowestPoint).toBeNull();
      expect(empty.highestPm25).toBeNull();
      expect(empty.lowestPm25).toBeNull();

      const invalidPoints = deriveForecastExtremes([
        createForecastPoint('00:00', null, 'T00:00'),
      ]);
      expect(invalidPoints.highestPm25).toBeNull();
    });
  });

  describe('deriveConditionSummary', () => {
    it('returns elevated smog warning when highest PM2.5 exceeds 80', () => {
      const summary = deriveConditionSummary(95, 30);
      expect(summary).toContain('elevated smog concentrations');
    });

    it('returns moderate advisory when highest PM2.5 is between 45 and 80', () => {
      const summary = deriveConditionSummary(60, 25);
      expect(summary).toContain('Moderate ambient particulate concentrations');
    });

    it('returns favorable conditions summary when highest PM2.5 is 45 or lower', () => {
      const summary = deriveConditionSummary(35, 15);
      expect(summary).toContain('Favorable periods for outdoor family routines');
    });

    it('returns steady fallback when values are null', () => {
      const summary = deriveConditionSummary(null, null);
      expect(summary).toContain('remain relatively steady');
    });
  });

  describe('triageActivitiesNeedingAttention', () => {
    const forecast: ForecastPoint[] = [
      createForecastPoint('07:00', 30, 'T07:00'),
      createForecastPoint('08:00', 55, 'T08:00'),
      createForecastPoint('14:00', 20, 'T14:00'),
      createForecastPoint('18:00', 48, 'T18:00'),
    ];

    const members: HouseholdMember[] = [
      {
        id: 'm1',
        nickname: 'Aarav',
        archetype: 'CHILD_STUDENT',
        sensitivityTier: 'PEDIATRIC',
        createdAt: '2026-11-24T00:00:00Z',
        schedules: [
          { id: 's1', activityType: 'OUTDOOR_EXERCISE', activityName: 'Morning Jog', startTime: '07:00', durationMinutes: 45 },
          { id: 's2', activityType: 'SCHOOL_TRAVEL', activityName: 'Bus to School', startTime: '08:00', durationMinutes: 45 },
        ],
      },
      {
        id: 'm2',
        nickname: 'Rohit',
        archetype: 'WORKING_COMMUTER',
        sensitivityTier: 'NONE',
        createdAt: '2026-11-24T00:00:00Z',
        schedules: [
          { id: 's3', activityType: 'OUTDOOR_EXERCISE', activityName: 'Cycling', startTime: '07:00', durationMinutes: 45 },
          { id: 's4', activityType: 'VENTILATION', activityName: 'Window Flush', startTime: '18:00', durationMinutes: 30 },
        ],
      },
    ];

    it('correctly triages activities exceeding sensitivity-specific thresholds', () => {
      const { allSchedules, activitiesNeedingAttention } = triageActivitiesNeedingAttention(members, forecast);

      expect(allSchedules).toHaveLength(4);

      // s1: Aarav (PEDIATRIC) exercise at 07:00 (pm25=30 > 25 threshold) -> needs attention
      // s2: Aarav school travel at 08:00 (pm25=55 > 45 threshold) -> needs attention
      // s3: Rohit (NONE) exercise at 07:00 (pm25=30 <= 35 threshold) -> SAFE
      // s4: Rohit ventilation at 18:00 (pm25=48 > 40 threshold) -> needs attention
      expect(activitiesNeedingAttention).toHaveLength(3);
      expect(activitiesNeedingAttention.map((a) => a.id)).toEqual(['s1', 's2', 's4']);
    });
  });

  describe('calculateExposureGaugeData', () => {
    it('returns optimized gauge when adopted shifts are active', () => {
      const recommendations: PlannerRecommendation[] = [
        {
          id: 'r1',
          memberId: 'm1',
          memberNickname: 'Aarav',
          scheduleId: 's1',
          activityName: 'Jog',
          type: 'TIMING_SHIFT',
          title: 'Shift Jog',
          practicalAction: 'Move to afternoon',
          scientificReason: 'Lower PM2.5',
          originalWindow: { startTime: '07:00', endTime: '07:45' },
          forecastAttribution: 'CAMS',
          limitationsDisclaimer: 'None',
          deltaC: {
            pollutantKey: 'pm2_5',
            pollutantLabel: 'PM2.5',
            deltaValue: 40,
            unit: 'µg/m³',
            originalConcentration: 80,
            suggestedConcentration: 40,
            providerTimestamp: '2026-11-24',
            cautionaryNote: 'None',
          },
        },
      ];

      const activeActions: ActiveActionItem[] = [
        {
          id: 'a1',
          recommendationId: 'r1',
          memberId: 'm1',
          memberNickname: 'Aarav',
          title: 'Shifted Jog to 14:00',
          actionType: 'TIMING_SHIFT',
          originalWindow: { startTime: '07:00', endTime: '07:45' },
          adjustedWindow: { startTime: '14:00', endTime: '14:45' },
          status: 'ADOPTED',
          adoptedAt: '2026-11-24T06:00:00Z',
          completedAt: null,
          deltaCValue: 40,
        },
      ];

      const gauge = calculateExposureGaugeData(recommendations, activeActions);
      expect(gauge.gaugeIsOptimized).toBe(true);
      expect(gauge.hasAdoptedShifts).toBe(true);
      expect(gauge.gaugeDeltaCValue).toBe(40);
      expect(gauge.gaugeStatusTitle).toBe('Active Smog Exposure Reduction');
      expect(gauge.gaugeStatusSubtitle).toContain('1 routine shift adopted');
    });

    it('returns potential reduction metrics when recommendations exist without active adoptions', () => {
      const recommendations: PlannerRecommendation[] = [
        {
          id: 'r1',
          memberId: 'm1',
          memberNickname: 'Aarav',
          scheduleId: 's1',
          activityName: 'Jog',
          type: 'TIMING_SHIFT',
          title: 'Shift Morning Jog',
          practicalAction: 'Move to afternoon',
          scientificReason: 'Lower PM2.5',
          originalWindow: { startTime: '07:00', endTime: '07:45' },
          forecastAttribution: 'CAMS',
          limitationsDisclaimer: 'None',
          deltaC: {
            pollutantKey: 'pm2_5',
            pollutantLabel: 'PM2.5',
            deltaValue: 50,
            unit: 'µg/m³',
            originalConcentration: 100,
            suggestedConcentration: 50,
            providerTimestamp: '2026-11-24',
            cautionaryNote: 'None',
          },
        },
      ];

      const gauge = calculateExposureGaugeData(recommendations, []);
      expect(gauge.gaugeIsOptimized).toBe(false);
      expect(gauge.hasAdoptedShifts).toBe(false);
      expect(gauge.hasPotentialShifts).toBe(true);
      expect(gauge.gaugeDeltaCValue).toBe(50);
      expect(gauge.gaugeStatusTitle).toBe('Potential Exposure Reduction Available');
      expect(gauge.gaugeStatusSubtitle).toContain('1 routine shift window ready to adopt');
    });

    it('returns baseline status when no recommendations or adoptions exist', () => {
      const gauge = calculateExposureGaugeData([], []);
      expect(gauge.gaugeIsOptimized).toBe(false);
      expect(gauge.hasAdoptedShifts).toBe(false);
      expect(gauge.hasPotentialShifts).toBe(false);
      expect(gauge.gaugePercentage).toBe(0);
      expect(gauge.gaugeStatusTitle).toBe('Routines In Lower Smog Hours');
    });
  });
});
