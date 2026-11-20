'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { GeoLocation, AirQualityReport } from '@/domain/types';
import { normalizeAirQualityReport, RawOpenMeteoAirQualityResponse } from '@/domain/aqi/normalizer';
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

interface IndoorAirWorkspaceProps {
  readonly onOpenCopilotWithContext?: (prompt?: string, roomName?: string) => void;
}

const DEFAULT_LOCATION: GeoLocation = {
  id: 1273294,
  name: 'New Delhi',
  country: 'India',
  countryCode: 'IN',
  admin1: 'Delhi',
  latitude: 28.6139,
  longitude: 77.209,
  timezone: 'Asia/Kolkata',
};

function getSavedLocation(): GeoLocation {
  if (typeof window === 'undefined') return DEFAULT_LOCATION;
  try {
    const raw = localStorage.getItem('airaware_last_location');
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return DEFAULT_LOCATION;
}

export function IndoorAirWorkspace({ onOpenCopilotWithContext }: IndoorAirWorkspaceProps) {
  // 1. Reactive Indoor Storage via useSyncExternalStore
  const indoorState = useSyncExternalStore(
    subscribeIndoorStorage,
    loadIndoorState,
    getIndoorServerSnapshot
  );

  // 2. Fetch current environmental forecast report for active location
  const [location] = useState<GeoLocation>(getSavedLocation);
  const [report, setReport] = useState<AirQualityReport | null>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    async function fetchForecast() {
      setIsLoadingForecast(true);
      try {
        const res = await fetch(
          `/api/air-quality?latitude=${location.latitude}&longitude=${location.longitude}&timezone=${encodeURIComponent(
            location.timezone
          )}`
        );
        if (!res.ok) throw new Error('Failed to load atmospheric forecast');
        const rawJson: RawOpenMeteoAirQualityResponse = await res.json();
        const normalized = normalizeAirQualityReport(rawJson, location);
        if (!isCancelled) {
          setReport(normalized);
        }
      } catch {
        // Fallback gracefully without breaking UI
      } finally {
        if (!isCancelled) {
          setIsLoadingForecast(false);
        }
      }
    }

    fetchForecast();
    return () => {
      isCancelled = true;
    };
  }, [location]);

  const activeRoomArea = indoorState.roomAreas[indoorState.selectedRoomId] || 20;

  return (
    <div className="w-full space-y-6 animate-fadeIn py-2 sm:py-4">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">🏡</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)] font-sans">
              Indoor Air Intelligence
            </h1>
            <span className="text-xs font-mono font-bold text-[var(--brand-primary)] bg-[var(--brand-surface)] px-2.5 py-0.5 rounded-full border border-[var(--brand-primary)]/30">
              Phase 4 Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--ink-secondary)] mt-1 max-w-2xl leading-relaxed">
            Protect your family's breathing zones. Understand indoor sources, practical kitchen and dusting mitigations, purifier sizing, and forecast ventilation windows.
          </p>
        </div>

        {/* Location & Storage Indicator */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto text-xs font-mono text-[var(--ink-muted)]">
          <span className="px-2.5 py-1 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
            📍 {location.name}, {location.countryCode}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
            🔒 100% Local-First
          </span>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols on desktop): Home Cutaway & Ventilation Advisor */}
        <div className="lg:col-span-7 space-y-6">
          <TheAirAwareHome
            selectedRoomId={indoorState.selectedRoomId}
            roomAreas={indoorState.roomAreas}
            onSelectRoom={setSelectedRoom}
            onUpdateArea={updateRoomArea}
            onAskCopilot={(q) => onOpenCopilotWithContext?.(q, indoorState.selectedRoomId)}
          />

          <VentilationAdvisor
            report={report}
            onAskCopilot={(q) => onOpenCopilotWithContext?.(q, indoorState.selectedRoomId)}
          />
        </div>

        {/* Right Column (5 cols on desktop): CADR Sizer, Sources, Filter Log */}
        <div className="lg:col-span-5 space-y-6">
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

          <FilterMaintenanceLog
            filterLog={indoorState.filterLog}
            onUpdateLog={updateFilterLog}
            onAskCopilot={(q) => onOpenCopilotWithContext?.(q, indoorState.selectedRoomId)}
          />

          <PollutionSourceMatrix
            onAskCopilot={(q) => onOpenCopilotWithContext?.(q, indoorState.selectedRoomId)}
          />
        </div>
      </div>

      {/* Scientific Grounding & Methodology Expandable Drawer */}
      <details className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]/70 p-4 sm:p-5 text-xs text-[var(--ink-secondary)]">
        <summary className="flex items-center justify-between cursor-pointer list-none select-none font-mono font-bold uppercase tracking-wider text-[var(--ink-primary)]">
          <span className="flex items-center gap-2">
            <span>🔬</span>
            <span>Indoor Air Science &amp; CADR Standards Disclosure</span>
          </span>
          <span className="text-[10px] text-[var(--ink-muted)] group-open:rotate-180 transition-transform">
            ▼
          </span>
        </summary>

        <div className="mt-3.5 pt-3 border-t border-[var(--border-subtle)] space-y-3 leading-relaxed">
          <p>
            <strong>Clean Air Delivery Rate (CADR):</strong> Measured under ANSI/AHAM AC-1 standardized chamber tests. CADR ratings specify the volume of filtered air delivered per unit of time (m³/h or CFM) under maximum fan speed. Real-world air cleaning depends on fan operating speed, room air circulation geometry, and filter loading.
          </p>
          <p>
            <strong>Air Changes per Hour (ACH):</strong> Calculated as ACH = CADR / Room Volume. A baseline of 3 to 5 ACH is a widely cited engineering standard for residential particulate reduction. It is an engineering air turnover metric, not a medical or clinical health guarantee.
          </p>
          <p>
            <strong>Filtration Boundaries:</strong> Standard HEPA filters capture 99.97% of 0.3 µm airborne particulate matter (PM2.5, pollen, mold spores, combustion smoke particles). HEPA does not remove volatile organic compounds (VOCs) or gaseous combustion products (NO2, CO). Gaseous removal requires dense activated carbon adsorbent beds. Ozone-generating air purifiers are not recommended.
          </p>
        </div>
      </details>
    </div>
  );
}
