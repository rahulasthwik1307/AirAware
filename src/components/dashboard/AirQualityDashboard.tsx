'use client';

import React, { useCallback, useSyncExternalStore } from 'react';
import { AqiStandardKey, GeoLocation, WorkspaceKey } from '@/domain/types';
import { useAirQuality, DEFAULT_LOCATION } from '@/domain/aqi/useAirQuality';
import {
  loadHouseholdState,
  getHouseholdServerSnapshot,
  subscribeHouseholdStorage,
} from '@/domain/household/storage';
import { LocationSearch } from './LocationSearch';
import { AqiHeroCard } from './AqiHeroCard';
import { HouseholdTodayPlanCard } from '@/components/planner/HouseholdTodayPlanCard';
import { ActionableHealthGuidance } from './ActionableHealthGuidance';
import { PollutantGrid } from './PollutantGrid';
import { ForecastTimeline } from './ForecastTimeline';
import { AtmosphericWeatherCard } from './AtmosphericWeatherCard';
import { ScientificGrounding } from './ScientificGrounding';
import { ProvenanceFooter } from './ProvenanceFooter';

interface AirQualityDashboardProps {
  readonly onSelectWorkspace?: (workspace: WorkspaceKey) => void;
}

export function AirQualityDashboard({ onSelectWorkspace }: AirQualityDashboardProps = {}) {
  const {
    location,
    report,
    weather,
    isLoading,
    error,
    setLocation,
    refetch,
    setActiveStandard,
  } = useAirQuality();

  const selectedLocation = location ?? DEFAULT_LOCATION;
  const weatherData = weather;
  const isDefaultInitial = !location || location.id === DEFAULT_LOCATION.id;

  const householdState = useSyncExternalStore(
    subscribeHouseholdStorage,
    loadHouseholdState,
    getHouseholdServerSnapshot
  );

  const handleSelectLocation = useCallback((loc: GeoLocation) => {
    setLocation(loc);
  }, [setLocation]);

  const handleSwitchStandard = useCallback((standard: AqiStandardKey) => {
    setActiveStandard(standard);
  }, [setActiveStandard]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="w-full space-y-7">
      {/* 1. Global City Search & Location Selector */}
      <LocationSearch
        onSelectLocation={handleSelectLocation}
        selectedLocation={selectedLocation}
        isLoading={isLoading}
        isDefaultLocation={isDefaultInitial}
      />

      {/* Loading Skeletons: Only display on initial load before any report exists */}
      {isLoading && !report && (
        <div aria-busy="true" aria-label="Acquiring modelled air-quality data..." className="space-y-4">
          <div className="h-56 sm:h-64 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] animate-pulse"
              />
            ))}
          </div>
          <div className="h-36 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] animate-pulse" />
        </div>
      )}

      {/* Error State with Manual Retry */}
      {!isLoading && error && !report && (
        <div
          role="alert"
          className="rounded-xl border border-[var(--aqi-unhealthy-border)] bg-[var(--aqi-unhealthy-bg)] p-6 text-center shadow-xs"
        >
          <span className="text-2xl select-none" aria-hidden="true">
            ⚠️
          </span>
          <h3 className="text-sm font-semibold font-mono text-[var(--aqi-unhealthy)] mt-2 tracking-wide">
            Air Quality Data Unavailable
          </h3>
          <p className="text-xs text-[var(--ink-secondary)] mt-1.5 max-w-md mx-auto">
            {error || 'Could not load air quality data right now. Please check your connection and tap retry.'}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-3.5 px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-xs font-mono font-bold shadow-xs hover:bg-[var(--brand-hover)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Initial Welcome Discovery State (No location selected yet) */}
      {!isLoading && !error && !selectedLocation && (
        <section
          aria-labelledby="welcome-discovery-heading"
          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-8 sm:p-12 text-center shadow-sm"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-surface)] text-3xl border border-[var(--border-subtle)] mb-4 shadow-xs">
            🌍
          </div>
          <h3
            id="welcome-discovery-heading"
            className="text-xl sm:text-2xl font-bold text-[var(--ink-primary)] tracking-tight font-sans"
          >
            Global Environmental Intelligence
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-[var(--ink-secondary)] max-w-xl mx-auto leading-relaxed">
            Current modelled environmental estimates across 6 criteria pollutants, 24-hour predictive
            surface meteorology, and transparent public science standards.
          </p>
          <p className="mt-3 text-xs font-medium text-[var(--brand-primary)]">
            Enter a city name above or select a preset to explore air quality.
          </p>
        </section>
      )}

      {/* Main Environmental Intelligence Content (Remains smoothly mounted during data transitions) */}
      {report && (
        <div className="space-y-8 animate-fadeIn">
          {/* 1. Signature Asymmetric Hero: Primary Atmospheric Intelligence + Interactive Earth Globe */}
          <AqiHeroCard
            report={report}
            weather={weatherData}
            onSwitchStandard={handleSwitchStandard}
            onSelectLocation={handleSelectLocation}
            isLoading={isLoading}
            isDefaultLocation={isDefaultInitial}
          />

          {/* Today's GenAI Household Plan: Morning / Afternoon / Evening (Locked live numbers, Why & Expected Impact) */}
          <HouseholdTodayPlanCard
            report={report}
            householdState={householdState}
            location={selectedLocation}
          />

          {/* 2. Actionable Health Guidance: Daily Family Protective Protocols */}
          <ActionableHealthGuidance
            tier={report.tier}
            dominantPollutant={report.dominantPollutant}
            variant="light"
            onSelectWorkspace={onSelectWorkspace}
            location={report.location}
            providerAqi={report.providerAqi}
            cpcbCategory={report.cpcbComparison?.equivalentCategory}
          />

          {/* 3. 24-Hour Telemetry Forecast with Interactive Hourly Inspection */}
          <ForecastTimeline
            forecast={report.forecast}
            activeStandard={report.activeStandard}
            modelMetadata={report.modelMetadata}
            modelTimestamp={report.modelTimestamp}
            localTime={report.localTime}
          />

          {/* 4. Atmospheric Surface Weather Context */}
          <AtmosphericWeatherCard weather={weatherData} />

          {/* 5. Six Criteria Pollutant Telemetry Cards */}
          <PollutantGrid
            pollutants={report.pollutants}
            activeStandard={report.activeStandard}
            modelTimestamp={report.modelTimestamp}
            localTime={report.localTime}
            dominantPollutant={report.dominantPollutant}
            sourceType={report.sourceType}
            stationName={report.stationName}
            distanceKm={report.distanceKm}
            observedAt={report.observedAt}
          />

          {/* 6. Scientific Grounding & Multi-Standard Calibration */}
          <ScientificGrounding report={report} />

          {/* 7. Source Attribution & Data Provenance */}
          <ProvenanceFooter report={report} />
        </div>
      )}
    </div>
  );
}
