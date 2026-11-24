import { describe, it, expect } from 'vitest';
import {
  deriveUserContextFromHousehold,
  buildCopilotApiPayload,
  createNoReportMessage,
  createRateLimitMessage,
  createCatchErrorMessage,
  createAssistantSuccessMessage,
} from '@/lib/ai/copilot-session';
import { HouseholdStorageState, HouseholdMember } from '@/domain/household/types';
import { AirQualityReport, PollutantKey, PollutantMeasurement, GeoLocation } from '@/domain/types';
import { CopilotResponse } from '@/lib/ai/types';

describe('copilot-session helper module', () => {
  const createMockPollutant = (
    key: PollutantKey,
    conc: number | null,
    subIndex: number | null
  ): PollutantMeasurement => ({
    key,
    label: key.toUpperCase(),
    chemicalFormula: key,
    concentration: conc,
    unit: 'µg/m³',
    subIndex,
    tier: null,
    isEvaluatedInActiveStandard: true,
    whoGuideline: 15,
    whoRatio: conc ? conc / 15 : null,
    isStationMeasurement: true,
  });

  describe('deriveUserContextFromHousehold', () => {
    it('derives vulnerability tiers and activities for active pediatric member', () => {
      const member: HouseholdMember = {
        id: 'm1',
        nickname: 'Tara',
        archetype: 'CHILD_STUDENT',
        sensitivityTier: 'PEDIATRIC',
        createdAt: '2026-11-24T00:00:00Z',
        schedules: [
          { id: 's1', activityType: 'SCHOOL_TRAVEL', activityName: 'School Bus', startTime: '07:30', durationMinutes: 45 },
        ],
      };

      const household: HouseholdStorageState = {
        version: 1,
        updatedAt: '2026-11-24T00:00:00Z',
        members: [member],
        activeMemberId: 'm1',
      };

      const ctx = deriveUserContextFromHousehold(household, member);
      expect(ctx.isSensitiveGroup).toBe(true);
      expect(ctx.vulnerabilityTiers).toContain('pediatric');
      expect(ctx.primaryActivity).toBe('daily_commute');
    });

    it('derives senior and respiratory vulnerabilities', () => {
      const member: HouseholdMember = {
        id: 'm2',
        nickname: 'Dada',
        archetype: 'SENIOR_VULNERABLE',
        sensitivityTier: 'RESPIRATORY',
        createdAt: '2026-11-24T00:00:00Z',
        schedules: [
          { id: 's2', activityType: 'OUTDOOR_EXERCISE', activityName: 'Garden Walk', startTime: '08:00', durationMinutes: 45 },
        ],
      };

      const ctx = deriveUserContextFromHousehold(null, member);
      expect(ctx.isSensitiveGroup).toBe(true);
      expect(ctx.vulnerabilityTiers).toContain('senior');
      expect(ctx.vulnerabilityTiers).toContain('respiratory');
      expect(ctx.primaryActivity).toBe('outdoor_exercise');
    });

    it('defaults gracefully when household or members are empty', () => {
      const ctx = deriveUserContextFromHousehold(null, null);
      expect(ctx.isSensitiveGroup).toBe(false);
      expect(ctx.vulnerabilityTiers).toEqual([]);
      expect(ctx.primaryActivity).toBe('general');
    });
  });

  describe('buildCopilotApiPayload', () => {
    const mockGeoLocation: GeoLocation = {
      id: 1,
      name: 'London',
      country: 'United Kingdom',
      countryCode: 'GB',
      latitude: 51.5074,
      longitude: -0.1278,
      timezone: 'Europe/London',
    };

    const mockReport: AirQualityReport = {
      location: mockGeoLocation,
      modelTimestamp: '2026-11-24T06:00:00Z',
      localTime: '2026-11-24 11:30',
      intervalSeconds: 3600,
      dataSource: 'OPENAQ_GROUND_STATION',
      isModelled: false,
      isStale: false,
      activeStandard: 'US_EPA',
      standardMetadata: {
        key: 'US_EPA',
        name: 'US EPA AQI',
        shortLabel: 'US AQI',
        scaleRange: '0-500',
        role: 'LOCAL_OFFICIAL',
        roleLabel: 'Official',
        description: 'US EPA benchmark',
      },
      providerAqi: 220,
      tier: {
        level: 5,
        label: 'Very Unhealthy',
        colorToken: '#9333ea',
        bgToken: '#f3e8ff',
        borderToken: '#d8b4fe',
        description: 'Health alert',
        healthAdvisory: 'Avoid outdoor activities',
      },
      dominantPollutant: 'pm2_5',
      pollutants: {
        pm2_5: createMockPollutant('pm2_5', 160, 220),
        pm10: createMockPollutant('pm10', 210, 180),
        nitrogen_dioxide: createMockPollutant('nitrogen_dioxide', 45, 45),
        ozone: createMockPollutant('ozone', 50, 50),
        sulphur_dioxide: createMockPollutant('sulphur_dioxide', 20, 20),
        carbon_monoxide: createMockPollutant('carbon_monoxide', 500, 25),
      },
      forecast: [],
      coordinates: { latitude: 51.5074, longitude: -0.1278 },
      averagingPeriodNote: '1-hour average',
      cpcbComparison: null,
      modelMetadata: {
        domain: 'CAMS_GLOBAL',
        domainName: 'CAMS Global',
        spatialResolution: '0.4 deg',
        temporalResolution: '1 hour',
        updateCadence: 'Every 6 hours',
      },
      sourceType: 'station',
      stationName: 'Marylebone Road',
      observedAt: '2026-11-24T06:00:00Z',
    };

    it('builds privacy-safe payload with mapped dominant key and capped AQI', () => {
      const payload = buildCopilotApiPayload({
        query: 'Is it safe to run outdoors this morning?',
        activeWorkspace: 'family-planner',
        report: mockReport,
        location: mockGeoLocation,
      });

      expect(payload.question).toBe('Is it safe to run outdoors this morning?');
      expect(payload.workspace).toBe('family-planner');
      expect(payload.aqi).toBe(220);
      expect(payload.dominantPollutant).toBe('pm25');
      expect(payload.pollutantConcentration).toBe(160);
      expect(payload.cityName).toBe('London');
      expect(payload.sourceType).toBe('station');
    });

    it('truncates oversized questions to 200 characters and clamps AQI at 500', () => {
      const longQuery = 'A'.repeat(250);
      const highAqiReport = { ...mockReport, providerAqi: 750 };

      const payload = buildCopilotApiPayload({
        query: longQuery,
        activeWorkspace: 'air-intelligence',
        report: highAqiReport,
      });

      expect(payload.question).toHaveLength(200);
      expect(payload.aqi).toBe(500);
    });
  });

  describe('message factories', () => {
    it('creates no report message', () => {
      const msg = createNoReportMessage();
      expect(msg.sender).toBe('assistant');
      expect(msg.source).toBe('deterministic');
      expect(msg.text).toContain('need a selected location');
    });

    it('creates rate limit error message with countdown', () => {
      const msg = createRateLimitMessage(42);
      expect(msg.isError).toBe(true);
      expect(msg.errorMessage).toContain('wait 42 seconds');
    });

    it('creates caught error message handling both Error objects and strings', () => {
      const errObjMsg = createCatchErrorMessage(new Error('Gateway timeout'));
      expect(errObjMsg.isError).toBe(true);
      expect(errObjMsg.errorMessage).toBe('Gateway timeout');

      const genericMsg = createCatchErrorMessage('something broke');
      expect(genericMsg.errorMessage).toContain('Network connection interrupted');
    });

    it('creates assistant success message tagging source appropriately', () => {
      const mockResponse: CopilotResponse = {
        directAnswer: 'Air quality is poor; keep workouts indoors.',
        environmentalConditions: 'PM2.5 is elevated at 160 µg/m³.',
        recommendedAction: 'Cancel morning run.',
        explanation: 'Deep breathing pulls fine soot into the lungs.',
        practicalAlternatives: ['Exercise indoors with HEPA filter'],
        dataSourceAndFreshness: 'CPCB Ground Station Anand Vihar (10m ago)',
        limitationsOrUncertainty: 'Localized smoke may cause temporary spikes.',
        isDeterministicFallback: false,
      };

      const cfMsg = createAssistantSuccessMessage(mockResponse, 'cloudflare-ai');
      expect(cfMsg.source).toBe('cloudflare-ai');
      expect(cfMsg.response?.directAnswer).toContain('workouts indoors');

      const fallbackResponse: CopilotResponse = {
        ...mockResponse,
        isDeterministicFallback: true,
      };
      const fallbackMsg = createAssistantSuccessMessage(fallbackResponse, 'cloudflare-ai');
      expect(fallbackMsg.source).toBe('deterministic');
    });
  });
});
