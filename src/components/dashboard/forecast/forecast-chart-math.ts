import { AqiStandardKey, ForecastPoint } from '@/domain/types';

export function getSplinePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const prev = points[Math.max(0, i - 1)];
    const after = points[Math.min(points.length - 1, i + 2)];

    const cp1x = curr.x + (next.x - prev.x) / 6;
    const cp1y = curr.y + (next.y - prev.y) / 6;
    const cp2x = next.x - (after.x - curr.x) / 6;
    const cp2y = next.y - (after.y - curr.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
  }
  return d;
}

export function formatDataAge(timestampStr?: string): string {
  if (!timestampStr) return 'recent';
  try {
    const iso = timestampStr.includes('T') ? timestampStr : timestampStr.replace(' ', 'T');
    const time = new Date(iso).getTime();
    if (isNaN(time)) return 'recent';
    const diffMs = Date.now() - time;
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h ${diffMin % 60}m ago`;
  } catch {
    return 'recent';
  }
}

export interface SvgPoint {
  x: number;
  y: number;
  aqi: number | null;
  point: ForecastPoint;
  index: number;
}

export interface ThresholdLine {
  val: number;
  label: string;
  y: number;
  color: string;
}

export interface SvgChartData {
  points: SvgPoint[];
  splineD: string;
  areaD: string;
  thresholds: ThresholdLine[];
  maxScale: number;
  chartBottom: number;
}

export function computeSvgData(safeForecast: readonly ForecastPoint[], activeStandard: AqiStandardKey): SvgChartData {
  if (safeForecast.length === 0) {
    return {
      points: [],
      splineD: '',
      areaD: '',
      thresholds: [],
      maxScale: 100,
      chartBottom: 185,
    };
  }

  const isEaqi = activeStandard === 'EUROPEAN_EAQI';
  const rawValues = safeForecast.map((p) => p.activeAqi).filter((v): v is number => v !== null && Number.isFinite(v));
  const maxObserved = rawValues.length > 0 ? Math.max(...rawValues) : (isEaqi ? 6 : 100);

  const maxScale = isEaqi ? 6 : Math.max(150, Math.ceil((maxObserved * 1.18) / 50) * 50);

  const chartTop = 30;
  const chartBottom = 185;
  const chartHeight = chartBottom - chartTop;
  const leftPad = 48;
  const rightPad = 32;
  const chartWidth = 1000 - leftPad - rightPad;

  const points: SvgPoint[] = safeForecast.map((p, idx) => {
    const x = leftPad + (idx / Math.max(1, safeForecast.length - 1)) * chartWidth;
    let y = chartBottom;
    if (p.activeAqi !== null && Number.isFinite(p.activeAqi)) {
      const normalized = Math.min(1, Math.max(0, p.activeAqi / maxScale));
      y = chartBottom - normalized * chartHeight;
    }
    return { x, y, aqi: p.activeAqi, point: p, index: idx };
  });

  const splineD = getSplinePath(points);
  const areaD =
    points.length >= 2
      ? `${splineD} L ${points[points.length - 1].x.toFixed(1)} ${chartBottom} L ${points[0].x.toFixed(1)} ${chartBottom} Z`
      : '';

  const thresholds: ThresholdLine[] = [];
  if (!isEaqi) {
    const rawThresholds = [
      { val: 50, label: '50 Moderate', color: '#059669' },
      { val: 100, label: '100 USG', color: '#ca8a04' },
      { val: 150, label: '150 Unhealthy', color: '#ea580c' },
      { val: 200, label: '200 Very Unhealthy', color: '#dc2626' },
      { val: 300, label: '300 Hazardous', color: '#7f1d1d' },
    ];
    for (const t of rawThresholds) {
      if (t.val < maxScale) {
        const y = chartBottom - (t.val / maxScale) * chartHeight;
        thresholds.push({ ...t, y });
      }
    }
  }

  return { points, splineD, areaD, thresholds, maxScale, chartBottom };
}
