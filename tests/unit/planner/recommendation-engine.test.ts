import { describe, it, expect } from 'vitest';
import { generateMemberRecommendations } from '@/domain/planner/recommendation-engine';
import { HouseholdMember } from '@/domain/household/types';
import { ForecastPoint } from '@/domain/types';

function createMockForecast(): ForecastPoint[] {
  const points: ForecastPoint[] = [];
  for (let h = 0; h < 24; h++) {
    // Diurnal curve: high in morning (07:00 = 85 μg/m³), low in afternoon (14:00 = 35 μg/m³)
    let pm25 = 50;
    if (h >= 6 && h <= 9) pm25 = 85;
    else if (h >= 13 && h <= 16) pm25 = 35;
    else if (h >= 18 && h <= 21) pm25 = 75;

    points.push({
      time: `2026-11-19T${h.toString().padStart(2, '0')}:00:00Z`,
      displayTime: `${h.toString().padStart(2, '0')}:00`,
      usAqi: Math.round(pm25 * 1.5),
      europeanAqi: 3,
      activeAqi: Math.round(pm25 * 1.5),
      tier: null,
      pm25,
      pm10: pm25 * 1.6,
      temperature: 22,
      windSpeed: 8,
    });
  }
  return points;
}

describe('Deterministic Recommendation Engine', () => {
  const mockForecast = createMockForecast();

  it('generates a TIMING_SHIFT recommendation when a cleaner afternoon window exists for outdoor exercise', () => {
    const member: HouseholdMember = {
      id: 'mem_1',
      nickname: 'Aarav',
      archetype: 'CHILD_STUDENT',
      sensitivityTier: 'NONE',
      createdAt: '2026-11-19T00:00:00Z',
      schedules: [
        {
          id: 'sch_1',
          activityName: 'Morning Football Practice',
          activityType: 'OUTDOOR_EXERCISE',
          startTime: '07:00', // Peak morning PM2.5 = 85
          durationMinutes: 60,
        },
      ],
    };

    const recs = generateMemberRecommendations({
      member,
      forecast: mockForecast,
    });

    const shiftRec = recs.find((r) => r.type === 'TIMING_SHIFT');
    expect(shiftRec).toBeDefined();
    expect(shiftRec?.originalWindow.startTime).toBe('07:00');
    // Best afternoon hour is 13:00 to 16:00
    expect(shiftRec?.suggestedWindow?.startTime).toMatch(/^(13|14|15):00$/);
    expect(shiftRec?.deltaC).toBeDefined();
    expect(shiftRec?.deltaC?.deltaValue).toBeGreaterThan(0);
    expect(shiftRec?.limitationsDisclaimer).toContain('Regional atmospheric model estimate');
  });

  it('generates an INDOOR_ALTERNATIVE recommendation for members with respiratory or pediatric sensitivity', () => {
    const member: HouseholdMember = {
      id: 'mem_sensitive',
      nickname: 'Dadaji',
      archetype: 'SENIOR_VULNERABLE',
      sensitivityTier: 'RESPIRATORY',
      createdAt: '2026-11-19T00:00:00Z',
      schedules: [
        {
          id: 'sch_walk',
          activityName: 'Morning Park Walk',
          activityType: 'OUTDOOR_EXERCISE',
          startTime: '08:00',
          durationMinutes: 45,
        },
      ],
    };

    const recs = generateMemberRecommendations({
      member,
      forecast: mockForecast,
    });

    const indoorRec = recs.find((r) => r.type === 'INDOOR_ALTERNATIVE');
    expect(indoorRec).toBeDefined();
    expect(indoorRec?.scientificReason).toContain('airway irritation');
  });

  it('generates a TRANSIT_ADJUSTMENT recommendation for solo car commutes', () => {
    const member: HouseholdMember = {
      id: 'mem_commuter',
      nickname: 'Priya',
      archetype: 'WORKING_COMMUTER',
      sensitivityTier: 'NONE',
      createdAt: '2026-11-19T00:00:00Z',
      schedules: [
        {
          id: 'sch_commute',
          activityName: 'Office Commute',
          activityType: 'COMMUTE',
          startTime: '09:00',
          durationMinutes: 40,
          commuteMode: 'PRIVATE_CAR',
          commuteDistanceKm: 15,
        },
      ],
    };

    const recs = generateMemberRecommendations({
      member,
      forecast: mockForecast,
    });

    const transitRec = recs.find((r) => r.type === 'TRANSIT_ADJUSTMENT');
    expect(transitRec).toBeDefined();
    expect(transitRec?.transportImpact).toBeDefined();
    expect(transitRec?.transportImpact?.avoidedCo2eKg).toBeGreaterThan(0);
    expect(transitRec?.limitationsDisclaimer).toContain('do not directly lower citywide ambient AQI');
  });

  it('generates an optimal natural VENTILATION_WINDOW recommendation', () => {
    const member: HouseholdMember = {
      id: 'mem_home',
      nickname: 'Family Home',
      archetype: 'WORKING_COMMUTER',
      sensitivityTier: 'NONE',
      createdAt: '2026-11-19T00:00:00Z',
      schedules: [
        {
          id: 'sch_vent',
          activityName: 'Morning Airing Out',
          activityType: 'VENTILATION',
          startTime: '07:00', // high pollution
          durationMinutes: 15,
        },
      ],
    };

    const recs = generateMemberRecommendations({
      member,
      forecast: mockForecast,
    });

    const ventRec = recs.find((r) => r.type === 'VENTILATION_WINDOW');
    expect(ventRec).toBeDefined();
    expect(ventRec?.title).toContain('Optimal Home Airing Window');
    expect(ventRec?.limitationsDisclaimer).toContain('balance outdoor particulate conditions');
  });

  it('does not generate speculative ventilation recommendations when forecast PM2.5 data is missing', () => {
    const member: HouseholdMember = {
      id: 'mem_home',
      nickname: 'Family Home',
      archetype: 'WORKING_COMMUTER',
      sensitivityTier: 'NONE',
      createdAt: '2026-11-19T00:00:00Z',
      schedules: [
        {
          id: 'sch_vent',
          activityName: 'Morning Airing Out',
          activityType: 'VENTILATION',
          startTime: '07:00',
          durationMinutes: 15,
        },
      ],
    };

    const nullPmForecast: ForecastPoint[] = mockForecast.map((fp) => ({
      ...fp,
      pm25: null,
    }));

    const recs = generateMemberRecommendations({
      member,
      forecast: nullPmForecast,
    });

    const ventRec = recs.find((r) => r.type === 'VENTILATION_WINDOW');
    expect(ventRec).toBeUndefined();
  });

  it('returns empty array when member has no schedules or forecast is empty', () => {
    const memberNoSchedules: HouseholdMember = {
      id: 'mem_empty',
      nickname: 'Empty',
      archetype: 'CHILD_STUDENT',
      sensitivityTier: 'NONE',
      createdAt: '2026-11-19T00:00:00Z',
      schedules: [],
    };

    expect(
      generateMemberRecommendations({
        member: memberNoSchedules,
        forecast: mockForecast,
      })
    ).toHaveLength(0);

    expect(
      generateMemberRecommendations({
        member: { ...memberNoSchedules, schedules: [{ id: '1', activityName: 'Test', activityType: 'ERRAND', startTime: '10:00', durationMinutes: 30 }] },
        forecast: [],
      })
    ).toHaveLength(0);
  });
});
