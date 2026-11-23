'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CustomSelect } from '../CustomSelect';
import {
  HouseholdMember,
  ActivityType,
  CommuteMode,
  MemberScheduleItem,
} from '@/domain/household/types';
import {
  ARCHETYPE_ICONS,
  ARCHETYPE_LABELS,
  ACTIVITY_TYPE_SELECT_OPTIONS,
  COMMUTE_MODE_SELECT_OPTIONS,
} from './constants';

interface AddScheduleModalProps {
  readonly isOpen: boolean;
  readonly members: readonly HouseholdMember[];
  readonly selectedMemberId: string;
  readonly onSelectMemberId: (id: string) => void;
  readonly onClose: () => void;
  readonly onAddSchedule: (memberId: string, schedule: Omit<MemberScheduleItem, 'id'>) => void;
}

export function AddScheduleModal({
  isOpen,
  members,
  selectedMemberId,
  onSelectMemberId,
  onClose,
  onAddSchedule,
}: AddScheduleModalProps) {
  const [activityName, setActivityName] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('OUTDOOR_EXERCISE');
  const [startTime, setStartTime] = useState('07:30');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [commuteMode, setCommuteMode] = useState<CommuteMode>('WALKING');
  const [commuteDistanceKm, setCommuteDistanceKm] = useState(5);

  if (!isOpen) return null;

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !activityName.trim()) return;

    onAddSchedule(selectedMemberId, {
      activityName: activityName.trim(),
      activityType,
      startTime,
      durationMinutes: Number(durationMinutes),
      commuteMode:
        activityType === 'COMMUTE' || activityType === 'SCHOOL_TRAVEL' ? commuteMode : undefined,
      commuteDistanceKm:
        activityType === 'COMMUTE' || activityType === 'SCHOOL_TRAVEL'
          ? Number(commuteDistanceKm)
          : undefined,
    });

    setActivityName('');
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-schedule-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 animate-fadeIn"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div>
            <h3 id="add-schedule-dialog-title" className="text-base font-bold text-[var(--ink-primary)] font-sans">
              Add Daily Routine Activity
            </h3>
            <p className="text-[11px] text-[var(--ink-muted)]">
              Schedule recurring commute, outdoor exercise, or school journeys.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          {members.length > 1 && (
            <div>
              <label htmlFor="schedule-target-member-select" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                Family Member
              </label>
              <CustomSelect<string>
                id="schedule-target-member-select"
                value={selectedMemberId}
                options={members.map((m) => ({
                  value: m.id,
                  label: `${m.nickname} (${ARCHETYPE_LABELS[m.archetype] || m.archetype})`,
                  icon: ARCHETYPE_ICONS[m.archetype] || '👤',
                }))}
                onChange={onSelectMemberId}
              />
            </div>
          )}

          <div>
            <label htmlFor="activity-name-input" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
              Activity Name
            </label>
            <input
              id="activity-name-input"
              type="text"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="e.g. Morning Football, School Bus, Office Commute"
              maxLength={50}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-sm font-medium text-[var(--ink-primary)] placeholder-[var(--ink-muted)] hover:border-[var(--brand-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25 focus:border-[var(--brand-primary)] transition-all"
            />
          </div>

          <div>
            <label htmlFor="activity-type-select" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
              Activity Type
            </label>
            <CustomSelect<ActivityType>
              id="activity-type-select"
              value={activityType}
              options={ACTIVITY_TYPE_SELECT_OPTIONS}
              onChange={setActivityType}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="schedule-time-input" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                Start Time (24h)
              </label>
              <input
                id="schedule-time-input"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-sm font-mono font-medium text-[var(--ink-primary)] hover:border-[var(--brand-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25 focus:border-[var(--brand-primary)] transition-all"
              />
            </div>

            <div>
              <label htmlFor="schedule-duration-input" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                Duration (Minutes)
              </label>
              <input
                id="schedule-duration-input"
                type="number"
                min={5}
                max={720}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-sm font-mono font-medium text-[var(--ink-primary)] hover:border-[var(--brand-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25 focus:border-[var(--brand-primary)] transition-all"
              />
            </div>
          </div>

          {(activityType === 'COMMUTE' || activityType === 'SCHOOL_TRAVEL') && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
              <div>
                <label htmlFor="commute-mode-select" className="block text-[11px] font-semibold text-[var(--ink-secondary)] mb-1">
                  Travel Mode
                </label>
                <CustomSelect<CommuteMode>
                  id="commute-mode-select"
                  value={commuteMode}
                  options={COMMUTE_MODE_SELECT_OPTIONS}
                  onChange={setCommuteMode}
                />
              </div>

              <div>
                <label htmlFor="commute-distance-input" className="block text-[11px] font-semibold text-[var(--ink-secondary)] mb-1">
                  Distance (km)
                </label>
                <input
                  id="commute-distance-input"
                  type="number"
                  min={0.5}
                  max={150}
                  step={0.5}
                  value={commuteDistanceKm}
                  onChange={(e) => setCommuteDistanceKm(Number(e.target.value))}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 text-xs font-mono text-[var(--ink-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25 focus:border-[var(--brand-primary)] transition-all"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono font-medium text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-mono font-bold transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            >
              Add Routine Activity
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
