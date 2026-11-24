/**
 * AirAware — Chart Geometry & CPCB Benchmark Pure Domain Helpers
 * Calculates SVG path coordinates, interpolation, threshold guides, and CPCB limits.
 * Pure TypeScript — 0 React or DOM dependencies.
 */

import { HistoricalAirshedPoint, PollutantKey, PollutantMeasurement } from '@/domain/types';

export interface CpcbLimitEntry {
  readonly limit: number;
  readonly unit: string;
  readonly name: string;
  readonly formula: string;
  readonly fullName: string;
}

/** CPCB National Ambient Air Quality Standards (NAAQS 2009) 24-Hour Limits */
export const CPCB_24H_LIMITS: Record<PollutantKey, CpcbLimitEntry> = {
  pm2_5: { limit: 60, unit: 'µg/m³', name: 'PM2.5', formula: 'PM₂.₅', fullName: 'Fine Particulates' },
  pm10: { limit: 100, unit: 'µg/m³', name: 'PM10', formula: 'PM₁₀', fullName: 'Coarse Particulates' },
  nitrogen_dioxide: { limit: 80, unit: 'µg/m³', name: 'NO2', formula: 'NO₂', fullName: 'Nitrogen Dioxide' },
  sulphur_dioxide: { limit: 80, unit: 'µg/m³', name: 'SO2', formula: 'SO₂', fullName: 'Sulphur Dioxide' },
  ozone: { limit: 100, unit: 'µg/m³', name: 'Ozone (8h)', formula: 'O₃', fullName: 'Surface Ozone' },
  carbon_monoxide: { limit: 2000, unit: 'µg/m³', name: 'CO', formula: 'CO', fullName: 'Carbon Monoxide' },
};

/**
 * Maps a pollutant concentration-to-limit ratio to a color hex code.
 * @param ratio - Ratio of measured concentration to standard limit
 * @returns Hex color string for progress bars
 */
export function getBarColor(ratio: number): string {
  if (ratio <= 0.5) return '#047857'; // <= 50% of limit: Good green
  if (ratio <= 1.0) return '#4d7c0f'; // 50-100% of limit: Satisfactory green
  if (ratio <= 1.5) return '#92400e'; // 100-150% of limit: Moderate amber
  if (ratio <= 2.5) return '#ea580c'; // 150-250% of limit: Poor orange
  return '#dc2626'; // > 250% of limit: Severe red
}

export interface StatusBadgeInfo {
  readonly label: string;
  readonly textClass: string;
  readonly bgClass: string;
  readonly borderClass: string;
}

/**
 * Returns accessible CSS badge classes and text label for a given limit ratio.
 * @param ratio - Ratio of concentration to standard benchmark limit
 * @returns Badge presentation configuration
 */
export function getStatusBadge(ratio: number): StatusBadgeInfo {
  if (ratio <= 0.5) {
    return { label: 'Good', textClass: 'text-emerald-700', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-200' };
  }
  if (ratio <= 1.0) {
    return { label: 'Safe', textClass: 'text-emerald-800', bgClass: 'bg-emerald-50/80', borderClass: 'border-emerald-300' };
  }
  if (ratio <= 1.5) {
    return { label: 'Moderate', textClass: 'text-amber-800', bgClass: 'bg-amber-50', borderClass: 'border-amber-200' };
  }
  if (ratio <= 2.5) {
    return { label: 'Poor', textClass: 'text-orange-800', bgClass: 'bg-orange-50', borderClass: 'border-orange-300' };
  }
  return { label: 'Severe', textClass: 'text-rose-800', bgClass: 'bg-rose-50', borderClass: 'border-rose-300' };
}

export interface PollutantLimitItem {
  readonly key: PollutantKey;
  readonly formula: string;
  readonly fullName: string;
  readonly conc: number;
  readonly unit: string;
  readonly limit: number;
  readonly ratio: number;
  readonly pct: number;
  readonly barColor: string;
  readonly isItemStation: boolean;
  readonly badge: StatusBadgeInfo;
}

/**
 * Computes comparative limit items for key criteria pollutants (PM2.5, PM10, Ozone).
 * @param pollutants - Measurement dictionary
 * @param isStation - Whether primary source is ground station
 * @returns List of computed pollutant limit items
 */
export function calculatePollutantLimitItems(
  pollutants: Record<PollutantKey, PollutantMeasurement> | undefined,
  isStation: boolean
): PollutantLimitItem[] {
  if (!pollutants) return [];
  const keys: PollutantKey[] = ['pm2_5', 'pm10', 'ozone'];

  return keys
    .map((key) => {
      const item = pollutants[key];
      const standard = CPCB_24H_LIMITS[key];
      const conc = item?.concentration;
      if (conc === null || conc === undefined) return null;
      const ratio = conc / standard.limit;
      const pct = Math.min(100, Math.round(ratio * 100));
      const barColor = getBarColor(ratio);
      const isItemStation = isStation && Boolean(item.isStationMeasurement);
      const badge = getStatusBadge(ratio);
      return {
        key,
        formula: standard.formula,
        fullName: standard.fullName,
        conc,
        unit: standard.unit,
        limit: standard.limit,
        ratio,
        pct,
        barColor,
        isItemStation,
        badge,
      };
    })
    .filter((item): item is PollutantLimitItem => item !== null);
}

export interface SvgChartDimensions {
  readonly svgWidth: number;
  readonly svgHeight: number;
  readonly paddingLeft: number;
  readonly paddingRight: number;
  readonly paddingTop: number;
  readonly paddingBottom: number;
}

export const DEFAULT_CHART_DIMENSIONS: SvgChartDimensions = {
  svgWidth: 540,
  svgHeight: 150,
  paddingLeft: 32,
  paddingRight: 24,
  paddingTop: 20,
  paddingBottom: 26,
};

export interface ThresholdGuide {
  readonly value: number;
  readonly label: string;
  readonly color: string;
}

export interface TrendChartGeometry {
  readonly points: readonly HistoricalAirshedPoint[];
  readonly hasTrend: boolean;
  readonly currentAqi: number;
  readonly avgAqi: number;
  readonly minAqiPoint: HistoricalAirshedPoint | null;
  readonly maxAqiPoint: HistoricalAirshedPoint | null;
  readonly pctDiffFromAvg: number;
  readonly maxPlotScale: number;
  readonly linePoints: string;
  readonly areaPoints: string;
  readonly thresholdGuides: ThresholdGuide[];
  readonly getX: (index: number) => number;
  readonly getY: (val: number) => number;
}

/**
 * Derives pure SVG geometry, coordinates, and statistics for the historical trend spline chart.
 * @param trend - Historical airshed trend points
 * @param providerAqi - Fallback current AQI
 * @param dimensions - SVG viewbox and padding specifications
 * @returns Fully computed geometry and point projection functions
 */
export function computeTrendGeometry(
  trend: readonly HistoricalAirshedPoint[] | undefined,
  providerAqi: number | null | undefined,
  dimensions: SvgChartDimensions = DEFAULT_CHART_DIMENSIONS
): TrendChartGeometry {
  const { svgWidth, svgHeight, paddingLeft, paddingRight, paddingTop, paddingBottom } = dimensions;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const points: readonly HistoricalAirshedPoint[] = trend && trend.length > 0 ? trend.slice(-7) : [];
  const hasTrend = points.length > 0;

  const currentAqi = points.length > 0 ? points[points.length - 1].aqi : (providerAqi ?? 100);
  const avgAqi = hasTrend ? Math.round(points.reduce((acc, p) => acc + p.aqi, 0) / points.length) : currentAqi;
  const minAqiPoint = hasTrend
    ? points.reduce((prev, curr) => (curr.aqi < prev.aqi ? curr : prev), points[0])
    : null;
  const maxAqiPoint = hasTrend
    ? points.reduce((prev, curr) => (curr.aqi > prev.aqi ? curr : prev), points[0])
    : null;

  const pctDiffFromAvg = avgAqi > 0 ? Math.round(((currentAqi - avgAqi) / avgAqi) * 100) : 0;
  const maxPlotScale = hasTrend ? Math.max(...points.map((p) => p.aqi), 220) * 1.1 : 250;

  const getXCoord = (index: number) => paddingLeft + (index / Math.max(1, points.length - 1)) * plotWidth;
  const getYCoord = (val: number) => {
    const ratio = Math.min(1, Math.max(0, val / maxPlotScale));
    return svgHeight - paddingBottom - ratio * plotHeight;
  };

  const linePoints = hasTrend ? points.map((p, i) => `${getXCoord(i).toFixed(1)},${getYCoord(p.aqi).toFixed(1)}`).join(' ') : '';
  const areaPoints = hasTrend
    ? `${getXCoord(0).toFixed(1)},${(svgHeight - paddingBottom).toFixed(1)} ${linePoints} ${getXCoord(points.length - 1).toFixed(1)},${(svgHeight - paddingBottom).toFixed(1)}`
    : '';

  const thresholdGuides: ThresholdGuide[] = [
    { value: 50, label: '50 Safe', color: '#10b981' },
    { value: 100, label: '100 Mod', color: '#f59e0b' },
    { value: 200, label: '200 Poor', color: '#f97316' },
  ].filter((t) => t.value <= maxPlotScale);

  return {
    points,
    hasTrend,
    currentAqi,
    avgAqi,
    minAqiPoint,
    maxAqiPoint,
    pctDiffFromAvg,
    maxPlotScale,
    linePoints,
    areaPoints,
    thresholdGuides,
    getX: getXCoord,
    getY: getYCoord,
  };
}
