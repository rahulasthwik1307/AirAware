'use client';

import React from 'react';
import { HEALTH_OPTIONS } from './constants';

interface Step2SensitivitiesProps {
  readonly selectedSensitivities: readonly string[];
  readonly onToggleSensitivity: (id: string) => void;
}

export function Step2Sensitivities({
  selectedSensitivities,
  onToggleSensitivity,
}: Step2SensitivitiesProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2
          id="onboarding-modal-title"
          className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight"
        >
          Who are you protecting in your home?
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
          Select all that apply. AirAware will customize your morning exposure thresholds, school transit shifts, and N95 respirator alerts.
        </p>
      </div>

      {/* Health Sensitivity Multi-Select Cards */}
      <div className="space-y-2">
        {HEALTH_OPTIONS.map((opt) => {
          const isChecked = selectedSensitivities.includes(opt.id);
          return (
            <label
              key={opt.id}
              htmlFor={`sensitivity-${opt.id}`}
              className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                isChecked
                  ? 'border-teal-700 bg-teal-50/50 shadow-2xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <input
                id={`sensitivity-${opt.id}`}
                name={`sensitivity-${opt.id}`}
                type="checkbox"
                checked={isChecked}
                aria-label={opt.title}
                onChange={() => onToggleSensitivity(opt.id)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-teal-700 focus:ring-teal-700 cursor-pointer"
              />
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">
                    {opt.title}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {opt.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  {opt.desc}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
