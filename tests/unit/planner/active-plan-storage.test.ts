import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import {
  loadActivePlanState,
  saveActivePlanState,
  adoptRecommendation,
  markActionCompleted,
  markActionSkipped,
  updateActionItem,
  removeActionItem,
  subscribeActivePlanStorage,
  resetPlanStorageCache,
  ACTIVE_PLAN_STORAGE_KEY,
} from '@/domain/planner/storage';
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

describe('Active Plan Local Storage Operations', () => {
  const originalWindow = globalThis.window;
  let mockStorage: ReturnType<typeof createMockLocalStorage>;
  let listeners: Record<string, ((e?: unknown) => void)[]> = {};

  beforeAll(() => {
    mockStorage = createMockLocalStorage();
    (globalThis as unknown as { window: unknown }).window = {
      localStorage: mockStorage,
      dispatchEvent: (event: CustomEvent) => {
        const type = event.type;
        (listeners[type] || []).forEach((cb) => cb(event));
        return true;
      },
      addEventListener: (type: string, cb: (e?: unknown) => void) => {
        if (!listeners[type]) listeners[type] = [];
        listeners[type].push(cb);
      },
      removeEventListener: (type: string, cb: (e?: unknown) => void) => {
        if (listeners[type]) {
          listeners[type] = listeners[type].filter((fn) => fn !== cb);
        }
      },
    };
  });

  afterAll(() => {
    (globalThis as unknown as { window: unknown }).window = originalWindow;
  });

  beforeEach(() => {
    mockStorage.clear();
    resetPlanStorageCache();
    listeners = {};
    vi.restoreAllMocks();
  });

  const mockRec: PlannerRecommendation = {
    id: 'rec-test-1',
    memberId: 'm1',
    memberNickname: 'Aarav',
    scheduleId: 's1',
    activityName: 'Morning Recess',
    type: 'INDOOR_ALTERNATIVE',
    title: 'Recess Indoor Activity',
    practicalAction: 'Move activity inside to clean zone',
    scientificReason: 'Peak ambient PM2.5 in morning inversion',
    originalWindow: { startTime: '08:00', endTime: '09:00' },
    suggestedWindow: { startTime: '12:30', endTime: '13:30' },
    deltaC: {
      pollutantKey: 'pm2_5',
      pollutantLabel: 'PM2.5',
      deltaValue: 50,
      unit: 'µg/m³',
      originalConcentration: 120,
      suggestedConcentration: 70,
      providerTimestamp: '2026-11-23T08:00:00Z',
      cautionaryNote: 'Model prediction',
    },
    transportImpact: {
      distanceKm: 5,
      baselineMode: 'PRIVATE_CAR',
      alternativeMode: 'PUBLIC_TRANSIT',
      baselineFactorKgPerKm: 0.18,
      alternativeFactorKgPerKm: 0.03,
      avoidedCo2eKg: 0.75,
      sourceCitation: 'CPCB',
      operationalScopeNote: 'Direct commute tailpipe emissions',
    },
    forecastAttribution: 'CAMS Global Analysis',
    limitationsDisclaimer: 'Indicative advice only',
  };

  it('loads default plan when storage is empty', () => {
    const plan = loadActivePlanState();
    expect(plan.version).toBe(1);
    expect(plan.actions).toEqual([]);
  });

  it('adopts recommendation and persists new action item', () => {
    const initial = loadActivePlanState();
    const result = adoptRecommendation(initial, mockRec);

    expect(result.isDuplicate).toBe(false);
    expect(result.actionId).toBeDefined();
    expect(result.state.actions.length).toBe(1);
    expect(result.state.actions[0].recommendationId).toBe(mockRec.id);
    expect(result.state.actions[0].status).toBe('ADOPTED');

    const loaded = loadActivePlanState();
    expect(loaded.actions.length).toBe(1);
    expect(loaded.actions[0].memberNickname).toBe('Aarav');
  });

  it('detects duplicate adoption when recommendation is already active', () => {
    const initial = loadActivePlanState();
    const first = adoptRecommendation(initial, mockRec);
    expect(first.isDuplicate).toBe(false);

    const second = adoptRecommendation(first.state, mockRec);
    expect(second.isDuplicate).toBe(true);
    expect(second.actionId).toBe(first.actionId);
    expect(second.state.actions.length).toBe(1);
  });

  it('marks action as COMPLETED and SKIPPED', () => {
    let state = loadActivePlanState();
    const adopted = adoptRecommendation(state, mockRec);
    state = adopted.state;
    const actionId = adopted.actionId!;

    state = markActionCompleted(state, actionId);
    expect(state.actions[0].status).toBe('COMPLETED');
    expect(state.actions[0].completedAt).toBeDefined();

    state = markActionSkipped(state, actionId);
    expect(state.actions[0].status).toBe('SKIPPED');
    expect(state.actions[0].completedAt).toBeNull();
  });

  it('updates custom action item notes and adjusted time window', () => {
    let state = loadActivePlanState();
    const adopted = adoptRecommendation(state, mockRec);
    state = adopted.state;
    const actionId = adopted.actionId!;

    state = updateActionItem(state, actionId, {
      userNotes: 'Played board games in library',
      adjustedWindow: { startTime: '13:00', endTime: '14:00' },
    });

    expect(state.actions[0].userNotes).toBe('Played board games in library');
    expect(state.actions[0].adjustedWindow.startTime).toBe('13:00');
  });

  it('removes action item from active plan', () => {
    let state = loadActivePlanState();
    const adopted = adoptRecommendation(state, mockRec);
    state = adopted.state;
    const actionId = adopted.actionId!;

    state = removeActionItem(state, actionId);
    expect(state.actions.length).toBe(0);
  });

  it('handles corrupted JSON and invalid schema in storage gracefully', () => {
    mockStorage.setItem(ACTIVE_PLAN_STORAGE_KEY, 'NOT_VALID_JSON{[');
    resetPlanStorageCache();
    expect(loadActivePlanState().actions).toEqual([]);

    mockStorage.setItem(ACTIVE_PLAN_STORAGE_KEY, JSON.stringify({ version: 999 }));
    resetPlanStorageCache();
    expect(loadActivePlanState().actions).toEqual([]);
  });

  it('handles setItem throwing without crashing', () => {
    const errorSpy = vi.spyOn(mockStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage write failed');
    });

    expect(() => saveActivePlanState(loadActivePlanState())).not.toThrow();
    errorSpy.mockRestore();
  });

  it('subscribes to plan storage change events and triggers callbacks', () => {
    const callback = vi.fn();
    const unsubscribe = subscribeActivePlanStorage(callback);

    let state = loadActivePlanState();
    adoptRecommendation(state, mockRec);
    expect(callback).toHaveBeenCalled();

    callback.mockClear();
    const event = { key: ACTIVE_PLAN_STORAGE_KEY } as StorageEvent;
    (listeners['storage'] || []).forEach((fn) => fn(event));
    expect(callback).toHaveBeenCalled();

    callback.mockClear();
    const otherEvent = { key: 'other_key' } as StorageEvent;
    (listeners['storage'] || []).forEach((fn) => fn(otherEvent));
    expect(callback).not.toHaveBeenCalled();

    unsubscribe();
  });
});
