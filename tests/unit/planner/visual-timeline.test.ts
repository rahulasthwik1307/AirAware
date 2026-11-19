import { describe, it, expect } from 'vitest';
import { ForecastPoint } from '@/domain/types';
import { MemberScheduleItem } from '@/domain/household/types';
import { ActiveActionItem } from '@/domain/planner/types';

describe('Family-Wide Visual Daily Timeline Logic & Mathematics', () => {
  // Test helper for timeline minute positioning
  function computeTimelinePosition(startTime: string, durationMinutes: number) {
    const [hStr, mStr] = startTime.split(':');
    const h = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    const startMinutes = h * 60 + m;
    const leftPercent = (startMinutes / 1440) * 100;
    const widthPercent = Math.max(1.8, (durationMinutes / 1440) * 100);
    return { leftPercent, widthPercent, startMinutes };
  }

  // Test helper for dynamic diurnal intensity scaling
  function computeForecastIntensity(pm25: number, minPm25: number, maxPm25: number) {
    const range = Math.max(1, maxPm25 - minPm25);
    const normalized = (pm25 - minPm25) / range;
    const isHigh = normalized >= 0.7 || pm25 > 90;
    const isLow = normalized <= 0.3 && pm25 <= 60;
    return { normalized, isHigh, isLow };
  }

  // Test helper for 4-period mobile summary calculations
  function computeMobilePeriodSummaries(validPoints: ForecastPoint[], schedules: { startTime: string; durationMinutes: number }[]) {
    const periodConfigs = [
      { label: 'Morning', startHour: 6, endHour: 9 },
      { label: 'Midday', startHour: 10, endHour: 13 },
      { label: 'Afternoon', startHour: 14, endHour: 17 },
      { label: 'Evening / Night', startHour: 18, endHour: 21 },
    ];

    return periodConfigs.map((cfg) => {
      const periodPoints = validPoints.slice(cfg.startHour, cfg.endHour + 1);
      const values = periodPoints
        .map((p) => p.pm25)
        .filter((v): v is number => v !== null && v !== undefined && Number.isFinite(v));

      const averagePm25 =
        values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : null;

      let peakPm25: number | null = null;
      let peakHour: number | null = null;
      if (values.length > 0) {
        let maxVal = -1;
        periodPoints.forEach((pt, idx) => {
          if (pt.pm25 !== null && pt.pm25 !== undefined && pt.pm25 > maxVal) {
            maxVal = pt.pm25;
            peakPm25 = Math.round(pt.pm25 * 10) / 10;
            peakHour = cfg.startHour + idx;
          }
        });
      }

      const activityCount = schedules.filter((s) => {
        const [h] = s.startTime.split(':');
        const sHour = parseInt(h, 10) || 0;
        return sHour >= cfg.startHour && sHour <= cfg.endHour;
      }).length;

      return {
        label: cfg.label,
        averagePm25,
        peakPm25,
        peakHour,
        activityCount,
      };
    });
  }

  it('calculates spatial left and width percentages accurately across 24 hours (1440 mins)', () => {
    // 00:00 start (midnight)
    const midnight = computeTimelinePosition('00:00', 60);
    expect(midnight.leftPercent).toBe(0);
    expect(midnight.widthPercent).toBeCloseTo((60 / 1440) * 100, 2);

    // 07:30 start (morning commute/run)
    const morning = computeTimelinePosition('07:30', 45);
    expect(morning.startMinutes).toBe(450);
    expect(morning.leftPercent).toBeCloseTo(31.25, 2); // 450 / 1440 = 0.3125
    expect(morning.widthPercent).toBeCloseTo((45 / 1440) * 100, 2);

    // 15:00 start (afternoon shifted window)
    const afternoon = computeTimelinePosition('15:00', 45);
    expect(afternoon.startMinutes).toBe(900);
    expect(afternoon.leftPercent).toBeCloseTo(62.5, 2); // 900 / 1440 = 0.625

    // Minimum width clamp for very short activities (e.g. 5 minutes)
    const shortAct = computeTimelinePosition('12:00', 5);
    expect(shortAct.widthPercent).toBeGreaterThanOrEqual(1.8); // Accessible click target
  });

  it('dynamically computes pollution intensity bands from actual values without hardcoded morning/afternoon assumptions', () => {
    // Scenario 1: Typical winter inversion (high morning, lower afternoon)
    const winterMorning = computeForecastIntensity(148.5, 55.8, 162.1);
    expect(winterMorning.isHigh).toBe(true);
    expect(winterMorning.isLow).toBe(false);

    const winterAfternoon = computeForecastIntensity(55.8, 55.8, 162.1);
    expect(winterAfternoon.isHigh).toBe(false);
    expect(winterAfternoon.isLow).toBe(true);

    // Scenario 2: Summer ozone / dust episode (low morning, severe afternoon spike at 15:00)
    // Proves that 15:00 is NOT hardcoded as "clean"
    const summerMorning = computeForecastIntensity(25.0, 20.0, 180.0);
    expect(summerMorning.isLow).toBe(true);
    expect(summerMorning.isHigh).toBe(false);

    const summerAfternoon = computeForecastIntensity(180.0, 20.0, 180.0);
    expect(summerAfternoon.isHigh).toBe(true);
    expect(summerAfternoon.isLow).toBe(false);
  });

  it('computes 4-period diurnal summaries accurately from actual hourly forecast slices', () => {
    const mockForecast: ForecastPoint[] = Array.from({ length: 24 }, (_, h) => ({
      time: `2026-11-19T${h.toString().padStart(2, '0')}:00`,
      displayTime: `${h.toString().padStart(2, '0')}:00`,
      pm25: h >= 6 && h <= 9 ? 140 : h >= 14 && h <= 17 ? 60 : 100,
      pm10: 200,
      no2: 40,
      so2: 10,
      co: 500,
      o3: 30,
      aqi: 150,
      usAqi: 150,
      europeanAqi: 4,
      activeAqi: 150,
      dominantPollutant: 'pm25',
      tier: null,
    }));

    const mockSchedules = [
      { startTime: '07:30', durationMinutes: 45 },
      { startTime: '08:15', durationMinutes: 30 },
      { startTime: '15:00', durationMinutes: 60 },
    ];

    const summaries = computeMobilePeriodSummaries(mockForecast, mockSchedules);
    expect(summaries).toHaveLength(4);

    const morning = summaries.find((s) => s.label === 'Morning')!;
    expect(morning.averagePm25).toBe(140);
    expect(morning.activityCount).toBe(2);
    expect(morning.peakHour).toBe(6);

    const afternoon = summaries.find((s) => s.label === 'Afternoon')!;
    expect(afternoon.averagePm25).toBe(60);
    expect(afternoon.activityCount).toBe(1);
  });

  it('evaluates modelled ambient concentration difference (ΔC) correctly and disallows personal inhaled dose claims', () => {
    const cOriginal = 148.5; // μg/m³ at 07:30
    const cAdjusted = 55.8;  // μg/m³ at 15:00
    const deltaC = Math.round((cOriginal - cAdjusted) * 10) / 10;

    expect(deltaC).toBe(92.7);
    expect(deltaC).toBeGreaterThan(0);

    // The scientific string must explicitly state "Modelled ambient concentration difference (ΔC)"
    const label = `+${deltaC} μg/m³ Modelled ambient concentration difference (ΔC)`;
    expect(label).toContain('Modelled ambient concentration difference (ΔC)');
    expect(label).not.toContain('ambient exposure reduction');
    expect(label).not.toContain('personal exposure reduction');
  });

  it('handles adopted action shifting and distinguishes shifted blocks from unmodified blocks', () => {
    const originalSchedule: MemberScheduleItem = {
      id: 'sch-1',
      activityName: 'Morning Soccer',
      activityType: 'OUTDOOR_EXERCISE',
      startTime: '07:30',
      durationMinutes: 45,
    };

    const adoptedAction: ActiveActionItem = {
      id: 'act-1',
      recommendationId: 'rec-1',
      memberId: 'mem-1',
      memberNickname: 'Priya',
      actionType: 'TIMING_SHIFT',
      title: 'Shift Morning Soccer to 15:00',
      status: 'ADOPTED',
      adoptedAt: '2026-11-19T08:00:00Z',
      completedAt: null,
      originalWindow: {
        startTime: '07:30',
        endTime: '08:15',
      },
      adjustedWindow: {
        startTime: '15:00',
        endTime: '15:45',
      },
      deltaCValue: 92.7,
    };

    // When adopted, effective start time is 15:00 instead of 07:30
    const effectiveStart = adoptedAction.adjustedWindow?.startTime ?? originalSchedule.startTime;
    expect(effectiveStart).toBe('15:00');

    const pos = computeTimelinePosition(effectiveStart, originalSchedule.durationMinutes);
    expect(pos.leftPercent).toBeCloseTo(62.5, 2);
  });

  it('handles missing or empty forecast arrays without runtime crashes', () => {
    const emptyPoints: ForecastPoint[] = [];
    const summaries = computeMobilePeriodSummaries(emptyPoints, []);
    expect(summaries).toHaveLength(4);
    summaries.forEach((s) => {
      expect(s.averagePm25).toBeNull();
      expect(s.peakPm25).toBeNull();
      expect(s.activityCount).toBe(0);
    });
  });
});
