/**
 * AirAware Zod Schemas — Actionable Daily Routine Loop
 * Validates local persistence for 'airaware_active_plan'.
 */

import { z } from 'zod';
import { ActivePlanStorageState } from './types';
import { TimeStringSchema } from '../household/schema';

export const RecommendationTypeSchema = z.enum([
  'TIMING_SHIFT',
  'INDOOR_ALTERNATIVE',
  'TRANSIT_ADJUSTMENT',
  'VENTILATION_WINDOW',
  'PROTECTIVE_HABIT',
]);

export const ActionItemStatusSchema = z.enum(['ADOPTED', 'COMPLETED', 'SKIPPED']);

export const TimeWindowSchema = z.object({
  startTime: TimeStringSchema,
  endTime: TimeStringSchema,
});

export const ActiveActionItemSchema = z.object({
  id: z.string().min(1),
  recommendationId: z.string().min(1),
  memberId: z.string().min(1),
  memberNickname: z.string().trim().min(1).max(30),
  scheduleId: z.string().optional(),
  title: z.string().trim().min(1).max(80),
  actionType: RecommendationTypeSchema,
  originalWindow: TimeWindowSchema,
  adjustedWindow: TimeWindowSchema,
  status: ActionItemStatusSchema,
  adoptedAt: z.string(),
  completedAt: z.string().nullable(),
  deltaCValue: z.number().nullable().optional(),
  deltaCPollutant: z.string().nullable().optional(),
  avoidedCo2eKg: z.number().nullable().optional(),
  userNotes: z.string().max(200).optional(),
});

export const ActivePlanStorageStateSchema = z.object({
  version: z.literal(1),
  updatedAt: z.string(),
  actions: z.array(ActiveActionItemSchema),
});

export function createDefaultActivePlanState(): ActivePlanStorageState {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    actions: [],
  };
}

export function parseActivePlanStorageState(raw: unknown): ActivePlanStorageState | null {
  if (!raw || typeof raw !== 'object') return null;
  const result = ActivePlanStorageStateSchema.safeParse(raw);
  if (result.success) {
    return result.data;
  }
  return null;
}
