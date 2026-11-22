'use client';

import React, { useState, useSyncExternalStore } from 'react';
import {
  analyzeIndoorAir,
  IndoorReadingAnalysis,
  IndoorActionItem,
} from '@/domain/indoor/calculations';
import { updateIndoorPm25Reading } from '@/domain/indoor/storage';
import {
  subscribeHouseholdStorage,
  loadHouseholdState,
  getHouseholdServerSnapshot,
} from '@/domain/household/storage';

interface IndoorAirReadingCardProps {
  readonly outdoorPm25: number;
  readonly savedReading: number | null | undefined;
  readonly hasMonitor: boolean | undefined;
  readonly bestVentilationWindow?: string;
  readonly onAskCopilot?: (question: string) => void;
}

export function IndoorAirReadingCard({
  outdoorPm25,
  savedReading,
  hasMonitor = false,
  bestVentilationWindow,
  onAskCopilot,
}: IndoorAirReadingCardProps) {
  const householdState = useSyncExternalStore(
    subscribeHouseholdStorage,
    loadHouseholdState,
    getHouseholdServerSnapshot
  );
  const [inputValue, setInputValue] = useState<string>(
    savedReading !== null && savedReading !== undefined ? String(savedReading) : ''
  );
  const [monitorMode, setMonitorMode] = useState<boolean>(hasMonitor);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const activeReading = monitorMode
    ? inputValue !== '' && !isNaN(Number(inputValue))
      ? Number(inputValue)
      : null
    : null;

  const analysis: IndoorReadingAnalysis = analyzeIndoorAir({
    indoorReading: activeReading,
    hasMonitor: monitorMode,
    outdoorPm25,
    householdMembers: householdState.members,
    bestVentilationWindow,
  });

  const handleSaveReading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!monitorMode) return;
    const num = Number(inputValue);
    if (!isNaN(num) && num >= 0) {
      updateIndoorPm25Reading(num, true);
      setSaveFeedback('Reading saved to your device!');
      setTimeout(() => setSaveFeedback(null), 3000);
    }
  };

  const handleSelectNoMonitor = () => {
    setMonitorMode(false);
    updateIndoorPm25Reading(null, false);
  };

  const handleSelectHasMonitor = () => {
    setMonitorMode(true);
    const num = Number(inputValue);
    if (!isNaN(num) && num >= 0 && inputValue !== '') {
      updateIndoorPm25Reading(num, true);
    }
  };

  return (
    <section
      aria-labelledby="indoor-reading-heading"
      className="w-full rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5 animate-fadeIn"
    >
      {/* Header with Clear Purpose */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <h2
            id="indoor-reading-heading"
            className="text-base sm:text-lg font-bold font-sans text-slate-900 flex items-center gap-2"
          >
            <span>🏠 Indoor Air Quality &amp; Room Protection</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Compare your indoor living space against outdoor smog and discover timed room actions.
          </p>
        </div>

        {/* Toggle Mode: Have a Monitor vs Don't Have a Monitor */}
        <div
          role="group"
          aria-label="Indoor monitor selection"
          className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-semibold self-start sm:self-auto"
        >
          <button
            type="button"
            onClick={handleSelectHasMonitor}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              monitorMode
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            aria-pressed={monitorMode}
          >
            I have a monitor / purifier reading
          </button>
          <button
            type="button"
            onClick={handleSelectNoMonitor}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              !monitorMode
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            aria-pressed={!monitorMode}
          >
            I don&apos;t have a monitor
          </button>
        </div>
      </div>

      {/* Input or Rough Estimate Area */}
      {monitorMode ? (
        <form onSubmit={handleSaveReading} className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 space-y-1">
              <label
                htmlFor="indoor-pm25-input"
                className="block text-xs font-semibold text-slate-800 font-sans"
              >
                Your indoor PM2.5 reading (from a purifier or monitor), in µg/m³
              </label>
              <div className="relative">
                <input
                  id="indoor-pm25-input"
                  type="number"
                  min="0"
                  max="1000"
                  step="0.1"
                  placeholder="e.g. 28"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  aria-describedby="indoor-reading-help"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400 pointer-events-none">
                  µg/m³
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold shadow-xs transition-all cursor-pointer tactile-btn self-stretch sm:self-auto"
            >
              Update reading
            </button>
          </div>

          <p id="indoor-reading-help" className="text-[11px] text-slate-500 font-sans">
            Look at the digital display on your air purifier or handheld monitor (e.g., Mi, Philips, Dyson, Kaiterra). Stored only on your device.
          </p>

          {saveFeedback && (
            <div className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl animate-fadeIn">
              ✓ {saveFeedback}
            </div>
          )}
        </form>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold font-sans text-sm flex items-center gap-1.5">
              <span>📊 Estimated Indoor Quality</span>
              <span className="text-[10px] font-mono font-bold bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                Rough estimate · not a measurement
              </span>
            </span>
            <span className="font-mono text-xs font-bold text-amber-900">
              ~{analysis.reading} µg/m³
            </span>
          </div>
          <p className="text-amber-800 leading-relaxed font-sans">
            {analysis.statedAssumption}
          </p>
        </div>
      )}

      {/* Classification & Outdoor Comparison Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase block">
            CPCB Category Classification
          </span>
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold"
              style={{
                color: analysis.cpcbColorToken,
                backgroundColor: analysis.cpcbBgToken,
                border: `1px solid ${analysis.cpcbColorToken}40`,
              }}
            >
              {analysis.cpcbCategory}
            </span>
            <span className="text-xs font-mono text-slate-700 font-bold tabular-nums">
              {analysis.reading} µg/m³
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase block">
            Outdoor vs Indoor Comparison
          </span>
          <p className="text-xs font-sans text-slate-800 font-medium">
            {analysis.comparisonText}
          </p>
        </div>
      </div>

      {/* 4 Concrete Actions: Purifier, Windows/Ventilation, Cooking, Plants */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold font-sans uppercase tracking-wider text-slate-700">
            Recommended Indoor Actions
          </h3>
          {onAskCopilot && (
            <button
              type="button"
              onClick={() =>
                onAskCopilot(
                  `My indoor PM2.5 is ${analysis.reading} µg/m³ while outdoor is ${Math.round(
                    outdoorPm25
                  )} µg/m³. What specific purifier fan speed and window timing do you advise for our household?`
                )
              }
              className="text-xs font-mono font-bold text-sky-700 hover:text-sky-800 hover:underline cursor-pointer"
            >
              🤖 Ask Copilot about this reading →
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {analysis.actions.map((act: IndoorActionItem) => (
            <div
              key={act.title}
              className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2 shadow-2xs"
            >
              <h4 className="text-xs font-bold text-slate-900 font-sans flex items-center gap-1.5">
                <span>{act.title}</span>
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium">
                {act.action}
              </p>
              <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1 font-sans">
                <p className="text-slate-600">
                  <strong className="text-slate-800">Why:</strong> {act.why}
                </p>
                <p className="text-emerald-800 font-medium">
                  <strong>Expected Impact:</strong> {act.expectedImpact}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
