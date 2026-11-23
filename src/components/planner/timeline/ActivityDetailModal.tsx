'use client';

import React from 'react';
import { SelectedActivityDetail, ACTIVITY_ICONS } from './timeline-types';

interface ActivityDetailModalProps {
  readonly activeDetail: SelectedActivityDetail | null;
  readonly dialogId: string;
  readonly onClose: () => void;
}

export function ActivityDetailModal({
  activeDetail,
  dialogId,
  onClose,
}: ActivityDetailModalProps) {
  if (!activeDetail) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${dialogId}-title`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 animate-fadeIn"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-2xl space-y-3.5">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-base select-none" aria-hidden="true">
              {ACTIVITY_ICONS[activeDetail.schedule.activityType] || '⏰'}
            </span>
            <div>
              <h3 id={`${dialogId}-title`} className="text-sm font-bold text-[var(--ink-primary)] font-sans">
                {activeDetail.schedule.activityName}
              </h3>
              <p className="text-[10px] font-mono text-[var(--ink-muted)]">
                For {activeDetail.memberNickname}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] text-sm p-1 rounded-lg cursor-pointer"
            aria-label="Close activity details"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between p-2 rounded-lg bg-[var(--surface-subtle)] font-mono">
            <span className="text-[var(--ink-muted)]">Scheduled Window:</span>
            <span className="font-bold text-[var(--ink-primary)]">
              {activeDetail.displayStart} – {activeDetail.displayEnd} ({activeDetail.schedule.durationMinutes} min)
            </span>
          </div>

          {activeDetail.isShifted && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
              <p className="font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                <span>✓ Adopted Routine Shift</span>
              </p>
              <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300">
                Originally: {activeDetail.originalStart} ➔ Shifted to: {activeDetail.displayStart}
              </p>
              {activeDetail.adoptedAction?.deltaCValue && (
                <div className="pt-1 text-[10px] text-emerald-900 dark:text-emerald-100 font-mono space-y-0.5">
                  <p>
                    +{activeDetail.adoptedAction.deltaCValue} μg/m³ Modelled ambient concentration difference (ΔC)
                  </p>
                  <p className="text-[9px] text-[var(--ink-muted)] italic font-sans">
                    Represents modelled outdoor air concentration difference, not personal inhaled dose.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between p-2 rounded-lg bg-[var(--surface-subtle)] font-mono">
            <span className="text-[var(--ink-muted)]">Forecast PM₂.₅ at Hour:</span>
            <span className="font-bold text-[var(--ink-primary)]">
              {activeDetail.forecastPm25 !== null ? `${activeDetail.forecastPm25} μg/m³` : 'Data not reported'}
            </span>
          </div>

          <div className="flex justify-between p-2 rounded-lg bg-[var(--surface-subtle)] text-[11px]">
            <span className="text-[var(--ink-muted)] font-mono">Activity Category:</span>
            <span className="font-semibold text-[var(--ink-primary)] capitalize">
              {activeDetail.schedule.activityType.toLowerCase().replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--border-subtle)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-xs font-mono font-medium text-[var(--ink-primary)] border border-[var(--border-subtle)] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
