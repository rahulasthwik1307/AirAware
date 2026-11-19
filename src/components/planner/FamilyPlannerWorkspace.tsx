'use client';

import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { GeoLocation, AirQualityReport } from '@/domain/types';
import { normalizeAirQualityReport, RawOpenMeteoAirQualityResponse } from '@/domain/aqi/normalizer';
import {
  loadHouseholdState,
  getHouseholdServerSnapshot,
  subscribeHouseholdStorage,
  addHouseholdMember,
  updateHouseholdMember,
  removeHouseholdMember,
  setActiveHouseholdMember,
  addMemberSchedule,
  removeMemberSchedule,
} from '@/domain/household/storage';
import {
  loadActivePlanState,
  getActivePlanServerSnapshot,
  subscribeActivePlanStorage,
  adoptRecommendation,
  updateActionItem,
  markActionCompleted,
  markActionSkipped,
  removeActionItem,
} from '@/domain/planner/storage';
import { generateMemberRecommendations } from '@/domain/planner/recommendation-engine';
import { PlannerRecommendation, TimeWindow } from '@/domain/planner/types';
import { FamilyDailyBriefing } from './FamilyDailyBriefing';
import { FamilyScheduleBoard } from './FamilyScheduleBoard';
import { HouseholdProfilesManager } from './HouseholdProfilesManager';
import { ScheduleTimeline } from './ScheduleTimeline';
import { ActivePlanTracker } from './ActivePlanTracker';
import { RecommendationCard } from './RecommendationCard';

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

export function FamilyPlannerWorkspace() {
  // Reactive Storage Synchronization via useSyncExternalStore
  const householdState = useSyncExternalStore(
    subscribeHouseholdStorage,
    loadHouseholdState,
    getHouseholdServerSnapshot
  );

  const activePlanState = useSyncExternalStore(
    subscribeActivePlanStorage,
    loadActivePlanState,
    getActivePlanServerSnapshot
  );

  // Environmental Forecast State
  const [location] = useState<GeoLocation>(getSavedLocation);
  const [report, setReport] = useState<AirQualityReport | null>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState(true);
  const [forecastError, setForecastError] = useState<string | null>(null);

  // View Filter State: 'ALL_FAMILY' (default) or memberId
  const [selectedViewFilter, setSelectedViewFilter] = useState<string>('ALL_FAMILY');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMethodologyExpanded, setIsMethodologyExpanded] = useState(false);
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [targetMemberForSchedule, setTargetMemberForSchedule] = useState<string | null>(null);

  const handleOpenAddSchedule = (memberId?: string) => {
    setTargetMemberForSchedule(
      memberId ?? (selectedViewFilter !== 'ALL_FAMILY' ? selectedViewFilter : householdState.members[0]?.id ?? null)
    );
    setIsAddScheduleModalOpen(true);
  };

  const handleCloseAddSchedule = () => {
    setIsAddScheduleModalOpen(false);
    setTargetMemberForSchedule(null);
  };

  // Fetch Environmental Forecast for Location
  useEffect(() => {
    let isCancelled = false;
    async function fetchForecast() {
      setIsLoadingForecast(true);
      setForecastError(null);
      try {
        const res = await fetch(
          `/api/air-quality?latitude=${location.latitude}&longitude=${location.longitude}&timezone=${encodeURIComponent(
            location.timezone
          )}`
        );
        if (!res.ok) {
          throw new Error(`Air quality API returned status ${res.status}`);
        }
        const rawData: RawOpenMeteoAirQualityResponse = await res.json();
        if (!isCancelled) {
          const normalized = normalizeAirQualityReport(rawData, location, 'US_EPA');
          setReport(normalized);
        }
      } catch (err) {
        if (!isCancelled) {
          setForecastError(err instanceof Error ? err.message : 'Failed to fetch environmental forecast');
        }
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

  // Generate Deterministic Recommendations across all household members
  const householdRecommendations = useMemo(() => {
    if (!householdState.members || householdState.members.length === 0 || !report?.forecast) {
      return [];
    }
    const allRecs: PlannerRecommendation[] = [];
    for (const member of householdState.members) {
      const recs = generateMemberRecommendations({
        member,
        forecast: report.forecast,
        modelMetadata: report.modelMetadata,
      });
      allRecs.push(...recs);
    }
    return allRecs;
  }, [householdState.members, report]);

  // Recommendations filtered by active view filter
  const displayedRecommendations = useMemo(() => {
    if (selectedViewFilter === 'ALL_FAMILY') {
      return householdRecommendations;
    }
    return householdRecommendations.filter((r) => r.memberId === selectedViewFilter);
  }, [householdRecommendations, selectedViewFilter]);

  // Flattened Activities for Secondary Forecast Overlay
  const allActivitiesForTimeline = useMemo(() => {
    const targetMembers =
      selectedViewFilter === 'ALL_FAMILY'
        ? householdState.members
        : householdState.members.filter((m) => m.id === selectedViewFilter);

    return targetMembers.flatMap((member) =>
      member.schedules.map((schedule) => ({
        schedule,
        memberNickname: member.nickname,
      }))
    );
  }, [householdState.members, selectedViewFilter]);

  // Handlers for Household Profiles
  const handleSelectViewFilter = (filterId: string) => {
    setSelectedViewFilter(filterId);
    if (filterId !== 'ALL_FAMILY') {
      setActiveHouseholdMember(householdState, filterId);
    }
  };

  const handleAddMember = (input: Parameters<typeof addHouseholdMember>[1]): boolean => {
    const res = addHouseholdMember(householdState, input);
    return res.newMemberId !== null;
  };

  const handleUpdateMember = (
    memberId: string,
    updates: Parameters<typeof updateHouseholdMember>[2]
  ) => {
    updateHouseholdMember(householdState, memberId, updates);
  };

  const handleRemoveMember = (memberId: string) => {
    removeHouseholdMember(householdState, memberId);
    if (selectedViewFilter === memberId) {
      setSelectedViewFilter('ALL_FAMILY');
    }
  };

  const handleAddSchedule = (memberId: string, schedule: Parameters<typeof addMemberSchedule>[2]) => {
    addMemberSchedule(householdState, memberId, schedule);
  };

  const handleRemoveSchedule = (memberId: string, scheduleId: string) => {
    removeMemberSchedule(householdState, memberId, scheduleId);
  };

  // Handlers for Active Routine Loop
  const handleAdoptRecommendation = (rec: PlannerRecommendation) => {
    adoptRecommendation(activePlanState, rec);
  };

  const handleUpdateAction = (actionId: string, adjustedWindow: TimeWindow, notes?: string) => {
    updateActionItem(activePlanState, actionId, { adjustedWindow, userNotes: notes });
  };

  const handleMarkComplete = (actionId: string) => {
    markActionCompleted(activePlanState, actionId);
  };

  const handleMarkSkipped = (actionId: string) => {
    markActionSkipped(activePlanState, actionId);
  };

  const handleRemoveAction = (actionId: string) => {
    removeActionItem(activePlanState, actionId);
  };

  const handleJumpToActions = () => {
    const el = document.getElementById('todays-actions');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const activeMemberObj = householdState.members.find((m) => m.id === selectedViewFilter);
  const activeNicknameLabel =
    selectedViewFilter === 'ALL_FAMILY' ? 'All Family' : activeMemberObj?.nickname ?? 'All Family';

  return (
    <div className="w-full space-y-6 animate-fadeIn py-2 sm:py-4">
      {/* Workspace Header & Provenance */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl select-none" aria-hidden="true">
                📅
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--ink-primary)] font-sans">
                Family Daily Planner
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[var(--brand-surface)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/20">
                Phase 3 Verified
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--ink-secondary)] max-w-2xl leading-relaxed">
              The Family Morning Command Center. Coordinate school runs, commutes, exercise, and ventilation with live diurnal smog forecasts. 100% local-first in your browser.
            </p>
          </div>

          {/* Active Context Indicators */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-xl bg-[var(--surface-subtle)] text-[var(--ink-primary)] border border-[var(--border-subtle)]">
              📍 {location.name}, {location.countryCode}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-[var(--brand-surface)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/20">
              🔒 100% Local Storage
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: FAMILY DAILY BRIEFING */}
      <FamilyDailyBriefing
        members={householdState.members}
        forecast={report?.forecast ?? []}
        recommendations={householdRecommendations}
        adoptedCount={activePlanState.actions.length}
        modelMetadata={report?.modelMetadata}
        isLoadingForecast={isLoadingForecast}
        forecastError={forecastError}
        onJumpToActions={handleJumpToActions}
      />

      {/* SECTION 2: WHOLE FAMILY SELECTOR & SECTION 7: HOUSEHOLD SETTINGS */}
      <HouseholdProfilesManager
        members={householdState.members}
        selectedViewFilter={selectedViewFilter}
        onSelectViewFilter={handleSelectViewFilter}
        onAddMember={handleAddMember}
        onUpdateMember={handleUpdateMember}
        onRemoveMember={handleRemoveMember}
        onAddSchedule={handleAddSchedule}
        onRemoveSchedule={handleRemoveSchedule}
        isSettingsOpen={isSettingsOpen}
        onToggleSettings={() => setIsSettingsOpen((prev) => !prev)}
        isAddScheduleOpen={isAddScheduleModalOpen}
        onOpenAddSchedule={handleOpenAddSchedule}
        onCloseAddSchedule={handleCloseAddSchedule}
        targetScheduleMemberId={targetMemberForSchedule}
      />

      {/* SECTION 3: FAMILY-WIDE VISUAL DAILY TIMELINE (UNIFIED SWIMLANES & 4-PERIOD MOBILE SUMMARY) */}
      {report?.forecast && (
        <ScheduleTimeline
          memberNickname={activeNicknameLabel}
          members={householdState.members}
          activeViewFilter={selectedViewFilter}
          schedules={allActivitiesForTimeline}
          forecast={report.forecast}
          activePlanActions={activePlanState.actions}
          onSelectMember={(memberId) => handleSelectViewFilter(memberId)}
          onAddActivityClick={handleOpenAddSchedule}
        />
      )}

      {/* SECTION 4: CHRONOLOGICAL FAMILY SCHEDULE & ROUTINE STREAM */}
      <FamilyScheduleBoard
        members={householdState.members}
        activeViewFilter={selectedViewFilter}
        forecast={report?.forecast ?? []}
        recommendations={householdRecommendations}
        activePlanActions={activePlanState.actions}
        onAdoptRecommendation={handleAdoptRecommendation}
        onAddActivityClick={() => handleOpenAddSchedule()}
      />

      {/* SECTION 5: TODAY'S FAMILY ACTION CHECKLIST */}
      <ActivePlanTracker
        actions={activePlanState.actions}
        selectedMemberId={selectedViewFilter}
        onMarkComplete={handleMarkComplete}
        onMarkSkipped={handleMarkSkipped}
        onRemoveAction={handleRemoveAction}
        onUpdateAction={handleUpdateAction}
      />

      {/* SECTION 6: SCIENTIFIC METHODOLOGY & PRIVACY BOUNDARY */}
      <footer className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4 sm:p-5 text-xs text-[var(--ink-secondary)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-base select-none" aria-hidden="true">
              🔬
            </span>
            <h3 className="font-bold text-[var(--ink-primary)] font-sans">
              Scientific Method &amp; Privacy Boundary
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsMethodologyExpanded((prev) => !prev)}
            className="text-[11px] font-mono text-[var(--brand-primary)] hover:underline cursor-pointer self-start sm:self-auto"
            aria-expanded={isMethodologyExpanded}
          >
            {isMethodologyExpanded ? 'Hide Methodology Details ▲' : 'Show Methodology Details ▼'}
          </button>
        </div>

        <p className="leading-relaxed">
          AirAware uses regional air-quality forecasts from the Copernicus Atmosphere Monitoring Service (Open-Meteo CAMS) to help your family plan daily activities around lower forecast pollution periods. Forecasts are numerical atmospheric simulations and may differ from localized ground-level station readings. Your family profiles, schedules, and adopted actions remain 100% on this device in browser localStorage.
        </p>

        {isMethodologyExpanded && (
          <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2 text-[11px] font-mono text-[var(--ink-muted)] leading-relaxed animate-fadeIn">
            <p>
              • <strong>Modelled ambient concentration difference (ΔC):</strong> Evaluates ΔC = C_original − C_adjusted. A positive value indicates a lower modelled ambient concentration during the adjusted window compared with the original window. This represents a modelled outdoor air concentration difference, not personal inhaled dose.
            </p>
            <p>
              • <strong>Operational Transport Emissions:</strong> Emissions reductions reflect direct operational tailpipe benchmarks (UK DESNZ/DEFRA 2023) and traction benchmarks. Avoided vehicle emissions reduce collective carbon footprint but do not directly clean the measured ambient air quality of your neighborhood.
            </p>
            <p>
              • <strong>Zero Cloud Tracking:</strong> No personal or household data is transmitted to external servers. Only coordinate-based queries for weather and regional atmospheric model fields are fetched.
            </p>
          </div>
        )}
      </footer>
    </div>
  );
}
