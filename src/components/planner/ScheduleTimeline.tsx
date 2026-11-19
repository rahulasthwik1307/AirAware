'use client';

import React, { useState, useId } from 'react';
import { ForecastPoint } from '@/domain/types';
import { MemberScheduleItem, HouseholdMember } from '@/domain/household/types';
import { ActiveActionItem } from '@/domain/planner/types';

export interface ScheduledActivityRef {
  readonly schedule: MemberScheduleItem;
  readonly memberNickname: string;
}

export interface ScheduleTimelineProps {
  readonly memberNickname?: string;
  readonly members?: readonly HouseholdMember[];
  readonly activeViewFilter?: string;
  readonly schedules: readonly ScheduledActivityRef[];
  readonly forecast: readonly ForecastPoint[];
  readonly activePlanActions?: readonly ActiveActionItem[];
  readonly onSelectMember?: (memberId: string) => void;
  readonly onAddActivityClick?: (memberId?: string) => void;
}

function parseMinutes(timeStr: string): number {
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  return h * 60 + m;
}

function parseHour(timeStr: string): number {
  const [h] = timeStr.split(':');
  return parseInt(h, 10) || 0;
}

function formatMinutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

interface DiurnalPeriodSummary {
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

interface SelectedActivityDetail {
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

const ARCHETYPE_ICONS: Record<string, string> = {
  CHILD_STUDENT: '🎒',
  WORKING_COMMUTER: '💼',
  SENIOR_VULNERABLE: '🧓',
  OUTDOOR_ENTHUSIAST: '🏃',
};

const ARCHETYPE_COLORS: Record<
  string,
  { laneBadge: string; blockBg: string; blockBorder: string; blockText: string }
> = {
  CHILD_STUDENT: {
    laneBadge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
    blockBg: 'bg-sky-50 dark:bg-sky-950/40',
    blockBorder: 'border-sky-300 dark:border-sky-700',
    blockText: 'text-sky-900 dark:text-sky-100',
  },
  WORKING_COMMUTER: {
    laneBadge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    blockBg: 'bg-amber-50 dark:bg-amber-950/40',
    blockBorder: 'border-amber-300 dark:border-amber-700',
    blockText: 'text-amber-900 dark:text-amber-100',
  },
  SENIOR_VULNERABLE: {
    laneBadge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
    blockBg: 'bg-purple-50 dark:bg-purple-950/40',
    blockBorder: 'border-purple-300 dark:border-purple-700',
    blockText: 'text-purple-900 dark:text-purple-100',
  },
  OUTDOOR_ENTHUSIAST: {
    laneBadge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    blockBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    blockBorder: 'border-emerald-300 dark:border-emerald-700',
    blockText: 'text-emerald-900 dark:text-emerald-100',
  },
};

const ACTIVITY_ICONS: Record<string, string> = {
  OUTDOOR_EXERCISE: '🏃',
  COMMUTE: '💼',
  SCHOOL_TRAVEL: '🎒',
  VENTILATION: '🪟',
  INDOOR_CHORE: '🧹',
  ERRAND: '🛒',
};

export function ScheduleTimeline({
  memberNickname,
  members = [],
  activeViewFilter = 'ALL_FAMILY',
  schedules,
  forecast,
  activePlanActions = [],
  onSelectMember,
  onAddActivityClick,
}: ScheduleTimelineProps) {
  const dialogId = useId();
  const [activeDetail, setActiveDetail] = useState<SelectedActivityDetail | null>(null);

  // If no forecast data, show graceful fallback
  if (!forecast || forecast.length === 0) {
    return (
      <section
        aria-labelledby="timeline-heading"
        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 text-center text-xs text-[var(--ink-muted)] space-y-1"
      >
        <h2 id="timeline-heading" className="font-bold text-[var(--ink-primary)] font-sans">
          Family-Wide Visual Daily Timeline
        </h2>
        <p>Hourly environmental forecast is currently unavailable for this location.</p>
      </section>
    );
  }

  // 24-hour CAMS forecast array
  const validPoints = forecast.slice(0, 24);
  const pm25Values = validPoints
    .map((p) => p.pm25)
    .filter((v): v is number => v !== null && v !== undefined && Number.isFinite(v));

  const maxPm25 = pm25Values.length > 0 ? Math.max(...pm25Values) : 100;
  const minPm25 = pm25Values.length > 0 ? Math.min(...pm25Values) : 0;
  const pm25Range = Math.max(1, maxPm25 - minPm25);

  // Determine displayed members based on view filter
  const targetMembers: readonly HouseholdMember[] =
    activeViewFilter !== 'ALL_FAMILY'
      ? members.filter((m) => m.id === activeViewFilter)
      : members.length > 0
      ? members
      : [
          {
            id: 'default-all',
            nickname: memberNickname || 'Family Member',
            archetype: 'CHILD_STUDENT',
            sensitivityTier: 'NONE',
            schedules: schedules.map((s) => s.schedule),
            createdAt: new Date().toISOString(),
          },
        ];

  // Compute 4-Period Diurnal Summaries for Mobile View (< 768px)
  const periodConfigs = [
    { label: 'Morning', timeRange: '06:00 – 10:00', startHour: 6, endHour: 9 },
    { label: 'Midday', timeRange: '10:00 – 14:00', startHour: 10, endHour: 13 },
    { label: 'Afternoon', timeRange: '14:00 – 18:00', startHour: 14, endHour: 17 },
    { label: 'Evening / Night', timeRange: '18:00 – 22:00', startHour: 18, endHour: 21 },
  ];

  const periods: DiurnalPeriodSummary[] = periodConfigs.map((cfg) => {
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

  const timeTicks = [0, 3, 6, 9, 12, 15, 18, 21, 24];

  return (
    <section aria-labelledby="timeline-heading" className="space-y-3">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h2
            id="timeline-heading"
            className="text-base font-bold text-[var(--ink-primary)] font-sans flex items-center gap-2"
          >
            <span>Family-Wide Visual Daily Timeline</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-subtle)] text-[var(--ink-muted)] border border-[var(--border-subtle)]">
              {activeViewFilter !== 'ALL_FAMILY' ? `${memberNickname}'s Track` : 'Whole Family Tracks'}
            </span>
          </h2>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Synchronized 24-hour diurnal forecast gradient with individual member routine tracks. Background bands reflect actual Copernicus CAMS PM₂.₅ forecast values.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-[11px] text-[var(--ink-muted)]">
          <span>Copernicus CAMS PM₂.₅ (μg/m³)</span>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 sm:p-5 shadow-xs space-y-4">
        {/* ============================================================ */}
        {/* MOBILE VIEW (< 768px): 4-Period Diurnal Summary Cards         */}
        {/* Prevents horizontal overflow while preserving clear metrics   */}
        {/* ============================================================ */}
        <div className="block md:hidden space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[var(--ink-secondary)]">
              Diurnal Forecast Periods (Mobile Summary):
            </p>
            <span className="text-[10px] font-mono text-[var(--ink-muted)]">No horizontal scroll</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {periods.map((period) => (
              <div
                key={period.label}
                className={`p-3.5 rounded-xl border ${period.colorClass} space-y-2 transition-all`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-sans flex items-center gap-1.5">
                    <span>{period.label}</span>
                  </span>
                  <span className="text-[10px] font-mono opacity-80">{period.timeRange}</span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-base font-bold font-mono">
                      {period.averagePm25 !== null ? `${period.averagePm25} μg/m³` : '—'}
                    </span>
                    <span className="text-[10px] font-mono opacity-70 ml-1">avg</span>
                  </div>
                  <span className="text-[10px] font-semibold">{period.severityLabel}</span>
                </div>

                {period.peakPm25 !== null && period.peakHour !== null && (
                  <p className="text-[10px] font-mono text-[var(--ink-muted)]">
                    Peak: ~{period.peakPm25} μg/m³ around {period.peakHour.toString().padStart(2, '0')}:00
                  </p>
                )}

                <p className="text-[10px] text-[var(--ink-muted)] font-mono border-t border-black/5 dark:border-white/5 pt-1.5">
                  {period.activityCount > 0
                    ? `${period.activityCount} family ${period.activityCount === 1 ? 'activity' : 'activities'} scheduled`
                    : 'No activities scheduled'}
                </p>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-[var(--ink-muted)] italic font-mono pt-1">
            Note: Period values reflect arithmetic averages of available 1-hour CAMS model points.
          </p>
        </div>

        {/* ============================================================ */}
        {/* DESKTOP & TABLET VIEW (>= 768px): Unified Swimlane Canvas   */}
        {/* 24-hour horizontal axis + Forecast Heatmap + Member Tracks   */}
        {/* ============================================================ */}
        <div className="hidden md:block space-y-3">
          {/* Timeline Container */}
          <div className="relative rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] overflow-hidden">
            {/* Top: 24-Hour Time Axis Header */}
            <div className="flex items-center border-b border-[var(--border-subtle)] bg-[var(--surface-card)]">
              {/* Member Column Header Spacer */}
              <div className="w-44 shrink-0 px-3 py-2 border-r border-[var(--border-subtle)]">
                <span className="text-[11px] font-mono font-bold text-[var(--ink-secondary)]">
                  Family Member
                </span>
              </div>

              {/* 24h Axis Labels (00:00 to 24:00) */}
              <div className="flex-1 relative h-7">
                {timeTicks.map((hour) => {
                  const leftPercent = (hour / 24) * 100;
                  return (
                    <div
                      key={hour}
                      className="absolute top-0 bottom-0 flex flex-col justify-between -translate-x-1/2"
                      style={{ left: `${leftPercent}%` }}
                    >
                      <span className="text-[10px] font-mono text-[var(--ink-muted)] select-none pt-1">
                        {hour.toString().padStart(2, '0')}:00
                      </span>
                      <div className="w-px h-1.5 bg-[var(--border-strong)] mx-auto" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Forecast Intensity Gradient Strip */}
            <div className="flex items-center border-b border-[var(--border-subtle)] bg-[var(--surface-card)]/50">
              <div className="w-44 shrink-0 px-3 py-1 border-r border-[var(--border-subtle)]">
                <span className="text-[10px] font-mono text-[var(--ink-muted)]">
                  Hourly Forecast (PM₂.₅)
                </span>
              </div>

              <div className="flex-1 relative h-6 flex">
                {validPoints.map((point, index) => {
                  const pm25 = point.pm25 ?? 0;
                  // Dynamic relative intensity from 0 to 1 across the day's forecast cycle
                  const normalizedIntensity = (pm25 - minPm25) / pm25Range;
                  const isHigh = normalizedIntensity >= 0.7 || pm25 > 90;
                  const isLow = normalizedIntensity <= 0.3 && pm25 <= 60;

                  return (
                    <div
                      key={point.time || index}
                      className={`flex-1 h-full border-r border-black/5 dark:border-white/5 flex items-center justify-center text-[9px] font-mono transition-colors group relative cursor-help ${
                        isHigh
                          ? 'bg-amber-500/25 text-amber-900 dark:text-amber-200'
                          : isLow
                          ? 'bg-emerald-500/25 text-emerald-900 dark:text-emerald-200'
                          : 'bg-slate-500/10 text-[var(--ink-muted)]'
                      }`}
                      title={`${index.toString().padStart(2, '0')}:00 — ${pm25} μg/m³ PM₂.₅`}
                    >
                      <span className="select-none scale-90 opacity-70">
                        {Math.round(pm25)}
                      </span>
                      {/* Tooltip on Hover */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                        <div className="rounded-lg bg-[var(--ink-primary)] text-white text-[10px] font-mono px-2 py-1 shadow-md whitespace-nowrap">
                          {index.toString().padStart(2, '0')}:00 • {pm25} μg/m³ PM₂.₅
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Swimlanes for Each Household Member */}
            <div className="divide-y divide-[var(--border-subtle)]">
              {targetMembers.map((member) => {
                const colors =
                  ARCHETYPE_COLORS[member.archetype] || ARCHETYPE_COLORS.CHILD_STUDENT;
                const icon = ARCHETYPE_ICONS[member.archetype] || '👤';

                return (
                  <div
                    key={member.id}
                    className="flex items-stretch min-h-[68px] sm:min-h-[72px] hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors"
                  >
                    {/* Left Member Identity Lane Header */}
                    <div className="w-44 shrink-0 p-3 border-r border-[var(--border-subtle)] bg-[var(--surface-card)] flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm select-none" aria-hidden="true">
                          {icon}
                        </span>
                        <span className="text-xs font-bold text-[var(--ink-primary)] truncate">
                          {member.nickname}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${colors.laneBadge}`}
                        >
                          {member.archetype.replace('_', ' ').toLowerCase()}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--ink-muted)]">
                          ({member.schedules.length})
                        </span>
                      </div>
                    </div>

                    {/* Right Timeline Canvas with Positioned Activity Blocks */}
                    <div className="flex-1 relative h-auto min-h-[68px] sm:min-h-[72px] p-1.5">
                      {/* Vertical Hour Grid Lines for Spatial Alignment */}
                      {timeTicks.map((hour) => {
                        const leftPercent = (hour / 24) * 100;
                        return (
                          <div
                            key={hour}
                            className="absolute top-0 bottom-0 w-px bg-black/[0.04] dark:bg-white/[0.04] pointer-events-none"
                            style={{ left: `${leftPercent}%` }}
                          />
                        );
                      })}

                      {/* Render Member Scheduled Activity Blocks */}
                      {member.schedules.length === 0 ? (
                        <div className="h-full flex items-center justify-start pl-3 text-[11px] text-[var(--ink-muted)] italic font-mono">
                          <span>No routine scheduled</span>
                          {onAddActivityClick && (
                            <button
                              type="button"
                              onClick={() => onAddActivityClick(member.id)}
                              className="ml-2 text-[10px] text-[var(--brand-primary)] hover:underline font-bold not-italic cursor-pointer"
                            >
                              + Add Activity
                            </button>
                          )}
                        </div>
                      ) : (
                        member.schedules.map((schedule) => {
                          const startMinutes = parseMinutes(schedule.startTime);
                          const duration = schedule.durationMinutes || 45;
                          const endMinutes = startMinutes + duration;

                          // Check if recommendation was adopted for this activity
                          const adoptedAction = activePlanActions.find(
                            (a) =>
                              a.memberId === member.id &&
                              a.title.toLowerCase().includes(schedule.activityName.toLowerCase())
                          );

                          const isShifted = Boolean(adoptedAction?.adjustedWindow);
                          const displayStart = isShifted && adoptedAction?.adjustedWindow
                            ? adoptedAction.adjustedWindow.startTime
                            : schedule.startTime;
                          const displayEnd = isShifted && adoptedAction?.adjustedWindow
                            ? adoptedAction.adjustedWindow.endTime
                            : formatMinutesToTime(endMinutes);

                          // Position block based on display time
                          const effectiveStartMinutes = isShifted
                            ? parseMinutes(displayStart)
                            : startMinutes;
                          const leftPercent = (effectiveStartMinutes / 1440) * 100;
                          // Keep block nicely positioned within the 24h timeline canvas
                          const clampedLeftPercent = Math.min(leftPercent, 83);

                          // Forecast at that hour
                          const hourIndex = Math.floor(effectiveStartMinutes / 60);
                          const forecastPm25 = validPoints[hourIndex]?.pm25 ?? null;
                          const isHighForecast = forecastPm25 !== null && forecastPm25 > 55;

                          const actIcon =
                            ACTIVITY_ICONS[schedule.activityType] || '⏰';

                          return (
                            <div
                              key={schedule.id}
                              className={`absolute top-2 bottom-2 rounded-xl border-2 px-2.5 py-1.5 shadow-xs cursor-pointer transition-all flex flex-col justify-between group hover:scale-[1.02] hover:shadow-md hover:z-20 min-w-[130px] sm:min-w-[145px] max-w-[220px] w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
                                isShifted
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500/30'
                                  : isHighForecast
                                  ? `${colors.blockBg} border-amber-400 dark:border-amber-600 ${colors.blockText}`
                                  : `${colors.blockBg} ${colors.blockBorder} ${colors.blockText}`
                              }`}
                              style={{
                                left: `${clampedLeftPercent}%`,
                              }}
                              role="button"
                              tabIndex={0}
                              aria-haspopup="dialog"
                              aria-label={`${member.nickname}: ${schedule.activityName}, scheduled ${displayStart} to ${displayEnd}${
                                isShifted ? ', Shifted window adopted' : ''
                              }`}
                              onClick={() =>
                                setActiveDetail({
                                  memberNickname: member.nickname,
                                  schedule,
                                  adoptedAction,
                                  forecastPm25,
                                  originalStart: schedule.startTime,
                                  originalEnd: formatMinutesToTime(endMinutes),
                                  displayStart,
                                  displayEnd,
                                  isShifted,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setActiveDetail({
                                    memberNickname: member.nickname,
                                    schedule,
                                    adoptedAction,
                                    forecastPm25,
                                    originalStart: schedule.startTime,
                                    originalEnd: formatMinutesToTime(endMinutes),
                                    displayStart,
                                    displayEnd,
                                    isShifted,
                                  });
                                }
                              }}
                            >
                              <div className="flex items-center gap-1.5 whitespace-nowrap min-w-0">
                                <span className="text-xs select-none shrink-0" aria-hidden="true">
                                  {actIcon}
                                </span>
                                <span className="text-xs font-bold whitespace-nowrap leading-tight">
                                  {schedule.activityName}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-1.5 text-[10px] font-mono leading-none mt-1 opacity-90 whitespace-nowrap">
                                <span>{displayStart}</span>
                                {isShifted ? (
                                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-300 ml-1">
                                    ✓ Shifted
                                  </span>
                                ) : isHighForecast ? (
                                  <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold ml-1">
                                    ⚠️ Smog
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-[var(--ink-muted)] opacity-80 ml-1">
                                    {schedule.durationMinutes}m
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Dynamic Intensity & Status Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--ink-muted)] pt-1 font-mono">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-500/30 border border-emerald-500/50" aria-hidden="true" />
                <span>Lower Forecast Pollution Window (≤30 μg/m³)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-slate-500/20 border border-slate-500/40" aria-hidden="true" />
                <span>Moderate Concentration Period</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-amber-500/30 border border-amber-500/50" aria-hidden="true" />
                <span>Higher Forecast Pollution Period (&gt;55 μg/m³)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-100 dark:bg-emerald-950 border border-emerald-500" aria-hidden="true" />
                <span>Adopted Routine Shift</span>
              </span>
            </div>
            <span className="text-[11px] text-[var(--ink-muted)]">
              {schedules.length} total scheduled items aligned with 24h diurnal forecast
            </span>
          </div>
        </div>
      </div>

      {/* ACCESSIBLE ACTIVITY DETAIL MODAL */}
      {activeDetail && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${dialogId}-title`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 animate-fadeIn"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setActiveDetail(null);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-base select-none" aria-hidden="true">
                  {ACTIVITY_ICONS[activeDetail.schedule.activityType] || '⏰'}
                </span>
                <div>
                  <h3 id={`${dialogId}-title`} className="text-sm font-bold text-[var(--ink-primary)] font-sans">
                    {activeDetail.schedule.activityName}
                  </h3>
                  <p className="text-[10px] font-mono text-[var(--ink-muted)]">
                    For {activeDetail.memberNickname}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDetail(null)}
                className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] text-sm p-1 rounded-lg cursor-pointer"
                aria-label="Close activity details"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded-lg bg-[var(--surface-subtle)] font-mono">
                <span className="text-[var(--ink-muted)]">Scheduled Window:</span>
                <span className="font-bold text-[var(--ink-primary)]">
                  {activeDetail.displayStart} – {activeDetail.displayEnd} ({activeDetail.schedule.durationMinutes} min)
                </span>
              </div>

              {activeDetail.isShifted && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <p className="font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                    <span>✓ Adopted Routine Shift</span>
                  </p>
                  <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300">
                    Originally: {activeDetail.originalStart} ➔ Shifted to: {activeDetail.displayStart}
                  </p>
                  {activeDetail.adoptedAction?.deltaCValue && (
                    <div className="pt-1 text-[10px] text-emerald-900 dark:text-emerald-100 font-mono space-y-0.5">
                      <p>
                        +{activeDetail.adoptedAction.deltaCValue} μg/m³ Modelled ambient concentration difference (ΔC)
                      </p>
                      <p className="text-[9px] text-[var(--ink-muted)] italic font-sans">
                        Represents modelled outdoor air concentration difference, not personal inhaled dose.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between p-2 rounded-lg bg-[var(--surface-subtle)] font-mono">
                <span className="text-[var(--ink-muted)]">Forecast PM₂.₅ at Hour:</span>
                <span className="font-bold text-[var(--ink-primary)]">
                  {activeDetail.forecastPm25 !== null ? `${activeDetail.forecastPm25} μg/m³` : 'Data not reported'}
                </span>
              </div>

              <div className="flex justify-between p-2 rounded-lg bg-[var(--surface-subtle)] text-[11px]">
                <span className="text-[var(--ink-muted)] font-mono">Activity Category:</span>
                <span className="font-semibold text-[var(--ink-primary)] capitalize">
                  {activeDetail.schedule.activityType.toLowerCase().replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] flex justify-end">
              <button
                type="button"
                onClick={() => setActiveDetail(null)}
                className="px-3 py-1.5 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-xs font-mono font-medium text-[var(--ink-primary)] border border-[var(--border-subtle)] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
