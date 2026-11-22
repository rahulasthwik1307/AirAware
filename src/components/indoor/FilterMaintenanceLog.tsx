'use client';

import React, { useState, useMemo } from 'react';
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
  const [installDate, setInstallDate] = useState(() => filterLog.installDate || new Date().toISOString().split('T')[0]);
  const [now] = useState(() => Date.now());

  // Calculate elapsed days and estimated lifecycle
  const { daysElapsed, totalLifespanDays, percentElapsed, daysRemaining, isVacuumDue, daysSinceVacuum } = useMemo(() => {
    const installedAt = new Date(filterLog.installDate || installDate).getTime();
    const elapsed = Math.max(0, Math.floor((now - installedAt) / (1000 * 60 * 60 * 24)));
    const totalDays = Math.max(30, (filterLog.customIntervalMonths || intervalMonths) * 30.5);
    const pct = Math.min(100, Math.round((elapsed / totalDays) * 100));
    const remaining = Math.max(0, Math.round(totalDays - elapsed));

    const lastVacuumAt = filterLog.lastVacuumDate ? new Date(filterLog.lastVacuumDate).getTime() : installedAt;
    const sinceVacuum = Math.max(0, Math.floor((now - lastVacuumAt) / (1000 * 60 * 60 * 24)));
    return {
      daysElapsed: elapsed,
      totalLifespanDays: totalDays,
      percentElapsed: pct,
      daysRemaining: remaining,
      isVacuumDue: sinceVacuum >= 21,
      daysSinceVacuum: sinceVacuum,
    };
  }, [filterLog.installDate, filterLog.customIntervalMonths, filterLog.lastVacuumDate, installDate, intervalMonths, now]);

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

  // Circular progress calculations (radius 36, circumference ~226.19)
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentElapsed / 100) * circumference;

  return (
    <section
      aria-labelledby="filter-tracker-heading"
      className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3 sm:space-y-3.5 flex flex-col justify-start overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-slate-100 pb-2.5 space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0" aria-hidden="true">🛡️</span>
            <h2
              id="filter-tracker-heading"
              className="text-base sm:text-lg font-bold text-slate-900 font-sans tracking-tight truncate"
            >
              Filter Maintenance &amp; Airflow Health
            </h2>
          </div>

          {onAskCopilot && (
            <button
              type="button"
              onClick={() =>
                onAskCopilot('How often should I clean my air cleaner pre-filter to maintain rated CADR?')
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 text-sky-800 text-xs font-mono font-bold border border-sky-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
            >
              <span className="text-sm">🤖</span>
              <span>Ask Copilot</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
            Local-First Tracker
          </span>
          <p className="text-xs text-slate-500 whitespace-nowrap">
            HEPA &amp; carbon lifecycle monitoring.
          </p>
        </div>
      </div>

      {/* Main Lifecycle & Donut Status Panel - Enlarged & Visually Engaging */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
        {/* Left: SVG Circular Donut Progress Ring with Prominent Readout */}
        <div className="rounded-xl border border-slate-200/90 bg-gradient-to-b from-slate-50 to-slate-100/70 p-3 flex items-center justify-between gap-2.5 shadow-2xs">
          <div className="relative flex items-center justify-center shrink-0">
            <svg width="88" height="88" viewBox="0 0 88 88" className="transform -rotate-90 select-none">
              <circle
                cx="44"
                cy="44"
                r={radius}
                stroke="#e2e8f0"
                strokeWidth="7"
                fill="none"
              />
              <circle
                cx="44"
                cy="44"
                r={radius}
                stroke={percentElapsed > 85 ? '#ef4444' : percentElapsed > 65 ? '#f59e0b' : '#0284c7'}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute text-center flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg sm:text-xl font-black text-slate-900 font-mono block leading-none">
                {100 - percentElapsed}%
              </span>
              <span className="text-[8.5px] font-mono font-medium text-slate-500 mt-0.5">
                Life Left
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-slate-200/90 text-[10px] font-mono font-bold text-slate-700 shadow-2xs whitespace-nowrap self-start">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
              <span>{filterLog.customIntervalMonths || 6}-Mo HEPA</span>
            </span>
            <div className="flex items-baseline gap-1.5 pt-0.5">
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 leading-none">
                {daysRemaining}
              </span>
              <span className="text-xs font-mono font-semibold text-slate-500">
                Days
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block leading-tight font-mono">
              Installed: {filterLog.installDate || installDate}
            </span>
            <span className="text-[9.5px] font-mono font-bold text-emerald-700 flex items-center gap-1">
              <span aria-hidden="true">✓</span>
              <span>Optimal Filtration</span>
            </span>
          </div>
        </div>

        {/* Right: Airflow & Resistance Health Status with Visual Progress Bar */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 sm:p-3.5 space-y-2 flex flex-col justify-between shadow-2xs">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-1 text-xs">
              <span className="font-bold text-slate-800 font-sans flex items-center gap-1.5 whitespace-nowrap">
                <span aria-hidden="true">🕸️</span>
                <span>Pre-Filter Hygiene</span>
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 flex items-center gap-1 ${
                  isVacuumDue
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}
              >
                <span>{isVacuumDue ? '⚠️ Vacuum Due' : '✓ Optimal'}</span>
              </span>
            </div>

            {/* Visual Airflow & Static Fan Pressure Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Intake Static Pressure:</span>
                <span className="font-bold text-slate-800">{isVacuumDue ? '75% (Air Drag)' : '100% Free Flow'}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isVacuumDue ? 'bg-amber-500 w-3/4' : 'bg-gradient-to-r from-emerald-500 to-sky-500 w-full'
                  }`}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-snug">
              {isVacuumDue
                ? `Last cleaned ${daysSinceVacuum} days ago. Dust buildup on pre-filter reduces CADR delivery by ~15–25%.`
                : `Vacuumed ${daysSinceVacuum} days ago. Airflow and static fan pressure are optimal, maximizing clean air.`}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogVacuum}
            className="w-full py-1.5 text-xs font-mono font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.99]"
          >
            <span>🧹</span>
            <span>Record Pre-Filter Clean Today</span>
          </button>
        </div>
      </div>

      {/* 3-Stage Visual Filtration Stack Diagram - Enriched & Aligned with Left Forecast Wave */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
          <span className="font-semibold text-slate-800 font-sans flex items-center gap-1.5">
            <span>🔬</span>
            <span>3-Stage Filter Medium Mechanics</span>
          </span>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="text-sky-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>{isEditing ? '✕ Cancel Edit' : '⚙️ Adjust Interval'}</span>
          </button>
        </div>

        {isEditing ? (
          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2.5">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Manufacturer Lifespan:
                </label>
                <select
                  value={intervalMonths}
                  onChange={(e) => setIntervalMonths(Number(e.target.value))}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded font-mono text-xs text-slate-900"
                >
                  <option value={3}>3 Months (Heavy particulate)</option>
                  <option value={6}>6 Months (Standard residential)</option>
                  <option value={9}>9 Months (Low pollution)</option>
                  <option value={12}>12 Months (Extended Life)</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Install Date:
                </label>
                <input
                  type="date"
                  value={installDate}
                  onChange={(e) => setInstallDate(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded font-mono text-xs text-slate-900"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 text-center text-xs items-stretch">
            {/* Tile 1: Pre-Filter */}
            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 flex flex-col justify-between space-y-1.5 shadow-2xs">
              <div className="space-y-1">
                <span className="text-xl block leading-none" aria-hidden="true">🕸️</span>
                <span className="text-[10px] font-mono font-bold text-sky-700 uppercase tracking-wide block">
                  1. Pre-Filter
                </span>
                <strong className="text-slate-900 font-bold block text-xs leading-tight">
                  Mesh Screen
                </strong>
                <span className="text-[9.5px] text-slate-500 block leading-snug">
                  Traps coarse hair, fur &amp; dust &gt;10µm
                </span>
              </div>
              <span className="text-[9.5px] font-mono font-bold text-sky-800 bg-sky-50 px-2 py-1 rounded-md border border-sky-200 block">
                Vacuum 2–4 wks
              </span>
            </div>

            {/* Tile 2: True HEPA */}
            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 flex flex-col justify-between space-y-1.5 shadow-2xs">
              <div className="space-y-1">
                <span className="text-xl block leading-none" aria-hidden="true">🔬</span>
                <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wide block">
                  2. True HEPA
                </span>
                <strong className="text-slate-900 font-bold block text-xs leading-tight">
                  H13 Borosilicate
                </strong>
                <span className="text-[9.5px] text-slate-500 block leading-snug">
                  99.97% removal of 0.3µm PM₂.₅ soot
                </span>
              </div>
              <span className="text-[9.5px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 block">
                Replace ~6–12 mo
              </span>
            </div>

            {/* Tile 3: Carbon Bed */}
            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 flex flex-col justify-between space-y-1.5 shadow-2xs">
              <div className="space-y-1">
                <span className="text-xl block leading-none" aria-hidden="true">🪨</span>
                <span className="text-[10px] font-mono font-bold text-amber-700 uppercase tracking-wide block">
                  3. Carbon Bed
                </span>
                <strong className="text-slate-900 font-bold block text-xs leading-tight">
                  Activated Pellets
                </strong>
                <span className="text-[9.5px] text-slate-500 block leading-snug">
                  Adsorbs VOCs, cooking fumes &amp; NO₂
                </span>
              </div>
              <span className="text-[9.5px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 block">
                Replace ~6–12 mo
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
          <span className="text-[10px] text-slate-500 font-mono">
            *Manufacturer standard: Vacuum pre-filter bi-weekly; replace HEPA annually.
          </span>
          <button
            type="button"
            onClick={handleResetFilter}
            className="text-[10px] font-mono font-semibold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
          >
            🔄 Reset to New Filter
          </button>
        </div>
      </div>
    </section>
  );
}
