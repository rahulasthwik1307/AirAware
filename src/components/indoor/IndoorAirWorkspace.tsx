'use client';

import React, { useSyncExternalStore } from 'react';
import { useAirQuality, DEFAULT_LOCATION } from '@/hooks/aqi/useAirQuality';
import {
  subscribeIndoorStorage,
  loadIndoorState,
  getIndoorServerSnapshot,
  setSelectedRoom,
  updateRoomArea,
  updateCeilingHeight,
  updatePurifierSettings,
  updateFilterLog,
} from '@/domain/indoor/storage';
import { TheAirAwareHome } from './TheAirAwareHome';
import { VentilationAdvisor } from './VentilationAdvisor';
import { PollutionSourceMatrix } from './PollutionSourceMatrix';
import { CleanAirSizer } from './CleanAirSizer';
import { FilterMaintenanceLog } from './FilterMaintenanceLog';
import { IndoorAirReadingCard } from './IndoorAirReadingCard';

interface IndoorAirWorkspaceProps {
  readonly onOpenCopilotWithContext?: (prompt?: string, roomName?: string) => void;
}

export function IndoorAirWorkspace({ onOpenCopilotWithContext }: IndoorAirWorkspaceProps) {
  // 1. Reactive Indoor Storage via useSyncExternalStore
  const indoorState = useSyncExternalStore(
    subscribeIndoorStorage,
    loadIndoorState,
    getIndoorServerSnapshot
  );

  // 2. Shared single-source environmental forecast report for active location
  const { location, report } = useAirQuality();
  const activeLocation = location ?? DEFAULT_LOCATION;

  const activeRoomArea = indoorState.roomAreas[indoorState.selectedRoomId] || 22;

  return (
    <div className="w-full space-y-6 animate-fadeIn py-2 sm:py-4">
      {/* Workspace Header - Zero Phase 4 Terminology */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">🏡</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
              Indoor Air Intelligence
            </h1>
            <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              Breathing Zone Protection
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Track room air quality, size purifiers, and keep your indoor air clean.
          </p>
        </div>

        {/* Location & Storage Indicator */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto text-xs font-mono text-slate-600">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
            📍 {activeLocation.name}, {activeLocation.countryCode}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
            🔒 100% Local-First
          </span>
        </div>
      </div>

      {/* User Indoor Reading & Room Protection Directive */}
      <IndoorAirReadingCard
        outdoorPm25={report?.pollutants?.pm2_5?.concentration ?? 60}
        savedReading={indoorState.indoorPm25Reading}
        hasMonitor={indoorState.hasMonitor}
        bestVentilationWindow="1:00 PM – 3:00 PM"
        onAskCopilot={(q) => onOpenCopilotWithContext?.(q, indoorState.selectedRoomId)}
      />

      {/* Main Balanced Grid: Row 1 (Home Cutaway & Purifier Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="h-full">
          <TheAirAwareHome
            selectedRoomId={indoorState.selectedRoomId}
            roomAreas={indoorState.roomAreas}
            onSelectRoom={setSelectedRoom}
            onUpdateArea={updateRoomArea}
            onAskCopilot={(q) => onOpenCopilotWithContext?.(q, indoorState.selectedRoomId)}
          />
        </div>

        <div className="h-full">
          <CleanAirSizer
            floorAreaM2={activeRoomArea}
            ceilingHeightM={indoorState.ceilingHeightM}
            selectedCadrM3h={indoorState.selectedCadrM3h}
            targetAch={indoorState.targetAch}
            onUpdateArea={(area) => updateRoomArea(indoorState.selectedRoomId, area)}
            onUpdateCeilingHeight={updateCeilingHeight}
            onUpdatePurifier={updatePurifierSettings}
            onAskCopilot={(q) => onOpenCopilotWithContext?.(q, indoorState.selectedRoomId)}
          />
        </div>
      </div>

      {/* Main Balanced Grid: Row 2 (Ventilation Advisor & Filter Log) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="h-full">
          <VentilationAdvisor
            report={report}
            onAskCopilot={(q) => onOpenCopilotWithContext?.(q, indoorState.selectedRoomId)}
          />
        </div>

        <div className="h-full">
          <FilterMaintenanceLog
            filterLog={indoorState.filterLog}
            onUpdateLog={updateFilterLog}
            onAskCopilot={(q) => onOpenCopilotWithContext?.(q, indoorState.selectedRoomId)}
          />
        </div>
      </div>

      {/* Main Balanced Grid: Row 3 (Full Width Source Intelligence) */}
      <div className="w-full">
        <PollutionSourceMatrix
          onAskCopilot={(q) => onOpenCopilotWithContext?.(q, indoorState.selectedRoomId)}
        />
      </div>

      {/* Scientific Grounding & Methodology Disclosure Card */}
      <details className="group rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition-all">
        <summary className="flex items-center justify-between cursor-pointer list-none select-none p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-sky-50/20 to-slate-50 hover:bg-slate-100/60 transition-colors">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-lg p-1.5 rounded-lg bg-sky-100 text-sky-800" aria-hidden="true">🔬</span>
            <span className="font-sans font-bold text-sm text-slate-900 tracking-tight">
              Indoor Air Science &amp; CADR Standards Disclosure
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
              ANSI/AHAM AC-1 &amp; ASHRAE Reference
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-sky-800 shrink-0">
            <span className="group-open:hidden">View Methodology ▼</span>
            <span className="hidden group-open:inline">Hide Methodology ▲</span>
          </div>
        </summary>

        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/40 grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <strong className="text-xs font-bold text-slate-900 font-sans flex items-center gap-1.5">
                <span>💨</span>
                <span>Clean Air Delivery Rate (CADR)</span>
              </strong>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                ANSI/AHAM AC-1
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
              Measured under standardized sealed test chambers. CADR indicates filtered air volume delivered per hour (m³/h or CFM) at maximum fan speed. Real performance derates 50–70% on low/quiet settings.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <strong className="text-xs font-bold text-slate-900 font-sans flex items-center gap-1.5">
                <span>🔄</span>
                <span>Air Changes per Hour (ACH)</span>
              </strong>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                ACH = CADR ÷ Volume
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
              Residential turnover benchmark. 3 to 5 ACH is the standard engineering baseline for active particulate reduction. It is an engineering air turnover rate, not a medical or clinical guarantee.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <strong className="text-xs font-bold text-slate-900 font-sans flex items-center gap-1.5">
                <span>🛡️</span>
                <span>Filtration Boundaries</span>
              </strong>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                HEPA vs Carbon
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
              HEPA captures 99.97% of 0.3 µm particles (soot, dust, pollen). Gaseous pollutants (combustion NO₂, formaldehyde, and VOCs) bypass HEPA completely and require dense activated carbon beds.
            </p>
          </div>
        </div>
      </details>
    </div>
  );
}
