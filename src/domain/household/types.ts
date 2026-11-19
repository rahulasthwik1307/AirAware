/**
 * AirAware Domain Types — Household Profiles
 * Authoritative types for multi-member family profiles, sensitivity tiers,
 * and individual daily schedules stored 100% locally.
 */

export type HouseholdArchetype =
  | 'CHILD_STUDENT'
  | 'WORKING_COMMUTER'
  | 'SENIOR_VULNERABLE'
  | 'OUTDOOR_ENTHUSIAST';

export type SensitivityTier =
  | 'NONE'
  | 'PEDIATRIC'
  | 'SENIOR'
  | 'RESPIRATORY'
  | 'CARDIOVASCULAR';

export type ActivityType =
  | 'OUTDOOR_EXERCISE'
  | 'COMMUTE'
  | 'SCHOOL_TRAVEL'
  | 'ERRAND'
  | 'INDOOR_CHORE'
  | 'VENTILATION';

export type CommuteMode =
  | 'WALKING'
  | 'CYCLING'
  | 'PUBLIC_TRANSIT'
  | 'PRIVATE_CAR'
  | 'CARPOOL';

export interface MemberScheduleItem {
  readonly id: string;
  readonly activityName: string;
  readonly activityType: ActivityType;
  readonly startTime: string; // "HH:mm" (24-hour local time format)
  readonly durationMinutes: number; // 5 to 720 minutes
  readonly commuteMode?: CommuteMode;
  readonly commuteDistanceKm?: number;
}

export interface HouseholdMember {
  readonly id: string;
  readonly nickname: string;
  readonly archetype: HouseholdArchetype;
  readonly sensitivityTier: SensitivityTier;
  readonly schedules: readonly MemberScheduleItem[];
  readonly createdAt: string; // ISO 8601
}

export interface HouseholdStorageState {
  readonly version: 1;
  readonly updatedAt: string; // ISO 8601
  readonly activeMemberId: string | null;
  readonly members: readonly HouseholdMember[];
}
