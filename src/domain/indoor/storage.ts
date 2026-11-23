/**
 * AirAware Local Storage Adapter — Indoor Air Intelligence
 * Strict client-side persistence under key 'airaware_indoor_v1'.
 * Zero cloud transmission, resilient against corrupt storage, 100% in-browser.
 */

import { z } from 'zod';
import { IndoorPreferencesState, RoomType, FilterLogState } from './types';

export const INDOOR_STORAGE_KEY = 'airaware_indoor_v1';
const INDOOR_EVENT_NAME = 'airaware_indoor_updated';

const IndoorPreferencesStateSchema = z.object({
  selectedRoomId: z.string().default('living_room'),
  roomAreas: z.record(z.string(), z.number().nonnegative()).default({
    living_room: 22,
    kitchen: 12,
    bedroom: 16,
    study: 14,
  }),
  ceilingHeightM: z.number().min(1.5).max(10).default(2.7),
  selectedCadrM3h: z.number().min(0).max(5000).default(250),
  targetAch: z.number().min(0.5).max(20).default(4.0),
  filterLog: z.object({
    installDate: z.string(),
    customIntervalMonths: z.number().int().min(1).max(24),
    notes: z.string().optional(),
  }).default({
    installDate: new Date().toISOString().split('T')[0],
    customIntervalMonths: 6,
    notes: 'Standard HEPA + activated carbon filter set',
  }),
  indoorPm25Reading: z.number().nonnegative().nullable().default(null),
  hasMonitor: z.boolean().default(false),
});

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
  indoorPm25Reading: null,
  hasMonitor: false,
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
    const validated = IndoorPreferencesStateSchema.safeParse(parsed);
    if (!validated.success) {
      cachedIndoorState = DEFAULT_INDOOR_STATE;
      return cachedIndoorState;
    }
    const d = validated.data;
    cachedIndoorState = {
      selectedRoomId: d.selectedRoomId as RoomType,
      roomAreas: d.roomAreas as Record<RoomType, number>,
      ceilingHeightM: d.ceilingHeightM,
      selectedCadrM3h: d.selectedCadrM3h,
      targetAch: d.targetAch,
      filterLog: d.filterLog as FilterLogState,
      indoorPm25Reading: d.indoorPm25Reading,
      hasMonitor: d.hasMonitor,
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

export function updateIndoorPm25Reading(reading: number | null, hasMonitor: boolean): void {
  const current = loadIndoorState();
  const safeReading =
    typeof reading === 'number' && Number.isFinite(reading) && reading >= 0
      ? Math.round(reading * 10) / 10
      : null;
  saveIndoorState({
    ...current,
    indoorPm25Reading: safeReading,
    hasMonitor,
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
