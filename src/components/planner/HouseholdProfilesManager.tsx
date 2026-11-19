'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  HouseholdMember,
  HouseholdArchetype,
  SensitivityTier,
  ActivityType,
  CommuteMode,
  MemberScheduleItem,
} from '@/domain/household/types';

interface HouseholdProfilesManagerProps {
  readonly members: readonly HouseholdMember[];
  readonly activeMemberId: string | null;
  readonly onSelectMember: (memberId: string) => void;
  readonly onAddMember: (input: Omit<HouseholdMember, 'id' | 'createdAt'>) => void;
  readonly onUpdateMember: (memberId: string, updates: Partial<Omit<HouseholdMember, 'id' | 'createdAt'>>) => void;
  readonly onRemoveMember: (memberId: string) => void;
  readonly onAddSchedule: (memberId: string, schedule: Omit<MemberScheduleItem, 'id'>) => void;
  readonly onRemoveSchedule: (memberId: string, scheduleId: string) => void;
}

const ARCHETYPE_ICONS: Record<HouseholdArchetype, string> = {
  CHILD_STUDENT: '🎒',
  WORKING_COMMUTER: '💼',
  SENIOR_VULNERABLE: '🌿',
  OUTDOOR_ENTHUSIAST: '🏃',
};

const ARCHETYPE_LABELS: Record<HouseholdArchetype, string> = {
  CHILD_STUDENT: 'Child / Student',
  WORKING_COMMUTER: 'Working Commuter',
  SENIOR_VULNERABLE: 'Senior / Vulnerable',
  OUTDOOR_ENTHUSIAST: 'Outdoor Enthusiast',
};

export function HouseholdProfilesManager({
  members,
  activeMemberId,
  onSelectMember,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
  onAddSchedule,
  onRemoveSchedule,
}: HouseholdProfilesManagerProps) {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // New Member Form State
  const [nickname, setNickname] = useState('');
  const [archetype, setArchetype] = useState<HouseholdArchetype>('CHILD_STUDENT');
  const [sensitivityTier, setSensitivityTier] = useState<SensitivityTier>('NONE');

  // New Schedule Form State
  const [activityName, setActivityName] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('OUTDOOR_EXERCISE');
  const [startTime, setStartTime] = useState('07:30');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [commuteMode, setCommuteMode] = useState<CommuteMode>('WALKING');
  const [commuteDistanceKm, setCommuteDistanceKm] = useState(5);

  const activeMember = members.find((m) => m.id === activeMemberId) ?? members[0] ?? null;

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    onAddMember({
      nickname: nickname.trim(),
      archetype,
      sensitivityTier,
      schedules: [],
    });

    setNickname('');
    setIsAddMemberOpen(false);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMember || !activityName.trim()) return;

    onAddSchedule(activeMember.id, {
      activityName: activityName.trim(),
      activityType,
      startTime,
      durationMinutes: Number(durationMinutes),
      commuteMode: activityType === 'COMMUTE' || activityType === 'SCHOOL_TRAVEL' ? commuteMode : undefined,
      commuteDistanceKm: activityType === 'COMMUTE' || activityType === 'SCHOOL_TRAVEL' ? Number(commuteDistanceKm) : undefined,
    });

    setActivityName('');
    setIsAddScheduleOpen(false);
  };

  return (
    <section aria-labelledby="household-profiles-title" className="space-y-4">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 id="household-profiles-title" className="text-base font-bold text-[var(--ink-primary)] font-sans flex items-center gap-2">
            <span>Household Profiles</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-subtle)] text-[var(--ink-secondary)] font-mono font-medium border border-[var(--border-subtle)]">
              {members.length}/4 Profiles
            </span>
          </h2>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Anonymous local profiles stored in browser localStorage. Maximum 4 family members.
          </p>
        </div>

        <button
          type="button"
          disabled={members.length >= 4}
          onClick={() => setIsAddMemberOpen(true)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer ${
            members.length >= 4
              ? 'bg-[var(--surface-subtle)] text-[var(--ink-muted)] cursor-not-allowed border border-[var(--border-subtle)]'
              : 'bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white'
          }`}
          title={members.length >= 4 ? 'Maximum 4 profiles reached' : 'Add new family member'}
        >
          <span>+ Add Member</span>
        </button>
      </div>

      {/* Member Selector Cards */}
      {members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-card)] p-6 text-center space-y-3">
          <div className="text-3xl select-none" aria-hidden="true">
            👨‍👩‍👧‍👦
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ink-primary)] font-sans">
              No family profiles created yet
            </h3>
            <p className="text-xs text-[var(--ink-muted)] max-w-sm mx-auto mt-1 leading-relaxed">
              Add your household members to personalize commute guidance, school runs, and outdoor activity times.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddMemberOpen(true)}
            className="px-4 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-mono font-bold transition-all shadow-xs cursor-pointer"
          >
            Create First Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {members.map((member) => {
            const isActive = member.id === activeMemberId;
            return (
              <div
                key={member.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectMember(member.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectMember(member.id);
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all text-left cursor-pointer flex flex-col justify-between gap-3 ${
                  isActive
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-surface)]/60 shadow-xs ring-2 ring-[var(--brand-primary)]/20'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-[var(--brand-primary)]/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl select-none" aria-hidden="true">
                      {ARCHETYPE_ICONS[member.archetype]}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--ink-primary)] font-sans leading-tight">
                        {member.nickname}
                      </h4>
                      <p className="text-[10px] text-[var(--ink-muted)]">
                        {ARCHETYPE_LABELS[member.archetype]}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Remove ${member.nickname} from household?`)) {
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

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[var(--border-subtle)]/60">
                  <span className="font-mono text-[var(--ink-muted)]">
                    {member.schedules.length} activities
                  </span>
                  {member.sensitivityTier !== 'NONE' && (
                    <span className="px-2 py-0.5 rounded-md font-mono font-medium text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
                      {member.sensitivityTier}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Member Schedules & Management */}
      {activeMember && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--ink-primary)] font-sans flex items-center gap-2">
                <span>{activeMember.nickname}&apos;s Daily Routine</span>
                <span className="text-xs font-normal text-[var(--ink-muted)]">
                  ({ARCHETYPE_LABELS[activeMember.archetype]})
                </span>
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setIsAddScheduleOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[var(--brand-surface)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white border border-[var(--brand-primary)]/20 text-xs font-mono font-semibold transition-all cursor-pointer self-start sm:self-auto"
            >
              + Add Activity
            </button>
          </div>

          {activeMember.schedules.length === 0 ? (
            <p className="text-xs text-[var(--ink-muted)] italic py-2">
              No daily activities configured yet. Click &quot;+ Add Activity&quot; to set school travel, commute, outdoor exercise, or ventilation times.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {activeMember.schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3 flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[var(--ink-primary)]">
                      {schedule.activityName}
                    </p>
                    <p className="text-[11px] font-mono text-[var(--ink-secondary)]">
                      ⏰ {schedule.startTime} ({schedule.durationMinutes}m)
                    </p>
                    <p className="text-[10px] text-[var(--ink-muted)] capitalize">
                      {schedule.activityType.toLowerCase().replace('_', ' ')}
                      {schedule.commuteMode && ` • ${schedule.commuteMode.toLowerCase().replace('_', ' ')}`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveSchedule(activeMember.id, schedule.id)}
                    className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--aqi-unhealthy)] hover:bg-[var(--aqi-unhealthy-bg)] transition-colors cursor-pointer text-xs"
                    aria-label={`Remove activity ${schedule.activityName}`}
                    title="Remove activity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Member Modal */}
      {isAddMemberOpen && isMounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-member-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40"
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 id="add-member-title" className="text-base font-bold text-[var(--ink-primary)] font-sans">
                Add Household Member
              </h3>
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(false)}
                className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                aria-label="Close add member dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMemberSubmit} className="space-y-4">
              <div>
                <label htmlFor="member-nickname" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                  Nickname or Identifier
                </label>
                <input
                  id="member-nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Aarav, Grandma, Self"
                  maxLength={30}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-sm font-medium text-[var(--ink-primary)] placeholder-[var(--ink-muted)] hover:border-[var(--brand-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25 focus:border-[var(--brand-primary)] transition-all"
                />
              </div>

              <div>
                <label htmlFor="member-archetype" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                  Household Archetype
                </label>
                <div className="relative">
                  <select
                    id="member-archetype"
                    value={archetype}
                    onChange={(e) => setArchetype(e.target.value as HouseholdArchetype)}
                    className="w-full appearance-none rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] pl-3.5 pr-10 py-2.5 text-sm font-medium text-[var(--ink-primary)] shadow-2xs hover:border-[var(--brand-primary)]/40 focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25 transition-all cursor-pointer"
                  >
                    <option value="CHILD_STUDENT">🎒 Child / Student</option>
                    <option value="WORKING_COMMUTER">💼 Working Commuter</option>
                    <option value="SENIOR_VULNERABLE">🌿 Senior / Vulnerable Adult</option>
                    <option value="OUTDOOR_ENTHUSIAST">🏃 Outdoor Enthusiast</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[var(--ink-muted)]">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="member-sensitivity" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                  Sensitivity Tier (Optional)
                </label>
                <div className="relative">
                  <select
                    id="member-sensitivity"
                    value={sensitivityTier}
                    onChange={(e) => setSensitivityTier(e.target.value as SensitivityTier)}
                    className="w-full appearance-none rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] pl-3.5 pr-10 py-2.5 text-sm font-medium text-[var(--ink-primary)] shadow-2xs hover:border-[var(--brand-primary)]/40 focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25 transition-all cursor-pointer"
                  >
                    <option value="NONE">General Population (No specific sensitivity)</option>
                    <option value="PEDIATRIC">Pediatric (Developing lungs)</option>
                    <option value="SENIOR">Senior (Older adult)</option>
                    <option value="RESPIRATORY">Respiratory (Asthma, allergy prone)</option>
                    <option value="CARDIOVASCULAR">Cardiovascular Sensitivity</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[var(--ink-muted)]">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-[11px] text-[var(--ink-muted)] mt-1.5 leading-relaxed">
                  Optional high-level category used strictly for local advisory filtering. Never sent to cloud servers.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-primary)] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-bold shadow-xs hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Add Activity Modal */}
      {isAddScheduleOpen && isMounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-schedule-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40"
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 id="add-schedule-title" className="text-base font-bold text-[var(--ink-primary)] font-sans">
                Add Activity for {activeMember?.nickname}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddScheduleOpen(false)}
                className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                aria-label="Close add activity dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label htmlFor="activity-name" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                  Activity Name
                </label>
                <input
                  id="activity-name"
                  type="text"
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  placeholder="e.g. School Bus, Morning Jog, Office Commute"
                  maxLength={50}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-sm font-medium text-[var(--ink-primary)] placeholder-[var(--ink-muted)] hover:border-[var(--brand-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25 focus:border-[var(--brand-primary)] transition-all"
                />
              </div>

              <div>
                <label htmlFor="activity-type" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                  Activity Category
                </label>
                <div className="relative">
                  <select
                    id="activity-type"
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as ActivityType)}
                    className="w-full appearance-none rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] pl-3.5 pr-10 py-2.5 text-sm font-medium text-[var(--ink-primary)] shadow-2xs hover:border-[var(--brand-primary)]/40 focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25 transition-all cursor-pointer"
                  >
                    <option value="OUTDOOR_EXERCISE">🏃 Outdoor Exercise (Jogging, Football, Yoga)</option>
                    <option value="COMMUTE">💼 Work Commute</option>
                    <option value="SCHOOL_TRAVEL">🎒 School Run / Student Travel</option>
                    <option value="ERRAND">🛒 Errands &amp; Shopping</option>
                    <option value="VENTILATION">🪟 Home Natural Airing Out</option>
                    <option value="INDOOR_CHORE">🧹 Indoor Cleaning &amp; Chores</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[var(--ink-muted)]">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="activity-start-time" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                    Start Time
                  </label>
                  <input
                    id="activity-start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-sm font-mono font-medium text-[var(--ink-primary)] hover:border-[var(--brand-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25 focus:border-[var(--brand-primary)] transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="activity-duration" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                    Duration (Minutes)
                  </label>
                  <input
                    id="activity-duration"
                    type="number"
                    min={5}
                    max={720}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-sm font-mono font-medium text-[var(--ink-primary)] hover:border-[var(--brand-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25 focus:border-[var(--brand-primary)] transition-all"
                  />
                </div>
              </div>

              {(activityType === 'COMMUTE' || activityType === 'SCHOOL_TRAVEL') && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border-subtle)]">
                  <div>
                    <label htmlFor="commute-mode" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                      Transport Mode
                    </label>
                    <div className="relative">
                      <select
                        id="commute-mode"
                        value={commuteMode}
                        onChange={(e) => setCommuteMode(e.target.value as CommuteMode)}
                        className="w-full appearance-none rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] pl-3 pr-8 py-2.5 text-xs font-medium text-[var(--ink-primary)] shadow-2xs hover:border-[var(--brand-primary)]/40 focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25 transition-all cursor-pointer"
                      >
                        <option value="WALKING">🚶 Walking</option>
                        <option value="CYCLING">🚲 Cycling</option>
                        <option value="PUBLIC_TRANSIT">🚌 Public Bus / Metro Rail</option>
                        <option value="PRIVATE_CAR">🚗 Private Petrol Car</option>
                        <option value="CARPOOL">👥 Carpool / Shared Ride</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-[var(--ink-muted)]">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="commute-distance" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                      Approx Distance (km)
                    </label>
                    <input
                      id="commute-distance"
                      type="number"
                      min={0.5}
                      max={200}
                      step={0.5}
                      value={commuteDistanceKm}
                      onChange={(e) => setCommuteDistanceKm(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-xs font-mono font-medium text-[var(--ink-primary)] hover:border-[var(--brand-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25 focus:border-[var(--brand-primary)] transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsAddScheduleOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-primary)] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-bold shadow-xs hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
