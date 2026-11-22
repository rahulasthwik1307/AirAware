'use client';

import React, { useState } from 'react';
import { calculateCadrAch } from '@/domain/indoor/calculations';

interface CleanAirSizerProps {
  readonly floorAreaM2: number;
  readonly ceilingHeightM: number;
  readonly selectedCadrM3h: number;
  readonly targetAch: number;
  readonly onUpdateArea: (area: number) => void;
  readonly onUpdateCeilingHeight: (height: number) => void;
  readonly onUpdatePurifier: (cadr: number, targetAch: number) => void;
  readonly onAskCopilot?: (question: string) => void;
}

export function CleanAirSizer({
  floorAreaM2,
  ceilingHeightM,
  selectedCadrM3h,
  targetAch,
  onUpdateArea,
  onUpdateCeilingHeight,
  onUpdatePurifier,
  onAskCopilot,
}: CleanAirSizerProps) {
  const [activeTab, setActiveTab] = useState<'commercial' | 'cr-box' | 'botanical'>('commercial');

  const effectiveCadr = activeTab === 'cr-box' ? 380 : selectedCadrM3h;
  const calc = calculateCadrAch(floorAreaM2, ceilingHeightM, targetAch, effectiveCadr);

  // Particle clearance kinetics: C(t) = 100 * exp(-ACH * t / 60)
  const ach = Math.max(0.1, calc.estimatedAch);
  const t50 = Math.round((Math.log(2) / ach) * 60);
  const t90 = Math.round((Math.log(10) / ach) * 60);
  const t99 = Math.round((Math.log(100) / ach) * 60);

  // Expanded SVG Clearance curve points across 60 minutes (viewBox 0 0 460 72)
  const plotLeft = 32;
  const plotRight = 440;
  const plotWidth = plotRight - plotLeft;

  const curvePoints = Array.from({ length: 13 }, (_, i) => {
    const mins = i * 5;
    const remaining = Math.round(100 * Math.exp((-ach * mins) / 60));
    const x = plotLeft + (mins / 60) * plotWidth;
    const y = 62 - (remaining / 100) * 52; // 10 to 62
    return { mins, remaining, x, y };
  });

  const curveSvgPath = curvePoints.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );
  const areaSvgPath = `${curveSvgPath} L ${curvePoints[curvePoints.length - 1].x} 62 L ${curvePoints[0].x} 62 Z`;

  return (
    <section
      aria-labelledby="clean-air-sizer-heading"
      className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3 sm:space-y-3.5 flex flex-col justify-start overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-slate-100 pb-2.5 space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0" aria-hidden="true">💨</span>
            <h2
              id="clean-air-sizer-heading"
              className="text-base sm:text-lg font-bold text-slate-900 font-sans tracking-tight truncate"
            >
              Clean Air &amp; Purifier
            </h2>
          </div>

          {onAskCopilot && (
            <button
              type="button"
              onClick={() =>
                onAskCopilot(
                  `How many Air Changes per Hour (ACH) do I need for a ${floorAreaM2}m² room with ${effectiveCadr} m³/h CADR?`
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 text-sky-800 text-xs font-mono font-bold border border-sky-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
            >
              <span className="text-sm">🤖</span>
              <span>Ask Copilot</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 min-w-0 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
              CADR Sizer
            </span>
            <p className="text-xs text-slate-500 whitespace-nowrap">
              CADR &amp; clearance kinetics.
            </p>
          </div>

          {/* Segmented Tab: Purifier vs DIY Box Fan vs Indoor Plants */}
          <div className="inline-flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200 shrink-0" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'commercial'}
              onClick={() => setActiveTab('commercial')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'commercial'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🏢</span>
              <span>Purifier</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'cr-box'}
              onClick={() => setActiveTab('cr-box')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'cr-box'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📦</span>
              <span>DIY Box Fan</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'botanical'}
              onClick={() => setActiveTab('botanical')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'botanical'
                  ? 'bg-white text-emerald-800 shadow-2xs border border-emerald-200/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🌿</span>
              <span>Plants</span>
            </button>
          </div>
        </div>
      </div>

      {/* Down 1: Compact Turnover Rate & Capacity Strip */}
      <div className="rounded-xl border border-slate-200/90 bg-gradient-to-r from-slate-50 via-sky-50/20 to-slate-50 p-3 sm:p-3.5 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
          <span className="font-semibold text-slate-800 font-sans">
            Air Turnover Capacity
          </span>
          <span className="font-semibold text-slate-500">
            Room: <strong className="text-slate-900">{calc.roomVolumeM3} m³</strong> ({floorAreaM2}m² × {ceilingHeightM}m)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          {/* Main ACH Metric */}
          <div className="sm:col-span-5 flex items-center gap-2.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight shrink-0">
              {calc.estimatedAch} <span className="text-xs font-semibold text-slate-500">ACH</span>
            </div>
            <div className="space-y-0.5">
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border inline-block ${
                  calc.isTargetMet
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {calc.isTargetMet ? '✓ Meets Target' : '⚠️ Below Target'}
              </span>
              <span className="text-[9.5px] text-slate-500 block">
                Required: {calc.requiredCadrM3h} m³/h
              </span>
            </div>
          </div>

          {/* Sleep Mode Derating Metric */}
          <div className="sm:col-span-7 rounded-lg bg-white p-2 border border-slate-200/80 space-y-1 shadow-2xs">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-slate-600 font-medium">Sleep / Low Fan:</span>
              <strong className="text-amber-800 font-bold">~{calc.deratedSleepAch} ACH Output</strong>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
              <div
                className="bg-sky-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (calc.deratedSleepAch / 6) * 100)}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-400 block leading-tight">
              Quiet settings reduce airflow ~50–65%. Sizing for 4+ ACH ensures adequate sleep protection.
            </span>
          </div>
        </div>
      </div>

      {/* Down 2: Expanded Simulated Particle Clearance Kinetics Card - Absorbs empty space */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-3 sm:p-3.5 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
          <span className="font-semibold text-slate-800 font-sans">
            Simulated Particulate Clearance
          </span>
          <span className="text-emerald-700 font-bold text-[10.5px] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
            90% Drop in {t90} min
          </span>
        </div>

        {/* Expanded SVG Clearance Curve with Clear Visibility */}
        <div className="relative py-1">
          <svg viewBox="0 0 460 72" className="w-full h-20 overflow-visible select-none">
            <defs>
              <linearGradient id="decayCompactGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            <line x1={plotLeft} y1="10" x2={plotRight} y2="10" stroke="#f1f5f9" strokeDasharray="3,3" />
            <line x1={plotLeft} y1="36" x2={plotRight} y2="36" stroke="#f1f5f9" strokeDasharray="3,3" />
            <line x1={plotLeft} y1="62" x2={plotRight} y2="62" stroke="#cbd5e1" strokeWidth="1" />
            {/* Y Labels */}
            <text x={plotLeft - 4} y="13" textAnchor="end" fontSize="8" fill="#94a3b8" fontFamily="monospace">100%</text>
            <text x={plotLeft - 4} y="39" textAnchor="end" fontSize="8" fill="#94a3b8" fontFamily="monospace">50%</text>
            <text x={plotLeft - 4} y="65" textAnchor="end" fontSize="8" fill="#94a3b8" fontFamily="monospace">0%</text>
            {/* Fill & Curve */}
            <path d={areaSvgPath} fill="url(#decayCompactGradient)" />
            <path d={curveSvgPath} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
            {/* Benchmark dots */}
            <circle cx={plotLeft + (t50 / 60) * plotWidth} cy="36" r="3.5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
            <circle cx={plotLeft + (t90 / 60) * plotWidth} cy="57" r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
          </svg>
          <div className="flex justify-between text-[9px] font-mono text-slate-400 px-6 mt-0.5">
            <span>0 min</span>
            <span>15 min</span>
            <span>30 min</span>
            <span>45 min</span>
            <span>60 min</span>
          </div>
        </div>

        {/* 3 Enriched Time Benchmark Cards */}
        <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/70">
            <span className="text-[9px] text-slate-500 font-mono block">50% Drop</span>
            <strong className="text-sm font-mono font-bold text-slate-900">{t50} min</strong>
          </div>
          <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200/80">
            <span className="text-[9px] text-emerald-700 font-mono block">90% Drop</span>
            <strong className="text-sm font-mono font-bold text-emerald-950">{t90} min</strong>
          </div>
          <div className="bg-sky-50 p-2 rounded-lg border border-sky-200/80">
            <span className="text-[9px] text-sky-700 font-mono block">99% Drop</span>
            <strong className="text-sm font-mono font-bold text-sky-950">{t99} min</strong>
          </div>
        </div>
      </div>

      {/* Down 3: Compact Interactive Controls or DIY Box Fan Blueprint */}
      {activeTab === 'commercial' ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* CADR Slider */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-xs font-semibold text-slate-800">
                <label htmlFor="cadr-range">Purifier Rated CADR:</label>
                <span className="font-mono font-bold text-sky-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
                  {selectedCadrM3h} m³/h
                </span>
              </div>
              <input
                id="cadr-range"
                type="range"
                min={50}
                max={600}
                step={25}
                value={selectedCadrM3h}
                onChange={(e) => onUpdatePurifier(Number(e.target.value), targetAch)}
                className="w-full accent-sky-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[8.5px] font-mono text-slate-400">
                <span>Compact (100)</span>
                <span>Standard (300)</span>
                <span>Pro (600)</span>
              </div>
            </div>

            {/* Target ACH Buttons */}
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800 block">Design ACH Target:</span>
              <div className="grid grid-cols-3 gap-1">
                {[3, 4, 5].map((achOption) => (
                  <button
                    key={achOption}
                    type="button"
                    onClick={() => onUpdatePurifier(selectedCadrM3h, achOption)}
                    className={`py-1 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                      targetAch === achOption
                        ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {achOption} ACH
                  </button>
                ))}
              </div>
              <span className="text-[8.5px] text-slate-400 block font-mono">
                {targetAch === 3 ? 'Baseline residential' : targetAch === 4 ? 'Recommended standard' : 'High allergy load'}
              </span>
            </div>
          </div>

          {/* Ceiling Height Toggle */}
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/70">
            <span className="text-slate-600 font-medium text-xs">Ceiling Height:</span>
            <div className="flex gap-1.5">
              {[2.4, 2.7, 3.0].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => onUpdateCeilingHeight(h)}
                  className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer ${
                    ceilingHeightM === h
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {h}m
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'cr-box' ? (
        /* Corsi-Rosenthal Box DIY Blueprint View */
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-950 font-sans flex items-center gap-1.5">
              <span>📦</span>
              <span>Corsi-Rosenthal Box Blueprint</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              High CADR: ~380 m³/h
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-snug">
            Peer-reviewed DIY air cleaner built using a 20″ box fan, 4× MERV 13 furnace filters, and a cardboard shroud. Delivers commercial-grade CADR with lower noise.
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-0.5">
            <div className="bg-white p-1.5 rounded-lg border border-sky-100 shadow-2xs">
              <span className="text-[8.5px] text-slate-400 block">Est. Cost</span>
              <strong className="text-slate-900 text-xs">₹3,500–₹5,000</strong>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-sky-100 shadow-2xs">
              <span className="text-[8.5px] text-slate-400 block">CADR Delivery</span>
              <strong className="text-sky-700 text-xs">~380 m³/h</strong>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-sky-100 shadow-2xs">
              <span className="text-[8.5px] text-slate-400 block">Filter Area</span>
              <strong className="text-emerald-700 text-xs">4× Surface</strong>
            </div>
          </div>
        </div>
      ) : (
        /* Houseplants: Aesthetic & Humidity Addition (Not a Purifier) */
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 font-sans flex items-center gap-1.5">
              <span>🌿</span>
              <span>Houseplants: Aesthetic &amp; Humidity Addition (Not a Purifier)</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-emerald-800 border border-emerald-200">
              Nice Extra, Not a Filter
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white p-2 rounded-xl border border-emerald-100 shadow-2xs space-y-0.5">
              <div className="flex items-center gap-1 font-bold text-slate-900 text-[11px]">
                <span>🪴</span> Snake Plant
              </div>
              <p className="text-[9.5px] text-slate-500 leading-tight">
                Hardy indoor greenery. Provides modest humidity benefit; negligible effect on indoor pollutants.
              </p>
            </div>
            <div className="bg-white p-2 rounded-xl border border-emerald-100 shadow-2xs space-y-0.5">
              <div className="flex items-center gap-1 font-bold text-slate-900 text-[11px]">
                <span>🌴</span> Areca Palm
              </div>
              <p className="text-[9.5px] text-slate-500 leading-tight">
                Natural room humidifier in dry winter air. Does not replace mechanical HEPA air filtration.
              </p>
            </div>
            <div className="bg-white p-2 rounded-xl border border-emerald-100 shadow-2xs space-y-0.5">
              <div className="flex items-center gap-1 font-bold text-slate-900 text-[11px]">
                <span>🍃</span> Money Plant
              </div>
              <p className="text-[9.5px] text-slate-500 leading-tight">
                Easy-care indoor plant for visual comfort. Has minimal impact on room air pollutants.
              </p>
            </div>
            <div className="bg-white p-2 rounded-xl border border-emerald-100 shadow-2xs space-y-0.5">
              <div className="flex items-center gap-1 font-bold text-slate-900 text-[11px]">
                <span>🌱</span> Spider Plant
              </div>
              <p className="text-[9.5px] text-slate-500 leading-tight">
                Resilient houseplant. Does not filter combustion smoke; always use a kitchen range hood or exhaust fan for stove emissions.
              </p>
            </div>
          </div>
          <p className="text-[10px] text-emerald-900 italic">
            *Scientific consensus: Houseplants provide psychological comfort and modest humidity, but have a negligible effect on indoor pollutants in real homes. Mechanical HEPA filtration and kitchen exhaust ventilation remain essential.
          </p>
        </div>
      )}
    </section>
  );
}
