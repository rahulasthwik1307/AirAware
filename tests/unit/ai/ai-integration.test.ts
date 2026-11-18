import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getPersonalizedGuidance,
  askAirCopilot,
  aiCache,
  CLOUDFLARE_DEFAULTS,
  GuidanceRequest,
  CopilotRequest,
} from '@/lib/ai';

describe('AI Facade Integration & Graceful Degradation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    aiCache.clear();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  const sampleGuidanceReq: GuidanceRequest = {
    aqi: 145,
    category: 'Unhealthy for Sensitive Groups',
    dominantPollutant: 'pm25',
    pollutantConcentration: 52.0,
    pollutantUnit: 'µg/m³',
    weather: { temperatureC: 25, humidityPercent: 60, windSpeedKmh: 8 },
    userContext: { isSensitiveGroup: true, primaryActivity: 'outdoor_exercise', locale: 'en' },
  };

  const sampleCopilotReq: CopilotRequest = {
    question: 'Should I open my bedroom windows today?',
    aqi: 160,
    category: 'Unhealthy',
    dominantPollutant: 'pm25',
    pollutantConcentration: 75.0,
    pollutantUnit: 'µg/m³',
    weather: { temperatureC: 28, humidityPercent: 55, windSpeedKmh: 5 },
    userContext: { isSensitiveGroup: false, primaryActivity: 'indoor_resting', locale: 'en' },
  };

  it('gracefully degrades to deterministic guidance when token is not yet pasted (out of the box)', async () => {
    process.env.CLOUDFLARE_API_TOKEN = CLOUDFLARE_DEFAULTS.PLACEHOLDER_TOKEN;

    const result = await getPersonalizedGuidance(sampleGuidanceReq);

    expect(result.isDeterministicFallback).toBe(true);
    expect(result.headline).toBeDefined();
    expect(result.ventilationRecommendation).toBe('ventilate_briefly');
    expect(result.sensitiveGroupAdvisory).toContain('Children, seniors');
  });

  it('gracefully degrades to deterministic Copilot answer when token is not yet pasted', async () => {
    process.env.CLOUDFLARE_API_TOKEN = CLOUDFLARE_DEFAULTS.PLACEHOLDER_TOKEN;

    const result = await askAirCopilot(sampleCopilotReq);

    expect(result.isDeterministicFallback).toBe(true);
    expect(result.directAnswer).toContain('Keep your windows closed');
    expect(result.environmentalConditions).toContain('AQI: 160');
    expect(result.dataSourceAndFreshness).toContain('EPA');
  });

  it('serves AI guidance with isDeterministicFallback: false when Cloudflare returns valid data', async () => {
    process.env.CLOUDFLARE_API_TOKEN = 'real_user_token_123';

    const aiGuidanceData = {
      headline: 'Air Quality Strained by PM2.5',
      healthSummary: 'Sensitivities may be triggered during outdoor training.',
      actionRecommendations: ['Shorten outdoor running.', 'Use filtered indoor gym.'],
      sensitiveGroupAdvisory: 'Keep inhaler accessible.',
      ventilationRecommendation: 'ventilate_briefly',
    };

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: { content: JSON.stringify(aiGuidanceData) },
            },
          ],
        }),
        { status: 200 }
      )
    );

    const result = await getPersonalizedGuidance(sampleGuidanceReq, mockFetch);

    expect(result.isDeterministicFallback).toBe(false);
    expect(result.headline).toBe('Air Quality Strained by PM2.5');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Verify privacy: no raw PII or secret in the fetch body
    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const sentText = JSON.stringify(sentBody);
    expect(sentText).not.toContain('192.168');
    expect(sentText).not.toContain('real_user_token_123');
  });

  it('seamlessly falls back to deterministic guidance if Cloudflare throws a network error', async () => {
    process.env.CLOUDFLARE_API_TOKEN = 'real_user_token_123';

    const mockFetch = vi.fn().mockRejectedValue(new Error('Network connection failed'));

    const result = await getPersonalizedGuidance(sampleGuidanceReq, mockFetch);

    expect(result.isDeterministicFallback).toBe(true);
    expect(result.headline).toBeDefined();
    expect(result.actionRecommendations.length).toBeGreaterThanOrEqual(2);
  });
});
