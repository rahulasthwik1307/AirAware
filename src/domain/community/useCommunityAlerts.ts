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
  isDelhiNcrRegion,
} from './generator';

interface UseCommunityAlertsOptions {
  readonly locationName?: string;
  readonly aqi?: number;
  readonly prominentPollutant?: string;
  readonly historicalTrend?: readonly HistoricalAirshedPoint[];
}

export function useCommunityAlerts({
  locationName = 'Your Location',
  aqi = 100,
  prominentPollutant = 'PM2.5',
  historicalTrend,
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

  // Generate dynamic atmospheric alerts based on real environmental conditions
  const rawAlerts = useMemo(() => {
    return generateAirshedAlerts(locationName, aqi, prominentPollutant, currentHour);
  }, [locationName, aqi, prominentPollutant, currentHour]);

  // Map user-reported incidents from local storage to citizen alerts
  const userIncidentAlerts: readonly AlertItem[] = useMemo(() => {
    return storageState.incidents.map((inc) => ({
      id: `alert-incident-${inc.id}`,
      title: `Citizen Report: ${inc.title}`,
      severity: inc.severity === 'HIGH' ? 'CRITICAL' : 'ADVISORY',
      category: 'COMMUNITY_REPORT' as const,
      message: inc.description,
      locationName: inc.locationName,
      timestamp: inc.timestamp,
      aqiValue: aqi,
      pollutant: 'Local Source',
      actionableStep:
        inc.status === 'EXPORTED_CPCB'
          ? 'CPCB dossier exported for regulatory enforcement.'
          : 'Report saved on device. Review in Community workspace to export or resolve.',
      targetWorkspace: 'community-alerts',
      isRead: false,
      source: 'User Incident Report',
    }));
  }, [storageState.incidents, aqi]);

  // Combine user reports and atmospheric alerts, then decorate with read status from storage
  const alerts: readonly AlertItem[] = useMemo(() => {
    const combined = [...userIncidentAlerts, ...rawAlerts];
    return combined.map((alert) => ({
      ...alert,
      isRead: storageState.readAlertIds.includes(alert.id),
    }));
  }, [userIncidentAlerts, rawAlerts, storageState.readAlertIds]);

  // Unread count
  const unreadCount = useMemo(() => {
    return alerts.filter((a) => !a.isRead).length;
  }, [alerts]);

  // Region detection
  const isDelhiNcr = useMemo(() => isDelhiNcrRegion(locationName), [locationName]);

  // Active GRAP Stage (Delhi-NCR) or CPCB National Category Advisory (Rest of India)
  const activeGrapStage = useMemo(() => {
    if (isDelhiNcr) {
      if (aqi >= 450) return 'GRAP Stage 4: Severe+ Air';
      if (aqi >= 400) return 'GRAP Stage 3: Severe Air';
      if (aqi >= 300) return 'GRAP Stage 2: Very Poor Air';
      if (aqi >= 200) return 'GRAP Stage 1: Poor Air';
      return 'GRAP: Standard (Normal)';
    } else {
      if (aqi >= 450) return 'CPCB: Severe+ Air';
      if (aqi >= 400) return 'CPCB: Severe Air';
      if (aqi >= 300) return 'CPCB: Very Poor Air';
      if (aqi >= 200) return 'CPCB: Poor Air';
      if (aqi >= 100) return 'CPCB: Moderate Air';
      if (aqi >= 50) return 'CPCB: Satisfactory';
      return 'CPCB: Good Air';
    }
  }, [aqi, isDelhiNcr]);

  // Real historical trend (empty array if no past data retrieved, never mock numbers)
  const finalHistoricalTrend = useMemo(() => {
    return historicalTrend && historicalTrend.length > 0 ? historicalTrend : [];
  }, [historicalTrend]);

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
    isDelhiNcr,
    ventilationWindow,
    historicalTrend: finalHistoricalTrend,
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
