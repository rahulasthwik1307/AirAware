import { describe, it, expect } from 'vitest';
import { HouseholdStorageStateSchema } from '@/domain/household/schema';

describe('Onboarding Personalization & Local-First Invariants', () => {
  it('validates pre-seeded household state adheres strictly to HouseholdStorageStateSchema', () => {
    const preSeededHousehold = {
      version: 1,
      updatedAt: new Date().toISOString(),
      activeMemberId: 'member_child',
      members: [
        {
          id: 'member_child',
          nickname: 'Aarav (Child)',
          archetype: 'CHILD_STUDENT',
          sensitivityTier: 'PEDIATRIC',
          createdAt: new Date().toISOString(),
          schedules: [
            {
              id: 'sch_school',
              activityName: 'Morning School Transit',
              activityType: 'SCHOOL_TRAVEL',
              startTime: '07:30',
              durationMinutes: 45,
              commuteMode: 'PUBLIC_TRANSIT',
              commuteDistanceKm: 6,
            },
          ],
        },
        {
          id: 'member_senior',
          nickname: 'Dada / Dadi (Senior)',
          archetype: 'SENIOR_VULNERABLE',
          sensitivityTier: 'SENIOR',
          createdAt: new Date().toISOString(),
          schedules: [
            {
              id: 'sch_walk',
              activityName: 'Morning Park Walk',
              activityType: 'OUTDOOR_EXERCISE',
              startTime: '06:45',
              durationMinutes: 40,
              commuteMode: 'WALKING',
              commuteDistanceKm: 1.5,
            },
          ],
        },
      ],
    };

    const parseResult = HouseholdStorageStateSchema.safeParse(preSeededHousehold);
    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      expect(parseResult.data.members.length).toBe(2);
      expect(parseResult.data.members[0].sensitivityTier).toBe('PEDIATRIC');
      expect(parseResult.data.members[1].sensitivityTier).toBe('SENIOR');
    }
  });

  it('enforces maximum 4 household members invariant', () => {
    const excessiveMembersState = {
      version: 1,
      updatedAt: new Date().toISOString(),
      activeMemberId: 'm1',
      members: [
        { id: 'm1', nickname: 'M1', archetype: 'CHILD_STUDENT', sensitivityTier: 'PEDIATRIC', createdAt: new Date().toISOString(), schedules: [] },
        { id: 'm2', nickname: 'M2', archetype: 'SENIOR_VULNERABLE', sensitivityTier: 'SENIOR', createdAt: new Date().toISOString(), schedules: [] },
        { id: 'm3', nickname: 'M3', archetype: 'OUTDOOR_ENTHUSIAST', sensitivityTier: 'RESPIRATORY', createdAt: new Date().toISOString(), schedules: [] },
        { id: 'm4', nickname: 'M4', archetype: 'WORKING_COMMUTER', sensitivityTier: 'NONE', createdAt: new Date().toISOString(), schedules: [] },
        { id: 'm5', nickname: 'M5', archetype: 'WORKING_COMMUTER', sensitivityTier: 'NONE', createdAt: new Date().toISOString(), schedules: [] },
      ],
    };

    const parseResult = HouseholdStorageStateSchema.safeParse(excessiveMembersState);
    expect(parseResult.success).toBe(false);
  });
});
