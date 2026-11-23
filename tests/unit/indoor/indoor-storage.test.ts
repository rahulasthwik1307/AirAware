import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import {
  loadIndoorState,
  setSelectedRoom,
  updateRoomArea,
  updateCeilingHeight,
  updatePurifierSettings,
  updateFilterLog,
  updateIndoorPm25Reading,
  resetIndoorStorageCache,
  getIndoorServerSnapshot,
  subscribeIndoorStorage,
  DEFAULT_INDOOR_STATE,
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
    listeners = {};
    resetIndoorStorageCache();
  });

  it('loads default indoor state when storage is empty', () => {
    const state = loadIndoorState();
    expect(state.selectedRoomId).toBe('living_room');
    expect(state.roomAreas.living_room).toBe(22);
    expect(state.targetAch).toBe(4.0);
  });

  it('provides safe server hydration snapshot', () => {
    const serverSnap = getIndoorServerSnapshot();
    expect(serverSnap).toEqual(DEFAULT_INDOOR_STATE);
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

    updateRoomArea('bedroom', -5);
    expect(loadIndoorState().roomAreas.bedroom).toBe(1);
  });

  it('updates ceiling height', () => {
    updateCeilingHeight(3.2);
    const state = loadIndoorState();
    expect(state.ceilingHeightM).toBe(3.2);
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
      notes: 'Custom HEPA 13 filter with carbon layer',
    });
    const state = loadIndoorState();
    expect(state.filterLog.installDate).toBe('2026-11-01');
    expect(state.filterLog.customIntervalMonths).toBe(12);
    expect(state.filterLog.notes).toContain('HEPA 13');
  });

  it('updates indoor PM2.5 readings with rounding and handles invalid/null readings', () => {
    updateIndoorPm25Reading(45.67, true);
    let state = loadIndoorState();
    expect(state.indoorPm25Reading).toBe(45.7);
    expect(state.hasMonitor).toBe(true);

    // Null or invalid reading
    updateIndoorPm25Reading(null, false);
    state = loadIndoorState();
    expect(state.indoorPm25Reading).toBeNull();
    expect(state.hasMonitor).toBe(false);

    updateIndoorPm25Reading(-10, true);
    state = loadIndoorState();
    expect(state.indoorPm25Reading).toBeNull();
  });

  it('handles corrupted JSON in storage gracefully', () => {
    mockStorage.setItem(INDOOR_STORAGE_KEY, 'INVALID_JSON_CORRUPTED');
    resetIndoorStorageCache();

    const state = loadIndoorState();
    expect(state.selectedRoomId).toBe('living_room');
  });

  it('handles schema mismatch in storage gracefully', () => {
    mockStorage.setItem(INDOOR_STORAGE_KEY, JSON.stringify({ ceilingHeightM: 'not-a-number' }));
    resetIndoorStorageCache();

    const state = loadIndoorState();
    expect(state).toEqual(DEFAULT_INDOOR_STATE);
  });

  it('handles localStorage setItem throwing error without crashing', () => {
    const errorSpy = vi.spyOn(mockStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => setSelectedRoom('study')).not.toThrow();
    errorSpy.mockRestore();
  });

  it('subscribes to storage events and triggers callbacks', () => {
    const callback = vi.fn();
    const unsubscribe = subscribeIndoorStorage(callback);

    // Trigger update
    setSelectedRoom('bedroom');
    expect(callback).toHaveBeenCalled();

    // Trigger native storage event with matching key
    callback.mockClear();
    const storageEvent = { key: INDOOR_STORAGE_KEY } as StorageEvent;
    (listeners['storage'] || []).forEach((fn) => fn(storageEvent));
    expect(callback).toHaveBeenCalled();

    // Trigger native storage event with different key
    callback.mockClear();
    const otherEvent = { key: 'other_key' } as StorageEvent;
    (listeners['storage'] || []).forEach((fn) => fn(otherEvent));
    expect(callback).not.toHaveBeenCalled();

    unsubscribe();
  });
});
