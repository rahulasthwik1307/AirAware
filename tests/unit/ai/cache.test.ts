import { describe, it, expect, beforeEach } from 'vitest';
import { aiCache } from '@/lib/ai/cache';
import { GuidanceRequest, GuidanceResponse } from '@/lib/ai/types';

describe('AI Cache & Request Deduplication', () => {
  beforeEach(() => {
    aiCache.clear();
  });

  const sampleReq: GuidanceRequest = {
    aqi: 80,
    category: 'Moderate',
    dominantPollutant: 'pm25',
    pollutantConcentration: 26.0,
    pollutantUnit: 'µg/m³',
    weather: { temperatureC: 22, humidityPercent: 50, windSpeedKmh: 10 },
    userContext: { isSensitiveGroup: false, primaryActivity: 'general', locale: 'en' },
  };

  const sampleRes: GuidanceResponse = {
    headline: 'Moderate Air',
    healthSummary: 'Air quality is acceptable.',
    actionRecommendations: ['Normal activities are fine.', 'Ventilate rooms.'],
    sensitiveGroupAdvisory: 'Watch for symptoms if sensitive.',
    ventilationRecommendation: 'open_windows',
    isDeterministicFallback: false,
  };

  it('generates normalized keys based on category, not raw AQI numbers', () => {
    const key1 = aiCache.getGuidanceKey(sampleReq);
    const key2 = aiCache.getGuidanceKey({
      ...sampleReq,
      aqi: 95, // Different number, same Moderate category
      pollutantConcentration: 32.0,
    });

    expect(key1).toBe(key2);
  });

  it('stores and retrieves cached guidance within TTL', () => {
    const key = aiCache.getGuidanceKey(sampleReq);
    expect(aiCache.getGuidance(key)).toBeNull();

    aiCache.setGuidance(key, sampleRes, 1000);
    expect(aiCache.getGuidance(key)).toEqual(sampleRes);
  });

  it('deduplicates simultaneous concurrent requests', async () => {
    const key = 'test-concurrent-key';
    let executionCount = 0;

    const slowFactory = async () => {
      executionCount++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return sampleRes;
    };

    // Trigger 5 parallel requests
    const promises = [
      aiCache.deduplicateGuidance(key, slowFactory),
      aiCache.deduplicateGuidance(key, slowFactory),
      aiCache.deduplicateGuidance(key, slowFactory),
      aiCache.deduplicateGuidance(key, slowFactory),
      aiCache.deduplicateGuidance(key, slowFactory),
    ];

    const results = await Promise.all(promises);

    expect(executionCount).toBe(1); // Factory executed only ONCE!
    expect(results.length).toBe(5);
    results.forEach((r) => expect(r).toEqual(sampleRes));
  });

  it('tracks daily quota exhaustion suppression', () => {
    expect(aiCache.isDailyQuotaExhausted()).toBe(false);

    aiCache.setDailyQuotaExhausted();
    expect(aiCache.isDailyQuotaExhausted()).toBe(true);
    expect(aiCache.getDailyQuotaResetTimestamp()).toBeGreaterThan(Date.now());
  });

  it('never stores rule-based fallback answers or timeout/error results', () => {
    const key = aiCache.getGuidanceKey(sampleReq);

    const fallbackRes: GuidanceResponse = {
      ...sampleRes,
      isDeterministicFallback: true,
    };

    aiCache.setGuidance(key, fallbackRes);
    expect(aiCache.getGuidance(key)).toBeNull();

    // Copilot test
    const copilotKey = 'copilot-test-key';
    aiCache.setCopilot(copilotKey, {
      directAnswer: 'Fallback answer',
      environmentalConditions: 'AQI 100',
      recommendedAction: 'Action',
      explanation: 'Explanation',
      practicalAlternatives: ['Alt'],
      dataSourceAndFreshness: 'CPCB',
      limitationsOrUncertainty: 'Ambient',
      isDeterministicFallback: true,
      fallbackReason: 'AI service busy, showing a standard answer',
    });
    expect(aiCache.getCopilot(copilotKey)).toBeNull();
  });
});
