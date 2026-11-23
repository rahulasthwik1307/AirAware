// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAirCopilot, deriveUserContextFromHousehold } from '@/lib/ai/use-copilot';
import { HouseholdStorageState } from '@/domain/household/types';
import { AirQualityReport } from '@/domain/types';

describe('deriveUserContextFromHousehold', () => {
  it('returns default context when household state is empty or null', () => {
    const ctx = deriveUserContextFromHousehold(null, null);
    expect(ctx.isSensitiveGroup).toBe(false);
    expect(ctx.primaryActivity).toBe('general');
    expect(ctx.locale).toBe('en');
    expect(ctx.vulnerabilityTiers).toEqual([]);
  });

  it('correctly maps pediatric child member with school commute schedule', () => {
    const state: HouseholdStorageState = {
      version: 1,
      updatedAt: '2026-11-23T10:00:00Z',
      activeMemberId: 'm1',
      members: [
        {
          id: 'm1',
          nickname: 'Aarav',
          archetype: 'CHILD_STUDENT',
          sensitivityTier: 'PEDIATRIC',
          createdAt: '2026-11-23T10:00:00Z',
          schedules: [
            {
              id: 's1',
              activityName: 'School Bus',
              activityType: 'SCHOOL_TRAVEL',
              startTime: '07:30',
              durationMinutes: 45,
            },
          ],
        },
      ],
    };

    const ctx = deriveUserContextFromHousehold(state);
    expect(ctx.isSensitiveGroup).toBe(true);
    expect(ctx.vulnerabilityTiers).toContain('pediatric');
    expect(ctx.primaryActivity).toBe('daily_commute');
  });

  it('correctly maps senior member with outdoor exercise schedule', () => {
    const state: HouseholdStorageState = {
      version: 1,
      updatedAt: '2026-11-23T10:00:00Z',
      activeMemberId: 'm2',
      members: [
        {
          id: 'm2',
          nickname: 'Grandfather',
          archetype: 'SENIOR_VULNERABLE',
          sensitivityTier: 'SENIOR',
          createdAt: '2026-11-23T10:00:00Z',
          schedules: [
            {
              id: 's2',
              activityName: 'Morning Park Walk',
              activityType: 'OUTDOOR_EXERCISE',
              startTime: '06:30',
              durationMinutes: 40,
            },
          ],
        },
      ],
    };

    const ctx = deriveUserContextFromHousehold(state);
    expect(ctx.isSensitiveGroup).toBe(true);
    expect(ctx.vulnerabilityTiers).toContain('senior');
    expect(ctx.primaryActivity).toBe('outdoor_exercise');
  });

  it('correctly maps respiratory member with indoor chore schedule', () => {
    const state: HouseholdStorageState = {
      version: 1,
      updatedAt: '2026-11-23T10:00:00Z',
      activeMemberId: 'm3',
      members: [
        {
          id: 'm3',
          nickname: 'Rohan',
          archetype: 'SENIOR_VULNERABLE',
          sensitivityTier: 'RESPIRATORY',
          createdAt: '2026-11-23T10:00:00Z',
          schedules: [
            {
              id: 's3',
              activityName: 'Window Airing',
              activityType: 'VENTILATION',
              startTime: '12:00',
              durationMinutes: 20,
            },
          ],
        },
      ],
    };

    const ctx = deriveUserContextFromHousehold(state);
    expect(ctx.isSensitiveGroup).toBe(true);
    expect(ctx.vulnerabilityTiers).toContain('respiratory');
    expect(ctx.primaryActivity).toBe('indoor_resting');
  });
});

describe('useAirCopilot Hook Contract', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const mockReport: AirQualityReport = {
    location: {
      id: 1,
      name: 'New Delhi',
      country: 'India',
      countryCode: 'IN',
      latitude: 28.6139,
      longitude: 77.209,
      timezone: 'Asia/Kolkata',
    },
    providerAqi: 185,
    dominantPollutant: 'pm25',
    activeStandard: 'US_EPA',
    sourceType: 'station',
    stationName: 'Anand Vihar, Delhi',
    observedAt: '2026-11-23T12:00:00Z',
    pollutants: {
      pm2_5: { concentration: 95.4, unit: 'µg/m³', isStationMeasurement: true },
      pm10: { concentration: 160.2, unit: 'µg/m³', isStationMeasurement: true },
    },
    tier: {
      level: 4,
      label: 'Poor',
      colorToken: '#EF4444',
      bgToken: '#FEF2F2',
      borderToken: '#FCA5A5',
      description: 'Breathing discomfort to people on prolonged exposure',
      healthAdvisory: 'Wear N95 masks outdoors',
    },
  } as unknown as AirQualityReport;

  it('initializes session thread with default welcome message and manages multiple sessions', () => {
    const { result } = renderHook(() =>
      useAirCopilot({
        activeWorkspace: 'air-intelligence',
        report: mockReport,
      })
    );

    expect(result.current.sessions.length).toBeGreaterThanOrEqual(1);
    expect(result.current.messages.length).toBe(1);
    expect(result.current.isThinking).toBe(false);

    // Create a new session
    act(() => {
      result.current.createNewSession('Custom Transit Thread');
    });
    expect(result.current.sessions.length).toBe(2);
    expect(result.current.sessions[0].title).toBe('Custom Transit Thread');

    // Switch between sessions
    const firstSessionId = result.current.sessions[1].id;
    act(() => {
      result.current.switchSession(firstSessionId);
    });
    expect(result.current.activeSessionId).toBe(firstSessionId);

    // Delete a session
    act(() => {
      result.current.deleteSession(firstSessionId);
    });
    expect(result.current.sessions.some((s) => s.id === firstSessionId)).toBe(false);

    // Clear all sessions
    act(() => {
      result.current.clearAllSessions();
    });
    expect(result.current.sessions.length).toBe(1);
  });

  it('resets conversation messages in active session', () => {
    const { result } = renderHook(() =>
      useAirCopilot({
        activeWorkspace: 'air-intelligence',
        report: mockReport,
      })
    );

    act(() => {
      result.current.setInputQuery('Draft query');
      result.current.resetConversation();
    });

    expect(result.current.inputQuery).toBe('');
    expect(result.current.messages.length).toBe(1);
  });

  it('ignores empty, whitespace-only or pending queries when sendMessage is invoked', async () => {
    const { result } = renderHook(() =>
      useAirCopilot({
        activeWorkspace: 'air-intelligence',
        report: mockReport,
      })
    );

    await act(async () => {
      await result.current.sendMessage('   ');
    });

    expect(result.current.messages.length).toBe(1);
  });

  it('returns deterministic message when no environmental report is loaded', async () => {
    const { result } = renderHook(() =>
      useAirCopilot({
        activeWorkspace: 'air-intelligence',
        report: null,
      })
    );

    await act(async () => {
      await result.current.sendMessage('Can I exercise outdoors?');
    });

    const lastMsg = result.current.messages[result.current.messages.length - 1];
    expect(lastMsg.sender).toBe('assistant');
    expect(lastMsg.text).toContain('I need a selected location and live environmental telemetry');
  });

  it('sends query to API and appends structured response', async () => {
    const mockApiResponse = {
      directAnswer: 'Limit outdoor exercise right now as PM2.5 is high.',
      environmentalConditions: 'Delhi AQI is 185 (Poor) driven by PM2.5.',
      recommendedAction: 'Move running indoors or reschedule past noon.',
      explanation: 'Ground-level smoke inversion concentrates fine particles early morning.',
      practicalAlternatives: ['Indoor treadmill workout', 'Yoga with HEPA purifier'],
      dataSourceAndFreshness: 'OpenAQ ground station updated 10m ago',
      limitationsOrUncertainty: 'Local traffic micro-spikes may occur.',
      isRuleBased: false,
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'X-AirAware-Response-Source': 'cloudflare-ai' }),
      json: async () => mockApiResponse,
    } as Response);

    const { result } = renderHook(() =>
      useAirCopilot({
        activeWorkspace: 'air-intelligence',
        report: mockReport,
      })
    );

    await act(async () => {
      await result.current.sendMessage('Should I jog outside?');
    });

    expect(result.current.isThinking).toBe(false);
    const lastMsg = result.current.messages[result.current.messages.length - 1];
    expect(lastMsg.sender).toBe('assistant');
    expect(lastMsg.response?.directAnswer).toBe(mockApiResponse.directAnswer);
  });

  it('handles rate-limit 429 response by engaging cooldown timer', async () => {
    vi.useFakeTimers();
    try {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'Retry-After': '10' }),
        json: async () => ({ error: 'RATE_LIMIT_EXCEEDED' }),
      } as Response);

      const { result } = renderHook(() =>
        useAirCopilot({
          activeWorkspace: 'air-intelligence',
          report: mockReport,
        })
      );

      await act(async () => {
        await result.current.sendMessage('Is it safe to commute?');
      });

      expect(result.current.cooldownSeconds).toBe(10);
      const lastMsg = result.current.messages[result.current.messages.length - 1];
      expect(lastMsg.isError).toBe(true);
      expect(lastMsg.errorMessage).toContain('Rate limit');

      // Fast-forward cooldown timer
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(result.current.cooldownSeconds).toBe(5);

      act(() => {
        vi.advanceTimersByTime(6000);
      });
      expect(result.current.cooldownSeconds).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
