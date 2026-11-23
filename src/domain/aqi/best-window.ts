/**
 * AirAware — Best Daytime Window Finder
 * Pure calculation function to find the cleanest 2–3 hour daytime window
 * from an hourly forecast series.
 */

import { ForecastPoint } from '../types';
import { calculateCpcbPm25SubIndex } from './cpcb-benchmark';

export interface BestWindowResult {
  readonly startHour: string;
  readonly endHour: string;
  readonly displayWindow: string; // e.g. "3:00 PM – 5:00 PM"
  readonly averageAqi: number;
  readonly category: string;
  readonly colorToken: string;
  readonly summary: string;
}

function getCpcbCategory(aqi: number): { category: string; colorToken: string } {
  if (aqi <= 50) return { category: 'Good', colorToken: '#047857' };
  if (aqi <= 100) return { category: 'Satisfactory', colorToken: '#4D7C0F' };
  if (aqi <= 200) return { category: 'Moderate', colorToken: '#92400E' };
  if (aqi <= 300) return { category: 'Poor', colorToken: '#EA580C' };
  if (aqi <= 400) return { category: 'Very Poor', colorToken: '#DC2626' };
  return { category: 'Severe', colorToken: '#7F1D1D' };
}

function parseHour24(timeStr?: string): number {
  if (!timeStr) return 12;
  if (timeStr.includes('T')) {
    const timePart = timeStr.split('T')[1];
    const hourPart = timePart ? timePart.split(':')[0] : '';
    const h = parseInt(hourPart, 10);
    if (!isNaN(h)) return h;
  }
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  return isNaN(h) ? 12 : h;
}

function formatHour12(hour24: number): string {
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const h = hour24 % 12 || 12;
  return `${h} ${period}`;
}

/**
 * Evaluates daytime forecast points (between 07:00 and 19:00) over the next 24 hours
 * and selects the consecutive 2 to 3 hour window with the lowest average pollution.
 */
export function findBestDaytimeWindow(
  forecast: readonly ForecastPoint[],
  windowSizeHours = 2
): BestWindowResult | null {
  if (!forecast || forecast.length === 0) return null;

  // Take the next 24 points
  const points = forecast.slice(0, 24);

  // Filter to daytime candidate indices (07:00 to 19:00)
  const daytimeCandidates: { index: number; point: ForecastPoint; hour: number; aqi: number }[] = [];

  points.forEach((pt, idx) => {
    const h = parseHour24(pt.displayTime || pt.time);
    if (h >= 7 && h <= 19) {
      const computedAqi =
        pt.activeAqi ??
        pt.usAqi ??
        (pt.pm25 !== null && pt.pm25 !== undefined ? calculateCpcbPm25SubIndex(pt.pm25) : null) ??
        100;
      daytimeCandidates.push({ index: idx, point: pt, hour: h, aqi: computedAqi });
    }
  });

  if (daytimeCandidates.length === 0) {
    // Fallback to whatever points exist
    const firstAqi = points[0]?.activeAqi ?? 100;
    const { category, colorToken } = getCpcbCategory(firstAqi);
    return {
      startHour: '14:00',
      endHour: '16:00',
      displayWindow: '2 PM – 4 PM',
      averageAqi: firstAqi,
      category,
      colorToken,
      summary: `Cleanest daytime window around 2 PM – 4 PM (AQI ~${firstAqi}).`,
    };
  }

  // Scan consecutive blocks of windowSizeHours in daytimeCandidates
  let bestAvg = Infinity;
  let bestStartCandidate = daytimeCandidates[0];
  let bestEndCandidate = daytimeCandidates[Math.min(windowSizeHours - 1, daytimeCandidates.length - 1)];

  for (let i = 0; i <= daytimeCandidates.length - windowSizeHours; i++) {
    let sum = 0;
    for (let j = 0; j < windowSizeHours; j++) {
      sum += daytimeCandidates[i + j].aqi;
    }
    const avg = Math.round(sum / windowSizeHours);
    if (avg < bestAvg) {
      bestAvg = avg;
      bestStartCandidate = daytimeCandidates[i];
      bestEndCandidate = daytimeCandidates[i + windowSizeHours - 1];
    }
  }

  const startHourStr = formatHour12(bestStartCandidate.hour);
  const endHourStr = formatHour12((bestEndCandidate.hour + 1) % 24);
  const displayWindow = `${startHourStr} – ${endHourStr}`;
  const { category, colorToken } = getCpcbCategory(bestAvg);

  return {
    startHour: bestStartCandidate.point.displayTime,
    endHour: bestEndCandidate.point.displayTime,
    displayWindow,
    averageAqi: bestAvg,
    category,
    colorToken,
    summary: `Cleanest daytime air window: ${displayWindow} (AQI ~${bestAvg}, ${category}).`,
  };
}
