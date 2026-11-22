'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { CustomSelect, SelectOption } from './CustomSelect';
import { EditMemberModal } from './EditMemberModal';

const emptySubscribe = () => () => {};
import {
  HouseholdMember,
  HouseholdArchetype,
  SensitivityTier,
  ActivityType,
  CommuteMode,
  MemberScheduleItem,
} from '@/domain/household/types';
import { isNicknameUnique } from '@/domain/household/storage';

interface HouseholdProfilesManagerProps {
  readonly members: readonly HouseholdMember[];
  readonly selectedViewFilter: string; // 'ALL_FAMILY' or memberId
  readonly onSelectViewFilter: (filter: string) => void;
  readonly onAddMember: (input: Omit<HouseholdMember, 'id' | 'createdAt'>) => boolean;
  readonly onUpdateMember: (
    memberId: string,
    updates: Partial<Omit<HouseholdMember, 'id' | 'createdAt'>>
  ) => void;
  readonly onRemoveMember: (memberId: string) => void;
  readonly onAddSchedule: (memberId: string, schedule: Omit<MemberScheduleItem, 'id'>) => void;
  readonly onRemoveSchedule: (memberId: string, scheduleId: string) => void;
  readonly isSettingsOpen: boolean;
  readonly onToggleSettings: () => void;
  readonly isAddScheduleOpen?: boolean;
  readonly onOpenAddSchedule?: (memberId?: string) => void;
  readonly onCloseAddSchedule?: () => void;
  readonly targetScheduleMemberId?: string | null;
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

const ARCHETYPE_SELECT_OPTIONS: readonly SelectOption<HouseholdArchetype>[] = [
  { value: 'CHILD_STUDENT', label: 'Child / Student', icon: '🎒', subtitle: 'Developing lungs & sensitive respiratory tract' },
  { value: 'WORKING_COMMUTER', label: 'Working Commuter', icon: '💼', subtitle: 'Peak transit & traffic corridor exposure' },
  { value: 'SENIOR_VULNERABLE', label: 'Senior / Vulnerable Adult', icon: '🌿', subtitle: 'Cardiovascular & chronic condition precaution' },
  { value: 'OUTDOOR_ENTHUSIAST', label: 'Outdoor Enthusiast', icon: '🏃', subtitle: 'Elevated exertion & heavy ventilation' },
];

const SENSITIVITY_SELECT_OPTIONS: readonly SelectOption<SensitivityTier>[] = [
  { value: 'NONE', label: 'General Population (No specific sensitivity)', subtitle: 'Standard environmental exposure profile' },
  { value: 'PEDIATRIC', label: 'Pediatric (Developing Airways)', subtitle: 'Higher breath rate per body mass' },
  { value: 'RESPIRATORY', label: 'Respiratory (Asthma, COPD)', subtitle: 'Sensitive airway bronchospasm protection' },
  { value: 'CARDIOVASCULAR', label: 'Cardiovascular (Hypertension, CAD)', subtitle: 'Elevated arterial strain & PM2.5 protection' },
];

const ACTIVITY_TYPE_SELECT_OPTIONS: readonly SelectOption<ActivityType>[] = [
  { value: 'OUTDOOR_EXERCISE', label: 'Outdoor Exercise / Sports', icon: '🏃', subtitle: 'Jogging, football, outdoor yoga, high ventilation' },
  { value: 'COMMUTE', label: 'Work Commute', icon: '💼', subtitle: 'Transit, driving, or active road commute' },
  { value: 'SCHOOL_TRAVEL', label: 'School Run / Transit', icon: '🎒', subtitle: 'Morning & afternoon school journey' },
  { value: 'VENTILATION', label: 'Natural Home Ventilation', icon: '🪟', subtitle: 'Opening windows during lower forecast pollution window' },
  { value: 'INDOOR_CHORE', label: 'Indoor Cleaning / Chore', icon: '🧹', subtitle: 'Vacuuming, sweeping, or domestic chores' },
  { value: 'ERRAND', label: 'Outdoor Errand / Shopping', icon: '🛒', subtitle: 'Local neighborhood market trips' },
];

const COMMUTE_MODE_SELECT_OPTIONS: readonly SelectOption<CommuteMode>[] = [
  { value: 'WALKING', label: 'Walking', icon: '🚶', subtitle: 'Direct ambient air exposure' },
  { value: 'CYCLING', label: 'Bicycle / Cycling', icon: '🚲', subtitle: 'High ventilation rate along roadways' },
  { value: 'PUBLIC_TRANSIT', label: 'Public Transit / Metro', icon: '🚇', subtitle: 'Shared cabin & station platforms' },
  { value: 'PRIVATE_CAR', label: 'Solo Private Car', icon: '🚗', subtitle: 'Cabin air filter option available' },
  { value: 'CARPOOL', label: 'Shared Carpool', icon: '🚙', subtitle: 'Efficient vehicle occupancy' },
];

export function HouseholdProfilesManager({
  members,
  selectedViewFilter,
  onSelectViewFilter,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
  onAddSchedule,
  onRemoveSchedule,
  isSettingsOpen,
  onToggleSettings,
  isAddScheduleOpen: isAddScheduleOpenProp,
  onOpenAddSchedule,
  onCloseAddSchedule,
  targetScheduleMemberId,
}: HouseholdProfilesManagerProps) {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [internalIsAddScheduleOpen, setInternalIsAddScheduleOpen] = useState(false);
  const [internalTargetMemberId, setInternalTargetMemberId] = useState<string | null>(null);

  const isScheduleModalOpen =
    isAddScheduleOpenProp !== undefined ? isAddScheduleOpenProp : internalIsAddScheduleOpen;

  const effectiveTargetMemberId =
    targetScheduleMemberId !== undefined ? targetScheduleMemberId : internalTargetMemberId;

  const [overrideMemberId, setOverrideMemberId] = useState<string | null>(null);

  const selectedMemberIdForSchedule =
    overrideMemberId && members.some((m) => m.id === overrideMemberId)
      ? overrideMemberId
      : effectiveTargetMemberId && members.some((m) => m.id === effectiveTargetMemberId)
      ? effectiveTargetMemberId
      : selectedViewFilter !== 'ALL_FAMILY' && members.some((m) => m.id === selectedViewFilter)
      ? selectedViewFilter
      : members[0]?.id ?? '';

  const handleOpenScheduleModal = (memberId?: string) => {
    if (memberId) {
      setOverrideMemberId(memberId);
    }
    if (onOpenAddSchedule) {
      onOpenAddSchedule(memberId);
    } else {
      setInternalTargetMemberId(memberId ?? null);
      setInternalIsAddScheduleOpen(true);
    }
  };

  const handleCloseScheduleModal = () => {
    setOverrideMemberId(null);
    if (onCloseAddSchedule) {
      onCloseAddSchedule();
    } else {
      setInternalIsAddScheduleOpen(false);
    }
    setActivityName('');
  };

  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // New Member Form State & Validation
  const [nickname, setNickname] = useState('');
  const [archetype, setArchetype] = useState<HouseholdArchetype>('CHILD_STUDENT');
  const [sensitivityTier, setSensitivityTier] = useState<SensitivityTier>('NONE');
  const [memberFormError, setMemberFormError] = useState<string | null>(null);

  // Edit Member Form State
  const [editingMember, setEditingMember] = useState<HouseholdMember | null>(null);

  const handleStartEditMember = (member: HouseholdMember) => {
    setEditingMember(member);
  };

  const handleNicknameChange = (val: string) => {
    setNickname(val);
    if (memberFormError) setMemberFormError(null);
    const lower = val.toLowerCase().trim();
    if (
      lower.includes('grandma') ||
      lower.includes('dadi') ||
      lower.includes('nani') ||
      lower.includes('grandpa') ||
      lower.includes('dada') ||
      lower.includes('nana') ||
      lower.includes('elder') ||
      lower.includes('senior')
    ) {
      setArchetype('SENIOR_VULNERABLE');
      setSensitivityTier('SENIOR');
    } else if (
      lower.includes('aarav') ||
      lower.includes('child') ||
      lower.includes('kid') ||
      lower.includes('baby') ||
      lower.includes('son') ||
      lower.includes('daughter')
    ) {
      setArchetype('CHILD_STUDENT');
      setSensitivityTier('PEDIATRIC');
    } else if (
      lower.includes('priya') ||
      lower.includes('work') ||
      lower.includes('office') ||
      lower.includes('commute')
    ) {
      setArchetype('WORKING_COMMUTER');
    } else if (
      lower.includes('runner') ||
      lower.includes('cyclist') ||
      lower.includes('athlete') ||
      lower.includes('fitness')
    ) {
      setArchetype('OUTDOOR_ENTHUSIAST');
    }
  };

  const handleLoadSampleFamily = () => {
    if (members.length === 0) {
      onAddMember({
        nickname: 'Priya',
        archetype: 'WORKING_COMMUTER',
        sensitivityTier: 'NONE',
        schedules: [
          {
            id: 'sample-commute',
            activityName: 'Work Commute',
            activityType: 'COMMUTE',
            startTime: '08:30',
            durationMinutes: 45,
            commuteMode: 'PRIVATE_CAR',
            commuteDistanceKm: 12,
          },
        ],
      });
      onAddMember({
        nickname: 'Grandma',
        archetype: 'SENIOR_VULNERABLE',
        sensitivityTier: 'SENIOR',
        schedules: [
          {
            id: 'sample-walk',
            activityName: 'Morning Garden Walk',
            activityType: 'OUTDOOR_EXERCISE',
            startTime: '07:15',
            durationMinutes: 30,
          },
        ],
      });
      onAddMember({
        nickname: 'Aarav',
        archetype: 'CHILD_STUDENT',
        sensitivityTier: 'PEDIATRIC',
        schedules: [
          {
            id: 'sample-school',
            activityName: 'School Bus Transit',
            activityType: 'SCHOOL_TRAVEL',
            startTime: '07:45',
            durationMinutes: 30,
            commuteMode: 'PUBLIC_TRANSIT',
          },
        ],
      });
    }
  };

  // New Schedule Form State
  const [activityName, setActivityName] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('OUTDOOR_EXERCISE');
  const [startTime, setStartTime] = useState('07:30');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [commuteMode, setCommuteMode] = useState<CommuteMode>('WALKING');
  const [commuteDistanceKm, setCommuteDistanceKm] = useState(5);

  const totalHouseholdActivities = members.reduce(
    (sum, member) => sum + member.schedules.length,
    0
  );

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMemberFormError(null);
    const trimmed = nickname.trim();

    if (!trimmed) {
      setMemberFormError('Please enter a nickname or name.');
      return;
    }

    if (!isNicknameUnique(members, trimmed)) {
      setMemberFormError(`A family member named "${trimmed}" already exists.`);
      return;
    }

    const success = onAddMember({
      nickname: trimmed,
      archetype,
      sensitivityTier,
      schedules: [],
    });

    if (success) {
      setNickname('');
      setMemberFormError(null);
      setIsAddMemberOpen(false);
    }
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMemberId =
      selectedMemberIdForSchedule ||
      effectiveTargetMemberId ||
      (selectedViewFilter !== 'ALL_FAMILY' ? selectedViewFilter : members[0]?.id);

    if (!targetMemberId || !activityName.trim()) return;

    onAddSchedule(targetMemberId, {
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

    handleCloseScheduleModal();
  };

  return (
    <section aria-labelledby="family-selector-title" className="space-y-3">
      {/* SECTION 2: WHOLE FAMILY SELECTOR BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 id="family-selector-title" className="sr-only">
          Family Member Filter
        </h2>

        {/* Member Selector Pill List */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Option: All Family */}
          <button
            type="button"
            onClick={() => onSelectViewFilter('ALL_FAMILY')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs tactile-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
              selectedViewFilter === 'ALL_FAMILY'
                ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                : 'bg-[var(--surface-card)] text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)] border border-[var(--border-subtle)]'
            }`}
          >
            <span aria-hidden="true">👨‍👩‍👧‍👦</span>
            <span>All Family</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedViewFilter === 'ALL_FAMILY'
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--surface-subtle)] text-[var(--ink-muted)]'
              }`}
            >
              {totalHouseholdActivities}
            </span>
          </button>

          {/* Individual Member Pills */}
          {members.map((member) => {
            const isSelected = selectedViewFilter === member.id;
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => onSelectViewFilter(member.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer shadow-2xs tactile-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
                  isSelected
                    ? 'bg-[var(--brand-surface)] text-[var(--brand-primary)] border border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/20 font-bold'
                    : 'bg-[var(--surface-card)] text-[var(--ink-primary)] hover:bg-[var(--surface-subtle)] border border-[var(--border-subtle)]'
                }`}
              >
                <span aria-hidden="true">{ARCHETYPE_ICONS[member.archetype]}</span>
                <span>{member.nickname}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'bg-[var(--surface-subtle)] text-[var(--ink-muted)]'
                  }`}
                >
                  {member.schedules.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Controls: Add Member + Manage Settings */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            disabled={members.length >= 4}
            onClick={() => {
              setNickname('');
              setMemberFormError(null);
              setIsAddMemberOpen(true);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer tactile-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
              members.length >= 4
                ? 'bg-[var(--surface-subtle)] text-[var(--ink-muted)] cursor-not-allowed border border-[var(--border-subtle)]'
                : 'bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white'
            }`}
            title={members.length >= 4 ? 'Maximum 4 profiles reached' : 'Add new family member'}
          >
            <span>+ Add Member</span>
            <span className="text-[10px] opacity-80 font-normal">({members.length}/4)</span>
          </button>

          <button
            type="button"
            onClick={onToggleSettings}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all border flex items-center gap-1.5 cursor-pointer tactile-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
              isSettingsOpen
                ? 'bg-[var(--surface-subtle)] text-[var(--ink-primary)] border-[var(--border-strong)]'
                : 'bg-[var(--surface-card)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border-[var(--border-subtle)]'
            }`}
            aria-expanded={isSettingsOpen}
            aria-controls="household-settings-panel"
          >
            <span>⚙️ Settings</span>
            <span className="text-[10px]" style={{ transform: isSettingsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ▼
            </span>
          </button>
        </div>
      </div>

      {/* SECTION 7: HOUSEHOLD SETTINGS & PROFILE MANAGEMENT (COLLAPSIBLE) */}
      {isSettingsOpen && (
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
                onClick={handleLoadSampleFamily}
                className="px-4 py-2 rounded-xl bg-[var(--brand-surface)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white border border-[var(--brand-primary)]/30 text-xs font-mono font-bold transition-all shadow-xs cursor-pointer"
              >
                ✨ Quick Start: Load Sample Family (Priya, Grandma & Aarav)
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
                        onClick={() => handleStartEditMember(member)}
                        className="px-2 py-1 rounded text-[11px] font-mono font-medium text-[var(--ink-secondary)] hover:bg-[var(--surface-card)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer border border-[var(--border-subtle)]"
                        title="Edit member archetype or sensitivity"
                      >
                        ✎ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenScheduleModal(member.id)}
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
      )}

      {/* ADD MEMBER MODAL */}
      {isAddMemberOpen && isMounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-member-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 animate-fadeIn"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsAddMemberOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 id="add-member-dialog-title" className="text-base font-bold text-[var(--ink-primary)] font-sans">
                Add Household Member
              </h3>
              <button
                type="button"
                onClick={() => {
                  setMemberFormError(null);
                  setIsAddMemberOpen(false);
                }}
                className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {memberFormError && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                {memberFormError}
              </div>
            )}

            <form onSubmit={handleMemberSubmit} className="space-y-4">
              <div>
                <label htmlFor="member-nickname-input" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                  Nickname or Identifier (Unique)
                </label>
                <input
                  id="member-nickname-input"
                  type="text"
                  value={nickname}
                  onChange={(e) => handleNicknameChange(e.target.value)}
                  placeholder="e.g. Aarav, Grandma, Priya"
                  maxLength={30}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-sm font-medium text-[var(--ink-primary)] placeholder-[var(--ink-muted)] hover:border-[var(--brand-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25 focus:border-[var(--brand-primary)] transition-all"
                />
              </div>

              <div>
                <label htmlFor="member-archetype-select" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                  Household Archetype
                </label>
                <CustomSelect<HouseholdArchetype>
                  id="member-archetype-select"
                  value={archetype}
                  options={ARCHETYPE_SELECT_OPTIONS}
                  onChange={setArchetype}
                />
              </div>

              <div>
                <label htmlFor="member-sensitivity-select" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                  Physiological Sensitivity Category (Optional)
                </label>
                <CustomSelect<SensitivityTier>
                  id="member-sensitivity-select"
                  value={sensitivityTier}
                  options={SENSITIVITY_SELECT_OPTIONS}
                  onChange={setSensitivityTier}
                />
                <p className="text-[11px] text-[var(--ink-muted)] mt-1">
                  Enables tailored non-diagnostic advice during elevated smog episodes.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-medium text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-mono font-bold transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                >
                  Save Member Profile
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ADD SCHEDULE ACTIVITY MODAL */}
      {isScheduleModalOpen && isMounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-schedule-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 animate-fadeIn"
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleCloseScheduleModal();
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
                onClick={handleCloseScheduleModal}
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
                    value={selectedMemberIdForSchedule}
                    options={members.map((m) => ({
                      value: m.id,
                      label: `${m.nickname} (${ARCHETYPE_LABELS[m.archetype] || m.archetype})`,
                      icon: ARCHETYPE_ICONS[m.archetype] || '👤',
                    }))}
                    onChange={setOverrideMemberId}
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
                  onClick={handleCloseScheduleModal}
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
      )}

      {/* EDIT MEMBER PROFILE MODAL */}
      {editingMember && isMounted && (
        <EditMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={onUpdateMember}
        />
      )}
    </section>
  );
}
