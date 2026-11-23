'use client';

import { useState } from 'react';
import { CopilotResponse } from '@/lib/ai/types';
import { AirQualityReport, ForecastPoint } from '@/domain/types';
import { detectCopilotIntent, CopilotQueryIntent } from '@/domain/ai/copilot-intent';
import { getPrimaryAqiFacts } from '@/domain/aqi/primary-aqi';

interface CopilotRichResponseProps {
  readonly question: string;
  readonly response: CopilotResponse;
  readonly report?: AirQualityReport | null;
  readonly onSelectPrompt?: (prompt: string) => void;
  readonly isLiveAi?: boolean;
}

function getCpcbColorForValue(aqi: number | null | undefined): string {
  if (aqi === null || aqi === undefined) return '#94A3B8';
  if (aqi <= 50) return '#047857'; // Good
  if (aqi <= 100) return '#4d7c0f'; // Satisfactory
  if (aqi <= 200) return '#92400e'; // Moderate
  if (aqi <= 300) return '#EA580C'; // Poor
  if (aqi <= 400) return '#DC2626'; // Very Poor
  return '#7F1D1D'; // Severe
}

function getCpcbShortLabel(aqi: number | null | undefined): string {
  if (aqi === null || aqi === undefined) return 'N/A';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Sat';
  if (aqi <= 200) return 'Mod';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'V.Poor';
  return 'Sev';
}

export function CopilotRichResponse({
  question,
  response,
  report,
  onSelectPrompt,
}: CopilotRichResponseProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const intent: CopilotQueryIntent = detectCopilotIntent(question, response.directAnswer);

  const primaryFacts = report ? getPrimaryAqiFacts(report) : null;

  const handleCopy = async () => {
    try {
      const formatted = [
        `Q: ${question}`,
        `A: ${response.directAnswer}`,
        response.environmentalConditions ? `Conditions: ${response.environmentalConditions}` : null,
        `Action: ${response.recommendedAction}`,
        response.practicalAlternatives?.length ? `Alternatives:\n- ${response.practicalAlternatives.join('\n- ')}` : null,
        response.explanation ? `Explanation: ${response.explanation}` : null,
        `Source: ${response.dataSourceAndFreshness}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      if (!navigator.clipboard?.writeText) {
        setCopyFailed(true);
        setTimeout(() => setCopyFailed(false), 2000);
        return;
      }

      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2000);
    }
  };

  // Follow-up suggestions based on intent and question context
  const followUpSuggestions = getFollowUpPrompts(question, intent);

  // Next 12 hours forecast
  const next12Hours: readonly ForecastPoint[] = report?.forecast ? report.forecast.slice(0, 12) : [];

  return (
    <div
      role="region"
      aria-label="Air Copilot Guidance Response"
      className="space-y-3.5 text-xs font-sans text-slate-800"
    >
      {/* 1. Direct Answer Headline */}
      <div className="bg-gradient-to-r from-teal-50/80 to-sky-50/80 p-3.5 rounded-2xl border border-teal-200/90 shadow-2xs">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-teal-800 uppercase tracking-wider">
              <span>🎯</span>
              <span>Direct Answer</span>
            </span>
            <h4 className="text-sm font-extrabold text-slate-900 leading-snug font-sans">
              {response.directAnswer}
            </h4>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 border border-teal-200 text-[11px] font-mono font-semibold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
            title={copyFailed ? 'Clipboard write restricted' : 'Copy entire answer to clipboard'}
            aria-label={copyFailed ? 'Clipboard write restricted' : 'Copy entire answer to clipboard'}
          >
            <span>{copied ? '✓' : copyFailed ? '⚠️' : '📋'}</span>
            <span>{copied ? 'Copied' : copyFailed ? 'Failed' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* 2. Facts Row — Authoritative Data Chips */}
      {primaryFacts && report && (
        <div
          role="group"
          aria-label="Authoritative Environmental Facts Used"
          className="flex flex-wrap items-center gap-1.5 pt-0.5"
        >
          {/* AQI Chip */}
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border shadow-2xs"
            style={{
              backgroundColor: `${primaryFacts.colorToken}15`,
              borderColor: `${primaryFacts.colorToken}40`,
              color: primaryFacts.colorToken,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: primaryFacts.colorToken }}
              aria-hidden="true"
            />
            <span>AQI {primaryFacts.aqi}</span>
            <span className="font-semibold text-slate-700">({primaryFacts.category})</span>
          </span>

          {/* Scale Chip */}
          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold border border-slate-200">
            {primaryFacts.scaleName}
          </span>

          {/* PM2.5 Chip */}
          {primaryFacts.pm25Concentration !== null && (
            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold border border-slate-200">
              PM₂.₅: {primaryFacts.pm25Concentration} µg/m³
            </span>
          )}

          {/* City & Provenance Chip */}
          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold border border-slate-200">
            📍 {report.location.name}
          </span>

          {/* Source Type Chip */}
          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold border border-slate-200">
            {report.sourceType === 'station'
              ? `Station: ${report.stationName || 'Nearby'}`
              : 'Modeled: CAMS'}
          </span>
        </div>
      )}

      {/* 3. Environmental Conditions Summary */}
      {response.environmentalConditions && (
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-700 leading-relaxed font-sans text-xs">
          <span className="font-bold text-slate-900 mr-1.5">Atmospheric context:</span>
          {response.environmentalConditions}
        </div>
      )}

      {/* 4. Hourly Mini Strip (when query involves timing/outdoor hours and forecast is available) */}
      {intent === 'forecast_timing' && next12Hours.length > 0 && (
        <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-sans text-slate-900 flex items-center gap-1.5">
              <span>⏱️</span>
              <span>Next 12-Hour Air Quality Window</span>
            </span>
            <span className="text-[10px] font-mono font-semibold text-slate-500">
              Forecast: modeled
            </span>
          </div>

          <div
            role="img"
            aria-label="12-hour air quality forecast strip"
            className="flex items-center gap-1 overflow-x-auto pb-1 pt-0.5 select-none"
          >
            {next12Hours.map((pt, idx) => {
              const aqiVal = pt.activeAqi ?? pt.usAqi ?? 50;
              const col = getCpcbColorForValue(aqiVal);
              const label = getCpcbShortLabel(aqiVal);

              return (
                <div
                  key={pt.time || idx}
                  className="flex flex-col items-center justify-between min-w-[42px] p-1.5 rounded-xl border bg-slate-50/80 text-center transition-transform hover:scale-105"
                  style={{ borderColor: `${col}40` }}
                  title={`${pt.displayTime}: AQI ${aqiVal} (${label})`}
                >
                  <span className="text-[9px] font-mono font-semibold text-slate-500">
                    {pt.displayTime.slice(0, 5)}
                  </span>
                  <div
                    className="w-full h-1.5 rounded-full my-1"
                    style={{ backgroundColor: col }}
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-800 tabular-nums">
                    {aqiVal}
                  </span>
                  <span
                    className="text-[8px] font-mono font-semibold uppercase tracking-tight"
                    style={{ color: col }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Accessible Table Alternative */}
          <details className="text-[10px] text-slate-500 font-mono pt-0.5">
            <summary className="cursor-pointer hover:text-slate-800">
              Show text forecast table
            </summary>
            <div className="mt-1.5 max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-1.5 bg-slate-50">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="p-1">Time</th>
                    <th className="p-1">AQI</th>
                    <th className="p-1">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {next12Hours.map((pt) => (
                    <tr key={pt.time} className="border-b border-slate-100 last:border-0">
                      <td className="p-1">{pt.displayTime}</td>
                      <td className="p-1">{pt.activeAqi ?? pt.usAqi}</td>
                      <td className="p-1">{getCpcbShortLabel(pt.activeAqi ?? pt.usAqi)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}

      {/* 5. Action Checklist & Practical Alternatives */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold font-sans text-slate-900 flex items-center gap-1.5">
          <span>🛡️</span>
          <span>Recommended Protective Actions</span>
        </span>

        {/* Primary Recommended Action Card */}
        <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-300 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono font-bold text-[9px] uppercase">
              Primary Step
            </span>
            <span className="text-xs font-bold text-emerald-950 font-sans">
              {response.recommendedAction}
            </span>
          </div>
        </div>

        {/* Practical Alternatives */}
        {response.practicalAlternatives && response.practicalAlternatives.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {response.practicalAlternatives.map((alt, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-slate-800 space-y-1"
              >
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                  Alternative {idx + 1}
                </span>
                <p className="text-xs font-medium leading-snug">{alt}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Collapsible Scientific Explanation & Limitations */}
      <details className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 text-xs text-slate-700 transition-all">
        <summary className="font-semibold text-slate-900 cursor-pointer flex items-center justify-between select-none">
          <span className="flex items-center gap-1.5">
            <span>🔬</span>
            <span>Show the science &amp; data limitations</span>
          </span>
          <span className="text-slate-400 text-xs">▼</span>
        </summary>
        <div className="mt-2 space-y-2 pt-2 border-t border-slate-200/80 text-xs text-slate-600 leading-relaxed font-sans">
          {response.explanation && (
            <div>
              <strong className="text-slate-800 font-sans block mb-0.5">Scientific Basis:</strong>
              <p>{response.explanation}</p>
            </div>
          )}
          {response.limitationsOrUncertainty && (
            <div>
              <strong className="text-slate-800 font-sans block mb-0.5">Uncertainty &amp; Boundary:</strong>
              <p>{response.limitationsOrUncertainty}</p>
            </div>
          )}
        </div>
      </details>

      {/* 7. Data Provenance & Fallback Line */}
      <div className="p-2 rounded-xl bg-slate-100/80 border border-slate-200/80 text-[10px] font-mono text-slate-600 flex flex-col gap-0.5">
        <div className="flex items-center gap-1">
          <span className="font-bold text-slate-700">Data Source:</span>
          <span>{response.dataSourceAndFreshness}</span>
        </div>
        {primaryFacts?.modelFallbackReason && (
          <span className="text-amber-800 font-semibold">
            Note: {primaryFacts.modelFallbackReason}
          </span>
        )}
      </div>

      {/* 8. Contextual Follow-Up Suggestions */}
      {followUpSuggestions.length > 0 && onSelectPrompt && (
        <div className="pt-1 space-y-1.5">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
            Suggested Follow-Ups:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {followUpSuggestions.map((promptText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectPrompt(promptText)}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-teal-800 text-[11px] font-medium transition-all cursor-pointer shadow-2xs hover:shadow-xs text-left"
              >
                {promptText} →
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getFollowUpPrompts(question: string, intent: CopilotQueryIntent): readonly string[] {
  const q = question.toLowerCase();

  if (q.includes('cloth') || q.includes('laundry')) {
    return [
      'When is the cleanest afternoon window to air clothes?',
      'Can indoor clothes drying raise room humidity?',
    ];
  }

  if (q.includes('run') || q.includes('walk') || q.includes('jog') || q.includes('exercise')) {
    return [
      'What heart rate precautions apply for morning jogs?',
      'Should I switch to indoor bodyweight workouts today?',
    ];
  }

  if (intent === 'action_mitigation') {
    return [
      'Which certified N95 mask fits comfortably in Indian humidity?',
      'How do I seal bedroom door gaps during winter inversions?',
    ];
  }

  if (intent === 'concept_education') {
    return [
      'Why does winter thermal inversion trap vehicle exhaust?',
      'How does CPCB NAQI differ from the US EPA scale?',
    ];
  }

  return [
    'What precautions apply for toddlers and elderly members today?',
    'When should I open my windows today for ventilation?',
    'Which mask should I wear outdoors in this air quality?',
  ];
}
