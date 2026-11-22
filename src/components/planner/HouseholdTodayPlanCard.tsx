'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { AirQualityReport, GeoLocation } from '@/domain/types';
import { getPrimaryAqiFacts } from '@/domain/aqi/primary-aqi';
import { HouseholdStorageState } from '@/domain/household/types';
import {
  AqiCategory,
  GuidanceRequest,
  GuidanceResponse,
  GuidanceResponseSchema,
  TodayHouseholdPlan,
} from '@/lib/ai/types';
import { getDeterministicGuidance } from '@/lib/ai/deterministic-fallback';
import { loadIndoorState } from '@/domain/indoor/storage';

interface HouseholdTodayPlanCardProps {
  readonly report: AirQualityReport | null;
  readonly householdState: HouseholdStorageState | null;
  readonly location: GeoLocation | null;
}

export function HouseholdTodayPlanCard({
  report,
  householdState,
  location,
}: HouseholdTodayPlanCardProps) {
  const [guidance, setGuidance] = useState<GuidanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const primaryFacts = useMemo(() => (report ? getPrimaryAqiFacts(report) : null), [report]);

  // Derive request payload from live report & real household profiles
  const guidanceRequest = useMemo<GuidanceRequest | null>(() => {
    if (!report || report.providerAqi === null || !primaryFacts) return null;

    const aqi = primaryFacts.aqi;
    const category = primaryFacts.category as AqiCategory;
    const pm25Concentration = primaryFacts.pm25Concentration ?? 25;

    const members = householdState?.members ?? [];
    const hasVulnerable = members.some((m) =>
      ['PEDIATRIC', 'SENIOR', 'RESPIRATORY', 'PREGNANT'].includes(m.sensitivityTier)
    );

    const memberSummaries = members.map((m) => ({
      id: m.id,
      nickname: m.nickname,
      archetype: m.archetype,
      sensitivityTier: m.sensitivityTier,
      schedules: m.schedules.map((s) => ({
        activityName: s.activityName,
        startTime: s.startTime,
        durationMinutes: s.durationMinutes,
        commuteMode: s.commuteMode,
      })),
    }));

    return {
      aqi,
      category,
      dominantPollutant: 'pm25',
      pollutantConcentration: pm25Concentration,
      pollutantUnit: 'µg/m³',
      weather: {
        temperatureC: 22,
        humidityPercent: 50,
        windSpeedKmh: 8,
      },
      userContext: {
        isSensitiveGroup: hasVulnerable,
        primaryActivity: members[0]?.schedules[0]?.commuteMode === 'WALKING' ? 'outdoor_exercise' : 'daily_commute',
        locale: 'en',
      },
      cityName: location?.name || 'Your City',
      householdMembers: memberSummaries,
      scheduleSummary: members
        .flatMap((m) => m.schedules.map((s) => `${m.nickname}: ${s.activityName} at ${s.startTime}`))
        .slice(0, 4)
        .join(', '),
      sourceType: report.sourceType,
      stationName: report.stationName,
      distanceKm: report.distanceKm,
      observationTime: report.observedAt || report.modelTimestamp,
      indoorPm25: typeof window !== 'undefined' ? (loadIndoorState().indoorPm25Reading ?? null) : null,
      scaleName: primaryFacts.scaleName,
      modelFallbackReason: primaryFacts.modelFallbackReason,
    };
  }, [report, primaryFacts, householdState, location]);

  // Client-side cache key per (location, profile, hour)
  const clientCacheKey = useMemo(() => {
    if (!guidanceRequest) return '';
    const hour = new Date().getHours();
    const city = guidanceRequest.cityName ?? 'default';
    const profile =
      guidanceRequest.householdMembers && guidanceRequest.householdMembers.length > 0
        ? guidanceRequest.householdMembers.map((m) => `${m.id}_${m.sensitivityTier}`).sort().join(';')
        : 'general';
    return `airaware_plan_${city}_${profile}_${hour}`;
  }, [guidanceRequest]);

  const fetchPlan = useCallback(async () => {
    if (!guidanceRequest) return;

    // Check client session storage cache first
    if (clientCacheKey) {
      try {
        const cached = sessionStorage.getItem(clientCacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          const valid = GuidanceResponseSchema.safeParse(parsed);
          if (valid.success) {
            setGuidance(valid.data);
            return;
          }
        }
      } catch {
        // Fall through to network fetch
      }
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guidanceRequest),
      });

      if (!res.ok) {
        throw new Error(`Guidance API responded with status ${res.status}`);
      }

      const json = await res.json();
      const validated = GuidanceResponseSchema.parse(json);

      setGuidance(validated);

      if (clientCacheKey) {
        try {
          sessionStorage.setItem(clientCacheKey, JSON.stringify(validated));
        } catch {
          // sessionStorage full or disabled
        }
      }
    } catch {
      // Deterministic scientific fallback on any network error or schema mismatch
      const fallback = getDeterministicGuidance(guidanceRequest);
      setGuidance(fallback);
    } finally {
      setIsLoading(false);
    }
  }, [guidanceRequest, clientCacheKey]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  if (!report || !guidance) {
    return null;
  }

  const plan: TodayHouseholdPlan | undefined = guidance.todayHouseholdPlan;

  return (
    <section
      aria-label="Today's Plan for Your Household"
      className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 sm:p-6 shadow-xs space-y-5"
    >
      {/* Top Header & Provenance Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">
              📋
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--ink-primary)] font-sans">
              Today&apos;s Plan for Your Household
            </h2>
          </div>
          <p className="text-xs text-[var(--ink-secondary)]">
            Tailored actions for {location?.name || 'your area'} based on diurnal inversion windows, household sensitivities, and live AQI {primaryFacts?.aqi ?? report.providerAqi} ({primaryFacts?.category ?? report.tier?.label ?? 'Moderate'}).
          </p>
        </div>

        {/* Provenance Badge */}
        <div className="flex items-center gap-2 shrink-0">
          {!guidance.isDeterministicFallback ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" aria-hidden="true" />
              AI-generated · Cloudflare Workers AI · {guidance.modelName || '@cf/google/gemma-4-26b-a4b-it'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
              Rule-based fallback
            </span>
          )}
          {isLoading && (
            <span className="text-[10px] font-mono text-slate-400 animate-pulse">Syncing…</span>
          )}
        </div>
      </div>

      {/* 3-Part Chronological Plan: Morning, Afternoon, Evening */}
      {plan && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {/* Morning Protocol */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex flex-col justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🌅</span> Morning
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  {plan.morning.area}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {plan.morning.action}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-800">Why: </span>
                {plan.morning.why}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200/90 text-xs">
              <span className="text-[10px] font-mono font-bold uppercase text-amber-800 block">
                Direct Impact
              </span>
              <p className="text-[11px] font-medium text-slate-700 mt-0.5">
                {plan.morning.expectedImpact}
              </p>
            </div>
          </div>

          {/* Afternoon Protocol */}
          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 flex flex-col justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>☀️</span> Afternoon
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-300">
                  {plan.afternoon.area}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {plan.afternoon.action}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-800">Why: </span>
                {plan.afternoon.why}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 border border-sky-200/90 text-xs">
              <span className="text-[10px] font-mono font-bold uppercase text-sky-800 block">
                Direct Impact
              </span>
              <p className="text-[11px] font-medium text-slate-700 mt-0.5">
                {plan.afternoon.expectedImpact}
              </p>
            </div>
          </div>

          {/* Evening Protocol */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 flex flex-col justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🌙</span> Evening
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-300">
                  {plan.evening.area}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {plan.evening.action}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-800">Why: </span>
                {plan.evening.why}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 border border-indigo-200/90 text-xs">
              <span className="text-[10px] font-mono font-bold uppercase text-indigo-800 block">
                Direct Impact
              </span>
              <p className="text-[11px] font-medium text-slate-700 mt-0.5">
                {plan.evening.expectedImpact}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sensitive Group Caution Banner */}
      {guidance.sensitiveGroupAdvisory && (
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-xs text-rose-950">
          <span className="text-base shrink-0" aria-hidden="true">
            ⚠️
          </span>
          <div>
            <span className="font-bold font-sans">High-Risk Individual Advisory: </span>
            <span className="text-rose-900 leading-relaxed">
              {guidance.sensitiveGroupAdvisory}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
