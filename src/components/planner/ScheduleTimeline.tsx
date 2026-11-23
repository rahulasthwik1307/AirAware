'use client';

import { useState, useId } from 'react';
import { ForecastPoint } from '@/domain/types';
import { HouseholdMember } from '@/domain/household/types';
import { ActiveActionItem } from '@/domain/planner/types';
import {
  ScheduledActivityRef,
  SelectedActivityDetail,
  ARCHETYPE_ICONS,
  ARCHETYPE_COLORS,
  ACTIVITY_STYLE_MAP,
  ACTIVITY_ICONS,
} from './timeline/timeline-types';
import {
  parseMinutes,
  parseHour,
  formatMinutesToTime,
  computeDiurnalPeriods,
} from './timeline/timeline-utils';
import { ActivityDetailModal } from './timeline/ActivityDetailModal';
import { DiurnalPeriodSummaryCards } from './timeline/DiurnalPeriodSummaryCards';
import { TimelineAxisHeader } from './timeline/TimelineAxisHeader';

export type { ScheduledActivityRef };

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

export function ScheduleTimeline({
  memberNickname,
  members = [],
  activeViewFilter = 'ALL_FAMILY',
  schedules,
  forecast,
  activePlanActions = [],
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

  const periods = computeDiurnalPeriods(validPoints, schedules);

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
        {/* MOBILE VIEW (< 768px): 4-Period Diurnal Summary Cards */}
        <DiurnalPeriodSummaryCards periods={periods} />

        {/* DESKTOP & TABLET VIEW (>= 768px): Unified Swimlane Canvas */}
        <div className="hidden md:block space-y-3">
          <div className="relative rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] overflow-hidden shadow-xs">
            <TimelineAxisHeader
              validPoints={validPoints}
              minPm25={minPm25}
              pm25Range={pm25Range}
            />

            {/* Swimlanes for Each Household Member */}
            <div className="divide-y divide-[var(--border-subtle)]">
              {targetMembers.map((member) => {
                const colors = ARCHETYPE_COLORS[member.archetype] || ARCHETYPE_COLORS.CHILD_STUDENT;
                const icon = ARCHETYPE_ICONS[member.archetype] || '👤';

                return (
                  <div key={member.id} className="flex items-stretch min-h-[72px] bg-[var(--surface-card)]">
                    <div className="w-48 shrink-0 p-3 border-r border-[var(--border-subtle)] bg-[var(--surface-subtle)]/40 flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <span className="text-base select-none" aria-hidden="true">{icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--ink-primary)] truncate font-sans">
                            {member.nickname}
                          </p>
                          <span className={`inline-block text-[9px] font-mono px-1.5 py-0.2 rounded border ${colors.laneBadge}`}>
                            {member.schedules.length} {member.schedules.length === 1 ? 'routine' : 'routines'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 relative h-full min-h-[72px] bg-slate-50/50 dark:bg-slate-900/20">
                      {member.schedules.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-[11px] font-mono text-[var(--ink-muted)] italic">
                          No routine activities registered
                        </div>
                      ) : (
                        member.schedules.map((schedule) => {
                          const startMinutes = parseMinutes(schedule.startTime);
                          const duration = schedule.durationMinutes || 45;
                          const endMinutes = startMinutes + duration;

                          const adoptedAction = activePlanActions.find(
                            (a) => a.scheduleId === schedule.id && a.status === 'ADOPTED'
                          );
                          const isShifted = Boolean(adoptedAction?.adjustedWindow?.startTime);

                          let effectiveStartMin = startMinutes;
                          if (isShifted && adoptedAction?.adjustedWindow?.startTime) {
                            effectiveStartMin = parseMinutes(adoptedAction.adjustedWindow.startTime);
                          }
                          const effectiveEndMin = effectiveStartMin + duration;

                          const leftPct = (effectiveStartMin / 1440) * 100;
                          const widthPct = Math.max(2.5, (duration / 1440) * 100);

                          const actStyle =
                            ACTIVITY_STYLE_MAP[schedule.activityType] || ACTIVITY_STYLE_MAP.COMMUTE;
                          const actIcon = ACTIVITY_ICONS[schedule.activityType] || '⏰';

                          const startHour = Math.floor(effectiveStartMin / 60);
                          const forecastPoint = validPoints[startHour];
                          const forecastPm25 = forecastPoint?.pm25 ?? null;
                          const isHighForecast = forecastPm25 !== null && forecastPm25 > 55;

                          const displayStart = formatMinutesToTime(effectiveStartMin);
                          const displayEnd = formatMinutesToTime(effectiveEndMin);

                          return (
                            <div
                              key={schedule.id}
                              tabIndex={0}
                              role="button"
                              aria-label={`Activity ${schedule.activityName} for ${member.nickname}, ${displayStart} to ${displayEnd}`}
                              onClick={() => {
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
                              }}
                              className={`absolute top-2 bottom-2 rounded-lg border p-1.5 shadow-2xs cursor-pointer transition-all hover:scale-102 hover:z-20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] overflow-hidden ${
                                isShifted
                                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500/30'
                                  : isHighForecast
                                  ? `${actStyle.blockBg} border-amber-500 ${actStyle.blockText} ring-1 ring-amber-500/30`
                                  : `${actStyle.blockBg} ${actStyle.blockBorder} ${actStyle.blockText}`
                              }`}
                              style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: '85px' }}
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
                                <span className="text-xs select-none shrink-0" aria-hidden="true">{actIcon}</span>
                                <span className="text-xs font-bold whitespace-nowrap tracking-tight">{schedule.activityName}</span>
                              </div>

                              <div className="flex items-center justify-between gap-1.5 text-[10px] font-mono leading-none mt-1 whitespace-nowrap">
                                <span className="font-semibold">{displayStart} – {displayEnd}</span>
                                {isShifted ? (
                                  <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 ml-1">✓ Shifted</span>
                                ) : isHighForecast ? (
                                  <span className="text-[9px] text-amber-700 dark:text-amber-400 font-bold ml-1">⚠️ Smog</span>
                                ) : (
                                  <span className="text-[9px] text-[var(--ink-muted)] opacity-85 ml-1">({duration}m)</span>
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
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--ink-muted)] pt-1.5 font-mono">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-500/30 border border-emerald-500/50" aria-hidden="true" />
                <span>Lower Forecast Window (≤30 μg/m³)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-slate-500/20 border border-slate-500/40" aria-hidden="true" />
                <span>Moderate Concentration</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-amber-500/30 border border-amber-500/50" aria-hidden="true" />
                <span>Higher Pollution Window (&gt;55 μg/m³)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-100 dark:bg-emerald-950 border border-emerald-500" aria-hidden="true" />
                <span>Adopted Routine Shift (Emerald)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-rose-100 dark:bg-rose-950 border border-rose-400" aria-hidden="true" />
                <span>Exercise / Sport</span>
              </span>
            </div>
            <span className="text-[11px] text-[var(--ink-muted)]">
              {schedules.length} total scheduled items aligned with 24h diurnal forecast
            </span>
          </div>
        </div>
      </div>

      {/* ACCESSIBLE ACTIVITY DETAIL MODAL */}
      <ActivityDetailModal
        activeDetail={activeDetail}
        dialogId={dialogId}
        onClose={() => setActiveDetail(null)}
      />
    </section>
  );
}
