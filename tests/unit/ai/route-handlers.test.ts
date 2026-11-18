import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST as guidanceHandler } from '@/app/api/ai/guidance/route';
import { POST as copilotHandler } from '@/app/api/ai/copilot/route';
import { aiCache } from '@/lib/ai/cache';
import { localRateLimiter } from '@/lib/ai/rate-limiter';
import { CLOUDFLARE_DEFAULTS } from '@/lib/ai/config';

describe('AI Route Handlers (HTTP Seam)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      CLOUDFLARE_API_TOKEN: CLOUDFLARE_DEFAULTS.PLACEHOLDER_TOKEN, // Test deterministic fallback mode
    };
    aiCache.clear();
    localRateLimiter.clear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const validGuidancePayload = {
    aqi: 55,
    category: 'Moderate',
    dominantPollutant: 'pm25',
    pollutantConcentration: 14.2,
    pollutantUnit: 'µg/m³',
    weather: {
      temperatureC: 21,
      humidityPercent: 55,
      windSpeedKmh: 14,
    },
    userContext: {
      isSensitiveGroup: false,
      primaryActivity: 'general',
      locale: 'en',
    },
  };

  const validCopilotPayload = {
    question: 'Can I exercise outdoors this afternoon?',
    aqi: 55,
    category: 'Moderate',
    dominantPollutant: 'pm25',
    pollutantConcentration: 14.2,
    pollutantUnit: 'µg/m³',
    weather: {
      temperatureC: 21,
      humidityPercent: 55,
      windSpeedKmh: 14,
    },
    userContext: {
      isSensitiveGroup: false,
      primaryActivity: 'outdoor_exercise',
      locale: 'en',
    },
  };

  it('POST /api/ai/guidance rejects requests without application/json', async () => {
    const req = new Request('http://localhost/api/ai/guidance', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'invalid',
    });

    const res = await guidanceHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe('BAD_REQUEST');
    expect(json.message).toContain('Unsupported Content-Type');
  });

  it('POST /api/ai/guidance rejects invalid Zod payloads with 400 and validation details', async () => {
    const req = new Request('http://localhost/api/ai/guidance', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ aqi: 9999 }), // Invalid AQI range & missing fields
    });

    const res = await guidanceHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe('VALIDATION_ERROR');
    expect(json.details).toBeDefined();
  });

  it('POST /api/ai/guidance successfully returns deterministic guidance when token is not configured', async () => {
    const req = new Request('http://localhost/api/ai/guidance', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validGuidancePayload),
    });

    const res = await guidanceHandler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('private, no-cache, no-store, max-age=0, must-revalidate');
    expect(res.headers.get('Pragma')).toBe('no-cache');

    const json = await res.json();
    expect(json.isDeterministicFallback).toBe(true);
    expect(json.headline).toBeDefined();
    expect(json.ventilationRecommendation).toBeDefined();
  });

  it('POST /api/ai/copilot successfully returns 7-part deterministic answer when token is not configured', async () => {
    const req = new Request('http://localhost/api/ai/copilot', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validCopilotPayload),
    });

    const res = await copilotHandler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('private, no-cache, no-store, max-age=0, must-revalidate');
    expect(res.headers.get('Pragma')).toBe('no-cache');

    const json = await res.json();
    expect(json.isDeterministicFallback).toBe(true);
    expect(json.directAnswer).toBeDefined();
    expect(json.environmentalConditions).toContain('AQI: 55');
    expect(json.recommendedAction).toBeDefined();
    expect(json.explanation).toBeDefined();
    expect(json.practicalAlternatives.length).toBeGreaterThanOrEqual(1);
    expect(json.dataSourceAndFreshness).toBeDefined();
    expect(json.limitationsOrUncertainty).toBeDefined();
  });

  it('sets X-AirAware-Quota-Exhausted header when daily quota is marked exhausted', async () => {
    aiCache.setDailyQuotaExhausted();

    const req = new Request('http://localhost/api/ai/guidance', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validGuidancePayload),
    });

    const res = await guidanceHandler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-AirAware-Quota-Exhausted')).toBe('true');
    expect(res.headers.get('X-AirAware-Quota-Reset-Utc')).toBeDefined();
  });
});
