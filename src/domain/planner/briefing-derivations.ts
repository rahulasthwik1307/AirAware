/**
 * AirAware — Family Daily Air Briefing Derivations Domain Module
 * Pure TypeScript functions for forecasting extremes, schedule triage,
 * plain-language summaries, and smog exposure reduction metrics.
 * Strictly 0 React or UI dependencies.
 */

import { ForecastPoint } from '@/domain/types';
import { HouseholdMember, MemberScheduleItem } from '@/domain/household/types';
import { PlannerRecommendation, ActiveActionItem } from '@/domain/planner/types';

/**
 * Extracts the 24-hour hour integer from a time string formatted as HH:mm.
 *
 * @param timeStr - Time string formatted as "HH:mm"
 * @returns Hour number from 0 to 23
 */
export function parseHourFromTimeString(timeStr: string): number {
  const [h] = timeStr.split(':');
  const parsed = parseInt(h, 10);
  return Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(23, parsed));
}

/**
 * Finds the forecast point corresponding to an integer target hour.
 *
 * @param forecast - Array of forecast telemetry points
 * @param targetHour - Integer hour from 0 to 23
 * @returns Matching forecast point or null
 */
export function findForecastPointForHour(
  forecast: readonly ForecastPoint[],
  targetHour: number
): ForecastPoint | null {
  if (!forecast || forecast.length === 0) return null;
  const hourPrefix = `${targetHour.toString().padStart(2, '0')}:`;
  const match = forecast.find((fp) => {
    if (fp.displayTime && fp.displayTime.startsWith(hourPrefix)) {
      return true;
    }
    const tIndex = fp.time.indexOf('T');
    if (tIndex !== -1 && fp.time.length >= tIndex + 3) {
      const isoHour = parseInt(fp.time.slice(tIndex + 1, tIndex + 3), 10);
      return isoHour === targetHour;
    }
    return false;
  });
  return match ?? null;
}

export interface ForecastExtremes {
  readonly highestPoint: ForecastPoint | null;
  readonly lowestPoint: ForecastPoint | null;
  readonly highestPm25: number | null;
  readonly lowestPm25: number | null;
}

/**
 * Identifies the highest (peak) and lowest (cleanest) PM2.5 forecast points in a 24-hour cycle.
 *
 * @param forecast - Array of hourly forecast points
 * @returns Highest and lowest points and their PM2.5 concentrations
 */
export function deriveForecastExtremes(forecast: readonly ForecastPoint[]): ForecastExtremes {
  const validPoints = forecast.filter(
    (fp) => fp.pm25 !== null && fp.pm25 !== undefined && Number.isFinite(fp.pm25)
  );

  if (validPoints.length === 0) {
    return {
      highestPoint: null,
      lowestPoint: null,
      highestPm25: null,
      lowestPm25: null,
    };
  }

  const highestPoint = validPoints.reduce((prev, curr) =>
    (curr.pm25 ?? 0) > (prev.pm25 ?? 0) ? curr : prev
  );
  const lowestPoint = validPoints.reduce((prev, curr) =>
    (curr.pm25 ?? Infinity) < (prev.pm25 ?? Infinity) ? curr : prev
  );

  return {
    highestPoint,
    lowestPoint,
    highestPm25: highestPoint.pm25 ?? null,
    lowestPm25: lowestPoint.pm25 ?? null,
  };
}

/**
 * Formulates reassuring, evidence-grounded plain-language summary for the family briefing.
 *
 * @param highestPm25 - Peak PM2.5 concentration in forecast
 * @param lowestPm25 - Minimum PM2.5 concentration in forecast
 * @returns Human-friendly briefing summary
 */
export function deriveConditionSummary(
  highestPm25: number | null,
  lowestPm25: number | null
): string {
  if (highestPm25 === null || lowestPm25 === null) {
    return 'Modelled particulate levels remain relatively steady across today.';
  }

  if (highestPm25 > 80) {
    return 'Modelled particulate levels indicate elevated smog concentrations during peak hours, with lower forecast pollution during mid-day windows.';
  }
  if (highestPm25 > 45) {
    return 'Moderate ambient particulate concentrations forecast across daytime hours, with measurable differences between morning and afternoon windows.';
  }
  return 'Relatively lower ambient particulate levels modelled across daytime hours. Favorable periods for outdoor family routines.';
}

export interface ScheduledActivityWithMember extends MemberScheduleItem {
  readonly memberNickname: string;
  readonly memberArchetype: string;
  readonly memberSensitivity: string;
}

/**
 * Triages scheduled household activities against hourly forecast PM2.5 concentrations.
 * Flags activities that coincide with elevated particulate smog levels.
 *
 * @param members - Household family members with scheduled routines
 * @param forecast - Hourly air quality forecast
 * @returns Array of activities needing attention and flattened list of all schedules
 */
export function triageActivitiesNeedingAttention(
  members: readonly HouseholdMember[],
  forecast: readonly ForecastPoint[]
): {
  readonly allSchedules: ScheduledActivityWithMember[];
  readonly activitiesNeedingAttention: ScheduledActivityWithMember[];
} {
  const allSchedules: ScheduledActivityWithMember[] = members.flatMap((m) =>
    m.schedules.map((s) => ({
      ...s,
      memberNickname: m.nickname,
      memberArchetype: m.archetype,
      memberSensitivity: m.sensitivityTier,
    }))
  );

  const activitiesNeedingAttention = allSchedules.filter((item) => {
    const hour = parseHourFromTimeString(item.startTime);
    const fp = findForecastPointForHour(forecast, hour);
    const pm25 = fp?.pm25;
    if (pm25 === null || pm25 === undefined) return false;

    if (item.activityType === 'OUTDOOR_EXERCISE') {
      const threshold = item.memberSensitivity !== 'NONE' ? 25 : 35;
      return pm25 > threshold;
    }
    if (item.activityType === 'COMMUTE' || item.activityType === 'SCHOOL_TRAVEL') {
      return pm25 > 45;
    }
    if (item.activityType === 'VENTILATION') {
      return pm25 > 40;
    }
    return false;
  });

  return { allSchedules, activitiesNeedingAttention };
}

export interface ExposureGaugeData {
  readonly gaugePercentage: number;
  readonly gaugeDeltaCValue: number;
  readonly gaugeStatusTitle: string;
  readonly gaugeStatusSubtitle: string;
  readonly gaugeIsOptimized: boolean;
  readonly hasAdoptedShifts: boolean;
  readonly hasPotentialShifts: boolean;
}

/**
 * Calculates exposure reduction gauge percentage, delta-C concentration differences,
 * and status messaging based on adopted active plan actions vs suggested recommendations.
 *
 * @param recommendations - Suggested planner recommendations
 * @param activePlanActions - Currently adopted action items
 * @returns Gauge metrics and display metadata
 */
export function calculateExposureGaugeData(
  recommendations: readonly PlannerRecommendation[],
  activePlanActions: readonly ActiveActionItem[] = []
): ExposureGaugeData {
  const recsWithDelta = recommendations.filter(
    (r) => r.deltaC && r.deltaC.deltaValue > 0
  );

  const adoptedDeltaActions = (activePlanActions || []).filter(
    (a) => a.deltaCValue && a.deltaCValue > 0
  );

  const hasAdoptedShifts = adoptedDeltaActions.length > 0;
  const hasPotentialShifts = recsWithDelta.length > 0;

  let gaugePercentage = 0;
  let gaugeDeltaCValue = 0;
  let gaugeStatusTitle = 'Baseline Routine Schedule';
  let gaugeStatusSubtitle = 'No routine shifts active';
  let gaugeIsOptimized = false;

  if (hasAdoptedShifts) {
    gaugeIsOptimized = true;
    gaugeDeltaCValue =
      Math.round(
        adoptedDeltaActions.reduce((sum, a) => sum + (a.deltaCValue ?? 0), 0) * 10
      ) / 10;
    const avgDelta = gaugeDeltaCValue / adoptedDeltaActions.length;
    gaugePercentage = Math.min(
      85,
      Math.max(15, Math.round((avgDelta / Math.max(avgDelta + 20, 100)) * 100))
    );
    gaugeStatusTitle = 'Active Smog Exposure Reduction';
    gaugeStatusSubtitle = `${adoptedDeltaActions.length} routine ${
      adoptedDeltaActions.length === 1 ? 'shift' : 'shifts'
    } adopted across family`;
  } else if (hasPotentialShifts) {
    const totalPotentialDelta =
      Math.round(
        recsWithDelta.reduce((sum, r) => sum + (r.deltaC?.deltaValue ?? 0), 0) * 10
      ) / 10;
    gaugeDeltaCValue = totalPotentialDelta;
    const bestRec = recsWithDelta[0];
    const pct = bestRec.deltaC
      ? Math.round(
          (bestRec.deltaC.deltaValue /
            Math.max(1, bestRec.deltaC.originalConcentration)) *
            100
        )
      : 35;
    gaugePercentage = Math.min(85, Math.max(10, pct));
    gaugeStatusTitle = 'Potential Exposure Reduction Available';
    gaugeStatusSubtitle = `${recsWithDelta.length} routine shift ${
      recsWithDelta.length === 1 ? 'window' : 'windows'
    } ready to adopt`;
  } else {
    gaugePercentage = 0;
    gaugeStatusTitle = 'Routines In Lower Smog Hours';
    gaugeStatusSubtitle = 'Current schedule aligns with daytime forecast dips';
  }

  return {
    gaugePercentage,
    gaugeDeltaCValue,
    gaugeStatusTitle,
    gaugeStatusSubtitle,
    gaugeIsOptimized,
    hasAdoptedShifts,
    hasPotentialShifts,
  };
}
