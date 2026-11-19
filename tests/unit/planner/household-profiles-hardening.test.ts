import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import {
  createDefaultHouseholdState,
} from '@/domain/household/schema';
import {
  addHouseholdMember,
  updateHouseholdMember,
  isNicknameUnique,
  resetHouseholdStorageCache,
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

describe('Household Profiles Hardening — Nickname Uniqueness & Validation', () => {
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

  it('correctly checks nickname uniqueness with case-insensitivity and whitespace trimming', () => {
    let state = createDefaultHouseholdState();
    const res1 = addHouseholdMember(state, {
      nickname: 'Aarav',
      archetype: 'CHILD_STUDENT',
      sensitivityTier: 'PEDIATRIC',
      schedules: [],
    });
    expect(res1.newMemberId).toBeTruthy();
    state = res1.state;

    expect(isNicknameUnique(state.members, 'Priya')).toBe(true);
    expect(isNicknameUnique(state.members, 'aarav')).toBe(false);
    expect(isNicknameUnique(state.members, '  AARAV  ')).toBe(false);
    expect(isNicknameUnique(state.members, 'Aarav', res1.newMemberId!)).toBe(true); // excluding self is valid
  });

  it('rejects adding duplicate nicknames and returns friendly error', () => {
    let state = createDefaultHouseholdState();

    const res1 = addHouseholdMember(state, {
      nickname: 'Aarav',
      archetype: 'CHILD_STUDENT',
      sensitivityTier: 'PEDIATRIC',
      schedules: [],
    });
    expect(res1.newMemberId).toBeTruthy();
    state = res1.state;

    // Attempt to add second member with same name in lowercase with spaces
    const res2 = addHouseholdMember(state, {
      nickname: '  aarav  ',
      archetype: 'OUTDOOR_ENTHUSIAST',
      sensitivityTier: 'NONE',
      schedules: [],
    });
    expect(res2.newMemberId).toBeNull();
    expect(res2.error).toContain('already exists');
    expect(res2.state.members).toHaveLength(1);
  });

  it('rejects updating member nickname to an already existing member nickname', () => {
    let state = createDefaultHouseholdState();

    const res1 = addHouseholdMember(state, {
      nickname: 'Aarav',
      archetype: 'CHILD_STUDENT',
      sensitivityTier: 'PEDIATRIC',
      schedules: [],
    });
    state = res1.state;

    const res2 = addHouseholdMember(state, {
      nickname: 'Priya',
      archetype: 'WORKING_COMMUTER',
      sensitivityTier: 'NONE',
      schedules: [],
    });
    state = res2.state;
    expect(state.members).toHaveLength(2);

    // Try to rename Priya to "aarav"
    const updated = updateHouseholdMember(state, res2.newMemberId!, {
      nickname: 'Aarav',
    });

    // Nickname should remain unchanged (Priya)
    const priya = updated.members.find((m) => m.id === res2.newMemberId);
    expect(priya?.nickname).toBe('Priya');
  });

  it('allows updating a member without altering their nickname or when trimming self', () => {
    let state = createDefaultHouseholdState();

    const res1 = addHouseholdMember(state, {
      nickname: 'Aarav',
      archetype: 'CHILD_STUDENT',
      sensitivityTier: 'PEDIATRIC',
      schedules: [],
    });
    state = res1.state;

    // Update sensitivity only
    const updated = updateHouseholdMember(state, res1.newMemberId!, {
      sensitivityTier: 'NONE',
    });
    const aarav = updated.members.find((m) => m.id === res1.newMemberId);
    expect(aarav?.sensitivityTier).toBe('NONE');
    expect(aarav?.nickname).toBe('Aarav');
  });
});
