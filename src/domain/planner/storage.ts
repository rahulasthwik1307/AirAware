/**
 * AirAware Local Storage Adapter — Active Plan
 * Manages the Actionable Routine Loop persistence under key 'airaware_active_plan'.
 */

import { ActiveActionItem, ActivePlanStorageState, PlannerRecommendation, TimeWindow } from './types';
import { createDefaultActivePlanState, parseActivePlanStorageState, ActivePlanStorageStateSchema } from './schema';

export const ACTIVE_PLAN_STORAGE_KEY = 'airaware_active_plan';
const ACTIVE_PLAN_EVENT_NAME = 'airaware_active_plan_updated';

let cachedPlanRaw: string | null = null;
let cachedPlanState: ActivePlanStorageState | null = null;

const DEFAULT_SERVER_PLAN_STATE: ActivePlanStorageState = Object.freeze({
  version: 1,
  updatedAt: '1970-01-01T00:00:00.000Z',
  actions: [],
});

/**
 * Returns immutable default active plan state for server hydration safety.
 */
export function getActivePlanServerSnapshot(): ActivePlanStorageState {
  return DEFAULT_SERVER_PLAN_STATE;
}

/**
 * Resets the in-memory active plan cache used by useSyncExternalStore.
 */
export function resetPlanStorageCache(): void {
  cachedPlanRaw = null;
  cachedPlanState = null;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function emitPlanEvent(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ACTIVE_PLAN_EVENT_NAME));
  }
}

/**
 * Loads and validates active routine actions from local device storage.
 */
export function loadActivePlanState(): ActivePlanStorageState {
  if (!isBrowser()) {
    return DEFAULT_SERVER_PLAN_STATE;
  }

  try {
    const raw = window.localStorage.getItem(ACTIVE_PLAN_STORAGE_KEY);
    if (raw === cachedPlanRaw && cachedPlanState !== null) {
      return cachedPlanState;
    }
    cachedPlanRaw = raw;

    if (!raw) {
      cachedPlanState = createDefaultActivePlanState();
      return cachedPlanState;
    }
    const parsed = JSON.parse(raw);
    const validated = parseActivePlanStorageState(parsed);
    cachedPlanState = validated ?? createDefaultActivePlanState();
    return cachedPlanState;
  } catch {
    cachedPlanState = createDefaultActivePlanState();
    return cachedPlanState;
  }
}

/**
 * Persists updated active routine actions schema-validated to local storage.
 */
export function saveActivePlanState(state: ActivePlanStorageState): boolean {
  if (!isBrowser()) return false;

  const validation = ActivePlanStorageStateSchema.safeParse(state);
  if (!validation.success) return false;

  try {
    const toSave: ActivePlanStorageState = {
      ...validation.data,
      updatedAt: new Date().toISOString(),
    };
    const serialized = JSON.stringify(toSave);
    window.localStorage.setItem(ACTIVE_PLAN_STORAGE_KEY, serialized);
    cachedPlanRaw = serialized;
    cachedPlanState = toSave;
    emitPlanEvent();
    return true;
  } catch {
    return false;
  }
}

/**
 * Adopts a recommendation into the active daily plan.
 * Prevents accidental duplicates if the same recommendation is already adopted and active.
 */
export function adoptRecommendation(
  state: ActivePlanStorageState,
  recommendation: PlannerRecommendation,
  customWindow?: TimeWindow,
  userNotes?: string
): { readonly state: ActivePlanStorageState; readonly actionId: string | null; readonly isDuplicate: boolean } {
  // Check for existing active or completed adoption of this recommendation
  const existing = state.actions.find(
    (a) => a.recommendationId === recommendation.id && (a.status === 'ADOPTED' || a.status === 'COMPLETED')
  );

  if (existing) {
    return { state, actionId: existing.id, isDuplicate: true };
  }

  const actionId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const adjustedWindow = customWindow ?? recommendation.suggestedWindow ?? recommendation.originalWindow;

  const newAction: ActiveActionItem = {
    id: actionId,
    recommendationId: recommendation.id,
    memberId: recommendation.memberId,
    memberNickname: recommendation.memberNickname,
    scheduleId: recommendation.scheduleId,
    title: recommendation.title,
    actionType: recommendation.type,
    originalWindow: recommendation.originalWindow,
    adjustedWindow,
    status: 'ADOPTED',
    adoptedAt: new Date().toISOString(),
    completedAt: null,
    deltaCValue: recommendation.deltaC?.deltaValue ?? null,
    deltaCPollutant: recommendation.deltaC?.pollutantLabel ?? null,
    avoidedCo2eKg: recommendation.transportImpact?.avoidedCo2eKg ?? null,
    userNotes: userNotes?.trim(),
  };

  const nextState: ActivePlanStorageState = {
    ...state,
    actions: [newAction, ...state.actions],
    updatedAt: new Date().toISOString(),
  };

  saveActivePlanState(nextState);
  return { state: nextState, actionId, isDuplicate: false };
}

/**
 * Updates an action item (e.g. customized timing or notes).
 */
export function updateActionItem(
  state: ActivePlanStorageState,
  actionId: string,
  updates: Partial<Pick<ActiveActionItem, 'adjustedWindow' | 'userNotes'>>
): ActivePlanStorageState {
  const index = state.actions.findIndex((a) => a.id === actionId);
  if (index === -1) return state;

  const current = state.actions[index];
  const updatedAction: ActiveActionItem = {
    ...current,
    ...updates,
    adjustedWindow: updates.adjustedWindow ?? current.adjustedWindow,
    userNotes: updates.userNotes !== undefined ? updates.userNotes.trim() : current.userNotes,
  };

  const updatedActions = [...state.actions];
  updatedActions[index] = updatedAction;

  const nextState: ActivePlanStorageState = {
    ...state,
    actions: updatedActions,
    updatedAt: new Date().toISOString(),
  };

  saveActivePlanState(nextState);
  return nextState;
}

/**
 * Marks an action as COMPLETED with a timestamp.
 */
export function markActionCompleted(
  state: ActivePlanStorageState,
  actionId: string
): ActivePlanStorageState {
  const index = state.actions.findIndex((a) => a.id === actionId);
  if (index === -1) return state;

  const current = state.actions[index];
  const updatedAction: ActiveActionItem = {
    ...current,
    status: 'COMPLETED',
    completedAt: new Date().toISOString(),
  };

  const updatedActions = [...state.actions];
  updatedActions[index] = updatedAction;

  const nextState: ActivePlanStorageState = {
    ...state,
    actions: updatedActions,
    updatedAt: new Date().toISOString(),
  };

  saveActivePlanState(nextState);
  return nextState;
}

/**
 * Marks an action as SKIPPED.
 */
export function markActionSkipped(
  state: ActivePlanStorageState,
  actionId: string
): ActivePlanStorageState {
  const index = state.actions.findIndex((a) => a.id === actionId);
  if (index === -1) return state;

  const current = state.actions[index];
  const updatedAction: ActiveActionItem = {
    ...current,
    status: 'SKIPPED',
    completedAt: null,
  };

  const updatedActions = [...state.actions];
  updatedActions[index] = updatedAction;

  const nextState: ActivePlanStorageState = {
    ...state,
    actions: updatedActions,
    updatedAt: new Date().toISOString(),
  };

  saveActivePlanState(nextState);
  return nextState;
}

/**
 * Removes an action item from the active plan.
 */
export function removeActionItem(
  state: ActivePlanStorageState,
  actionId: string
): ActivePlanStorageState {
  const updatedActions = state.actions.filter((a) => a.id !== actionId);
  const nextState: ActivePlanStorageState = {
    ...state,
    actions: updatedActions,
    updatedAt: new Date().toISOString(),
  };

  saveActivePlanState(nextState);
  return nextState;
}

/**
 * Subscribes to changes in the active plan storage.
 */
export function subscribeActivePlanStorage(callback: () => void): () => void {
  if (!isBrowser()) return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === ACTIVE_PLAN_STORAGE_KEY) {
      callback();
    }
  };

  const handleCustom = () => {
    callback();
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(ACTIVE_PLAN_EVENT_NAME, handleCustom);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(ACTIVE_PLAN_EVENT_NAME, handleCustom);
  };
}
