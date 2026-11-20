/**
 * AirAware Community & Alerts Domain Types
 * Authoritative types for local-first pollution incident reporting,
 * verified atmospheric alerts, diurnal ventilation windows, and historical intelligence.
 */

import { WorkspaceKey } from '@/domain/types';

export type AlertSeverity = 'CRITICAL' | 'ADVISORY' | 'VENTILATION' | 'INFO';

export type AlertCategory =
  | 'ATMOSPHERIC_SMOG'
  | 'FAMILY_HEALTH'
  | 'VENTILATION_WINDOW'
  | 'GRAP_REGULATORY'
  | 'COMMUNITY_REPORT';

export interface AlertItem {
  readonly id: string;
  readonly title: string;
  readonly severity: AlertSeverity;
  readonly category: AlertCategory;
  readonly message: string;
  readonly locationName: string;
  readonly timestamp: string; // ISO 8601
  readonly aqiValue?: number;
  readonly pollutant?: string;
  readonly actionableStep: string;
  readonly targetWorkspace: WorkspaceKey;
  readonly isRead: boolean;
  readonly source: string;
}

export type IncidentCategory =
  | 'WASTE_BURNING'
  | 'CONSTRUCTION_DUST'
  | 'INDUSTRIAL_SMOKE'
  | 'TRAFFIC_IDLING'
  | 'LEAF_BURNING'
  | 'OTHER';

export type IncidentSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export type IncidentStatus = 'LOGGED_LOCALLY' | 'EXPORTED_CPCB' | 'RESOLVED_LOCALLY';

export interface IncidentCategoryMeta {
  readonly category: IncidentCategory;
  readonly label: string;
  readonly icon: string;
  readonly cpcbClassification: string;
  readonly healthImpact: string;
  readonly badgeColor: string;
}

export interface PollutionIncident {
  readonly id: string;
  readonly category: IncidentCategory;
  readonly title: string;
  readonly description: string;
  readonly locationName: string;
  readonly coordinates?: {
    readonly latitude: number;
    readonly longitude: number;
  };
  readonly timestamp: string;
  readonly photoDataUrl?: string; // Client-side compressed canvas thumbnail (<80 KB)
  readonly status: IncidentStatus;
  readonly severity: IncidentSeverity;
}

export interface HistoricalAirshedPoint {
  readonly date: string; // YYYY-MM-DD
  readonly dayLabel: string; // e.g. 'Thu 14', 'Fri 15'
  readonly aqi: number; // CPCB NAQI
  readonly pm25: number; // µg/m³
  readonly nox: number; // µg/m³
  readonly inversionCeilingMeters: number; // Estimated winter mixing height in meters
  readonly isSevereDay: boolean;
}

export interface DiurnalVentilationWindow {
  readonly isOpenNow: boolean;
  readonly windowStart: string; // e.g. '12:30 PM'
  readonly windowEnd: string; // e.g. '03:15 PM'
  readonly peakInversionStart: string; // e.g. '06:30 PM'
  readonly peakInversionEnd: string; // e.g. '09:30 AM'
  readonly advisory: string;
  readonly mixingHeightMeters: number;
}

export interface CommunityStorageState {
  readonly version: number;
  readonly incidents: readonly PollutionIncident[];
  readonly readAlertIds: readonly string[];
  readonly customAlertThreshold: number;
  readonly rwaSocietyName: string;
  readonly lastUpdated: string;
}
