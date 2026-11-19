/**
 * AirAware Domain Types — Daily Planner & Actionable Routine Loop
 * Types for deterministic recommendations, action items, and transparent impact metrics.
 */

import { CommuteMode } from '../household/types';
import { PollutantKey } from '../types';

export type RecommendationType =
  | 'TIMING_SHIFT'
  | 'INDOOR_ALTERNATIVE'
  | 'TRANSIT_ADJUSTMENT'
  | 'VENTILATION_WINDOW'
  | 'PROTECTIVE_HABIT';

export interface TimeWindow {
  readonly startTime: string; // "HH:mm"
  readonly endTime: string;   // "HH:mm"
}

export interface DeltaCIndicator {
  readonly pollutantKey: PollutantKey;
  readonly pollutantLabel: string;
  readonly deltaValue: number; // C_original - C_suggested (positive = lower ambient concentration)
  readonly unit: string;        // e.g. "μg/m³"
  readonly originalConcentration: number;
  readonly suggestedConcentration: number;
  readonly providerTimestamp: string;
  readonly cautionaryNote: string;
}

export interface TransportEmissionIndicator {
  readonly distanceKm: number;
  readonly baselineMode: CommuteMode;
  readonly alternativeMode: CommuteMode;
  readonly baselineFactorKgPerKm: number;
  readonly alternativeFactorKgPerKm: number;
  readonly avoidedCo2eKg: number;
  readonly sourceCitation: string;
  readonly operationalScopeNote: string;
}

export interface PlannerRecommendation {
  readonly id: string;
  readonly memberId: string;
  readonly memberNickname: string;
  readonly scheduleId: string;
  readonly activityName: string;
  readonly type: RecommendationType;
  readonly title: string;
  readonly practicalAction: string;
  readonly scientificReason: string;
  readonly originalWindow: TimeWindow;
  readonly suggestedWindow?: TimeWindow;
  readonly deltaC?: DeltaCIndicator;
  readonly transportImpact?: TransportEmissionIndicator;
  readonly forecastAttribution: string;
  readonly limitationsDisclaimer: string;
}

export type ActionItemStatus = 'ADOPTED' | 'COMPLETED' | 'SKIPPED';

export interface ActiveActionItem {
  readonly id: string;
  readonly recommendationId: string;
  readonly memberId: string;
  readonly memberNickname: string;
  readonly scheduleId?: string;
  readonly title: string;
  readonly actionType: RecommendationType;
  readonly originalWindow: TimeWindow;
  readonly adjustedWindow: TimeWindow;
  readonly status: ActionItemStatus;
  readonly adoptedAt: string; // ISO 8601
  readonly completedAt: string | null; // ISO 8601
  readonly deltaCValue?: number | null;
  readonly deltaCPollutant?: string | null;
  readonly avoidedCo2eKg?: number | null;
  readonly userNotes?: string;
}

export interface ActivePlanStorageState {
  readonly version: 1;
  readonly updatedAt: string;
  readonly actions: readonly ActiveActionItem[];
}
