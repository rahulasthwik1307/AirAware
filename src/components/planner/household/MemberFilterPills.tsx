'use client';

import React from 'react';
import { HouseholdMember } from '@/domain/household/types';
import { ARCHETYPE_ICONS } from './constants';

interface MemberFilterPillsProps {
  readonly members: readonly HouseholdMember[];
  readonly selectedViewFilter: string;
  readonly onSelectViewFilter: (filter: string) => void;
  readonly totalHouseholdActivities: number;
}

export function MemberFilterPills({
  members,
  selectedViewFilter,
  onSelectViewFilter,
  totalHouseholdActivities,
}: MemberFilterPillsProps) {
  return (
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
  );
}
