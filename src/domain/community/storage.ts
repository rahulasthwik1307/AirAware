/**
 * AirAware Community & Alerts Local-First Storage Adapter
 * Pure client-side persistence in localStorage with schema validation,
 * zero network transmission, and zero cloud tracking.
 */

import { CommunityStorageState, PollutionIncident } from './types';

export const COMMUNITY_STORAGE_KEY = 'airaware_community_v1';

export const INITIAL_COMMUNITY_STATE: CommunityStorageState = {
  version: 1,
  incidents: [
    {
      id: 'inc-demo-1',
      category: 'WASTE_BURNING',
      title: 'Municipal waste burning near neighborhood park boundary',
      description: 'Persistent leaf and solid plastic waste fire producing dense black acrid smoke trapped at breathing height.',
      locationName: 'Near Pocket A Community Park, New Delhi',
      coordinates: { latitude: 28.6139, longitude: 77.209 },
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
      status: 'LOGGED_LOCALLY',
      severity: 'HIGH',
    },
    {
      id: 'inc-demo-2',
      category: 'CONSTRUCTION_DUST',
      title: 'Uncovered commercial demolition and silica dust plume',
      description: 'Unsprinkled rubble excavation blowing coarse particulate plume across the pedestrian school crossing.',
      locationName: 'Main Arterial Avenue, New Delhi',
      timestamp: new Date(Date.now() - 3600000 * 18).toISOString(), // 18 hours ago
      status: 'EXPORTED_CPCB',
      severity: 'MEDIUM',
    },
  ],
  readAlertIds: [],
  customAlertThreshold: 300,
  rwaSocietyName: 'Green Meadows Apartment RWA',
  lastUpdated: new Date().toISOString(),
};

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
    if (parsed && typeof parsed === 'object' && parsed.version === 1) {
      return {
        version: 1,
        incidents: Array.isArray(parsed.incidents) ? parsed.incidents : INITIAL_COMMUNITY_STATE.incidents,
        readAlertIds: Array.isArray(parsed.readAlertIds) ? parsed.readAlertIds : [],
        customAlertThreshold: typeof parsed.customAlertThreshold === 'number' ? parsed.customAlertThreshold : 300,
        rwaSocietyName: typeof parsed.rwaSocietyName === 'string' ? parsed.rwaSocietyName : 'Residential Society RWA',
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('[AirAware] Failed to parse community storage state, falling back to initial state:', err);
  }

  return INITIAL_COMMUNITY_STATE;
}

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
