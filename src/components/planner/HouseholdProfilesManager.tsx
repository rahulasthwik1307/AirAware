'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { EditMemberModal } from './EditMemberModal';
import {
  HouseholdMember,
  MemberScheduleItem,
} from '@/domain/household/types';
import { AddMemberModal } from './household/AddMemberModal';
import { AddScheduleModal } from './household/AddScheduleModal';
import { MemberFilterPills } from './household/MemberFilterPills';
import { HouseholdSettingsDrawer } from './household/HouseholdSettingsDrawer';

const emptySubscribe = () => () => {};

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
  };

  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [editingMember, setEditingMember] = useState<HouseholdMember | null>(null);

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

  const totalHouseholdActivities = members.reduce(
    (sum, member) => sum + member.schedules.length,
    0
  );

  return (
    <section aria-labelledby="family-selector-title" className="space-y-3">
      {/* WHOLE FAMILY SELECTOR BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 id="family-selector-title" className="sr-only">
          Family Member Filter
        </h2>

        <MemberFilterPills
          members={members}
          selectedViewFilter={selectedViewFilter}
          onSelectViewFilter={onSelectViewFilter}
          totalHouseholdActivities={totalHouseholdActivities}
        />

        {/* Action Controls: Add Member + Manage Settings */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            disabled={members.length >= 4}
            onClick={() => setIsAddMemberOpen(true)}
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

      {/* HOUSEHOLD SETTINGS & PROFILE MANAGEMENT (COLLAPSIBLE) */}
      <HouseholdSettingsDrawer
        isOpen={isSettingsOpen}
        members={members}
        onLoadSampleFamily={handleLoadSampleFamily}
        onStartEditMember={setEditingMember}
        onOpenScheduleModal={handleOpenScheduleModal}
        onRemoveMember={onRemoveMember}
        onRemoveSchedule={onRemoveSchedule}
      />

      {/* ADD MEMBER MODAL */}
      <AddMemberModal
        isOpen={isAddMemberOpen && isMounted}
        members={members}
        onClose={() => setIsAddMemberOpen(false)}
        onAddMember={onAddMember}
      />

      {/* ADD SCHEDULE ACTIVITY MODAL */}
      <AddScheduleModal
        isOpen={isScheduleModalOpen && isMounted}
        members={members}
        selectedMemberId={selectedMemberIdForSchedule}
        onSelectMemberId={setOverrideMemberId}
        onClose={handleCloseScheduleModal}
        onAddSchedule={onAddSchedule}
      />

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
