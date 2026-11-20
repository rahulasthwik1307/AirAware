import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import {
  loadIndoorState,
  setSelectedRoom,
  updateRoomArea,
  updatePurifierSettings,
  updateFilterLog,
  resetIndoorStorageCache,
  INDOOR_STORAGE_KEY,
} from '@/domain/indoor/storage';

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

describe('Indoor Storage — Local-First Persistence', () => {
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
    resetIndoorStorageCache();
  });

  it('loads default indoor state when storage is empty', () => {
    const state = loadIndoorState();
    expect(state.selectedRoomId).toBe('living_room');
    expect(state.roomAreas.living_room).toBe(22);
    expect(state.targetAch).toBe(4.0);
  });

  it('updates and persists selected room', () => {
    setSelectedRoom('kitchen');
    const state = loadIndoorState();
    expect(state.selectedRoomId).toBe('kitchen');

    const storedRaw = mockStorage.getItem(INDOOR_STORAGE_KEY);
    expect(storedRaw).toContain('"selectedRoomId":"kitchen"');
  });

  it('updates and clamps custom room area', () => {
    updateRoomArea('bedroom', 24);
    const state = loadIndoorState();
    expect(state.roomAreas.bedroom).toBe(24);

    // Should clamp extreme numbers
    updateRoomArea('bedroom', 9999);
    expect(loadIndoorState().roomAreas.bedroom).toBe(200);
  });

  it('updates purifier CADR and target ACH', () => {
    updatePurifierSettings(350, 5.0);
    const state = loadIndoorState();
    expect(state.selectedCadrM3h).toBe(350);
    expect(state.targetAch).toBe(5.0);
  });

  it('updates filter maintenance log', () => {
    updateFilterLog({
      installDate: '2026-11-01',
      customIntervalMonths: 12,
      lastVacuumDate: '2026-11-15',
    });
    const state = loadIndoorState();
    expect(state.filterLog.installDate).toBe('2026-11-01');
    expect(state.filterLog.customIntervalMonths).toBe(12);
    expect(state.filterLog.lastVacuumDate).toBe('2026-11-15');
  });
});
