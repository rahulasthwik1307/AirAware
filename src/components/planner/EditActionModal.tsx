'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

const emptySubscribe = () => () => {};
import { ActiveActionItem, TimeWindow } from '@/domain/planner/types';

interface EditActionModalProps {
  readonly action: ActiveActionItem | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (actionId: string, adjustedWindow: TimeWindow, userNotes?: string) => void;
}

interface EditActionFormProps {
  readonly action: ActiveActionItem;
  readonly onClose: () => void;
  readonly onSave: (actionId: string, adjustedWindow: TimeWindow, userNotes?: string) => void;
}

function EditActionForm({ action, onClose, onSave }: EditActionFormProps) {
  const [startTime, setStartTime] = useState(action.adjustedWindow.startTime);
  const [endTime, setEndTime] = useState(action.adjustedWindow.endTime);
  const [userNotes, setUserNotes] = useState(action.userNotes ?? '');
  const [error, setError] = useState<string | null>(null);

  const startInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startInputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
      setError('Start time must be in HH:mm 24-hour format');
      return;
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)) {
      setError('End time must be in HH:mm 24-hour format');
      return;
    }

    onSave(action.id, { startTime, endTime }, userNotes);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
          Action Title
        </label>
        <p className="text-sm font-medium text-[var(--ink-primary)] bg-[var(--surface-subtle)] px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)]">
          {action.title}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="edit-action-start-time" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
            Adjusted Start Time
          </label>
          <input
            id="edit-action-start-time"
            ref={startInputRef}
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-sm font-mono font-medium text-[var(--ink-primary)] hover:border-[var(--brand-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25 focus:border-[var(--brand-primary)] transition-all"
          />
        </div>
        <div>
          <label htmlFor="edit-action-end-time" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
            Adjusted End Time
          </label>
          <input
            id="edit-action-end-time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-sm font-mono font-medium text-[var(--ink-primary)] hover:border-[var(--brand-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25 focus:border-[var(--brand-primary)] transition-all"
          />
        </div>
      </div>

      <div>
        <label htmlFor="edit-action-notes" className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
          Personal Household Notes (Optional)
        </label>
        <textarea
          id="edit-action-notes"
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
          placeholder="e.g. Discussed with school bus driver, or shifted workout buddy schedule"
          maxLength={200}
          rows={3}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-xs text-[var(--ink-primary)] placeholder-[var(--ink-muted)] hover:border-[var(--brand-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25 focus:border-[var(--brand-primary)] transition-all resize-none"
        />
        <p className="text-[10px] text-[var(--ink-muted)] text-right mt-1">
          {userNotes.length}/200 characters
        </p>
      </div>

      {error && (
        <p className="text-xs text-[var(--aqi-unhealthy)] font-medium" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-primary)] transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-bold shadow-xs hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer"
        >
          Save Custom Routine
        </button>
      </div>
    </form>
  );
}

export function EditActionModal({
  action,
  isOpen,
  onClose,
  onSave,
}: EditActionModalProps) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !action || !isMounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-action-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <h2 id="edit-action-title" className="text-base font-bold text-[var(--ink-primary)] font-sans">
            Customize Action Routine
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
            aria-label="Close edit action dialog"
          >
            ✕
          </button>
        </div>

        <EditActionForm
          key={action.id}
          action={action}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>,
    document.body
  );
}
