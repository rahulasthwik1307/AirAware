import { describe, it, expect } from 'vitest';
import {
  createDefaultActivePlanState,
  parseActivePlanStorageState,
  RecommendationTypeSchema,
  ActionItemStatusSchema,
  ActiveActionItemSchema,
  ActivePlanStorageStateSchema,
} from '@/domain/planner/schema';

describe('Active Plan Zod Schema & Validation', () => {
  it('creates valid default empty active plan state', () => {
    const defaultState = createDefaultActivePlanState();
    expect(defaultState.version).toBe(1);
    expect(defaultState.actions).toEqual([]);
    expect(typeof defaultState.updatedAt).toBe('string');

    const validated = ActivePlanStorageStateSchema.safeParse(defaultState);
    expect(validated.success).toBe(true);
  });

  it('rejects null, non-objects and malformed payloads in parseActivePlanStorageState', () => {
    expect(parseActivePlanStorageState(null)).toBeNull();
    expect(parseActivePlanStorageState(undefined)).toBeNull();
    expect(parseActivePlanStorageState('string')).toBeNull();
    expect(parseActivePlanStorageState(123)).toBeNull();
    expect(parseActivePlanStorageState({ version: 2, actions: [] })).toBeNull();
    expect(parseActivePlanStorageState({ version: 1, actions: 'not-array' })).toBeNull();
  });

  it('validates all allowable recommendation action types and statuses', () => {
    const actionTypes = [
      'TIMING_SHIFT',
      'INDOOR_ALTERNATIVE',
      'TRANSIT_ADJUSTMENT',
      'VENTILATION_WINDOW',
      'PROTECTIVE_HABIT',
    ];

    actionTypes.forEach((type) => {
      expect(RecommendationTypeSchema.safeParse(type).success).toBe(true);
    });
    expect(RecommendationTypeSchema.safeParse('INVALID_TYPE').success).toBe(false);

    const statuses = ['ADOPTED', 'COMPLETED', 'SKIPPED'];
    statuses.forEach((status) => {
      expect(ActionItemStatusSchema.safeParse(status).success).toBe(true);
    });
    expect(ActionItemStatusSchema.safeParse('UNKNOWN_STATUS').success).toBe(false);
  });

  it('parses a rich valid ActivePlanStorageState', () => {
    const raw = {
      version: 1,
      updatedAt: '2026-11-23T12:00:00Z',
      actions: [
        {
          id: 'action-1',
          recommendationId: 'rec-shift-1',
          memberId: 'member-child',
          memberNickname: 'Aarav',
          title: 'Shift Morning Recess Indoors',
          actionType: 'INDOOR_ALTERNATIVE',
          originalWindow: { startTime: '08:00', endTime: '09:00' },
          adjustedWindow: { startTime: '12:30', endTime: '13:30' },
          status: 'ADOPTED',
          adoptedAt: '2026-11-23T07:15:00Z',
          completedAt: null,
          deltaCValue: 45.2,
          deltaCPollutant: 'PM2.5',
          avoidedCo2eKg: 1.2,
          userNotes: 'Used bedroom HEPA filter during lunch',
        },
      ],
    };

    const parsed = parseActivePlanStorageState(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.actions).toHaveLength(1);
    expect(parsed?.actions[0].memberNickname).toBe('Aarav');
    expect(parsed?.actions[0].actionType).toBe('INDOOR_ALTERNATIVE');
  });

  it('rejects action items with invalid time formats or missing required fields', () => {
    const invalidAction = {
      id: 'action-x',
      recommendationId: 'rec-1',
      memberId: 'm1',
      memberNickname: 'Priya',
      title: 'Valid Title',
      actionType: 'TIMING_SHIFT',
      originalWindow: { startTime: '25:00', endTime: '09:00' }, // Invalid hour
      adjustedWindow: { startTime: '09:00', endTime: '10:00' },
      status: 'ADOPTED',
      adoptedAt: '2026-11-23T07:15:00Z',
      completedAt: null,
    };

    const result = ActiveActionItemSchema.safeParse(invalidAction);
    expect(result.success).toBe(false);
  });
});
