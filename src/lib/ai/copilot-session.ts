/**
 * AirAware — Copilot Session & Payload Derivation Helpers
 * Pure TypeScript functions for building copilot request payloads, deriving
 * household vulnerability contexts, and constructing chat response messages.
 * Strictly 0 React or UI dependencies.
 */

import { CopilotResponse, WorkspaceContext, RoomContext, AqiCategory } from './types';
import { AirQualityReport, GeoLocation } from '@/domain/types';
import { getPrimaryAqiFacts } from '@/domain/aqi/primary-aqi';
import { HouseholdStorageState, HouseholdMember } from '@/domain/household/types';
import { loadHouseholdState } from '@/domain/household/storage';
import { loadIndoorState } from '@/domain/indoor/storage';
import { CopilotChatMessage } from './use-copilot';

export interface UserContextDerivation {
  readonly isSensitiveGroup: boolean;
  readonly primaryActivity: 'outdoor_exercise' | 'daily_commute' | 'indoor_resting' | 'general';
  readonly locale: string;
  readonly vulnerabilityTiers: string[];
}

/**
 * Derives user vulnerability context from active household state and active member profile.
 *
 * @param householdState - Persisted or passed household state
 * @param activeMember - Currently active member profile
 * @returns Sensitivity flags, activity archetype, and vulnerability tiers
 */
export function deriveUserContextFromHousehold(
  householdState?: HouseholdStorageState | null,
  activeMember?: HouseholdMember | null
): UserContextDerivation {
  const state = householdState || (typeof window !== 'undefined' ? loadHouseholdState() : null);
  const members = state?.members || [];
  const currentMember =
    activeMember ||
    (state?.activeMemberId ? members.find((m) => m.id === state.activeMemberId) : null) ||
    members[0];

  const vulnerabilityTiers: string[] = [];
  let isSensitiveGroup = false;

  if (currentMember) {
    if (currentMember.sensitivityTier !== 'NONE') {
      isSensitiveGroup = true;
    }
    if (currentMember.sensitivityTier === 'PEDIATRIC' || currentMember.archetype === 'CHILD_STUDENT') {
      vulnerabilityTiers.push('pediatric');
    }
    if (currentMember.sensitivityTier === 'SENIOR' || currentMember.archetype === 'SENIOR_VULNERABLE') {
      vulnerabilityTiers.push('senior');
    }
    if (currentMember.sensitivityTier === 'RESPIRATORY' || currentMember.sensitivityTier === 'CARDIOVASCULAR') {
      vulnerabilityTiers.push('respiratory');
    }
    if (currentMember.archetype === 'WORKING_COMMUTER') {
      vulnerabilityTiers.push('commuter');
    }
    if (currentMember.archetype === 'OUTDOOR_ENTHUSIAST') {
      vulnerabilityTiers.push('outdoor_enthusiast');
    }

    const schedules = currentMember.schedules || [];
    const hasCommute = schedules.some((s) => s.activityType === 'COMMUTE' || s.activityType === 'SCHOOL_TRAVEL');
    const hasOutdoor = schedules.some((s) => s.activityType === 'OUTDOOR_EXERCISE');
    const hasIndoor = schedules.some((s) => s.activityType === 'INDOOR_CHORE' || s.activityType === 'VENTILATION');

    let primaryActivity: 'outdoor_exercise' | 'daily_commute' | 'indoor_resting' | 'general' = 'general';
    if (hasCommute || currentMember.archetype === 'WORKING_COMMUTER') {
      primaryActivity = 'daily_commute';
    } else if (hasOutdoor || currentMember.archetype === 'OUTDOOR_ENTHUSIAST') {
      primaryActivity = 'outdoor_exercise';
    } else if (hasIndoor) {
      primaryActivity = 'indoor_resting';
    }

    return {
      isSensitiveGroup,
      primaryActivity,
      locale: 'en',
      vulnerabilityTiers,
    };
  }

  const anySensitive = members.some((m) => m.sensitivityTier !== 'NONE');
  return {
    isSensitiveGroup: anySensitive,
    primaryActivity: 'general',
    locale: 'en',
    vulnerabilityTiers: [],
  };
}

export interface CopilotApiPayloadOptions {
  readonly query: string;
  readonly activeWorkspace: WorkspaceContext;
  readonly report: AirQualityReport;
  readonly location?: GeoLocation | null;
  readonly roomContext?: RoomContext | null;
  readonly householdState?: HouseholdStorageState | null;
  readonly activeMember?: HouseholdMember | null;
}

/**
 * Builds the authoritative, privacy-safe API payload for the Cloudflare / Gemini Copilot endpoint.
 *
 * @param options - Query, active report, location, and room context
 * @returns Fully formatted JSON payload
 */
export function buildCopilotApiPayload({
  query,
  activeWorkspace,
  report,
  location,
  roomContext,
  householdState,
  activeMember,
}: CopilotApiPayloadOptions) {
  const primaryFacts = getPrimaryAqiFacts(report);
  const currentAqi = primaryFacts.aqi;
  const currentCategory = primaryFacts.category as AqiCategory;

  let dominantKey: 'pm25' | 'pm10' | 'o3' | 'no2' | 'so2' | 'co' = 'pm25';
  const rawDominant = (report.dominantPollutant || 'pm25').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (rawDominant.includes('pm10')) dominantKey = 'pm10';
  else if (rawDominant.includes('pm2') || rawDominant.includes('pm25')) dominantKey = 'pm25';
  else if (rawDominant.includes('o3') || rawDominant.includes('ozone')) dominantKey = 'o3';
  else if (rawDominant.includes('no2')) dominantKey = 'no2';
  else if (rawDominant.includes('so2')) dominantKey = 'so2';
  else if (rawDominant.includes('co')) dominantKey = 'co';

  const pollutantMeasurementKey = dominantKey === 'pm25' ? 'pm2_5' : dominantKey;
  const conc =
    report.pollutants?.[pollutantMeasurementKey as keyof typeof report.pollutants]?.concentration ??
    report.pollutants?.pm2_5?.concentration ??
    0;

  const userContext = deriveUserContextFromHousehold(householdState, activeMember);
  const cityName = location?.name || report.location.name;
  const observationTime = report.observedAt || report.localTime || report.modelTimestamp;
  const dataSource = primaryFacts.resolvedDataSource;

  return {
    question: query.slice(0, 200),
    workspace: activeWorkspace,
    roomContext: roomContext || undefined,
    aqi: Math.min(500, Math.max(0, currentAqi)),
    category: currentCategory,
    dominantPollutant: dominantKey,
    pollutantConcentration: conc,
    pollutantUnit: 'µg/m³',
    weather: {
      temperatureC: 22,
      humidityPercent: 50,
      windSpeedKmh: 5,
    },
    userContext,
    cityName,
    observationTime,
    dataSource,
    sourceType: report.sourceType,
    stationName: report.stationName,
    distanceKm: report.distanceKm,
    indoorPm25: typeof window !== 'undefined' ? (loadIndoorState().indoorPm25Reading ?? null) : null,
    scaleName: primaryFacts.scaleName,
    modelFallbackReason: primaryFacts.modelFallbackReason,
  };
}

/**
 * Creates deterministic assistant message when no valid air quality report is loaded.
 *
 * @returns Deterministic fallback CopilotChatMessage
 */
export function createNoReportMessage(): CopilotChatMessage {
  return {
    id: `assistant-${Date.now()}`,
    sender: 'assistant',
    text: 'I need a selected location and live environmental telemetry before answering. Please select or detect a location first.',
    timestamp: new Date().toISOString(),
    source: 'deterministic',
  };
}

/**
 * Creates rate-limit error message with countdown seconds.
 *
 * @param seconds - Seconds remaining before retry is permitted
 * @returns Formatted rate-limit CopilotChatMessage
 */
export function createRateLimitMessage(seconds: number): CopilotChatMessage {
  return {
    id: `err-${Date.now()}`,
    sender: 'assistant',
    isError: true,
    errorMessage: `Rate limit reached. Please wait ${seconds} seconds before asking another question.`,
    timestamp: new Date().toISOString(),
    source: 'deterministic',
  };
}

/**
 * Creates sanitized network error message.
 *
 * @param err - Unknown caught error
 * @returns Formatted error CopilotChatMessage
 */
export function createCatchErrorMessage(err: unknown): CopilotChatMessage {
  const errMsg =
    err instanceof Error
      ? err.message
      : 'Network connection interrupted. Please try asking your question again.';
  return {
    id: `err-${Date.now()}`,
    sender: 'assistant',
    isError: true,
    errorMessage: errMsg,
    timestamp: new Date().toISOString(),
    source: 'deterministic',
  };
}

/**
 * Creates successful assistant response message.
 *
 * @param data - CopilotResponse payload from backend
 * @param rawSource - Header source tag
 * @returns Formatted CopilotChatMessage
 */
export function createAssistantSuccessMessage(
  data: CopilotResponse,
  rawSource: string | null
): CopilotChatMessage {
  const source: 'cloudflare-ai' | 'deterministic' =
    rawSource === 'cloudflare-ai' ? 'cloudflare-ai' : 'deterministic';
  return {
    id: `assistant-${Date.now()}`,
    sender: 'assistant',
    response: data,
    timestamp: new Date().toISOString(),
    source: data.isDeterministicFallback ? 'deterministic' : source,
  };
}
