'use client';

import React from 'react';
import { DiurnalVentilationWindow } from '@/domain/community/types';

interface CommunityKpiStripProps {
  readonly unreadCount: number;
  readonly activeGrapStage: string;
  readonly ventilationWindow: DiurnalVentilationWindow;
  readonly incidentCount: number;
  readonly onOpenRwaModal: () => void;
}

export function CommunityKpiStrip({
  unreadCount,
  activeGrapStage,
  ventilationWindow,
  incidentCount,
  onOpenRwaModal,
}: CommunityKpiStripProps) {
  return (
    <section
      aria-label="Community Airshed KPI Intelligence"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-stretch"
    >
      {/* KPI 1: Active Regulatory GRAP Mandate */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/90 via-white to-rose-50/50 border border-rose-200/90 shadow-2xs flex flex-col justify-between gap-2.5 transition-all hover:shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" aria-hidden="true" />
            Government Rules
          </span>
          <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-100/90 px-2 py-0.5 rounded border border-rose-200 shrink-0">
            Active
          </span>
        </div>
        <div className="space-y-1 my-auto">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-extrabold text-rose-950 font-sans tracking-tight">
              {activeGrapStage}
            </h3>
            <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-100/80 px-1.5 py-0.2 rounded border border-rose-200 shrink-0">
              AQI 378
            </span>
          </div>
          <p className="text-[11px] text-rose-900/85 leading-snug">
            Generator ban, carpool priority &amp; extra metro runs active.
          </p>
        </div>
        <div className="pt-2 border-t border-rose-100/80 flex items-center justify-between text-[10px] font-mono text-rose-700">
          <span>🚨 CAQM Mandate</span>
          <span>Level 2 Alert</span>
        </div>
      </div>

      {/* KPI 2: Diurnal Ventilation Window */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50/90 via-white to-emerald-50/50 border border-teal-200/90 shadow-2xs flex flex-col justify-between gap-2.5 transition-all hover:shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
            <span>🪟</span> Safe Window Timing
          </span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${
              ventilationWindow.isOpenNow
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {ventilationWindow.isOpenNow ? 'SAFE TO AIR' : 'KEEP CLOSED'}
          </span>
        </div>
        <div className="space-y-1 my-auto">
          <h3 className="text-sm font-extrabold text-slate-900 font-sans tracking-tight">
            {ventilationWindow.windowStart} – {ventilationWindow.windowEnd}
          </h3>
          <p className="text-[11px] text-slate-600 leading-snug">
            {ventilationWindow.isOpenNow
              ? 'Warm afternoon sunlight lifts smog. Safe for 15-min cross-ventilation.'
              : 'Cold ground inversion traps smog below 150m. Keep home sealed until afternoon.'}
          </p>
        </div>
        <div className="pt-2 border-t border-teal-100/80 flex items-center justify-between text-[10px] font-mono text-teal-700">
          <span>Ceiling: {ventilationWindow.mixingHeightMeters}m</span>
          <span>Window: 3h Active</span>
        </div>
      </div>

      {/* KPI 3: Local Citizen Incident Journal */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/50 border border-indigo-200/90 shadow-2xs flex flex-col justify-between gap-2.5 transition-all hover:shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
            <span>🛡️</span> Community Reports
          </span>
          <span className="text-[10px] font-mono font-bold text-indigo-800 bg-indigo-100/80 px-2 py-0.5 rounded border border-indigo-200 shrink-0">
            Local-First
          </span>
        </div>
        <div className="space-y-1 my-auto">
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-sm font-extrabold text-indigo-950 font-sans tracking-tight">
              {incidentCount} {incidentCount === 1 ? 'Report' : 'Reports'} Saved on Device
            </h3>
          </div>
          <p className="text-[11px] text-indigo-900/85 leading-snug">
            Saved safely in local device journal. Ready for instant WhatsApp dispatch.
          </p>
        </div>
        <div className="pt-2 border-t border-indigo-100/80 flex items-center justify-between text-[10px] font-mono text-indigo-700">
          <span>🔒 100% Private</span>
          <span>Zero Cloud Tracking</span>
        </div>
      </div>

      {/* KPI 4: RWA & Society Bulletin Dispatcher */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 via-white to-amber-50/50 border border-amber-200/90 shadow-2xs flex flex-col justify-between gap-2.5 transition-all hover:shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
            <span>📢</span> RWA Notice Board
          </span>
          {unreadCount > 0 ? (
            <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-100 px-2 py-0.2 rounded-full border border-rose-300 shrink-0">
              {unreadCount} unread
            </span>
          ) : (
            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200 shrink-0">
              Ready
            </span>
          )}
        </div>
        <div className="space-y-1 my-auto">
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
            Society Action Bulletin
          </h3>
          <p className="text-[11px] text-slate-600 leading-snug">
            Pre-composed clean-air notice for apartment WhatsApp groups.
          </p>
        </div>
        <div className="pt-2 border-t border-amber-100/80 flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-amber-800">
            One-Tap Share
          </span>
          <button
            type="button"
            onClick={onOpenRwaModal}
            className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
            title="Open RWA society bulletin dispatcher"
          >
            <span>📢</span>
            <span>Dispatch Notice</span>
          </button>
        </div>
      </div>
    </section>
  );
}
