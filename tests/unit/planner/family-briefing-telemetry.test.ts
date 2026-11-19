import { describe, it, expect } from 'vitest';
import { ForecastPoint } from '@/domain/types';
import { HouseholdMember } from '@/domain/household/types';

function createMockForecast(): ForecastPoint[] {
  const points: ForecastPoint[] = [];
  for (let h = 0; h < 24; h++) {
    let pm25 = 50;
    if (h === 7) pm25 = 115; // Peak hour
    else if (h === 14) pm25 = 32; // Lowest hour
    points.push({
      time: `2026-11-19T${h.toString().padStart(2, '0')}:00:00Z`,
      displayTime: `${h.toString().padStart(2, '0')}:00`,
      usAqi: Math.round(pm25 * 1.5),
      europeanAqi: 3,
      activeAqi: Math.round(pm25 * 1.5),
      tier: null,
      pm25,
      pm10: pm25 * 1.5,
    });
  }
  return points;
}

describe('Family Daily Briefing Telemetry & Chronological Sorting', () => {
  const mockForecast = createMockForecast();

  const members: HouseholdMember[] = [
    {
      id: 'mem_1',
      nickname: 'Aarav',
      archetype: 'CHILD_STUDENT',
      sensitivityTier: 'PEDIATRIC',
      createdAt: '2026-11-19T00:00:00Z',
      schedules: [
        {
          id: 'sch_1',
          activityName: 'Morning Football',
          activityType: 'OUTDOOR_EXERCISE',
          startTime: '07:00', // Matches peak hour (115 μg/m³)
          durationMinutes: 60,
        },
      ],
    },
    {
      id: 'mem_2',
      nickname: 'Priya',
      archetype: 'WORKING_COMMUTER',
      sensitivityTier: 'NONE',
      createdAt: '2026-11-19T00:00:00Z',
      schedules: [
        {
          id: 'sch_2',
          activityName: 'Office Commute',
          activityType: 'COMMUTE',
          startTime: '08:30',
          durationMinutes: 45,
          commuteMode: 'PRIVATE_CAR',
          commuteDistanceKm: 15,
        },
      ],
    },
    {
      id: 'mem_3',
      nickname: 'Dadaji',
      archetype: 'SENIOR_VULNERABLE',
      sensitivityTier: 'RESPIRATORY',
      createdAt: '2026-11-19T00:00:00Z',
      schedules: [
        {
          id: 'sch_3',
          activityName: 'Airing Out Home',
          activityType: 'VENTILATION',
          startTime: '14:00', // Matches lowest hour (32 μg/m³)
          durationMinutes: 15,
        },
      ],
    },
  ];

  it('accurately identifies peak and lowest forecast particulate hours from actual data', () => {
    const validPoints = mockForecast.filter(
      (fp) => fp.pm25 !== null && fp.pm25 !== undefined && Number.isFinite(fp.pm25)
    );
    const peak = validPoints.reduce((prev, curr) => ((curr.pm25 ?? 0) > (prev.pm25 ?? 0) ? curr : prev));
    const lowest = validPoints.reduce((prev, curr) => ((curr.pm25 ?? Infinity) < (prev.pm25 ?? Infinity) ? curr : prev));

    expect(peak.pm25).toBe(115);
    expect(peak.displayTime).toBe('07:00');

    expect(lowest.pm25).toBe(32);
    expect(lowest.displayTime).toBe('14:00');
  });

  it('merges schedules from all family members and sorts them chronologically', () => {
    const allActivities = members.flatMap((m) =>
      m.schedules.map((s) => ({
        schedule: s,
        memberNickname: m.nickname,
      }))
    );

    allActivities.sort((a, b) => a.schedule.startTime.localeCompare(b.schedule.startTime));

    expect(allActivities).toHaveLength(3);
    expect(allActivities[0].schedule.startTime).toBe('07:00');
    expect(allActivities[0].memberNickname).toBe('Aarav');

    expect(allActivities[1].schedule.startTime).toBe('08:30');
    expect(allActivities[1].memberNickname).toBe('Priya');

    expect(allActivities[2].schedule.startTime).toBe('14:00');
    expect(allActivities[2].memberNickname).toBe('Dadaji');
  });
});
