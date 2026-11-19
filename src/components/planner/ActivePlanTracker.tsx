'use client';

import React, { useState } from 'react';
import { ActiveActionItem, TimeWindow } from '@/domain/planner/types';
import { EditActionModal } from './EditActionModal';

interface ActivePlanTrackerProps {
  readonly actions: readonly ActiveActionItem[];
  readonly onMarkComplete: (actionId: string) => void;
  readonly onMarkSkipped: (actionId: string) => void;
  readonly onRemoveAction: (actionId: string) => void;
  readonly onUpdateAction: (actionId: string, adjustedWindow: TimeWindow, notes?: string) => void;
}

export function ActivePlanTracker({
  actions,
  onMarkComplete,
  onMarkSkipped,
  onRemoveAction,
  onUpdateAction,
}: ActivePlanTrackerProps) {
  const [editingAction, setEditingAction] = useState<ActiveActionItem | null>(null);

  const completedCount = actions.filter((a) => a.status === 'COMPLETED').length;
  const totalCount = actions.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <section aria-labelledby="active-plan-title" className="space-y-4">
      {/* Header & Daily Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface-card)] p-4 rounded-2xl border border-[var(--border-subtle)] shadow-xs">
        <div>
          <h2 id="active-plan-title" className="text-base font-bold text-[var(--ink-primary)] font-sans flex items-center gap-2">
            <span>Actionable Daily Routine Loop</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--brand-surface)] text-[var(--brand-primary)] font-mono font-medium border border-[var(--brand-primary)]/20">
              {completedCount}/{totalCount} Completed
            </span>
          </h2>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Adopted schedule shifts, transit changes, and protective habits stored locally in your browser.
          </p>
        </div>

        {totalCount > 0 && (
          <div className="w-full sm:w-44 flex flex-col gap-1 shrink-0">
            <div className="flex justify-between text-xs font-mono font-medium text-[var(--ink-secondary)]">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div
              className="w-full h-2 rounded-full bg-[var(--surface-subtle)] overflow-hidden"
              role="progressbar"
              aria-label="Daily action completion progress"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-[var(--brand-primary)] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Items List */}
      {actions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-card)] p-8 text-center space-y-2">
          <div className="text-3xl select-none" aria-hidden="true">
            📋
          </div>
          <h3 className="text-sm font-bold text-[var(--ink-primary)] font-sans">
            No routines adopted yet
          </h3>
          <p className="text-xs text-[var(--ink-muted)] max-w-md mx-auto leading-relaxed">
            Review the forecast-matched recommendations below and click <strong className="font-semibold text-[var(--brand-primary)]">[ + Adopt to Plan ]</strong> to add practical routines to your family schedule.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action) => {
            const isCompleted = action.status === 'COMPLETED';
            const isSkipped = action.status === 'SKIPPED';

            return (
              <div
                key={action.id}
                className={`rounded-xl border p-3.5 sm:p-4 bg-[var(--surface-card)] transition-all ${
                  isCompleted
                    ? 'border-[var(--aqi-good-border)] bg-[var(--aqi-good-bg)]/40'
                    : isSkipped
                    ? 'border-[var(--border-subtle)] opacity-60 bg-[var(--surface-subtle)]'
                    : 'border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--ink-muted)]">
                        {action.memberNickname}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-medium border bg-white border-[var(--border-subtle)] text-[var(--ink-secondary)]">
                        {action.adjustedWindow.startTime} – {action.adjustedWindow.endTime}
                      </span>
                      {action.deltaCValue && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-[var(--aqi-good-bg)] text-[var(--aqi-good)] border border-[var(--aqi-good-border)]">
                          +{action.deltaCValue} μg/m³ Ambient Diff
                        </span>
                      )}
                      {action.avoidedCo2eKg && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-[var(--brand-surface)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/20">
                          -{action.avoidedCo2eKg} kg CO₂e
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm font-bold font-sans ${
                        isCompleted
                          ? 'line-through text-[var(--ink-muted)]'
                          : 'text-[var(--ink-primary)]'
                      }`}
                    >
                      {action.title}
                    </h4>

                    {action.userNotes && (
                      <p className="text-xs text-[var(--ink-secondary)] italic bg-white/80 p-1.5 rounded border border-[var(--border-subtle)]">
                        Note: {action.userNotes}
                      </p>
                    )}

                    {isCompleted && action.completedAt && (
                      <p className="text-[10px] text-[var(--aqi-good)] font-mono font-medium">
                        ✓ Completed on {new Date(action.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                    {!isCompleted ? (
                      <button
                        type="button"
                        onClick={() => onMarkComplete(action.id)}
                        className="px-3 py-1.5 rounded-lg bg-[var(--aqi-good)] hover:bg-[#036246] text-white text-xs font-mono font-bold shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aqi-good)]"
                        aria-label={`Mark completed: ${action.title}`}
                      >
                        ✓ Complete
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onMarkSkipped(action.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                        aria-label="Revert completion status"
                      >
                        Undo
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setEditingAction(action)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium text-[var(--ink-secondary)] bg-white hover:bg-[var(--surface-subtle)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                      aria-label={`Edit routine timings: ${action.title}`}
                    >
                      ✎ Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemoveAction(action.id)}
                      className="p-1.5 rounded-lg text-xs text-[var(--ink-muted)] hover:text-[var(--aqi-unhealthy)] hover:bg-[var(--aqi-unhealthy-bg)] transition-colors cursor-pointer"
                      aria-label={`Remove from plan: ${action.title}`}
                      title="Remove from plan"
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

      {/* Edit Action Modal */}
      <EditActionModal
        action={editingAction}
        isOpen={editingAction !== null}
        onClose={() => setEditingAction(null)}
        onSave={onUpdateAction}
      />
    </section>
  );
}
