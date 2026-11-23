/**
 * AirAware Community & Alerts Local-First Storage Adapter
 * Pure client-side persistence in localStorage with schema validation,
 * zero network transmission, and zero cloud tracking.
 */

import { z } from 'zod';
import { CommunityStorageState, PollutionIncident } from './types';

export const COMMUNITY_STORAGE_KEY = 'airaware_community_v1';

const PollutionIncidentSchema = z.object({
  id: z.string(),
  category: z.enum([
    'WASTE_BURNING',
    'CONSTRUCTION_DUST',
    'ROAD_DUST',
    'DIESEL_GENERATOR',
    'BIOMASS_COOKING',
    'OTHER',
  ]),
  title: z.string().max(200),
  description: z.string().max(1000),
  locationName: z.string().max(200),
  coordinates: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
  timestamp: z.string(),
  status: z.enum(['LOGGED_LOCALLY', 'EXPORTED_CPCB', 'COMMUNITY_RESOLVED']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

const CommunityStorageStateSchema = z.object({
  version: z.literal(1),
  incidents: z.array(PollutionIncidentSchema),
  readAlertIds: z.array(z.string()),
  customAlertThreshold: z.number().min(0).max(500),
  rwaSocietyName: z.string().max(100),
  lastUpdated: z.string(),
});

export const INITIAL_COMMUNITY_STATE: CommunityStorageState = {
  version: 1,
  incidents: [],
  readAlertIds: [],
  customAlertThreshold: 300,
  rwaSocietyName: '',
  lastUpdated: new Date().toISOString(),
};

/**
 * Loads and validates local community incident reports and alerts from browser storage.
 */
export function loadCommunityState(): CommunityStorageState {
  if (typeof window === 'undefined') {
    return INITIAL_COMMUNITY_STATE;
  }

  try {
    const raw = window.localStorage.getItem(COMMUNITY_STORAGE_KEY);
    if (!raw) {
      return INITIAL_COMMUNITY_STATE;
    }

    const parsed = JSON.parse(raw);
    const validated = CommunityStorageStateSchema.safeParse(parsed);
    if (validated.success) {
      const data = validated.data as CommunityStorageState;
      return {
        ...data,
        incidents: data.incidents.filter((inc) => !inc.id.startsWith('inc-demo-')),
      };
    }
  } catch (err) {
    console.warn('[AirAware] Failed to parse community storage state, falling back to initial state:', err);
  }

  return INITIAL_COMMUNITY_STATE;
}

/**
 * Persists community incident and alert read state safely to browser storage.
 */
export function saveCommunityState(state: CommunityStorageState): void {
  if (typeof window === 'undefined') return;

  try {
    const payload = JSON.stringify({
      ...state,
      lastUpdated: new Date().toISOString(),
    });
    window.localStorage.setItem(COMMUNITY_STORAGE_KEY, payload);
  } catch (err) {
    console.warn('[AirAware] Failed to save community state to localStorage:', err);
  }
}

/**
 * Adds a new citizen pollution report to local device storage.
 */
export function addLocalIncident(
  currentState: CommunityStorageState,
  incident: Omit<PollutionIncident, 'id' | 'timestamp' | 'status'>
): CommunityStorageState {
  const newIncident: PollutionIncident = {
    ...incident,
    id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    status: 'LOGGED_LOCALLY',
  };

  const updated: CommunityStorageState = {
    ...currentState,
    incidents: [newIncident, ...currentState.incidents].slice(0, 50), // keep latest 50
  };

  saveCommunityState(updated);
  return updated;
}

/**
 * Updates the lifecycle or filing status of an existing local pollution incident.
 */
export function updateIncidentStatus(
  currentState: CommunityStorageState,
  incidentId: string,
  newStatus: PollutionIncident['status']
): CommunityStorageState {
  const updated: CommunityStorageState = {
    ...currentState,
    incidents: currentState.incidents.map((inc) =>
      inc.id === incidentId ? { ...inc, status: newStatus } : inc
    ),
  };

  saveCommunityState(updated);
  return updated;
}

/**
 * Removes an incident report from local device storage.
 */
export function deleteLocalIncident(
  currentState: CommunityStorageState,
  incidentId: string
): CommunityStorageState {
  const updated: CommunityStorageState = {
    ...currentState,
    incidents: currentState.incidents.filter((inc) => inc.id !== incidentId),
  };

  saveCommunityState(updated);
  return updated;
}

/**
 * Marks an alert item as read in local storage.
 */
export function markAlertAsRead(
  currentState: CommunityStorageState,
  alertId: string
): CommunityStorageState {
  if (currentState.readAlertIds.includes(alertId)) {
    return currentState;
  }

  const updated: CommunityStorageState = {
    ...currentState,
    readAlertIds: [...currentState.readAlertIds, alertId],
  };

  saveCommunityState(updated);
  return updated;
}

/**
 * Marks all supplied alert items as read in local storage.
 */
export function markAllAlertsAsRead(
  currentState: CommunityStorageState,
  alertIds: readonly string[]
): CommunityStorageState {
  const union = Array.from(new Set([...currentState.readAlertIds, ...alertIds]));
  const updated: CommunityStorageState = {
    ...currentState,
    readAlertIds: union,
  };

  saveCommunityState(updated);
  return updated;
}
