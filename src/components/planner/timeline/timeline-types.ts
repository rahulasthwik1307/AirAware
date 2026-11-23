import { MemberScheduleItem } from '@/domain/household/types';
import { ActiveActionItem } from '@/domain/planner/types';

export interface ScheduledActivityRef {
  readonly schedule: MemberScheduleItem;
  readonly memberNickname: string;
}

export interface DiurnalPeriodSummary {
  readonly label: string;
  readonly timeRange: string;
  readonly startHour: number;
  readonly endHour: number;
  readonly averagePm25: number | null;
  readonly peakPm25: number | null;
  readonly peakHour: number | null;
  readonly activityCount: number;
  readonly severityLabel: string;
  readonly colorClass: string;
}

export interface SelectedActivityDetail {
  readonly memberNickname: string;
  readonly schedule: MemberScheduleItem;
  readonly adoptedAction?: ActiveActionItem;
  readonly forecastPm25: number | null;
  readonly originalStart: string;
  readonly originalEnd: string;
  readonly displayStart: string;
  readonly displayEnd: string;
  readonly isShifted: boolean;
}

export const ARCHETYPE_ICONS: Record<string, string> = {
  CHILD_STUDENT: '🎒',
  WORKING_COMMUTER: '💼',
  SENIOR_VULNERABLE: '🧓',
  OUTDOOR_ENTHUSIAST: '🏃',
};

export const ARCHETYPE_COLORS: Record<
  string,
  { laneBadge: string; blockBg: string; blockBorder: string; blockText: string; accentColor: string }
> = {
  CHILD_STUDENT: {
    laneBadge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
    blockBg: 'bg-sky-50/90 dark:bg-sky-950/60',
    blockBorder: 'border-sky-400 dark:border-sky-600',
    blockText: 'text-sky-950 dark:text-sky-100',
    accentColor: '#0284c7',
  },
  WORKING_COMMUTER: {
    laneBadge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    blockBg: 'bg-amber-50/90 dark:bg-amber-950/60',
    blockBorder: 'border-amber-400 dark:border-amber-600',
    blockText: 'text-amber-950 dark:text-amber-100',
    accentColor: '#92400e',
  },
  SENIOR_VULNERABLE: {
    laneBadge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
    blockBg: 'bg-purple-50/90 dark:bg-purple-950/60',
    blockBorder: 'border-purple-400 dark:border-purple-600',
    blockText: 'text-purple-950 dark:text-purple-100',
    accentColor: '#7c3aed',
  },
  OUTDOOR_ENTHUSIAST: {
    laneBadge: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
    blockBg: 'bg-teal-50/90 dark:bg-teal-950/60',
    blockBorder: 'border-teal-400 dark:border-teal-600',
    blockText: 'text-teal-950 dark:text-teal-100',
    accentColor: '#0d9488',
  },
};

export const ACTIVITY_STYLE_MAP: Record<
  string,
  { blockBg: string; blockBorder: string; blockText: string }
> = {
  OUTDOOR_EXERCISE: {
    blockBg: 'bg-rose-50/95 dark:bg-rose-950/70',
    blockBorder: 'border-rose-400 dark:border-rose-600',
    blockText: 'text-rose-950 dark:text-rose-100',
  },
  COMMUTE: {
    blockBg: 'bg-amber-50/95 dark:bg-amber-950/70',
    blockBorder: 'border-amber-400 dark:border-amber-600',
    blockText: 'text-amber-950 dark:text-amber-100',
  },
  SCHOOL_TRAVEL: {
    blockBg: 'bg-sky-50/95 dark:bg-sky-950/70',
    blockBorder: 'border-sky-400 dark:border-sky-600',
    blockText: 'text-sky-950 dark:text-sky-100',
  },
  VENTILATION: {
    blockBg: 'bg-teal-50/95 dark:bg-teal-950/70',
    blockBorder: 'border-teal-400 dark:border-teal-600',
    blockText: 'text-teal-950 dark:text-teal-100',
  },
  ERRAND: {
    blockBg: 'bg-indigo-50/95 dark:bg-indigo-950/70',
    blockBorder: 'border-indigo-400 dark:border-indigo-600',
    blockText: 'text-indigo-950 dark:text-indigo-100',
  },
  INDOOR_CHORE: {
    blockBg: 'bg-slate-50/95 dark:bg-slate-900/70',
    blockBorder: 'border-slate-400 dark:border-slate-600',
    blockText: 'text-slate-950 dark:text-slate-100',
  },
};

export const ACTIVITY_ICONS: Record<string, string> = {
  OUTDOOR_EXERCISE: '🏃',
  COMMUTE: '💼',
  SCHOOL_TRAVEL: '🎒',
  VENTILATION: '🪟',
  INDOOR_CHORE: '🧹',
  ERRAND: '🛒',
};
