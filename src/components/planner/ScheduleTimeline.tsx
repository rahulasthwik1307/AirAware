'use client';

import React from 'react';
import { ForecastPoint } from '@/domain/types';
import { MemberScheduleItem } from '@/domain/household/types';

interface ScheduleTimelineProps {
  readonly memberNickname: string;
  readonly schedules: readonly MemberScheduleItem[];
  readonly forecast: readonly ForecastPoint[];
}

function parseHour(timeStr: string): number {
  const [h] = timeStr.split(':');
  return parseInt(h, 10) || 0;
}

export function ScheduleTimeline({
  memberNickname,
  schedules,
  forecast,
}: ScheduleTimelineProps) {
  // If no forecast data, show graceful fallback
  if (!forecast || forecast.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 text-center text-xs text-[var(--ink-muted)]">
        Forecast timeline currently unavailable for this location.
      </div>
    );
  }

  // Find max PM2.5 to scale bars proportionally
  const validPoints = forecast.slice(0, 24);
  const maxPm25 = Math.max(1, ...validPoints.map((p) => p.pm25 ?? 0));

  return (
    <section aria-labelledby="schedule-timeline-title" className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h2 id="schedule-timeline-title" className="text-sm font-bold text-[var(--ink-primary)] font-sans">
          Diurnal Forecast &amp; Activity Alignment ({memberNickname})
        </h2>
        <span className="text-[11px] text-[var(--ink-muted)] font-mono">
          Hourly PM2.5 (μg/m³) vs Scheduled Hours
        </span>
      </div>

      {/* Visual Diurnal Chart Container */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 sm:p-5 shadow-xs overflow-x-auto">
        <div className="min-w-[640px] space-y-4">
          {/* Hourly Forecast Bar Chart */}
          <div className="grid grid-cols-24 gap-1 items-end h-28 pt-4 border-b border-[var(--border-subtle)]">
            {validPoints.map((point, index) => {
              const hour = index;
              const pm25 = point.pm25 ?? 0;
              const heightPercent = Math.min(100, Math.max(10, Math.round((pm25 / maxPm25) * 100)));

              // Check if any schedule covers this hour
              const activeSchedules = schedules.filter((s) => {
                const sHour = parseHour(s.startTime);
                const sEndHour = sHour + Math.ceil(s.durationMinutes / 60);
                return hour >= sHour && hour < sEndHour;
              });

              const isScheduled = activeSchedules.length > 0;

              return (
                <div key={point.time || index} className="flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                    <div className="rounded bg-[var(--ink-primary)] text-white text-[10px] font-mono px-2 py-1 shadow-md whitespace-nowrap">
                      <span>{hour.toString().padStart(2, '0')}:00 • {pm25} μg/m³</span>
                      {isScheduled && (
                        <span className="block text-[9px] text-[var(--aqi-moderate-border)] font-sans">
                          Scheduled: {activeSchedules.map((s) => s.activityName).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hourly Bar */}
                  <div
                    className={`w-full rounded-t transition-all ${
                      isScheduled
                        ? 'bg-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/40 ring-offset-1'
                        : pm25 > 55
                        ? 'bg-[var(--aqi-unhealthy)]/70'
                        : pm25 > 30
                        ? 'bg-[var(--aqi-moderate)]/70'
                        : 'bg-[var(--aqi-good)]/60'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                    role="img"
                    aria-label={`${hour}:00, ${pm25} μg/m³ PM2.5${isScheduled ? ', Scheduled activity' : ''}`}
                  />
                  <span className="text-[9px] font-mono text-[var(--ink-muted)] mt-1.5 select-none">
                    {hour % 3 === 0 ? `${hour}h` : ''}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Member's Scheduled Activities Legend */}
          <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold text-[var(--ink-secondary)]">
              Scheduled Activities for Today ({schedules.length}):
            </p>
            {schedules.length === 0 ? (
              <p className="text-xs text-[var(--ink-muted)] italic">
                No activities scheduled yet for this member. Use the schedule editor below to add daily routines.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-primary)] shrink-0" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[var(--ink-primary)] truncate">
                        {schedule.activityName}
                      </p>
                      <p className="text-[10px] font-mono text-[var(--ink-muted)]">
                        {schedule.startTime} ({schedule.durationMinutes}m) • {schedule.activityType.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
