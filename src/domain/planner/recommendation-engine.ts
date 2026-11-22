/**
 * AirAware Deterministic Recommendation Engine
 * Pure TypeScript domain engine generating actionable family daily recommendations.
 *
 * Adheres strictly to Master Specification:
 * - Uses real Open-Meteo CAMS forecast data and timestamps.
 * - Does not invent forecast values or claim absolute safety.
 * - Separates personal exposure indicators (ΔC) from transport emissions.
 * - Evaluates sensitivity tiers with gentle, non-diagnostic guidance.
 */

import { HouseholdMember } from '../household/types';
import { ForecastPoint, AtmosphericModelMetadata } from '../types';
import { calculateDeltaC, calculateAvoidedTransportEmissions } from './impact-calculator';
import { PlannerRecommendation, TimeWindow } from './types';

function parseHourFromTimeString(timeStr: string): number {
  const [hourStr] = timeStr.split(':');
  const h = parseInt(hourStr, 10);
  return Number.isNaN(h) ? 0 : Math.max(0, Math.min(23, h));
}

function formatHour(hour: number): string {
  const h = Math.max(0, Math.min(23, Math.floor(hour)));
  return `${h.toString().padStart(2, '0')}:00`;
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const startHour = parseHourFromTimeString(startTime);
  const startMin = parseInt(startTime.split(':')[1] || '0', 10);
  const totalMinutes = startHour * 60 + startMin + durationMinutes;
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMin = totalMinutes % 60;
  return `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
}

function findForecastPointForHour(forecast: readonly ForecastPoint[], targetHour: number): ForecastPoint | null {
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

/**
 * Generates deterministic daily recommendations for a household member
 * based on their registered schedules and actual forecast conditions.
 */
export function generateMemberRecommendations(params: {
  readonly member: HouseholdMember;
  readonly forecast: readonly ForecastPoint[];
  readonly modelMetadata?: AtmosphericModelMetadata;
}): readonly PlannerRecommendation[] {
  const { member, forecast, modelMetadata } = params;

  if (!member.schedules || member.schedules.length === 0 || !forecast || forecast.length === 0) {
    return [];
  }

  const recommendations: PlannerRecommendation[] = [];
  const modelName = modelMetadata?.domainName ?? 'Open-Meteo CAMS Modelled Forecast';

  for (const schedule of member.schedules) {
    const scheduledHour = parseHourFromTimeString(schedule.startTime);
    const scheduledFp = findForecastPointForHour(forecast, scheduledHour);
    const originalWindow: TimeWindow = {
      startTime: schedule.startTime,
      endTime: calculateEndTime(schedule.startTime, schedule.durationMinutes),
    };

    // 1. OUTDOOR EXERCISE
    if (schedule.activityType === 'OUTDOOR_EXERCISE') {
      const scheduledPm25 = scheduledFp?.pm25 ?? null;

      // Scan daytime hours (06:00 to 20:00) to check if a cleaner window exists
      let bestHour = scheduledHour;
      let minPm25 = scheduledPm25 ?? Infinity;
      let bestFp: ForecastPoint | null = null;

      for (let h = 6; h <= 20; h++) {
        const fp = findForecastPointForHour(forecast, h);
        if (fp && fp.pm25 !== null && fp.pm25 !== undefined && fp.pm25 < minPm25) {
          minPm25 = fp.pm25;
          bestHour = h;
          bestFp = fp;
        }
      }

      // If a cleaner window is found with discernible improvement (>= 5 μg/m³ PM2.5 difference)
      if (
        scheduledPm25 !== null &&
        minPm25 < scheduledPm25 &&
        scheduledPm25 - minPm25 >= 5 &&
        bestHour !== scheduledHour &&
        bestFp
      ) {
        const suggestedStart = formatHour(bestHour);
        const suggestedWindow: TimeWindow = {
          startTime: suggestedStart,
          endTime: calculateEndTime(suggestedStart, schedule.durationMinutes),
        };

        const deltaC = calculateDeltaC({
          pollutantKey: 'pm2_5',
          pollutantLabel: 'PM2.5',
          unit: 'μg/m³',
          originalConcentration: scheduledPm25,
          suggestedConcentration: minPm25,
          providerTimestamp: bestFp.time,
        });

        recommendations.push({
          id: `rec_shift_${member.id}_${schedule.id}`,
          memberId: member.id,
          memberNickname: member.nickname,
          scheduleId: schedule.id,
          activityName: schedule.activityName,
          type: 'TIMING_SHIFT',
          title: `Shift ${schedule.activityName} to ${suggestedStart}`,
          practicalAction: `Plan your outdoor exercise window around ${suggestedStart} instead of ${schedule.startTime} to align with lower forecast ambient particulate levels.`,
          scientificReason: `Modelled forecast data indicates an ambient PM2.5 reduction of ${deltaC?.deltaValue ?? 'notable'} μg/m³ between the scheduled time (${schedule.startTime}) and ${suggestedStart}.`,
          originalWindow,
          suggestedWindow,
          deltaC: deltaC ?? undefined,
          forecastAttribution: modelName,
          limitationsDisclaimer:
            'Regional atmospheric model estimate. Does not guarantee individual protection or substitute for localized real-time observations.',
        });
      }

      // If sensitive or high air pollution (> 150 AQI or > 55 μg/m³ PM2.5), recommend indoor alternative
      const isSensitive = member.sensitivityTier !== 'NONE';
      if ((scheduledPm25 !== null && scheduledPm25 > 55) || isSensitive) {
        recommendations.push({
          id: `rec_indoor_${member.id}_${schedule.id}`,
          memberId: member.id,
          memberNickname: member.nickname,
          scheduleId: schedule.id,
          activityName: schedule.activityName,
          type: 'INDOOR_ALTERNATIVE',
          title: `Indoor Exercise Option for ${schedule.activityName}`,
          practicalAction:
            `Consider moving ${schedule.activityName} indoors to an air-filtered space, home workout area, or indoor facility during elevated particulate periods.`,
          scientificReason:
            member.sensitivityTier === 'PEDIATRIC'
              ? 'Developing pediatric airways experience higher relative inhalation rates during intense outdoor exertion.'
              : member.sensitivityTier === 'RESPIRATORY' || member.sensitivityTier === 'CARDIOVASCULAR'
              ? 'Elevated fine particulates trigger airway irritation and microvascular stress during aerobic outdoor exercise.'
              : 'Ambient fine particulate levels are elevated during this hour, increasing overall respiratory load.',
          originalWindow,
          forecastAttribution: modelName,
          limitationsDisclaimer:
            'General non-diagnostic wellness guidance based on environmental forecast indicators.',
        });
      }
    }

    // 2. COMMUTE & SCHOOL TRAVEL
    if (schedule.activityType === 'COMMUTE' || schedule.activityType === 'SCHOOL_TRAVEL') {
      const mode = schedule.commuteMode ?? 'PRIVATE_CAR';
      const distance = schedule.commuteDistanceKm ?? 8;

      // Sustainable transit alternative if currently private car
      if (mode === 'PRIVATE_CAR' && distance > 0) {
        const altMode = distance <= 3 ? 'CYCLING' : 'PUBLIC_TRANSIT';
        const impact = calculateAvoidedTransportEmissions({
          distanceKm: distance,
          baselineMode: 'PRIVATE_CAR',
          alternativeMode: altMode,
        });

        if (impact) {
          recommendations.push({
            id: `rec_transit_${member.id}_${schedule.id}`,
            memberId: member.id,
            memberNickname: member.nickname,
            scheduleId: schedule.id,
            activityName: schedule.activityName,
            type: 'TRANSIT_ADJUSTMENT',
            title: `Switch Commute to ${altMode === 'CYCLING' ? 'Active Cycling' : 'Public Metro/Bus'}`,
            practicalAction: `Opt for ${
              altMode === 'CYCLING' ? 'bicycle transit' : 'electric rail or clean urban bus'
            } for this ${distance} km route to reduce direct operational vehicle emissions.`,
            scientificReason:
              'Passenger rail and active transit produce significantly lower operational emissions per passenger-kilometer compared to solo passenger vehicles.',
            originalWindow,
            transportImpact: impact,
            forecastAttribution: modelName,
            limitationsDisclaimer:
              'Emissions calculations reflect operational tailpipe benchmarks. Transport alternatives do not directly lower citywide ambient AQI.',
          });
        }
      }

      // Protective habit during rush hour / elevated forecast
      if (scheduledFp?.pm25 !== null && scheduledFp?.pm25 !== undefined && scheduledFp.pm25 > 35) {
        recommendations.push({
          id: `rec_mask_${member.id}_${schedule.id}`,
          memberId: member.id,
          memberNickname: member.nickname,
          scheduleId: schedule.id,
          activityName: schedule.activityName,
          type: 'PROTECTIVE_HABIT',
          title: `Commuter Protective Masking Advisory`,
          practicalAction:
            'Wear a well-fitted certified N95 / FFP2 particulate respirator if walking along arterial roadways or waiting at outdoor bus/transit stops.',
          scientificReason:
            'Roadside vehicle exhaust elevates localized ultrafine particulates and nitrogen oxides near pedestrian walkways.',
          originalWindow,
          forecastAttribution: modelName,
          limitationsDisclaimer:
            'Respirators must be properly fitted to achieve rated particulate filtration. Does not protect against gaseous pollutants.',
        });
      }
    }

    // 3. VENTILATION
    if (schedule.activityType === 'VENTILATION') {
      // Find the cleanest window in the daytime forecast (08:00 to 18:00)
      let bestHour: number | null = null;
      let minPm = Infinity;
      let bestFp: ForecastPoint | null = null;

      for (let h = 8; h <= 18; h++) {
        const fp = findForecastPointForHour(forecast, h);
        if (
          fp &&
          fp.pm25 !== null &&
          fp.pm25 !== undefined &&
          Number.isFinite(fp.pm25) &&
          fp.pm25 < minPm
        ) {
          minPm = fp.pm25;
          bestHour = h;
          bestFp = fp;
        }
      }

      // Only generate recommendation if a valid forecast point was found
      if (bestHour !== null && bestFp !== null && Number.isFinite(minPm)) {
        const scheduledPm = scheduledFp?.pm25 ?? null;
        const suggestedStart = formatHour(bestHour);
        const suggestedWindow: TimeWindow = {
          startTime: suggestedStart,
          endTime: calculateEndTime(suggestedStart, schedule.durationMinutes),
        };

        const deltaC =
          scheduledPm !== null && minPm < scheduledPm
            ? calculateDeltaC({
                pollutantKey: 'pm2_5',
                pollutantLabel: 'PM2.5',
                unit: 'μg/m³',
                originalConcentration: scheduledPm,
                suggestedConcentration: minPm,
                providerTimestamp: bestFp.time,
              })
            : null;

        recommendations.push({
          id: `rec_vent_${member.id}_${schedule.id}`,
          memberId: member.id,
          memberNickname: member.nickname,
          scheduleId: schedule.id,
          activityName: schedule.activityName,
          type: 'VENTILATION_WINDOW',
          title: `Optimal Home Airing Window: ${suggestedStart}`,
          practicalAction: `Open cross-ventilation windows briefly around ${suggestedStart} for 10–15 minutes when forecast particulate concentrations are at their daytime minimum. Close windows immediately if outdoor dust or smoke becomes noticeable.`,
          scientificReason:
            'Atmospheric model forecasts indicate lower ambient particulate levels during this window compared to peak accumulation hours. Natural ventilation exchanges stale indoor CO2 while minimizing outdoor particulate ingress.',
          originalWindow,
          suggestedWindow,
          deltaC: deltaC ?? undefined,
          forecastAttribution: modelName,
          limitationsDisclaimer:
            'Modelled outdoor forecast. Natural ventilation timing should balance outdoor particulate conditions with indoor moisture, allergen, and CO2 requirements.',
        });
      }
    }

    // 4. INDOOR CHORES
    if (schedule.activityType === 'INDOOR_CHORE') {
      recommendations.push({
        id: `rec_chore_${member.id}_${schedule.id}`,
        memberId: member.id,
        memberNickname: member.nickname,
        scheduleId: schedule.id,
        activityName: schedule.activityName,
        type: 'PROTECTIVE_HABIT',
        title: `Low-Dust Cleaning Practice`,
        practicalAction:
          'Use damp microfiber cloths and wet-mopping rather than dry-sweeping to trap settled dust without resuspending fine particulates.',
        scientificReason:
          'Dry sweeping resuspends coarse particulate matter (PM10) and biological allergens into the breathing zone for several hours.',
        originalWindow,
        forecastAttribution: modelName,
        limitationsDisclaimer: 'Standard home hygiene practice based on indoor aerosol physics.',
      });
    }
  }

  return recommendations;
}
