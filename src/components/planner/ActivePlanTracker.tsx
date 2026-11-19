'use client';

import React, { useState } from 'react';
import { ActiveActionItem, TimeWindow } from '@/domain/planner/types';
import { EditActionModal } from './EditActionModal';

interface ActivePlanTrackerProps {
  readonly actions: readonly ActiveActionItem[];
  readonly selectedMemberId?: string; // 'ALL_FAMILY' or memberId
  readonly onMarkComplete: (actionId: string) => void;
  readonly onMarkSkipped: (actionId: string) => void;
  readonly onRemoveAction: (actionId: string) => void;
  readonly onUpdateAction: (actionId: string, adjustedWindow: TimeWindow, notes?: string) => void;
}

export function ActivePlanTracker({
  actions,
  selectedMemberId = 'ALL_FAMILY',
  onMarkComplete,
  onMarkSkipped,
  onRemoveAction,
  onUpdateAction,
}: ActivePlanTrackerProps) {
  const [editingAction, setEditingAction] = useState<ActiveActionItem | null>(null);

  // Filter actions if a specific member is selected
  const displayedActions =
    selectedMemberId === 'ALL_FAMILY'
      ? actions
      : actions.filter((a) => a.memberId === selectedMemberId);

  const completedCount = displayedActions.filter((a) => a.status === 'COMPLETED').length;
  const totalCount = displayedActions.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <section id="todays-actions" aria-labelledby="active-plan-title" className="space-y-4">
      {/* Header & Daily Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface-card)] p-4 sm:p-5 rounded-2xl border border-[var(--border-subtle)] shadow-xs">
        <div>
          <h2
            id="active-plan-title"
            className="text-base font-bold text-[var(--ink-primary)] font-sans flex items-center gap-2"
          >
            <span>Today&apos;s Family Action Checklist</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--brand-surface)] text-[var(--brand-primary)] font-mono font-medium border border-[var(--brand-primary)]/20">
              {completedCount}/{totalCount} Completed
            </span>
          </h2>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Adopted daily schedule shifts, commuter adjustments, and protective habits stored 100% locally.
          </p>
        </div>

        {totalCount > 0 && (
          <div className="w-full sm:w-48 flex flex-col gap-1.5 shrink-0">
            <div className="flex justify-between text-xs font-mono font-medium text-[var(--ink-secondary)]">
              <span>Daily Progress</span>
              <span className="font-bold text-[var(--brand-primary)]">{progressPercent}%</span>
            </div>
            <div
              className="w-full h-2.5 rounded-full bg-[var(--surface-subtle)] overflow-hidden border border-[var(--border-subtle)]"
              role="progressbar"
              aria-label="Daily action completion progress"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-[var(--brand-primary)] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Items List */}
      {displayedActions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-card)] p-8 text-center space-y-2">
          <div className="text-3xl select-none" aria-hidden="true">
            📋
          </div>
          <h3 className="text-sm font-bold text-[var(--ink-primary)] font-sans">
            No active routines adopted yet
          </h3>
          <p className="text-xs text-[var(--ink-muted)] max-w-md mx-auto leading-relaxed">
            Review the whole-family schedule above or personalized recommendations below, then click{' '}
            <strong className="font-semibold text-[var(--brand-primary)]">[ + Adopt to Plan ]</strong> to add
            practical daily actions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedActions.map((action) => {
            const isCompleted = action.status === 'COMPLETED';
            const isSkipped = action.status === 'SKIPPED';

            return (
              <div
                key={action.id}
                className={`rounded-2xl border p-4 sm:p-5 bg-[var(--surface-card)] transition-all ${
                  isCompleted
                    ? 'border-[var(--aqi-good-border)] bg-[var(--aqi-good-bg)]/30'
                    : isSkipped
                    ? 'border-[var(--border-subtle)] opacity-60 bg-[var(--surface-subtle)]'
                    : 'border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Member Nickname Chip */}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--surface-subtle)] text-[var(--ink-primary)] border border-[var(--border-subtle)]">
                        👤 {action.memberNickname}
                      </span>

                      {/* Time Window */}
                      <span className="text-[11px] px-2 py-0.5 rounded-md font-mono font-medium border bg-white border-[var(--border-subtle)] text-[var(--ink-secondary)]">
                        ⏰ {action.adjustedWindow.startTime} – {action.adjustedWindow.endTime}
                      </span>

                      {/* Exposure Reduction Badge */}
                      {action.deltaCValue && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-[var(--aqi-good-bg)] text-[var(--aqi-good)] border border-[var(--aqi-good-border)]">
                          +{action.deltaCValue} μg/m³ Ambient Diff
                        </span>
                      )}

                      {/* Transport Emissions Avoided Badge */}
                      {action.avoidedCo2eKg && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-[var(--brand-surface)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/20">
                          -{action.avoidedCo2eKg} kg CO₂e
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm sm:text-base font-bold font-sans ${
                        isCompleted ? 'line-through text-[var(--ink-muted)]' : 'text-[var(--ink-primary)]'
                      }`}
                    >
                      {action.title}
                    </h4>

                    {action.userNotes && (
                      <p className="text-xs text-[var(--ink-secondary)] italic bg-white/80 p-2 rounded-lg border border-[var(--border-subtle)]">
                        Note: {action.userNotes}
                      </p>
                    )}

                    {isCompleted && action.completedAt && (
                      <p className="text-[11px] text-[var(--aqi-good)] font-mono font-medium">
                        ✓ Completed at{' '}
                        {new Date(action.completedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                    {!isCompleted ? (
                      <button
                        type="button"
                        onClick={() => onMarkComplete(action.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-[var(--aqi-good)] hover:bg-[#036246] text-white text-xs font-mono font-bold shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aqi-good)]"
                        aria-label={`Mark completed: ${action.title}`}
                      >
                        ✓ Complete
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onMarkSkipped(action.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface-subtle)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                        aria-label="Revert completion status"
                      >
                        Undo
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setEditingAction(action)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface-subtle)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                      aria-label={`Edit timing for ${action.title}`}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemoveAction(action.id)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-mono text-[var(--ink-muted)] hover:text-[var(--aqi-unhealthy)] hover:bg-[var(--aqi-unhealthy-bg)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                      aria-label={`Remove action ${action.title}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Customization Modal */}
      {editingAction && (
        <EditActionModal
          key={editingAction.id}
          action={editingAction}
          isOpen={Boolean(editingAction)}
          onClose={() => setEditingAction(null)}
          onSave={(actionId, adjustedWindow, notes) => {
            onUpdateAction(actionId, adjustedWindow, notes);
            setEditingAction(null);
          }}
        />
      )}
    </section>
  );
}
