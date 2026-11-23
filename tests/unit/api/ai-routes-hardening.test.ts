import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST as copilotHandler } from '@/app/api/ai/copilot/route';
import { POST as guidanceHandler } from '@/app/api/ai/guidance/route';
import { aiCache } from '@/lib/ai/cache';
import { localRateLimiter } from '@/lib/ai/rate-limiter';
import * as cloudflareClient from '@/lib/ai/cloudflare-client';

describe('API Routes Hardening: /api/ai/copilot and /api/ai/guidance', () => {
  const originalEnv = process.env;

  const validCopilotPayload = {
    question: 'Should I wear a mask today?',
    aqi: 165,
    category: 'Poor' as const,
    dominantPollutant: 'pm25' as const,
    pollutantConcentration: 85,
    pollutantUnit: 'µg/m³',
    cityName: 'New Delhi',
    weather: {
      temperatureC: 22,
      humidityPercent: 60,
      windSpeedKmh: 6,
    },
    userContext: {
      isSensitiveGroup: false,
      primaryActivity: 'general' as const,
      locale: 'en',
    },
  };

  const validGuidancePayload = {
    aqi: 165,
    category: 'Poor' as const,
    dominantPollutant: 'pm25' as const,
    pollutantConcentration: 85,
    pollutantUnit: 'µg/m³',
    cityName: 'New Delhi',
    weather: {
      temperatureC: 22,
      humidityPercent: 60,
      windSpeedKmh: 6,
    },
    userContext: {
      isSensitiveGroup: false,
      primaryActivity: 'general' as const,
      locale: 'en',
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    aiCache.clear();
    localRateLimiter.clear();
    process.env = {
      ...originalEnv,
      CLOUDFLARE_API_TOKEN: 'cf_secret_token_12345',
      CLOUDFLARE_ACCOUNT_ID: 'cf_account_12345',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('200 live: returns live AI response when Cloudflare succeeds', async () => {
    vi.spyOn(cloudflareClient, 'executeWorkersAiInference').mockResolvedValue({
      directAnswer: 'Yes, wear an N95 respirator mask outdoors.',
      environmentalConditions: 'PM2.5 is high at 85 µg/m³ with calm winds.',
      recommendedAction: 'Fit an N95 mask snugly before going outdoors.',
      practicalAlternatives: ['Work indoors', 'Use air-conditioned transit'],
      explanation: 'Fine particulates can penetrate deep into lungs.',
      dataSourceAndFreshness: 'Copernicus CAMS & OpenAQ ground stations',
      limitationsOrUncertainty: 'Sensor variations may exist near local emissions sources.',
      isDeterministicFallback: false,
      modelName: '@cf/meta/llama-3.1-8b-instruct',
    });

    const req = new Request('http://localhost:3000/api/ai/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validCopilotPayload),
    });

    const res = await copilotHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.isDeterministicFallback).toBe(false);
    expect(data.directAnswer).toContain('wear an N95');
  });

  it('schema-invalid model output falls back to deterministic answer without crashing with 500', async () => {
    // Model fails schema validation
    vi.spyOn(cloudflareClient, 'executeWorkersAiInference').mockRejectedValue(
      new Error('Model output failed Zod schema validation')
    );

    const req = new Request('http://localhost:3000/api/ai/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validCopilotPayload),
    });

    const res = await copilotHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    // Must fall back to deterministic response
    expect(data.isDeterministicFallback).toBe(true);
    expect(data.directAnswer).toBeTruthy();
  });

  it('400 on bad input: returns 400 when required fields are missing or invalid', async () => {
    const req = new Request('http://localhost:3000/api/ai/guidance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aqi: 'not_a_number' }),
    });

    const res = await guidanceHandler(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe('VALIDATION_ERROR');
  });

  it('413 over the cap: rejects payloads exceeding the 32 KB body limit', async () => {
    const hugePayload = {
      ...validCopilotPayload,
      question: 'a'.repeat(35000), // 35 KB text
    };

    const req = new Request('http://localhost:3000/api/ai/copilot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(Buffer.byteLength(JSON.stringify(hugePayload))),
      },
      body: JSON.stringify(hugePayload),
    });

    const res = await copilotHandler(req);
    expect(res.status).toBe(413);

    const data = await res.json();
    expect(data.error).toBe('PAYLOAD_TOO_LARGE');
  });

  it('429 when limited: rate limit excess returns 429 with Retry-After header', async () => {
    // Exhaust rate limiter
    const clientIp = '198.51.100.44';
    const clientHash = localRateLimiter.hashClientId(clientIp);
    for (let i = 0; i < 35; i++) {
      localRateLimiter.check(clientHash);
    }

    const req = new Request('http://localhost:3000/api/ai/copilot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': clientIp,
      },
      body: JSON.stringify(validCopilotPayload),
    });

    const res = await copilotHandler(req);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
  });

  it('no secrets or stack traces in any response body', async () => {
    vi.spyOn(cloudflareClient, 'executeWorkersAiInference').mockRejectedValue(
      new Error('Cloudflare internal failure with token cf_secret_token_12345 at trace Object.run (file.ts:12)')
    );

    const req = new Request('http://localhost:3000/api/ai/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validCopilotPayload),
    });

    const res = await copilotHandler(req);
    const bodyText = await res.text();

    // Verify token or stack traces never leak
    expect(bodyText).not.toContain('cf_secret_token_12345');
    expect(bodyText).not.toContain('cf_account_12345');
    expect(bodyText).not.toContain('trace Object.run');
    expect(bodyText).not.toContain('file.ts:12');
  });

  it('cache never stores fallback answers', async () => {
    // When Cloudflare fails and falls back
    vi.spyOn(cloudflareClient, 'executeWorkersAiInference').mockRejectedValue(new Error('Network error'));

    const req = new Request('http://localhost:3000/api/ai/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validCopilotPayload),
    });

    const res = await copilotHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.isDeterministicFallback).toBe(true);

    // Verify cache has not stored the fallback answer
    const cacheKey = aiCache.getCopilotKey(validCopilotPayload);
    expect(aiCache.getCopilot(cacheKey)).toBeNull();
  });
});
