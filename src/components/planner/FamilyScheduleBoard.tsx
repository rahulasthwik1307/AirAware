'use client';

import React, { useState } from 'react';
import { ForecastPoint } from '@/domain/types';
import { HouseholdMember, HouseholdArchetype, MemberScheduleItem } from '@/domain/household/types';
import { PlannerRecommendation, ActiveActionItem } from '@/domain/planner/types';

interface FamilyScheduleBoardProps {
  readonly members: readonly HouseholdMember[];
  readonly activeViewFilter: string; // 'ALL_FAMILY' or memberId
  readonly forecast: readonly ForecastPoint[];
  readonly recommendations: readonly PlannerRecommendation[];
  readonly activePlanActions: readonly ActiveActionItem[];
  readonly onAdoptRecommendation: (rec: PlannerRecommendation) => void;
  readonly onAddActivityClick?: () => void;
}

const ARCHETYPE_ICONS: Record<HouseholdArchetype, string> = {
  CHILD_STUDENT: '🎒',
  WORKING_COMMUTER: '💼',
  SENIOR_VULNERABLE: '🌿',
  OUTDOOR_ENTHUSIAST: '🏃',
};

function parseHourFromTimeString(timeStr: string): number {
  const [h] = timeStr.split(':');
  const parsed = parseInt(h, 10);
  return Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(23, parsed));
}

function findForecastPointForHour(
  forecast: readonly ForecastPoint[],
  targetHour: number
): ForecastPoint | null {
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

export function FamilyScheduleBoard({
  members,
  activeViewFilter,
  forecast,
  recommendations,
  activePlanActions,
  onAdoptRecommendation,
  onAddActivityClick,
}: FamilyScheduleBoardProps) {
  const [expandedWhyId, setExpandedWhyId] = useState<string | null>(null);

  // Filter members based on activeViewFilter
  const filteredMembers =
    activeViewFilter === 'ALL_FAMILY'
      ? members
      : members.filter((m) => m.id === activeViewFilter);

  // Flatten and sort activities chronologically by startTime
  const allChronologicalActivities = filteredMembers.flatMap((member) =>
    member.schedules.map((schedule) => ({
      schedule,
      member,
    }))
  );

  allChronologicalActivities.sort((a, b) => {
    const timeA = a.schedule.startTime;
    const timeB = b.schedule.startTime;
    return timeA.localeCompare(timeB);
  });

  return (
    <section aria-labelledby="schedule-board-title" className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2
            id="schedule-board-title"
            className="text-base font-bold text-[var(--ink-primary)] font-sans flex items-center gap-2"
          >
            <span>Whole Family Chronological Schedule</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--surface-subtle)] text-[var(--ink-secondary)] font-mono font-medium border border-[var(--border-subtle)]">
              {allChronologicalActivities.length} {allChronologicalActivities.length === 1 ? 'activity' : 'activities'} today
            </span>
          </h2>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Combined daily routines sorted morning to evening, integrated with hourly air quality forecasts.
          </p>
        </div>

        {onAddActivityClick && (
          <button
            type="button"
            onClick={onAddActivityClick}
            className="px-3 py-1.5 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--ink-primary)] border border-[var(--border-subtle)] text-xs font-mono font-semibold transition-all cursor-pointer self-start sm:self-auto shadow-xs"
          >
            + Add Schedule Activity
          </button>
        )}
      </div>

      {/* Activities Timeline Stream */}
      {allChronologicalActivities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-card)] p-8 text-center space-y-2">
          <div className="text-3xl select-none" aria-hidden="true">
            🕒
          </div>
          <h3 className="text-sm font-bold text-[var(--ink-primary)] font-sans">
            No family activities scheduled for today
          </h3>
          <p className="text-xs text-[var(--ink-muted)] max-w-md mx-auto leading-relaxed">
            {members.length === 0
              ? 'Add household members above to begin scheduling daily school runs, commutes, exercise, and ventilation windows.'
              : 'Add activities to member profiles to match routines against hourly air quality models.'}
          </p>
          {onAddActivityClick && members.length > 0 && (
            <button
              type="button"
              onClick={onAddActivityClick}
              className="mt-2 px-4 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-mono font-bold transition-all shadow-xs cursor-pointer"
            >
              Add First Activity
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {allChronologicalActivities.map(({ schedule, member }) => {
            const hour = parseHourFromTimeString(schedule.startTime);
            const fp = findForecastPointForHour(forecast, hour);
            const pm25 = fp?.pm25;

            // Find matching recommendation for this activity
            const matchingRec = recommendations.find(
              (r) => r.scheduleId === schedule.id && r.memberId === member.id
            );

            // Find active adopted action for this schedule
            const adoptedAction = activePlanActions.find(
              (a) => a.scheduleId === schedule.id && a.memberId === member.id
            );

            const isAdopted = Boolean(adoptedAction);
            const isCompleted = adoptedAction?.status === 'COMPLETED';

            // Pollution severity classification for this hour
            const isHighSmog = pm25 !== null && pm25 !== undefined && pm25 > 55;
            const isModerateSmog = pm25 !== null && pm25 !== undefined && pm25 > 30 && pm25 <= 55;
            const isLowerSmog = pm25 !== null && pm25 !== undefined && pm25 <= 30;

            const isWhyOpen = expandedWhyId === schedule.id;

            return (
              <article
                key={`${member.id}_${schedule.id}`}
                className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
                  isCompleted
                    ? 'border-[var(--aqi-good-border)] bg-[var(--aqi-good-bg)]/25'
                    : isAdopted
                    ? 'border-[var(--brand-primary)]/40 bg-[var(--brand-surface)]/30 ring-1 ring-[var(--brand-primary)]/15'
                    : isHighSmog && schedule.activityType === 'OUTDOOR_EXERCISE'
                    ? 'border-amber-300 bg-amber-50/40'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-card)]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Time & Activity Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Scheduled Time Pill */}
                      <span className="px-2.5 py-1 rounded-lg font-mono text-xs font-bold bg-white border border-[var(--border-subtle)] text-[var(--ink-primary)] shadow-2xs">
                        ⏰ {schedule.startTime}
                      </span>

                      {/* Duration */}
                      <span className="text-[11px] font-mono text-[var(--ink-muted)]">
                        {schedule.durationMinutes} min
                      </span>

                      {/* Member Badge */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--ink-primary)]">
                        <span aria-hidden="true">{ARCHETYPE_ICONS[member.archetype]}</span>
                        <span>{member.nickname}</span>
                      </span>

                      {/* Adopted Status Badge */}
                      {isAdopted && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[var(--aqi-good-bg)] text-[var(--aqi-good)] border border-[var(--aqi-good-border)]">
                          {isCompleted ? '✓ Completed' : '✓ Routine Adopted'}
                        </span>
                      )}
                    </div>

                    {/* Activity Title & Context */}
                    <div>
                      <h3 className="text-base font-bold text-[var(--ink-primary)] font-sans">
                        {schedule.activityName}
                      </h3>
                      <p className="text-xs text-[var(--ink-secondary)] capitalize mt-0.5">
                        {schedule.activityType.toLowerCase().replace('_', ' ')}
                        {schedule.commuteMode && ` • Mode: ${schedule.commuteMode.toLowerCase().replace('_', ' ')}`}
                        {schedule.commuteDistanceKm && ` (${schedule.commuteDistanceKm} km)`}
                      </p>
                    </div>

                    {/* Adopted Adjustment Preview (if adopted) */}
                    {adoptedAction && adoptedAction.adjustedWindow && (
                      <div className="p-2.5 rounded-xl bg-white border border-[var(--border-subtle)] text-xs text-[var(--ink-secondary)] space-y-1">
                        <p className="font-semibold text-[var(--brand-primary)] flex items-center gap-1.5">
                          <span>🔄 Shifted Window:</span>
                          <span className="font-mono text-[var(--ink-primary)]">
                            {adoptedAction.adjustedWindow.startTime} – {adoptedAction.adjustedWindow.endTime}
                          </span>
                        </p>
                        {adoptedAction.deltaCValue && (
                          <div className="space-y-0.5">
                            <p className="text-[11px] font-mono text-[var(--aqi-good)]">
                              +{adoptedAction.deltaCValue} μg/m³ Modelled ambient concentration difference (ΔC)
                            </p>
                            <p className="text-[10px] text-[var(--ink-muted)] italic font-sans">
                              Represents modelled outdoor air concentration difference, not personal inhaled dose.
                            </p>
                          </div>
                        )}
                        {adoptedAction.avoidedCo2eKg && (
                          <p className="text-[11px] font-mono text-[var(--brand-primary)]">
                            -{adoptedAction.avoidedCo2eKg} kg CO₂e operational emissions avoided
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Hourly Forecast Context & Recommendation CTA */}
                  <div className="flex flex-col sm:flex-row lg:flex-col lg:items-end justify-between gap-3 shrink-0">
                    {/* Hourly Environmental Context */}
                    <div className="text-left sm:text-right lg:text-right space-y-1">
                      <div className="flex items-center sm:justify-end gap-1.5">
                        <span className="text-[11px] font-mono text-[var(--ink-muted)]">Forecast PM2.5:</span>
                        <span
                          className={`font-mono text-sm font-bold ${
                            isHighSmog
                              ? 'text-amber-700'
                              : isModerateSmog
                              ? 'text-[var(--ink-primary)]'
                              : isLowerSmog
                              ? 'text-[var(--aqi-good)]'
                              : 'text-[var(--ink-muted)]'
                          }`}
                        >
                          {pm25 !== null && pm25 !== undefined ? `${pm25} μg/m³` : 'Not reported'}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--ink-muted)] font-mono">
                        {isHighSmog
                          ? '⚠️ Higher forecast pollution window'
                          : isModerateSmog
                          ? '🟡 Moderate concentration period'
                          : isLowerSmog
                          ? '✅ Lower forecast pollution window'
                          : 'Awaiting local model updates'}
                      </p>
                    </div>

                    {/* In-Line Action Button for Recommendation (if not yet adopted) */}
                    {matchingRec && !isAdopted && (
                      <div className="flex flex-col items-start sm:items-end gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => onAdoptRecommendation(matchingRec)}
                          className="px-3 py-1.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-mono font-bold shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                          aria-label={`Adopt suggested change for ${schedule.activityName}: ${matchingRec.title}`}
                        >
                          + Adopt Suggested Shift
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedWhyId((prev) => (prev === schedule.id ? null : schedule.id))
                          }
                          className="text-[11px] text-[var(--brand-primary)] hover:underline font-mono cursor-pointer"
                          aria-expanded={isWhyOpen}
                        >
                          {isWhyOpen ? 'Close suggestion details ▲' : 'Why this suggestion? ▼'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expandable "Why this suggestion?" Drawer */}
                {isWhyOpen && matchingRec && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--ink-secondary)] bg-[var(--surface-subtle)] p-3 rounded-xl space-y-1.5 animate-fadeIn">
                    <p className="font-semibold text-[var(--ink-primary)] font-sans">
                      {matchingRec.title}
                    </p>
                    <p className="leading-relaxed">{matchingRec.practicalAction}</p>
                    <p className="text-[11px] text-[var(--ink-muted)] font-mono">
                      Reason: {matchingRec.scientificReason}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
