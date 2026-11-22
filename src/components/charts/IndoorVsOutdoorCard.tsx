'use client';

import React, { useSyncExternalStore } from 'react';
import {
  subscribeIndoorStorage,
  loadIndoorState,
  getIndoorServerSnapshot,
} from '@/domain/indoor/storage';
import { calculateCpcbPm25SubIndex } from '@/domain/aqi/cpcb-benchmark';

interface IndoorVsOutdoorCardProps {
  readonly outdoorPm25: number | null | undefined;
}

function getCpcbCategory(aqi: number | null): { label: string; color: string } {
  if (aqi === null) return { label: 'N/A', color: '#94A3B8' };
  if (aqi <= 50) return { label: 'Good', color: '#059669' };
  if (aqi <= 100) return { label: 'Satisfactory', color: '#84CC16' };
  if (aqi <= 200) return { label: 'Moderate', color: '#D97706' };
  if (aqi <= 300) return { label: 'Poor', color: '#EA580C' };
  if (aqi <= 400) return { label: 'Very Poor', color: '#DC2626' };
  return { label: 'Severe', color: '#7F1D1D' };
}

export function IndoorVsOutdoorCard({ outdoorPm25 }: IndoorVsOutdoorCardProps) {
  const indoorState = useSyncExternalStore(
    subscribeIndoorStorage,
    loadIndoorState,
    getIndoorServerSnapshot
  );

  const indoorPm25 = indoorState.indoorPm25Reading;

  // Case 1: No user-reported indoor reading
  if (indoorPm25 === null || indoorPm25 === undefined) {
    return (
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs space-y-2 font-sans">
        <div className="flex items-center gap-2">
          <span className="text-base select-none" aria-hidden="true">
            🏡
          </span>
          <h4 className="text-xs font-bold text-slate-900 font-sans">
            Compare with Indoor Air
          </h4>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Track personal filtration performance by recording your indoor monitor or purifier reading in the{' '}
          <strong className="text-teal-800">Indoor Air</strong> workspace.
        </p>
      </div>
    );
  }

  // Case 2: User has entered an indoor reading
  const outVal = typeof outdoorPm25 === 'number' && Number.isFinite(outdoorPm25) ? outdoorPm25 : 35;
  const indoorSubIndex = calculateCpcbPm25SubIndex(indoorPm25);
  const outdoorSubIndex = calculateCpcbPm25SubIndex(outVal);

  const indoorCat = getCpcbCategory(indoorSubIndex);
  const outdoorCat = getCpcbCategory(outdoorSubIndex);

  let takeaway = '';
  let isCleaner = false;
  if (outVal > 0) {
    const diffPct = Math.round(((outVal - indoorPm25) / outVal) * 100);
    if (diffPct > 0) {
      isCleaner = true;
      takeaway = `Indoor air is ${diffPct}% cleaner than outside.`;
    } else if (diffPct < 0) {
      takeaway = `Indoor PM₂.₅ is ${Math.abs(diffPct)}% higher than outside — ventilate or reduce indoor sources.`;
    } else {
      takeaway = 'Indoor PM₂.₅ matches outdoor ambient concentration.';
    }
  } else {
    takeaway = `Indoor PM₂.₅: ${indoorPm25} µg/m³.`;
  }

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base select-none" aria-hidden="true">
            🏡
          </span>
          <div>
            <h4 className="text-xs font-bold text-slate-900 font-sans">
              Indoor vs Outdoor PM₂.₅ Comparison
            </h4>
            <span className="text-[10px] font-mono font-semibold text-slate-500">
              User-reported indoor monitor vs local ambient air
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          Personal Monitor
        </span>
      </div>

      {/* Side-by-side reading cards */}
      <div className="grid grid-cols-2 gap-3 pt-0.5">
        {/* Indoor */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
            Indoor Home
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
              {indoorPm25}
            </span>
            <span className="text-[10px] text-slate-500">µg/m³</span>
          </div>
          <span
            className="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-bold"
            style={{
              backgroundColor: `${indoorCat.color}18`,
              color: indoorCat.color,
            }}
          >
            {indoorCat.label}
          </span>
        </div>

        {/* Outdoor */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
            Outdoor Ambient
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
              {outVal}
            </span>
            <span className="text-[10px] text-slate-500">µg/m³</span>
          </div>
          <span
            className="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-bold"
            style={{
              backgroundColor: `${outdoorCat.color}18`,
              color: outdoorCat.color,
            }}
          >
            {outdoorCat.label}
          </span>
        </div>
      </div>

      {/* Takeaway banner */}
      <div
        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
          isCleaner
            ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
            : 'bg-amber-50 text-amber-950 border-amber-300'
        }`}
      >
        <span>{isCleaner ? '🛡️' : '⚠️'}</span>
        <span>{takeaway}</span>
      </div>
    </div>
  );
}
