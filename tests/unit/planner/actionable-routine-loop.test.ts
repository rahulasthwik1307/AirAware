import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import {
  loadActivePlanState,
  adoptRecommendation,
  updateActionItem,
  markActionCompleted,
  markActionSkipped,
  removeActionItem,
  resetPlanStorageCache,
  ACTIVE_PLAN_STORAGE_KEY,
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
  id: 'rec_shift_101',
  memberId: 'mem_1',
  memberNickname: 'Aarav',
  scheduleId: 'sch_1',
  activityName: 'Evening Park Football',
  type: 'TIMING_SHIFT',
  title: 'Shift Football to 16:00',
  practicalAction: 'Play football at 16:00 when forecast ambient PM2.5 is lower.',
  scientificReason: 'Lower ambient particulate concentrations forecast during mid-afternoon.',
  originalWindow: { startTime: '18:00', endTime: '19:00' },
  suggestedWindow: { startTime: '16:00', endTime: '17:00' },
  deltaC: {
    pollutantKey: 'pm2_5',
    pollutantLabel: 'PM2.5',
    deltaValue: 24.5,
    unit: 'μg/m³',
    originalConcentration: 72.0,
    suggestedConcentration: 47.5,
    providerTimestamp: '2026-11-19T16:00:00Z',
    cautionaryNote: 'Modelled ambient difference, not inhaled dose.',
  },
  forecastAttribution: 'Open-Meteo CAMS',
  limitationsDisclaimer: 'Regional forecast model.',
};

describe('Actionable Daily Routine Loop (`airaware_active_plan`)', () => {
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

  it('loads safe default state when storage is empty', () => {
    const state = loadActivePlanState();
    expect(state.version).toBe(1);
    expect(state.actions).toHaveLength(0);
  });

  it('adopts a recommendation into the active plan', () => {
    const state = createDefaultActivePlanState();
    const result = adoptRecommendation(state, mockRecommendation);

    expect(result.actionId).toBeTruthy();
    expect(result.isDuplicate).toBe(false);
    expect(result.state.actions).toHaveLength(1);

    const action = result.state.actions[0];
    expect(action.title).toBe(mockRecommendation.title);
    expect(action.status).toBe('ADOPTED');
    expect(action.originalWindow.startTime).toBe('18:00');
    expect(action.adjustedWindow.startTime).toBe('16:00');
    expect(action.deltaCValue).toBe(24.5);
  });

  it('prevents accidental duplicate adoptions of the same recommendation', () => {
    let state = createDefaultActivePlanState();
    const res1 = adoptRecommendation(state, mockRecommendation);
    state = res1.state;
    expect(state.actions).toHaveLength(1);

    // Second adoption attempt of identical recommendation
    const res2 = adoptRecommendation(state, mockRecommendation);
    expect(res2.isDuplicate).toBe(true);
    expect(res2.actionId).toBe(res1.actionId);
    expect(res2.state.actions).toHaveLength(1); // No duplicate added
  });

  it('updates an adopted action with custom timing or notes', () => {
    let state = createDefaultActivePlanState();
    const { state: s1, actionId } = adoptRecommendation(state, mockRecommendation);

    state = updateActionItem(s1, actionId!, {
      adjustedWindow: { startTime: '15:30', endTime: '16:30' },
      userNotes: 'Coach agreed to earlier session',
    });

    const updated = state.actions.find((a) => a.id === actionId);
    expect(updated?.adjustedWindow.startTime).toBe('15:30');
    expect(updated?.userNotes).toBe('Coach agreed to earlier session');
  });

  it('marks an action as COMPLETED with a valid timestamp', () => {
    let state = createDefaultActivePlanState();
    const { state: s1, actionId } = adoptRecommendation(state, mockRecommendation);

    state = markActionCompleted(s1, actionId!);
    const action = state.actions.find((a) => a.id === actionId);

    expect(action?.status).toBe('COMPLETED');
    expect(action?.completedAt).toBeTruthy();
  });

  it('marks an action as SKIPPED and clears completedAt', () => {
    let state = createDefaultActivePlanState();
    const { state: s1, actionId } = adoptRecommendation(state, mockRecommendation);
    state = markActionCompleted(s1, actionId!);

    state = markActionSkipped(state, actionId!);
    const action = state.actions.find((a) => a.id === actionId);

    expect(action?.status).toBe('SKIPPED');
    expect(action?.completedAt).toBeNull();
  });

  it('removes an action item cleanly', () => {
    let state = createDefaultActivePlanState();
    const { state: s1, actionId } = adoptRecommendation(state, mockRecommendation);
    expect(s1.actions).toHaveLength(1);

    state = removeActionItem(s1, actionId!);
    expect(state.actions).toHaveLength(0);
  });

  it('survives corrupted active plan JSON in localStorage', () => {
    mockStorage.setItem(ACTIVE_PLAN_STORAGE_KEY, 'corrupted_state_not_json');
    const state = loadActivePlanState();
    expect(state.version).toBe(1);
    expect(state.actions).toHaveLength(0);
  });
});
