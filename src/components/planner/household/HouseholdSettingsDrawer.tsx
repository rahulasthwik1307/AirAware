'use client';

import React from 'react';
import { HouseholdMember } from '@/domain/household/types';
import { ARCHETYPE_ICONS, ARCHETYPE_LABELS } from './constants';

interface HouseholdSettingsDrawerProps {
  readonly isOpen: boolean;
  readonly members: readonly HouseholdMember[];
  readonly onLoadSampleFamily: () => void;
  readonly onStartEditMember: (member: HouseholdMember) => void;
  readonly onOpenScheduleModal: (memberId: string) => void;
  readonly onRemoveMember: (memberId: string) => void;
  readonly onRemoveSchedule: (memberId: string, scheduleId: string) => void;
}

export function HouseholdSettingsDrawer({
  isOpen,
  members,
  onLoadSampleFamily,
  onStartEditMember,
  onOpenScheduleModal,
  onRemoveMember,
  onRemoveSchedule,
}: HouseholdSettingsDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      id="household-settings-panel"
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 sm:p-5 shadow-xs space-y-4 animate-fadeIn"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <h3 className="text-sm font-bold text-[var(--ink-primary)] font-sans flex items-center gap-2">
            <span>Household Profiles &amp; Baseline Schedules</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-subtle)] text-[var(--ink-secondary)] font-mono font-medium border border-[var(--border-subtle)]">
              {members.length}/4 Configured
            </span>
          </h3>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Anonymous profiles stored 100% locally in your browser. Edit baseline routine hours or sensitivity categories.
          </p>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-subtle)] p-6 text-center space-y-3">
          <p className="text-xs text-[var(--ink-muted)]">
            No household members configured yet. Click &quot;+ Add Member&quot; or get started instantly with sample family profiles.
          </p>
          <button
            type="button"
            onClick={onLoadSampleFamily}
            className="px-4 py-2 rounded-xl bg-[var(--brand-surface)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white border border-[var(--brand-primary)]/30 text-xs font-mono font-bold transition-all shadow-xs cursor-pointer"
          >
            ✨ Quick Start: Load Sample Family (Priya, Grandma &amp; Aarav)
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3.5 space-y-3"
            >
              <div className="flex items-start justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl select-none" aria-hidden="true">
                    {ARCHETYPE_ICONS[member.archetype]}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--ink-primary)] font-sans">
                      {member.nickname}
                    </h4>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      {ARCHETYPE_LABELS[member.archetype]}
                      {member.sensitivityTier !== 'NONE' && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded font-mono text-[9px] bg-amber-50 text-amber-800 border border-amber-200">
                          {member.sensitivityTier}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onStartEditMember(member)}
                    className="px-2 py-1 rounded text-[11px] font-mono font-medium text-[var(--ink-secondary)] hover:bg-[var(--surface-card)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer border border-[var(--border-subtle)]"
                    title="Edit member archetype or sensitivity"
                  >
                    ✎ Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenScheduleModal(member.id)}
                    className="px-2 py-1 rounded text-[11px] font-mono font-semibold bg-[var(--brand-surface)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white transition-all cursor-pointer border border-[var(--brand-primary)]/20"
                    title="Add scheduled activity for this member"
                  >
                    + Activity
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove ${member.nickname} and their schedules?`)) {
                        onRemoveMember(member.id);
                      }
                    }}
                    className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--aqi-unhealthy)] hover:bg-[var(--aqi-unhealthy-bg)] transition-colors cursor-pointer text-xs"
                    aria-label={`Remove member ${member.nickname}`}
                    title="Remove member"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Member Schedules List */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-[var(--ink-secondary)]">
                  Daily Routine ({member.schedules.length}):
                </p>
                {member.schedules.length === 0 ? (
                  <p className="text-[11px] text-[var(--ink-muted)] italic">
                    No routine activities added yet.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {member.schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-[var(--border-subtle)] text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--ink-primary)] truncate">
                            {schedule.activityName}
                          </p>
                          <p className="text-[10px] font-mono text-[var(--ink-muted)]">
                            {schedule.startTime} ({schedule.durationMinutes}m) •{' '}
                            {schedule.activityType.toLowerCase().replace('_', ' ')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveSchedule(member.id, schedule.id)}
                          className="text-[var(--ink-muted)] hover:text-[var(--aqi-unhealthy)] text-xs p-1 cursor-pointer"
                          aria-label={`Remove schedule ${schedule.activityName}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
