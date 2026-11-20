'use client';

import React, { useState } from 'react';
import { FilterLogState } from '@/domain/indoor/types';

interface FilterMaintenanceLogProps {
  readonly filterLog: FilterLogState;
  readonly onUpdateLog: (update: Partial<FilterLogState>) => void;
  readonly onAskCopilot?: (question: string) => void;
}

export function FilterMaintenanceLog({
  filterLog,
  onUpdateLog,
  onAskCopilot,
}: FilterMaintenanceLogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [intervalMonths, setIntervalMonths] = useState(filterLog.customIntervalMonths || 6);
  const [installDate, setInstallDate] = useState(filterLog.installDate || new Date().toISOString().split('T')[0]);

  // Calculate elapsed days and estimated lifecycle
  const installedAt = new Date(filterLog.installDate || installDate).getTime();
  const now = Date.now();
  const daysElapsed = Math.max(0, Math.floor((now - installedAt) / (1000 * 60 * 60 * 24)));
  const totalLifespanDays = Math.max(30, (filterLog.customIntervalMonths || intervalMonths) * 30.5);
  const percentElapsed = Math.min(100, Math.round((daysElapsed / totalLifespanDays) * 100));
  const daysRemaining = Math.max(0, Math.round(totalLifespanDays - daysElapsed));

  const handleSave = () => {
    onUpdateLog({
      installDate,
      customIntervalMonths: intervalMonths,
    });
    setIsEditing(false);
  };

  const handleLogVacuum = () => {
    const today = new Date().toISOString().split('T')[0];
    onUpdateLog({
      lastVacuumDate: today,
    });
  };

  const handleResetFilter = () => {
    const today = new Date().toISOString().split('T')[0];
    setInstallDate(today);
    onUpdateLog({
      installDate: today,
      lastVacuumDate: today,
    });
  };

  return (
    <section
      aria-labelledby="filter-tracker-heading"
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 sm:p-6 shadow-xs space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2
              id="filter-tracker-heading"
              className="text-base sm:text-lg font-bold text-[var(--ink-primary)] font-sans flex items-center gap-2"
            >
              <span>🛡️ Filter Maintenance &amp; Care Log</span>
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--ink-secondary)] border border-[var(--border-subtle)]">
              Local-First Log
            </span>
          </div>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Track filter service intervals according to your purifier manufacturer specifications.
          </p>
        </div>

        {onAskCopilot && (
          <button
            type="button"
            onClick={() =>
              onAskCopilot('How often should I clean and replace my air purifier filters?')
            }
            className="px-3 py-1.5 rounded-lg bg-[var(--surface-subtle)] text-[var(--ink-secondary)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-card)] text-xs font-mono font-medium border border-[var(--border-subtle)] transition-all cursor-pointer self-start sm:self-auto shrink-0 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          >
            <span>🤖</span>
            <span>Ask Copilot about Filters</span>
          </button>
        )}
      </div>

      {/* Main Status & Progress Ring Display */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]/40">
        {/* Left: Progress Indicator */}
        <div className="sm:col-span-2 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[var(--ink-primary)] uppercase">
              Current Filter Cycle: {filterLog.customIntervalMonths || 6} Months
            </span>
            <span className="text-xs font-mono font-bold text-[var(--brand-primary)]">
              {daysRemaining} Days Remaining
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden flex">
            <div
              className={`h-full transition-all duration-300 ${
                percentElapsed >= 90
                  ? 'bg-rose-500'
                  : percentElapsed >= 75
                  ? 'bg-amber-500'
                  : 'bg-[var(--brand-primary)]'
              }`}
              style={{ width: `${percentElapsed}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ink-muted)]">
            <span>Installed: {filterLog.installDate || installDate}</span>
            <span>{percentElapsed}% Elapsed</span>
          </div>

          {filterLog.lastVacuumDate && (
            <p className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              ✓ Pre-filter last vacuumed: {filterLog.lastVacuumDate}
            </p>
          )}
        </div>

        {/* Right: Quick Maintenance Actions */}
        <div className="flex flex-col gap-2 justify-center border-t sm:border-t-0 sm:border-l border-[var(--border-subtle)] pt-3 sm:pt-0 sm:pl-4">
          <button
            type="button"
            onClick={handleLogVacuum}
            className="w-full py-1.5 px-3 rounded-lg bg-white hover:bg-[var(--surface-card)] text-xs font-mono font-semibold text-[var(--ink-primary)] border border-[var(--border-subtle)] shadow-2xs transition-all cursor-pointer"
          >
            🧹 Log Pre-Filter Clean
          </button>

          <button
            type="button"
            onClick={handleResetFilter}
            className="w-full py-1.5 px-3 rounded-lg bg-white hover:bg-[var(--surface-card)] text-xs font-mono font-semibold text-[var(--ink-primary)] border border-[var(--border-subtle)] shadow-2xs transition-all cursor-pointer"
          >
            🔄 Reset New Filter
          </button>

          <button
            type="button"
            onClick={() => setIsEditing((prev) => !prev)}
            className="w-full py-1.5 px-3 rounded-lg bg-[var(--surface-subtle)] hover:bg-slate-200 text-xs font-mono text-[var(--ink-secondary)] transition-all cursor-pointer text-center"
          >
            {isEditing ? 'Cancel Edit' : '⚙️ Adjust Interval'}
          </button>
        </div>
      </div>

      {/* Interval Customization Form */}
      {isEditing && (
        <div className="p-4 rounded-xl border border-[var(--brand-primary)]/30 bg-[var(--brand-surface)]/40 space-y-3 text-xs animate-fadeIn">
          <h3 className="font-bold font-sans text-[var(--ink-primary)]">
            Configure Manufacturer Replacement Specifications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="install-date-input" className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                Filter Installation Date
              </label>
              <input
                id="install-date-input"
                type="date"
                value={installDate}
                onChange={(e) => setInstallDate(e.target.value)}
                className="w-full p-2 bg-white rounded-lg border border-[var(--border-subtle)] font-mono text-xs text-[var(--ink-primary)]"
              />
            </div>

            <div>
              <label htmlFor="interval-select" className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                Manufacturer Specified Interval
              </label>
              <select
                id="interval-select"
                value={intervalMonths}
                onChange={(e) => setIntervalMonths(Number(e.target.value))}
                className="w-full p-2 bg-white rounded-lg border border-[var(--border-subtle)] font-mono text-xs text-[var(--ink-primary)] cursor-pointer"
              >
                <option value={3}>3 Months (Heavy particulate environment)</option>
                <option value={6}>6 Months (Standard residential recommendation)</option>
                <option value={9}>9 Months</option>
                <option value={12}>12 Months (Large capacity / light usage)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-[var(--brand-primary)] text-white text-xs font-mono font-bold rounded-lg shadow-2xs cursor-pointer hover:bg-[var(--brand-hover)] transition-all"
            >
              Save Schedule
            </button>
          </div>
        </div>
      )}

      {/* Maintenance Rule of Thumb Disclosure */}
      <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed italic">
        *Filter lifespans depend on ambient particulate loading, daily run-hours, fan speed, and manufacturer specifications (typically ranging from 3 to 12 months). Routine pre-filter vacuuming every 2–4 weeks extends HEPA lifespan and preserves rated CADR.
      </p>
    </section>
  );
}
