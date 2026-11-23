'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CustomSelect } from '../CustomSelect';
import {
  HouseholdMember,
  HouseholdArchetype,
  SensitivityTier,
} from '@/domain/household/types';
import { isNicknameUnique } from '@/domain/household/storage';
import {
  ARCHETYPE_SELECT_OPTIONS,
  SENSITIVITY_SELECT_OPTIONS,
} from './constants';

interface AddMemberModalProps {
  readonly isOpen: boolean;
  readonly members: readonly HouseholdMember[];
  readonly onClose: () => void;
  readonly onAddMember: (input: Omit<HouseholdMember, 'id' | 'createdAt'>) => boolean;
}

export function AddMemberModal({
  isOpen,
  members,
  onClose,
  onAddMember,
}: AddMemberModalProps) {
  const [nickname, setNickname] = useState('');
  const [archetype, setArchetype] = useState<HouseholdArchetype>('CHILD_STUDENT');
  const [sensitivityTier, setSensitivityTier] = useState<SensitivityTier>('NONE');
  const [memberFormError, setMemberFormError] = useState<string | null>(null);

  if (!isOpen) return null;

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
      onClose();
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-member-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 animate-fadeIn"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <h3 id="add-member-dialog-title" className="text-base font-bold text-[var(--ink-primary)] font-sans">
            Add Household Member
          </h3>
          <button
            type="button"
            onClick={onClose}
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
              onClick={onClose}
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
  );
}
