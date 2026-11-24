/**
 * AirAware — Pollutant Presentation & Metric Formatting Domain Module
 * Pure TypeScript helpers for pollutant card rendering, regulatory disclosures,
 * source metadata, and WHO 2021 guideline ratio derivations.
 * Strictly 0 React or DOM dependencies.
 */

import { AqiStandardKey, PollutantKey, PollutantMeasurement } from '@/domain/types';
import {
  POLLUTANT_EDUCATIONAL_DATA,
  PollutantEducationalData,
} from './pollutant-educational-data';

export const ORDERED_POLLUTANT_KEYS: readonly PollutantKey[] = [
  'pm2_5',
  'pm10',
  'nitrogen_dioxide',
  'ozone',
  'sulphur_dioxide',
  'carbon_monoxide',
];

export interface PollutantSourceTag {
  readonly sourceName: string;
  readonly icon: string;
}

export const POLLUTANT_SOURCE_TAGS: Record<PollutantKey, PollutantSourceTag> = {
  pm2_5: { sourceName: 'Fine Smog & Stubble Smoke', icon: '🔥' },
  pm10: { sourceName: 'Road Dust & Construction', icon: '🏗️' },
  nitrogen_dioxide: { sourceName: 'Diesel & Vehicle Exhaust', icon: '🚗' },
  ozone: { sourceName: 'Sunlight Chemical Smog', icon: '☀️' },
  sulphur_dioxide: { sourceName: 'Industrial Fuel Fumes', icon: '🏭' },
  carbon_monoxide: { sourceName: 'Incomplete Fuel Burning', icon: '⚠️' },
};

/**
 * Normalizes an AQI severity label into a standardized badge tier string.
 * @param label - Raw category label (e.g., 'Unhealthy for Sensitive Groups')
 * @returns Shortened human-friendly badge tier
 */
export function formatBadgeTier(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes('sensitive')) return 'Sensitive';
  if (lower.includes('very unhealthy') || lower.includes('very poor')) return 'Very Unhealthy';
  if (lower.includes('hazardous')) return 'Hazardous';
  if (lower.includes('unhealthy') || lower.includes('poor')) return 'Unhealthy';
  if (lower.includes('moderate') || lower.includes('fair')) return 'Moderate';
  if (lower.includes('good')) return 'Good';
  return label;
}

/**
 * Resolves regulatory averaging methodology disclosures per pollutant and standard.
 * @param key - The criteria pollutant key
 * @param isEaqi - True if active regulatory standard is European EAQI
 * @returns Human-readable regulatory methodology disclosure string
 */
export function getRegulatoryMethodDisclosure(key: PollutantKey, isEaqi: boolean): string {
  if (isEaqi && key === 'carbon_monoxide') {
    return 'Not evaluated under European EAQI standard (EEA convention)';
  }
  if (isEaqi) {
    return 'EAQI method: evaluates five pollutant indices using hourly concentrations';
  }
  if (key === 'pm2_5' || key === 'pm10') {
    return 'US EPA AQI method: requires preceding 24-hour rolling average (provider-modelled sub-index; not computed locally)';
  }
  if (key === 'carbon_monoxide' || key === 'ozone') {
    return 'US EPA AQI method: requires 8-hour rolling average (provider-modelled sub-index; not computed locally)';
  }
  return 'US EPA AQI method: evaluated against 1-hour daily maximum standard';
}

/**
 * Identifies the dominant pollutant from calculated positive sub-indices.
 * @param pollutants - Map of pollutant measurements
 * @returns Key of the dominant pollutant and its highest sub-index
 */
export function calculateDominantPollutant(
  pollutants: Record<PollutantKey, PollutantMeasurement>
): { dominantKey: PollutantKey | null; highestSubIndex: number } {
  let highestSubIndex = -1;
  let dominantKey: PollutantKey | null = null;

  for (const k of ORDERED_POLLUTANT_KEYS) {
    const p = pollutants[k];
    if (
      p &&
      p.isEvaluatedInActiveStandard &&
      p.subIndex !== null &&
      Number.isFinite(p.subIndex) &&
      p.subIndex > 0
    ) {
      if (p.subIndex > highestSubIndex) {
        highestSubIndex = p.subIndex;
        dominantKey = k;
      }
    }
  }

  return { dominantKey, highestSubIndex };
}

export interface PollutantThreatRankingItem {
  readonly key: PollutantKey;
  readonly formula: string;
  readonly fullName: string;
  readonly sourceName: string;
  readonly icon: string;
  readonly ratio: number;
  readonly conc: number;
  readonly ref: number;
  readonly unit: string;
  readonly tierColor: string;
}

/**
 * Derives threat ranking items sorted descending by WHO guideline exceedance ratio.
 * @param pollutants - Active pollutant measurements record
 * @returns Sorted array of threat ranking items with WHO ratios and colors
 */
export function derivePollutantThreatRanking(
  pollutants: Record<PollutantKey, PollutantMeasurement>
): PollutantThreatRankingItem[] {
  return ORDERED_POLLUTANT_KEYS.map((key) => {
    const item = pollutants[key];
    const edu: PollutantEducationalData = POLLUTANT_EDUCATIONAL_DATA[key];
    const conc = item?.concentration ?? 0;
    const ref = edu?.who2021Guidelines?.shortTerm?.value || 15;
    const ratio = conc > 0 && Number.isFinite(conc) ? conc / ref : 0;
    const tierColor = item?.tier
      ? item.tier.colorToken
      : ratio > 1
        ? 'var(--aqi-unhealthy)'
        : 'var(--aqi-good)';

    return {
      key,
      formula: edu?.chemicalFormula || key,
      fullName: edu?.fullName || key,
      sourceName: POLLUTANT_SOURCE_TAGS[key]?.sourceName || '',
      icon: POLLUTANT_SOURCE_TAGS[key]?.icon || '💨',
      ratio,
      conc,
      ref,
      unit: item?.unit || 'μg/m³',
      tierColor,
    };
  }).sort((a, b) => b.ratio - a.ratio);
}
