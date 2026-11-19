import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import {
  loadActivePlanState,
  adoptRecommendation,
  markActionCompleted,
  resetPlanStorageCache,
} from '@/domain/planner/storage';
import { createDefaultActivePlanState } from '@/domain/planner/schema';
import { PlannerRecommendation } from '@/domain/planner/types';

function createMockLocalStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

const mockRecommendation: PlannerRecommendation = {
  id: 'rec_shift_unique_1',
  memberId: 'mem_1',
  memberNickname: 'Aarav',
  scheduleId: 'sch_1',
  activityName: 'Morning Football',
  type: 'TIMING_SHIFT',
  title: 'Shift Football to 14:00',
  practicalAction: 'Play football at 14:00 when forecast ambient PM2.5 is lower.',
  scientificReason: 'Lower ambient particulate concentrations forecast during mid-afternoon.',
  originalWindow: { startTime: '07:00', endTime: '08:00' },
  suggestedWindow: { startTime: '14:00', endTime: '15:00' },
  deltaC: {
    pollutantKey: 'pm2_5',
    pollutantLabel: 'PM2.5',
    deltaValue: 50.0,
    unit: 'μg/m³',
    originalConcentration: 85.0,
    suggestedConcentration: 35.0,
    providerTimestamp: '2026-11-19T14:00:00Z',
    cautionaryNote: 'Modelled ambient difference, not inhaled dose.',
  },
  forecastAttribution: 'Open-Meteo CAMS',
  limitationsDisclaimer: 'Regional forecast model.',
};

describe('Action Deduplication & State Linkage Hardening', () => {
  const originalWindow = globalThis.window;
  let mockStorage: ReturnType<typeof createMockLocalStorage>;

  beforeAll(() => {
    mockStorage = createMockLocalStorage();
    (globalThis as unknown as { window: unknown }).window = {
      localStorage: mockStorage,
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  });

  afterAll(() => {
    (globalThis as unknown as { window: unknown }).window = originalWindow;
  });

  beforeEach(() => {
    mockStorage.clear();
    resetPlanStorageCache();
  });

  it('adopts a recommendation and prevents re-adopting when status is ADOPTED', () => {
    let state = createDefaultActivePlanState();
    const res1 = adoptRecommendation(state, mockRecommendation);
    expect(res1.isDuplicate).toBe(false);
    expect(res1.actionId).toBeTruthy();
    expect(res1.state.actions).toHaveLength(1);

    // Second adoption attempt while ADOPTED
    const res2 = adoptRecommendation(res1.state, mockRecommendation);
    expect(res2.isDuplicate).toBe(true);
    expect(res2.actionId).toBe(res1.actionId);
    expect(res2.state.actions).toHaveLength(1);
  });

  it('prevents re-adopting an action after it has been marked COMPLETED', () => {
    let state = createDefaultActivePlanState();
    const res1 = adoptRecommendation(state, mockRecommendation);
    state = res1.state;
    const actionId = res1.actionId!;

    // Mark completed
    state = markActionCompleted(state, actionId);
    expect(state.actions[0].status).toBe('COMPLETED');

    // Attempt to adopt recommendation again after completion
    const res2 = adoptRecommendation(state, mockRecommendation);
    expect(res2.isDuplicate).toBe(true);
    expect(res2.actionId).toBe(actionId);
    expect(res2.state.actions).toHaveLength(1);
    expect(res2.state.actions[0].status).toBe('COMPLETED');
  });
});
