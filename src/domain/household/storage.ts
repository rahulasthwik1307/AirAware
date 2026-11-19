/**
 * AirAware Local Storage Adapter — Household Profiles
 * Strict client-side persistence under key 'airaware_household_v1'.
 * Zero cloud transmission, schema-validated, resilient against quota and corrupt storage.
 */

import { HouseholdMember, HouseholdStorageState, MemberScheduleItem } from './types';
import { createDefaultHouseholdState, parseHouseholdStorageState, HouseholdStorageStateSchema } from './schema';

export const HOUSEHOLD_STORAGE_KEY = 'airaware_household_v1';
const HOUSEHOLD_EVENT_NAME = 'airaware_household_updated';

let cachedHouseholdRaw: string | null = null;
let cachedHouseholdState: HouseholdStorageState | null = null;

const DEFAULT_SERVER_HOUSEHOLD_STATE: HouseholdStorageState = Object.freeze({
  version: 1,
  updatedAt: '1970-01-01T00:00:00.000Z',
  activeMemberId: null,
  members: [],
});

export function getHouseholdServerSnapshot(): HouseholdStorageState {
  return DEFAULT_SERVER_HOUSEHOLD_STATE;
}

export function resetHouseholdStorageCache(): void {
  cachedHouseholdRaw = null;
  cachedHouseholdState = null;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function emitStorageEvent(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(HOUSEHOLD_EVENT_NAME));
  }
}

/**
 * Loads and validates household state from localStorage.
 * Caches the parsed snapshot so that useSyncExternalStore receives
 * an identical reference as long as localStorage content has not changed.
 */
export function loadHouseholdState(): HouseholdStorageState {
  if (!isBrowser()) {
    return DEFAULT_SERVER_HOUSEHOLD_STATE;
  }

  try {
    const raw = window.localStorage.getItem(HOUSEHOLD_STORAGE_KEY);
    if (raw === cachedHouseholdRaw && cachedHouseholdState !== null) {
      return cachedHouseholdState;
    }
    cachedHouseholdRaw = raw;

    if (!raw) {
      cachedHouseholdState = createDefaultHouseholdState();
      return cachedHouseholdState;
    }
    const parsed = JSON.parse(raw);
    const validated = parseHouseholdStorageState(parsed);
    cachedHouseholdState = validated ?? createDefaultHouseholdState();
    return cachedHouseholdState;
  } catch {
    cachedHouseholdState = createDefaultHouseholdState();
    return cachedHouseholdState;
  }
}

/**
 * Validates and writes household state to localStorage.
 * Emits custom event for synchronized UI updates.
 */
export function saveHouseholdState(state: HouseholdStorageState): boolean {
  if (!isBrowser()) return false;

  const validation = HouseholdStorageStateSchema.safeParse(state);
  if (!validation.success) {
    return false;
  }

  try {
    const toSave: HouseholdStorageState = {
      ...validation.data,
      updatedAt: new Date().toISOString(),
    };
    const serialized = JSON.stringify(toSave);
    window.localStorage.setItem(HOUSEHOLD_STORAGE_KEY, serialized);
    cachedHouseholdRaw = serialized;
    cachedHouseholdState = toSave;
    emitStorageEvent();
    return true;
  } catch {
    // Gracefully handle quota exceeded or privacy block
    return false;
  }
}

/**
 * Checks whether a nickname is unique within the household (case-insensitive and trimmed).
 */
export function isNicknameUnique(
  members: readonly HouseholdMember[],
  nickname: string,
  excludeMemberId?: string
): boolean {
  const normalized = nickname.trim().toLowerCase();
  if (!normalized) return false;
  return !members.some(
    (m) => m.id !== excludeMemberId && m.nickname.trim().toLowerCase() === normalized
  );
}

/**
 * Adds a new member to the household (max 4 members).
 * Enforces nickname uniqueness.
 */
export function addHouseholdMember(
  state: HouseholdStorageState,
  memberInput: Omit<HouseholdMember, 'id' | 'createdAt'>
): { readonly state: HouseholdStorageState; readonly newMemberId: string | null; readonly error?: string } {
  if (state.members.length >= 4) {
    return { state, newMemberId: null, error: 'Maximum 4 household members reached' };
  }

  const trimmedNickname = memberInput.nickname.trim();
  if (!trimmedNickname) {
    return { state, newMemberId: null, error: 'Nickname cannot be empty' };
  }

  if (!isNicknameUnique(state.members, trimmedNickname)) {
    return { state, newMemberId: null, error: `A family member named "${trimmedNickname}" already exists` };
  }

  const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newMember: HouseholdMember = {
    ...memberInput,
    nickname: trimmedNickname,
    id,
    createdAt: new Date().toISOString(),
  };

  const updatedMembers = [...state.members, newMember];
  const nextState: HouseholdStorageState = {
    ...state,
    activeMemberId: state.activeMemberId ?? id,
    members: updatedMembers,
    updatedAt: new Date().toISOString(),
  };

  saveHouseholdState(nextState);
  return { state: nextState, newMemberId: id };
}

/**
 * Updates an existing household member.
 * Enforces nickname uniqueness when nickname is updated.
 */
export function updateHouseholdMember(
  state: HouseholdStorageState,
  memberId: string,
  updates: Partial<Omit<HouseholdMember, 'id' | 'createdAt'>>
): HouseholdStorageState {
  const memberIndex = state.members.findIndex((m) => m.id === memberId);
  if (memberIndex === -1) return state;

  const current = state.members[memberIndex];
  let updatedNickname = current.nickname;

  if (updates.nickname !== undefined) {
    const trimmed = updates.nickname.trim();
    if (!trimmed) {
      return state;
    }
    if (!isNicknameUnique(state.members, trimmed, memberId)) {
      return state;
    }
    updatedNickname = trimmed;
  }

  const updatedMember: HouseholdMember = {
    ...current,
    ...updates,
    nickname: updatedNickname,
  };

  const updatedMembers = [...state.members];
  updatedMembers[memberIndex] = updatedMember;

  const nextState: HouseholdStorageState = {
    ...state,
    members: updatedMembers,
    updatedAt: new Date().toISOString(),
  };

  saveHouseholdState(nextState);
  return nextState;
}

/**
 * Removes a household member and handles active member reassignment.
 */
export function removeHouseholdMember(
  state: HouseholdStorageState,
  memberId: string
): HouseholdStorageState {
  const updatedMembers = state.members.filter((m) => m.id !== memberId);
  let nextActiveId = state.activeMemberId;

  if (state.activeMemberId === memberId) {
    nextActiveId = updatedMembers.length > 0 ? updatedMembers[0].id : null;
  }

  const nextState: HouseholdStorageState = {
    ...state,
    activeMemberId: nextActiveId,
    members: updatedMembers,
    updatedAt: new Date().toISOString(),
  };

  saveHouseholdState(nextState);
  return nextState;
}

/**
 * Sets the active member for schedule and recommendation viewing.
 */
export function setActiveHouseholdMember(
  state: HouseholdStorageState,
  memberId: string | null
): HouseholdStorageState {
  if (memberId !== null && !state.members.some((m) => m.id === memberId)) {
    return state;
  }

  const nextState: HouseholdStorageState = {
    ...state,
    activeMemberId: memberId,
    updatedAt: new Date().toISOString(),
  };

  saveHouseholdState(nextState);
  return nextState;
}

/**
 * Adds a schedule item to a member.
 */
export function addMemberSchedule(
  state: HouseholdStorageState,
  memberId: string,
  scheduleInput: Omit<MemberScheduleItem, 'id'>
): { readonly state: HouseholdStorageState; readonly scheduleId: string | null } {
  const member = state.members.find((m) => m.id === memberId);
  if (!member || member.schedules.length >= 12) {
    return { state, scheduleId: null };
  }

  const scheduleId = `sch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newScheduleItem: MemberScheduleItem = {
    ...scheduleInput,
    id: scheduleId,
    activityName: scheduleInput.activityName.trim(),
  };

  const updatedMember: HouseholdMember = {
    ...member,
    schedules: [...member.schedules, newScheduleItem],
  };

  const nextState = updateHouseholdMember(state, memberId, updatedMember);
  return { state: nextState, scheduleId };
}

/**
 * Updates a schedule item for a member.
 */
export function updateMemberSchedule(
  state: HouseholdStorageState,
  memberId: string,
  scheduleId: string,
  updates: Partial<Omit<MemberScheduleItem, 'id'>>
): HouseholdStorageState {
  const member = state.members.find((m) => m.id === memberId);
  if (!member) return state;

  const scheduleIndex = member.schedules.findIndex((s) => s.id === scheduleId);
  if (scheduleIndex === -1) return state;

  const current = member.schedules[scheduleIndex];
  const updatedItem: MemberScheduleItem = {
    ...current,
    ...updates,
    activityName: updates.activityName !== undefined ? updates.activityName.trim() : current.activityName,
  };

  const updatedSchedules = [...member.schedules];
  updatedSchedules[scheduleIndex] = updatedItem;

  return updateHouseholdMember(state, memberId, { schedules: updatedSchedules });
}

/**
 * Removes a schedule item from a member.
 */
export function removeMemberSchedule(
  state: HouseholdStorageState,
  memberId: string,
  scheduleId: string
): HouseholdStorageState {
  const member = state.members.find((m) => m.id === memberId);
  if (!member) return state;

  const updatedSchedules = member.schedules.filter((s) => s.id !== scheduleId);
  return updateHouseholdMember(state, memberId, { schedules: updatedSchedules });
}

/**
 * Subscribes to local storage updates across tabs and within the same window.
 */
export function subscribeHouseholdStorage(callback: () => void): () => void {
  if (!isBrowser()) {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === HOUSEHOLD_STORAGE_KEY) {
      callback();
    }
  };

  const handleCustom = () => {
    callback();
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(HOUSEHOLD_EVENT_NAME, handleCustom);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(HOUSEHOLD_EVENT_NAME, handleCustom);
  };
}
