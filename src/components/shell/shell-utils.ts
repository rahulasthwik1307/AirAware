import { WorkspaceKey } from '@/domain/types';
import { HouseholdMember } from '@/domain/household/types';

export function createHouseholdMembersFromSensitivities(sensitivities: readonly string[]): HouseholdMember[] {
  const members: HouseholdMember[] = [];
  const now = new Date().toISOString();

  if (sensitivities.includes('infants_children')) {
    members.push({
      id: 'member_child',
      nickname: 'Aarav (Child)',
      archetype: 'CHILD_STUDENT',
      sensitivityTier: 'PEDIATRIC',
      createdAt: now,
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
    });
  }

  if (sensitivities.includes('elderly_parents') && members.length < 4) {
    members.push({
      id: 'member_senior',
      nickname: 'Dada / Dadi (Senior)',
      archetype: 'SENIOR_VULNERABLE',
      sensitivityTier: 'SENIOR',
      createdAt: now,
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
    });
  }

  if (sensitivities.includes('asthma_respiratory') && members.length < 4) {
    members.push({
      id: 'member_respiratory',
      nickname: 'Priya (Asthma Care)',
      archetype: 'OUTDOOR_ENTHUSIAST',
      sensitivityTier: 'RESPIRATORY',
      createdAt: now,
      schedules: [
        {
          id: 'sch_exercise',
          activityName: 'Outdoor Jogging / Exercise',
          activityType: 'OUTDOOR_EXERCISE',
          startTime: '07:00',
          durationMinutes: 45,
          commuteMode: 'WALKING',
          commuteDistanceKm: 3,
        },
      ],
    });
  }

  if (sensitivities.includes('active_commuter') && members.length < 4) {
    members.push({
      id: 'member_commuter',
      nickname: 'Rohan (Daily Commuter)',
      archetype: 'WORKING_COMMUTER',
      sensitivityTier: 'NONE',
      createdAt: now,
      schedules: [
        {
          id: 'sch_commute',
          activityName: 'Morning Office Commute',
          activityType: 'COMMUTE',
          startTime: '08:30',
          durationMinutes: 60,
          commuteMode: 'PRIVATE_CAR',
          commuteDistanceKm: 18,
        },
      ],
    });
  }

  if ((members.length === 0 || sensitivities.includes('healthy_adult')) && members.length < 4) {
    members.push({
      id: 'member_general',
      nickname: 'Family Household',
      archetype: 'WORKING_COMMUTER',
      sensitivityTier: 'NONE',
      createdAt: now,
      schedules: [
        {
          id: 'sch_errand',
          activityName: 'Market & Neighborhood Errands',
          activityType: 'ERRAND',
          startTime: '10:00',
          durationMinutes: 30,
          commuteMode: 'WALKING',
          commuteDistanceKm: 1,
        },
      ],
    });
  }

  return members.slice(0, 4);
}

export const WORKSPACE_TITLES: Record<WorkspaceKey, string> = {
  'air-intelligence': 'AirAware — Global Environmental Intelligence',
  'family-planner': 'Family Daily Planner — AirAware',
  'indoor-air': 'Indoor Air Intelligence — AirAware',
  'cleaner-choices': 'Cleaner Choices & Impact — AirAware',
  'community-alerts': 'Community Air Intelligence — AirAware',
};

export const WORKSPACE_DESCRIPTIONS: Record<WorkspaceKey, string> = {
  'air-intelligence': 'Real-time, hyperlocal environmental intelligence and actionable health guidance powered by open public science.',
  'family-planner': 'Personalized family schedules coordinated with live diurnal smog forecasts for vulnerable members.',
  'indoor-air': 'Indoor room micro-climates, particle clearance kinetics, air cleaner sizing, and evidence-backed mitigations.',
  'cleaner-choices': 'Evidence-backed daily commute alternatives and quantifiable emissions reduction impact.',
  'community-alerts': 'Hyperlocal pollution incident reporting, society airshed alerts, and collective environmental action.',
};
