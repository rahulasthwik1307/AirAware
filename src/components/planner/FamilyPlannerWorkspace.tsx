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

  // Active Member Resolution
  const activeMember = useMemo(() => {
    if (!householdState.members || householdState.members.length === 0) return null;
    return (
      householdState.members.find((m) => m.id === householdState.activeMemberId) ??
      householdState.members[0]
    );
  }, [householdState.members, householdState.activeMemberId]);

  // Generate Deterministic Recommendations for Active Member
  const recommendations = useMemo(() => {
    if (!activeMember || !report?.forecast) return [];
    return generateMemberRecommendations({
      member: activeMember,
      forecast: report.forecast,
      modelMetadata: report.modelMetadata,
    });
  }, [activeMember, report]);

  // Handlers for Household Profiles
  const handleSelectMember = (memberId: string) => {
    setActiveHouseholdMember(householdState, memberId);
  };

  const handleAddMember = (input: Parameters<typeof addHouseholdMember>[1]) => {
    addHouseholdMember(householdState, input);
  };

  const handleUpdateMember = (
    memberId: string,
    updates: Parameters<typeof updateHouseholdMember>[2]
  ) => {
    updateHouseholdMember(householdState, memberId, updates);
  };

  const handleRemoveMember = (memberId: string) => {
    removeHouseholdMember(householdState, memberId);
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
              Coordinate school runs, office commutes, outdoor exercise, and ventilation windows with live diurnal smog forecasts. 100% local-first in your browser.
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

        {/* Scientific Integrity Notice */}
        <div className="mt-4 pt-3.5 border-t border-[var(--border-subtle)] flex items-start gap-2 text-xs text-[var(--ink-muted)] leading-relaxed">
          <span className="text-sm select-none" aria-hidden="true">
            ℹ️
          </span>
          <p>
            <strong className="text-[var(--ink-secondary)]">Scientific Integrity Policy:</strong> Personal exposure differences (ΔC) represent ambient modelled concentration differentials and do not measure inhaled pulmonary dose. Avoided transport emissions reduce collective footprint, but do not directly clean the measured ambient AQI of your neighborhood.
          </p>
        </div>
      </div>

      {/* Household Profiles Management */}
      <HouseholdProfilesManager
        members={householdState.members}
        activeMemberId={householdState.activeMemberId}
        onSelectMember={handleSelectMember}
        onAddMember={handleAddMember}
        onUpdateMember={handleUpdateMember}
        onRemoveMember={handleRemoveMember}
        onAddSchedule={handleAddSchedule}
        onRemoveSchedule={handleRemoveSchedule}
      />

      {/* Diurnal Schedule vs Forecast Timeline */}
      {activeMember && report && (
        <ScheduleTimeline
          memberNickname={activeMember.nickname}
          schedules={activeMember.schedules}
          forecast={report.forecast}
        />
      )}

      {/* Actionable Daily Routine Loop (Active Plan Tracker) */}
      <ActivePlanTracker
        actions={activePlanState.actions}
        onMarkComplete={handleMarkComplete}
        onMarkSkipped={handleMarkSkipped}
        onRemoveAction={handleRemoveAction}
        onUpdateAction={handleUpdateAction}
      />

      {/* Evidence-Based Recommendations Grid */}
      {activeMember && (
        <section aria-labelledby="recommendations-heading" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h2 id="recommendations-heading" className="text-base font-bold text-[var(--ink-primary)] font-sans flex items-center gap-2">
              <span>Personalized Recommendations</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--brand-surface)] text-[var(--brand-primary)] font-mono font-medium border border-[var(--brand-primary)]/20">
                {recommendations.length} Available
              </span>
            </h2>
            <span className="text-xs text-[var(--ink-muted)]">
              Matched against {activeMember.nickname}&apos;s schedule and hourly Open-Meteo CAMS curves
            </span>
          </div>

          {isLoadingForecast ? (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-8 text-center text-xs text-[var(--ink-muted)] animate-pulse">
              Loading diurnal forecast model...
            </div>
          ) : forecastError ? (
            <div className="rounded-2xl border border-[var(--aqi-unhealthy-border)] bg-[var(--aqi-unhealthy-bg)] p-6 text-center text-xs text-[var(--aqi-unhealthy)] space-y-1">
              <p className="font-bold">Forecast Temporarily Unavailable</p>
              <p>{forecastError}</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-card)] p-8 text-center space-y-2">
              <div className="text-2xl select-none" aria-hidden="true">
                ✨
              </div>
              <h3 className="text-sm font-bold text-[var(--ink-primary)] font-sans">
                No active schedule shifts needed
              </h3>
              <p className="text-xs text-[var(--ink-muted)] max-w-md mx-auto leading-relaxed">
                No elevated forecast concentration periods were identified during {activeMember.nickname}&apos;s scheduled activities. Add more activities or check back during diurnal pollution shifts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec) => {
                const isAdopted = activePlanState.actions.some(
                  (a) => a.recommendationId === rec.id && a.status === 'ADOPTED'
                );
                return (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    isAdopted={isAdopted}
                    onAdopt={handleAdoptRecommendation}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
