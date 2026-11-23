// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { HouseholdTodayPlanCard } from '@/components/planner/HouseholdTodayPlanCard';
import { AirQualityReport, GeoLocation } from '@/domain/types';
import { HouseholdStorageState } from '@/domain/household/types';
import { GuidanceResponse } from '@/lib/ai/types';

describe('HouseholdTodayPlanCard Component', () => {
  const originalFetch = globalThis.fetch;

  const mockLocation: GeoLocation = {
    id: 1273294,
    name: 'New Delhi',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    timezone: 'Asia/Kolkata',
  };

  const mockReport: AirQualityReport = {
    providerAqi: 185,
    dominantPollutant: 'pm2_5',
    sourceType: 'station',
    stationName: 'Anand Vihar',
    distanceKm: 5.2,
    observedAt: '2026-11-23T10:00:00Z',
    modelTimestamp: '2026-11-23T10:00:00Z',
    tier: {
      level: 4,
      label: 'Poor',
      colorToken: '#EA580C',
      bgToken: '#FFF7ED',
      borderToken: '#FDBA74',
      description: 'Breathing discomfort',
      healthAdvisory: 'Wear mask',
    },
    location: mockLocation,
    coordinates: { latitude: 28.6139, longitude: 77.209 },
    pollutants: {
      pm2_5: {
        concentration: 105,
        unit: 'µg/m³',
        displayName: 'PM2.5',
        subIndex: 185,
        tier: null,
      },
    },
    forecast: [],
    activeStandard: 'CPCB_NAQI',
  } as unknown as AirQualityReport;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('profile with children produces pediatric-focused actions', async () => {
    const childState: HouseholdStorageState = {
      version: 1,
      updatedAt: '2026-11-23T08:00:00Z',
      members: [
        {
          id: 'child-1',
          nickname: 'Aarav (Child)',
          archetype: 'CHILD_STUDENT',
          sensitivityTier: 'PEDIATRIC',
          createdAt: '2026-11-23T08:00:00Z',
          schedules: [
            {
              id: 'sch-1',
              activityName: 'Morning School Bus',
              activityType: 'SCHOOL_TRAVEL',
              startTime: '07:30',
              durationMinutes: 45,
              commuteMode: 'PUBLIC_TRANSIT',
            },
          ],
        },
      ],
      activeMemberId: 'child-1',
    };

    // Force deterministic fallback path by rejecting fetch
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    render(
      <HouseholdTodayPlanCard
        report={mockReport}
        householdState={childState}
        location={mockLocation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Today's Plan for Your Household/i)).toBeTruthy();
      expect(screen.getByText(/Rule-based fallback/i)).toBeTruthy();
    });

    // Check that pediatric/school/sensitive guidance is rendered
    const textContent = document.body.textContent || '';
    expect(
      textContent.toLowerCase().includes('mask') ||
      textContent.toLowerCase().includes('school') ||
      textContent.toLowerCase().includes('hepa') ||
      textContent.toLowerCase().includes('purifier')
    ).toBe(true);
  });

  it('profile with commuter produces transit-focused commute actions', async () => {
    const commuterState: HouseholdStorageState = {
      version: 1,
      updatedAt: '2026-11-23T08:00:00Z',
      members: [
        {
          id: 'commuter-1',
          nickname: 'Rahul (Office)',
          archetype: 'WORKING_COMMUTER',
          sensitivityTier: 'NONE',
          createdAt: '2026-11-23T08:00:00Z',
          schedules: [
            {
              id: 'sch-2',
              activityName: 'Evening Metro Commute',
              activityType: 'COMMUTE',
              startTime: '18:00',
              durationMinutes: 60,
              commuteMode: 'PUBLIC_TRANSIT',
            },
          ],
        },
      ],
      activeMemberId: 'commuter-1',
    };

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    render(
      <HouseholdTodayPlanCard
        report={mockReport}
        householdState={commuterState}
        location={mockLocation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Rule-based fallback/i)).toBeTruthy();
    });

    const textContent = document.body.textContent || '';
    expect(
      textContent.toLowerCase().includes('commute') ||
      textContent.toLowerCase().includes('transit') ||
      textContent.toLowerCase().includes('travel')
    ).toBe(true);
  });

  it('renders Live AI Adaptive Plan badge when API returns live response', async () => {
    const mockLiveGuidance: GuidanceResponse = {
      headline: 'Live Air Advice',
      healthSummary: 'Live AI environmental assessment for Delhi NCR.',
      actionRecommendations: [
        'Engage high-efficiency particulate air filtration',
        'Wear N95 masks during peak morning inversion',
      ],
      sensitiveGroupAdvisory: 'Keep pediatric family members indoors during peak morning inversion.',
      ventilationRecommendation: 'keep_closed_use_purifier',
      isDeterministicFallback: false,
      modelName: '@cf/meta/llama-3.1-8b-instruct',
      todayHouseholdPlan: {
        morning: {
          period: 'morning',
          area: 'Commute & Travel',
          action: 'Seal windows and engage HEPA filtration',
          why: 'Morning temperature inversion creates high ground-level particulate concentration.',
          expectedImpact: 'Reduces peak indoor exposure by up to 60%.',
        },
        afternoon: {
          period: 'afternoon',
          area: 'Outdoor Activity',
          action: 'Ideal window for short errands and rapid room ventilation.',
          why: 'Solar heating lifts the inversion ceiling and disperses particulate smog.',
          expectedImpact: 'Lowest diurnal PM2.5 exposure window.',
        },
        evening: {
          period: 'evening',
          area: 'Living Space',
          action: 'Keep purifiers running on medium mode.',
          why: 'Evening traffic and atmospheric cooling trap emissions near ground.',
          expectedImpact: 'Maintains healthy sleeping breathing zone.',
        },
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockLiveGuidance,
    } as Response);

    render(
      <HouseholdTodayPlanCard
        report={mockReport}
        householdState={null}
        location={mockLocation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/AI-generated/i)).toBeTruthy();
      expect(screen.getByText(/Cloudflare Workers AI/i)).toBeTruthy();
      expect(screen.getByText(/Seal windows and engage HEPA filtration/i)).toBeTruthy();
    });
  });
});
