import { ForecastPoint } from '@/domain/types';
import { DiurnalPeriodSummary, ScheduledActivityRef } from './timeline-types';

export function parseMinutes(timeStr: string): number {
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  return h * 60 + m;
}

export function parseHour(timeStr: string): number {
  const [h] = timeStr.split(':');
  return parseInt(h, 10) || 0;
}

export function formatMinutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function computeDiurnalPeriods(
  validPoints: readonly ForecastPoint[],
  schedules: readonly ScheduledActivityRef[]
): DiurnalPeriodSummary[] {
  const periodConfigs = [
    { label: 'Morning', timeRange: '06:00 – 10:00', startHour: 6, endHour: 9 },
    { label: 'Midday', timeRange: '10:00 – 14:00', startHour: 10, endHour: 13 },
    { label: 'Afternoon', timeRange: '14:00 – 18:00', startHour: 14, endHour: 17 },
    { label: 'Evening / Night', timeRange: '18:00 – 22:00', startHour: 18, endHour: 21 },
  ];

  return periodConfigs.map((cfg) => {
    const periodPoints = validPoints.slice(cfg.startHour, cfg.endHour + 1);
    const values = periodPoints
      .map((p) => p.pm25)
      .filter((v): v is number => v !== null && v !== undefined && Number.isFinite(v));

    const averagePm25 =
      values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : null;

    let peakPm25: number | null = null;
    let peakHour: number | null = null;
    if (values.length > 0) {
      let maxVal = -1;
      periodPoints.forEach((pt, idx) => {
        if (pt.pm25 !== null && pt.pm25 !== undefined && pt.pm25 > maxVal) {
          maxVal = pt.pm25;
          peakPm25 = Math.round(pt.pm25 * 10) / 10;
          peakHour = cfg.startHour + idx;
        }
      });
    }

    const activityCount = schedules.filter(({ schedule }) => {
      const sHour = parseHour(schedule.startTime);
      return sHour >= cfg.startHour && sHour <= cfg.endHour;
    }).length;

    let severityLabel = 'Moderate Window';
    let colorClass = 'text-[var(--ink-primary)] bg-[var(--surface-subtle)] border-[var(--border-subtle)]';

    if (averagePm25 !== null) {
      if (averagePm25 > 55) {
        severityLabel = 'Higher Forecast Window';
        colorClass = 'text-amber-800 bg-amber-50 dark:text-amber-200 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
      } else if (averagePm25 <= 30) {
        severityLabel = 'Lower Forecast Window';
        colorClass = 'text-emerald-800 bg-emerald-50 dark:text-emerald-200 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
      }
    }

    return {
      label: cfg.label,
      timeRange: cfg.timeRange,
      startHour: cfg.startHour,
      endHour: cfg.endHour,
      averagePm25,
      peakPm25,
      peakHour,
      activityCount,
      severityLabel,
      colorClass,
    };
  });
}
