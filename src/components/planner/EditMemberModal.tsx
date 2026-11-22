'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { HouseholdMember, HouseholdArchetype, SensitivityTier } from '@/domain/household/types';
import { CustomSelect, SelectOption } from './CustomSelect';

const ARCHETYPE_SELECT_OPTIONS: readonly SelectOption<HouseholdArchetype>[] = [
  { value: 'CHILD_STUDENT', label: 'Child / Student', icon: '🎒', subtitle: 'Developing lungs & sensitive respiratory tract' },
  { value: 'WORKING_COMMUTER', label: 'Working Commuter', icon: '💼', subtitle: 'Peak transit & traffic corridor exposure' },
  { value: 'SENIOR_VULNERABLE', label: 'Senior / Vulnerable Adult', icon: '🌿', subtitle: 'Cardiovascular & chronic condition precaution' },
  { value: 'OUTDOOR_ENTHUSIAST', label: 'Outdoor Enthusiast', icon: '🏃', subtitle: 'Elevated exertion & heavy ventilation' },
];

const SENSITIVITY_SELECT_OPTIONS: readonly SelectOption<SensitivityTier>[] = [
  { value: 'NONE', label: 'General Population (No specific sensitivity)', subtitle: 'Standard environmental exposure profile' },
  { value: 'PEDIATRIC', label: 'Pediatric (Developing Airways)', subtitle: 'Higher breath rate per body mass' },
  { value: 'SENIOR', label: 'Senior Citizen (65+ years)', subtitle: 'Cardiopulmonary reserve conservation' },
  { value: 'RESPIRATORY', label: 'Respiratory (Asthma, COPD)', subtitle: 'Sensitive airway bronchospasm protection' },
  { value: 'CARDIOVASCULAR', label: 'Cardiovascular (Hypertension, CAD)', subtitle: 'Elevated arterial strain & PM2.5 protection' },
];

export interface EditMemberModalProps {
  readonly member: HouseholdMember;
  readonly onClose: () => void;
  readonly onSave: (
    memberId: string,
    updates: Partial<Omit<HouseholdMember, 'id' | 'createdAt'>>
  ) => void;
}

export function EditMemberModal({ member, onClose, onSave }: EditMemberModalProps) {
  const [nickname, setNickname] = useState(member.nickname);
  const [archetype, setArchetype] = useState<HouseholdArchetype>(member.archetype);
  const [sensitivityTier, setSensitivityTier] = useState<SensitivityTier>(member.sensitivityTier);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) {
      setFormError('Member nickname cannot be blank.');
      return;
    }
    onSave(member.id, {
      nickname: trimmed,
      archetype,
      sensitivityTier,
    });
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-member-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 animate-fadeIn"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <h3 id="edit-member-dialog-title" className="text-base font-bold text-[var(--ink-primary)] font-sans">
            Edit Member: {member.nickname}
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

        {formError && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-member-nickname-input" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
              Nickname or Identifier
            </label>
            <input
              id="edit-member-nickname-input"
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                if (formError) setFormError(null);
              }}
              maxLength={30}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-sm font-medium text-[var(--ink-primary)] hover:border-[var(--brand-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25 focus:border-[var(--brand-primary)] transition-all"
            />
          </div>

          <div>
            <label htmlFor="edit-member-archetype-select" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
              Household Archetype
            </label>
            <CustomSelect<HouseholdArchetype>
              id="edit-member-archetype-select"
              value={archetype}
              options={ARCHETYPE_SELECT_OPTIONS}
              onChange={setArchetype}
            />
          </div>

          <div>
            <label htmlFor="edit-member-sensitivity-select" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
              Physiological Sensitivity Category
            </label>
            <CustomSelect<SensitivityTier>
              id="edit-member-sensitivity-select"
              value={sensitivityTier}
              options={SENSITIVITY_SELECT_OPTIONS}
              onChange={setSensitivityTier}
            />
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
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
