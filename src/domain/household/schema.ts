/**
 * AirAware Zod Schemas — Household Profiles & Schedules
 * Strict validation for local-first family storage, preventing corrupted
 * state and enforcing safety invariants (e.g. maximum 4 household members).
 */

import { z } from 'zod';
import { HouseholdStorageState } from './types';

export const HouseholdArchetypeSchema = z.enum([
  'CHILD_STUDENT',
  'WORKING_COMMUTER',
  'SENIOR_VULNERABLE',
  'OUTDOOR_ENTHUSIAST',
]);

export const SensitivityTierSchema = z.enum([
  'NONE',
  'PEDIATRIC',
  'SENIOR',
  'RESPIRATORY',
  'CARDIOVASCULAR',
]);

export const ActivityTypeSchema = z.enum([
  'OUTDOOR_EXERCISE',
  'COMMUTE',
  'SCHOOL_TRAVEL',
  'ERRAND',
  'INDOOR_CHORE',
  'VENTILATION',
]);

export const CommuteModeSchema = z.enum([
  'WALKING',
  'CYCLING',
  'PUBLIC_TRANSIT',
  'PRIVATE_CAR',
  'CARPOOL',
]);

export const TimeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:mm 24-hour format');

export const MemberScheduleItemSchema = z.object({
  id: z.string().min(1),
  activityName: z.string().trim().min(1).max(50),
  activityType: ActivityTypeSchema,
  startTime: TimeStringSchema,
  durationMinutes: z.number().int().min(5).max(720),
  commuteMode: CommuteModeSchema.optional(),
  commuteDistanceKm: z.number().min(0).max(300).optional(),
});

export const HouseholdMemberSchema = z.object({
  id: z.string().min(1),
  nickname: z.string().trim().min(1).max(30),
  archetype: HouseholdArchetypeSchema,
  sensitivityTier: SensitivityTierSchema,
  schedules: z.array(MemberScheduleItemSchema).max(12),
  createdAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/)),
});

export const HouseholdStorageStateSchema = z.object({
  version: z.literal(1),
  updatedAt: z.string(),
  activeMemberId: z.string().nullable(),
  members: z.array(HouseholdMemberSchema).max(4, 'Households cannot exceed 4 members'),
});

/**
 * Generates an initial empty household storage state.
 */
export function createDefaultHouseholdState(): HouseholdStorageState {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    activeMemberId: null,
    members: [],
  };
}

/**
 * Validates untrusted storage JSON against the HouseholdStorageState schema.
 */
export function parseHouseholdStorageState(raw: unknown): HouseholdStorageState | null {
  if (!raw || typeof raw !== 'object') return null;
  const result = HouseholdStorageStateSchema.safeParse(raw);
  if (result.success) {
    return result.data;
  }
  return null;
}
