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
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
    >
      {/* KPI 1: Active Regulatory GRAP Mandate */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/80 via-white to-rose-50/40 border border-rose-200/90 shadow-2xs flex flex-col justify-between gap-1.5 transition-all hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" aria-hidden="true" />
            CAQM Airshed Mandate
          </span>
          <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-100/70 px-2 py-0.5 rounded border border-rose-200">
            Official
          </span>
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-black text-rose-950 font-sans tracking-tight">
            {activeGrapStage}
          </h3>
          <p className="text-[11px] text-rose-800/90 leading-snug mt-0.5">
            Emergency mitigation restrictions in effect across municipal airshed.
          </p>
        </div>
      </div>

      {/* KPI 2: Diurnal Ventilation Window */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/40 border border-teal-200/90 shadow-2xs flex flex-col justify-between gap-1.5 transition-all hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
            <span>🪟</span> Diurnal Airing Window
          </span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              ventilationWindow.isOpenNow
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {ventilationWindow.isOpenNow ? 'ACTIVE NOW' : 'SEALED'}
          </span>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-base sm:text-lg font-black text-slate-900 font-sans tracking-tight">
              {ventilationWindow.windowStart} – {ventilationWindow.windowEnd}
            </h3>
          </div>
          <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
            {ventilationWindow.isOpenNow
              ? 'Solar thermal ceiling elevated. Safe for 15-min cross-ventilation.'
              : `Inversion lid compressed (<150m). Keep home sealed until afternoon.`}
          </p>
        </div>
      </div>

      {/* KPI 3: Local Citizen Incident Journal */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/40 border border-indigo-200/90 shadow-2xs flex flex-col justify-between gap-1.5 transition-all hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
            <span>🛡️</span> Incident Journal
          </span>
          <span className="text-[10px] font-mono font-bold text-indigo-800 bg-indigo-100/70 px-2 py-0.5 rounded border border-indigo-200">
            Local-First
          </span>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-indigo-950">
              {incidentCount}
            </span>
            <span className="text-xs font-bold text-indigo-800">
              {incidentCount === 1 ? 'incident' : 'incidents'} logged
            </span>
          </div>
          <p className="text-[11px] text-indigo-800/90 leading-snug mt-0.5">
            Stored securely on this device. Ready for CPCB Sameer export.
          </p>
        </div>
      </div>

      {/* KPI 4: RWA & Society Bulletin Dispatcher */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border border-amber-200/90 shadow-2xs flex flex-col justify-between gap-2 transition-all hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
            <span>📢</span> RWA Notice Board
          </span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-100 px-2 py-0.2 rounded-full border border-rose-300">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Society Action Bulletin
            </h3>
            <p className="text-[10px] text-slate-500 leading-snug">
              Pre-composed notice for residential WhatsApp groups.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenRwaModal}
            className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition-colors shrink-0 cursor-pointer flex items-center gap-1"
            title="Open RWA society bulletin dispatcher"
          >
            <span>💬</span>
            <span>Share</span>
          </button>
        </div>
      </div>
    </section>
  );
}
