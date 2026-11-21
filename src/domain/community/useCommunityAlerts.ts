'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertItem,
  PollutionIncident,
  CommunityStorageState,
  DiurnalVentilationWindow,
  HistoricalAirshedPoint,
} from './types';
import {
  loadCommunityState,
  addLocalIncident,
  updateIncidentStatus,
  deleteLocalIncident,
  markAlertAsRead,
  markAllAlertsAsRead,
  INITIAL_COMMUNITY_STATE,
} from './storage';
import {
  generateAirshedAlerts,
  calculateVentilationWindow,
  formatCpcbSameerDossier,
  formatRwaSocietyBulletin,
} from './generator';
import { DEFAULT_HISTORICAL_TREND } from './constants';

interface UseCommunityAlertsOptions {
  readonly locationName?: string;
  readonly aqi?: number;
  readonly prominentPollutant?: string;
}

export function useCommunityAlerts({
  locationName = 'New Delhi, India',
  aqi = 378,
  prominentPollutant = 'PM2.5',
}: UseCommunityAlertsOptions = {}) {
  const [storageState, setStorageState] = useState<CommunityStorageState>(INITIAL_COMMUNITY_STATE);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load state on mount
  useEffect(() => {
    setStorageState(loadCommunityState());
    setIsHydrated(true);
  }, []);

  // Compute current hour
  const currentHour = useMemo(() => {
    try {
      const now = new Date();
      return now.getHours();
    } catch {
      return 14;
    }
  }, []);

  // Compute ventilation window
  const ventilationWindow: DiurnalVentilationWindow = useMemo(() => {
    return calculateVentilationWindow(currentHour);
  }, [currentHour]);

  // Generate dynamic atmospheric alerts
  const rawAlerts = useMemo(() => {
    return generateAirshedAlerts(locationName, aqi, prominentPollutant, currentHour);
  }, [locationName, aqi, prominentPollutant, currentHour]);

  // Decorate alerts with read status from storage
  const alerts: readonly AlertItem[] = useMemo(() => {
    return rawAlerts.map((alert) => ({
      ...alert,
      isRead: storageState.readAlertIds.includes(alert.id),
    }));
  }, [rawAlerts, storageState.readAlertIds]);

  // Unread count
  const unreadCount = useMemo(() => {
    return alerts.filter((a) => !a.isRead).length;
  }, [alerts]);

  // Active GRAP Stage
  const activeGrapStage = useMemo(() => {
    if (aqi >= 450) return 'Emergency Stage 4: Severe+ Air';
    if (aqi >= 400) return 'Emergency Stage 3: Severe Air';
    if (aqi >= 300) return 'Emergency Stage 2: Very Poor Air';
    if (aqi >= 200) return 'Emergency Stage 1: Poor Air';
    return 'Standard Air Quality (Normal)';
  }, [aqi]);

  // Historical trend
  const historicalTrend: readonly HistoricalAirshedPoint[] = DEFAULT_HISTORICAL_TREND;

  // Handlers
  const handleAddIncident = useCallback(
    (incidentData: Omit<PollutionIncident, 'id' | 'timestamp' | 'status'>) => {
      const updated = addLocalIncident(storageState, incidentData);
      setStorageState(updated);
    },
    [storageState]
  );

  const handleUpdateIncidentStatus = useCallback(
    (incidentId: string, status: PollutionIncident['status']) => {
      const updated = updateIncidentStatus(storageState, incidentId, status);
      setStorageState(updated);
    },
    [storageState]
  );

  const handleDeleteIncident = useCallback(
    (incidentId: string) => {
      const updated = deleteLocalIncident(storageState, incidentId);
      setStorageState(updated);
    },
    [storageState]
  );

  const handleMarkAlertRead = useCallback(
    (alertId: string) => {
      const updated = markAlertAsRead(storageState, alertId);
      setStorageState(updated);
    },
    [storageState]
  );

  const handleMarkAllAlertsRead = useCallback(() => {
    const allIds = alerts.map((a) => a.id);
    const updated = markAllAlertsAsRead(storageState, allIds);
    setStorageState(updated);
  }, [storageState, alerts]);

  const handleGenerateCpcbComplaint = useCallback((incident: PollutionIncident) => {
    return formatCpcbSameerDossier(incident);
  }, []);

  const handleGenerateRwaBulletin = useCallback(
    (societyName?: string) => {
      const name = societyName || storageState.rwaSocietyName || locationName;
      return formatRwaSocietyBulletin(name, aqi, activeGrapStage, ventilationWindow);
    },
    [storageState.rwaSocietyName, locationName, aqi, activeGrapStage, ventilationWindow]
  );

  return {
    isHydrated,
    alerts,
    unreadCount,
    incidents: storageState.incidents,
    activeGrapStage,
    ventilationWindow,
    historicalTrend,
    rwaSocietyName: storageState.rwaSocietyName,
    addIncident: handleAddIncident,
    updateIncidentStatus: handleUpdateIncidentStatus,
    deleteIncident: handleDeleteIncident,
    markAlertRead: handleMarkAlertRead,
    markAllAlertsRead: handleMarkAllAlertsRead,
    generateCpcbComplaint: handleGenerateCpcbComplaint,
    generateRwaBulletin: handleGenerateRwaBulletin,
  };
}
