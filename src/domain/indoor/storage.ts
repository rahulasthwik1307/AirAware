/**
 * AirAware Local Storage Adapter — Indoor Air Intelligence
 * Strict client-side persistence under key 'airaware_indoor_v1'.
 * Zero cloud transmission, resilient against corrupt storage, 100% in-browser.
 */

import { IndoorPreferencesState, RoomType, FilterLogState } from './types';

export const INDOOR_STORAGE_KEY = 'airaware_indoor_v1';
const INDOOR_EVENT_NAME = 'airaware_indoor_updated';

let cachedIndoorRaw: string | null = null;
let cachedIndoorState: IndoorPreferencesState | null = null;

export const DEFAULT_INDOOR_STATE: IndoorPreferencesState = Object.freeze({
  selectedRoomId: 'living_room',
  roomAreas: {
    living_room: 22,
    kitchen: 12,
    bedroom: 16,
    study: 14,
  },
  ceilingHeightM: 2.7,
  selectedCadrM3h: 250,
  targetAch: 4.0,
  filterLog: {
    installDate: new Date().toISOString().split('T')[0],
    customIntervalMonths: 6,
    notes: 'Standard HEPA + activated carbon filter set',
  },
});

export function getIndoorServerSnapshot(): IndoorPreferencesState {
  return DEFAULT_INDOOR_STATE;
}

export function resetIndoorStorageCache(): void {
  cachedIndoorRaw = null;
  cachedIndoorState = null;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function emitStorageEvent(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(INDOOR_EVENT_NAME));
  }
}

/**
 * Loads and validates indoor state from localStorage with cache stability.
 */
export function loadIndoorState(): IndoorPreferencesState {
  if (!isBrowser()) {
    return DEFAULT_INDOOR_STATE;
  }

  try {
    const raw = window.localStorage.getItem(INDOOR_STORAGE_KEY);
    if (raw === cachedIndoorRaw && cachedIndoorState !== null) {
      return cachedIndoorState;
    }
    cachedIndoorRaw = raw;

    if (!raw) {
      cachedIndoorState = DEFAULT_INDOOR_STATE;
      return cachedIndoorState;
    }

    const parsed = JSON.parse(raw);
    cachedIndoorState = {
      selectedRoomId: parsed.selectedRoomId || DEFAULT_INDOOR_STATE.selectedRoomId,
      roomAreas: {
        ...DEFAULT_INDOOR_STATE.roomAreas,
        ...(parsed.roomAreas || {}),
      },
      ceilingHeightM: typeof parsed.ceilingHeightM === 'number' ? parsed.ceilingHeightM : DEFAULT_INDOOR_STATE.ceilingHeightM,
      selectedCadrM3h: typeof parsed.selectedCadrM3h === 'number' ? parsed.selectedCadrM3h : DEFAULT_INDOOR_STATE.selectedCadrM3h,
      targetAch: typeof parsed.targetAch === 'number' ? parsed.targetAch : DEFAULT_INDOOR_STATE.targetAch,
      filterLog: {
        ...DEFAULT_INDOOR_STATE.filterLog,
        ...(parsed.filterLog || {}),
      },
    };
    return cachedIndoorState;
  } catch {
    cachedIndoorState = DEFAULT_INDOOR_STATE;
    return cachedIndoorState;
  }
}

function saveIndoorState(state: IndoorPreferencesState): void {
  if (!isBrowser()) return;
  try {
    const raw = JSON.stringify(state);
    window.localStorage.setItem(INDOOR_STORAGE_KEY, raw);
    cachedIndoorRaw = raw;
    cachedIndoorState = state;
    emitStorageEvent();
  } catch {
    // Quota exceeded fallback
  }
}

export function setSelectedRoom(roomId: RoomType): void {
  const current = loadIndoorState();
  saveIndoorState({ ...current, selectedRoomId: roomId });
}

export function updateRoomArea(roomId: RoomType, areaM2: number): void {
  const current = loadIndoorState();
  const safeArea = Math.max(1, Math.min(200, Math.round(areaM2)));
  saveIndoorState({
    ...current,
    roomAreas: {
      ...current.roomAreas,
      [roomId]: safeArea,
    },
  });
}

export function updateCeilingHeight(heightM: number): void {
  const current = loadIndoorState();
  saveIndoorState({ ...current, ceilingHeightM: heightM });
}

export function updatePurifierSettings(cadrM3h: number, targetAch: number): void {
  const current = loadIndoorState();
  saveIndoorState({
    ...current,
    selectedCadrM3h: Math.max(0, cadrM3h),
    targetAch: Math.max(1, targetAch),
  });
}

export function updateFilterLog(logUpdate: Partial<FilterLogState>): void {
  const current = loadIndoorState();
  saveIndoorState({
    ...current,
    filterLog: {
      ...current.filterLog,
      ...logUpdate,
    },
  });
}

export function subscribeIndoorStorage(callback: () => void): () => void {
  if (!isBrowser()) return () => {};

  const handleCustom = () => callback();
  const handleNative = (e: StorageEvent) => {
    if (e.key === INDOOR_STORAGE_KEY) {
      resetIndoorStorageCache();
      callback();
    }
  };

  window.addEventListener(INDOOR_EVENT_NAME, handleCustom);
  window.addEventListener('storage', handleNative);

  return () => {
    window.removeEventListener(INDOOR_EVENT_NAME, handleCustom);
    window.removeEventListener('storage', handleNative);
  };
}
