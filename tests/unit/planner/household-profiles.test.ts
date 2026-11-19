import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import {
  createDefaultHouseholdState,
  parseHouseholdStorageState,
} from '@/domain/household/schema';
import {
  loadHouseholdState,
  addHouseholdMember,
  updateHouseholdMember,
  removeHouseholdMember,
  setActiveHouseholdMember,
  addMemberSchedule,
  updateMemberSchedule,
  removeMemberSchedule,
  resetHouseholdStorageCache,
  HOUSEHOLD_STORAGE_KEY,
} from '@/domain/household/storage';

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

describe('Household Profiles & Storage', () => {
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
    resetHouseholdStorageCache();
  });

  it('creates a safe default empty state when storage is empty', () => {
    const state = loadHouseholdState();
    expect(state.version).toBe(1);
    expect(state.members).toHaveLength(0);
    expect(state.activeMemberId).toBeNull();
  });

  it('adds household members up to the strict limit of four', () => {
    let state = createDefaultHouseholdState();

    // Add member 1 (Child)
    const res1 = addHouseholdMember(state, {
      nickname: 'Aarav',
      archetype: 'CHILD_STUDENT',
      sensitivityTier: 'PEDIATRIC',
      schedules: [],
    });
    state = res1.state;
    expect(state.members).toHaveLength(1);
    expect(state.members[0].nickname).toBe('Aarav');
    expect(state.activeMemberId).toBe(res1.newMemberId);

    // Add member 2 (Commuter)
    const res2 = addHouseholdMember(state, {
      nickname: 'Priya',
      archetype: 'WORKING_COMMUTER',
      sensitivityTier: 'NONE',
      schedules: [],
    });
    state = res2.state;
    expect(state.members).toHaveLength(2);

    // Add member 3 (Senior)
    const res3 = addHouseholdMember(state, {
      nickname: 'Dadaji',
      archetype: 'SENIOR_VULNERABLE',
      sensitivityTier: 'SENIOR',
      schedules: [],
    });
    state = res3.state;
    expect(state.members).toHaveLength(3);

    // Add member 4 (Outdoor enthusiast)
    const res4 = addHouseholdMember(state, {
      nickname: 'Vikram',
      archetype: 'OUTDOOR_ENTHUSIAST',
      sensitivityTier: 'RESPIRATORY',
      schedules: [],
    });
    state = res4.state;
    expect(state.members).toHaveLength(4);

    // Attempt to add member 5 — MUST be rejected by 4-member limit
    const res5 = addHouseholdMember(state, {
      nickname: 'Extra Member',
      archetype: 'CHILD_STUDENT',
      sensitivityTier: 'NONE',
      schedules: [],
    });
    expect(res5.newMemberId).toBeNull();
    expect(res5.state.members).toHaveLength(4);
  });

  it('updates member details correctly', () => {
    let state = createDefaultHouseholdState();
    const { state: s1, newMemberId } = addHouseholdMember(state, {
      nickname: 'Anaya',
      archetype: 'CHILD_STUDENT',
      sensitivityTier: 'NONE',
      schedules: [],
    });
    expect(newMemberId).toBeTruthy();

    state = updateHouseholdMember(s1, newMemberId!, {
      nickname: 'Anaya Sharma',
      sensitivityTier: 'PEDIATRIC',
    });

    const updated = state.members.find((m) => m.id === newMemberId);
    expect(updated?.nickname).toBe('Anaya Sharma');
    expect(updated?.sensitivityTier).toBe('PEDIATRIC');
  });

  it('removes member and gracefully reassigns active member', () => {
    let state = createDefaultHouseholdState();
    const { state: s1, newMemberId: id1 } = addHouseholdMember(state, {
      nickname: 'Member 1',
      archetype: 'WORKING_COMMUTER',
      sensitivityTier: 'NONE',
      schedules: [],
    });
    const { state: s2, newMemberId: id2 } = addHouseholdMember(s1, {
      nickname: 'Member 2',
      archetype: 'CHILD_STUDENT',
      sensitivityTier: 'NONE',
      schedules: [],
    });

    state = setActiveHouseholdMember(s2, id1);
    expect(state.activeMemberId).toBe(id1);

    // Remove active member id1
    state = removeHouseholdMember(state, id1!);
    expect(state.members).toHaveLength(1);
    expect(state.members[0].id).toBe(id2);
    // Active member should now fall back to id2
    expect(state.activeMemberId).toBe(id2);

    // Remove id2
    state = removeHouseholdMember(state, id2!);
    expect(state.members).toHaveLength(0);
    expect(state.activeMemberId).toBeNull();
  });

  it('adds, updates, and removes schedules for a member', () => {
    let state = createDefaultHouseholdState();
    const { state: s1, newMemberId } = addHouseholdMember(state, {
      nickname: 'Rohan',
      archetype: 'WORKING_COMMUTER',
      sensitivityTier: 'NONE',
      schedules: [],
    });

    // Add schedule
    const { state: s2, scheduleId } = addMemberSchedule(s1, newMemberId!, {
      activityName: 'Morning Metro Commute',
      activityType: 'COMMUTE',
      startTime: '08:30',
      durationMinutes: 45,
      commuteMode: 'PUBLIC_TRANSIT',
      commuteDistanceKm: 12,
    });
    expect(scheduleId).toBeTruthy();
    expect(s2.members[0].schedules).toHaveLength(1);

    // Update schedule
    state = updateMemberSchedule(s2, newMemberId!, scheduleId!, {
      startTime: '09:00',
      durationMinutes: 50,
    });
    expect(state.members[0].schedules[0].startTime).toBe('09:00');
    expect(state.members[0].schedules[0].durationMinutes).toBe(50);

    // Remove schedule
    state = removeMemberSchedule(state, newMemberId!, scheduleId!);
    expect(state.members[0].schedules).toHaveLength(0);
  });

  it('recovers gracefully from corrupted JSON in localStorage', () => {
    mockStorage.setItem(HOUSEHOLD_STORAGE_KEY, '{ invalid_json ::: corrupt');
    const state = loadHouseholdState();
    expect(state.version).toBe(1);
    expect(state.members).toHaveLength(0);
  });

  it('rejects invalid schema structures via Zod validation', () => {
    const invalidData = {
      version: 2, // unsupported version
      members: 'not-an-array',
    };
    const parsed = parseHouseholdStorageState(invalidData);
    expect(parsed).toBeNull();
  });
});
