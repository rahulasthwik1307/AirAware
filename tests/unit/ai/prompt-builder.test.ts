import { describe, it, expect } from 'vitest';
import {
  sanitizeUserQuery,
  buildGuidancePayload,
  buildCopilotPayload,
} from '@/lib/ai/prompt-builder';
import { GuidanceRequest, CopilotRequest } from '@/lib/ai/types';

describe('Grounded Prompt Builder & Sanitizer', () => {
  it('strips dangerous XML and control characters from user queries', () => {
    const malicious = 'Hello \x00\x1F <script>alert("hack")</script> Can I bike?';
    const cleaned = sanitizeUserQuery(malicious);
    expect(cleaned).not.toContain('<');
    expect(cleaned).not.toContain('>');
    expect(cleaned).not.toContain('\x00');
    expect(cleaned).toContain('Can I bike?');
  });

  it('bounds user queries to a maximum of 200 characters', () => {
    const overlyLong = 'A'.repeat(500);
    const cleaned = sanitizeUserQuery(overlyLong);
    expect(cleaned.length).toBe(200);
  });

  it('configures Gemma 4 with enable_thinking: false', () => {
    const req: GuidanceRequest = {
      aqi: 75,
      category: 'Moderate',
      dominantPollutant: 'pm25',
      pollutantConcentration: 24.0,
      pollutantUnit: 'µg/m³',
      weather: { temperatureC: 20, humidityPercent: 50, windSpeedKmh: 10 },
      userContext: { isSensitiveGroup: false, primaryActivity: 'general', locale: 'en' },
    };

    const payload = buildGuidancePayload(req, '@cf/google/gemma-4-26b-a4b-it');
    expect(payload.chat_template_kwargs).toEqual({ enable_thinking: false });
    expect(payload.max_tokens).toBe(550);
    expect(payload.response_format).toEqual({ type: 'json_object' });
  });

  it('does not set enable_thinking for GLM or Granite models', () => {
    const req: GuidanceRequest = {
      aqi: 75,
      category: 'Moderate',
      dominantPollutant: 'pm25',
      pollutantConcentration: 24.0,
      pollutantUnit: 'µg/m³',
      weather: { temperatureC: 20, humidityPercent: 50, windSpeedKmh: 10 },
      userContext: { isSensitiveGroup: false, primaryActivity: 'general', locale: 'en' },
    };

    const glmPayload = buildGuidancePayload(req, '@cf/zai-org/glm-4.7-flash');
    expect(glmPayload.chat_template_kwargs).toBeUndefined();

    const granitePayload = buildGuidancePayload(req, '@cf/ibm-granite/granite-4.0-h-micro');
    expect(granitePayload.chat_template_kwargs).toBeUndefined();
  });

  it('wraps user query inside XML tags in Copilot prompt', () => {
    const req: CopilotRequest = {
      question: 'Is cycling safe now?',
      aqi: 40,
      category: 'Good',
      dominantPollutant: 'pm25',
      pollutantConcentration: 9.0,
      pollutantUnit: 'µg/m³',
      weather: { temperatureC: 18, humidityPercent: 40, windSpeedKmh: 15 },
      userContext: { isSensitiveGroup: false, primaryActivity: 'general', locale: 'en' },
    };

    const payload = buildCopilotPayload(req, '@cf/google/gemma-4-26b-a4b-it');
    const userMsg = payload.messages.find((m) => m.role === 'user');
    expect(userMsg?.content).toBe('<user_query>Is cycling safe now?</user_query>');
  });

  it('includes provenance facts and generates distinct prompt payloads for commuter vs pediatric profiles in the same city', () => {
    const commuterReq: CopilotRequest = {
      question: 'Should I commute today?',
      aqi: 220,
      category: 'Very Unhealthy',
      dominantPollutant: 'pm25',
      pollutantConcentration: 120,
      pollutantUnit: 'µg/m³',
      cityName: 'Mumbai',
      dataSource: 'Copernicus CAMS via Open-Meteo',
      observationTime: '2026-11-22T08:00:00Z',
      weather: { temperatureC: 28, humidityPercent: 65, windSpeedKmh: 12 },
      userContext: {
        isSensitiveGroup: false,
        primaryActivity: 'daily_commute',
        vulnerabilityTiers: ['commuter'],
        locale: 'en',
      },
    };

    const pediatricReq: CopilotRequest = {
      question: 'Can my child play outside today?',
      aqi: 220,
      category: 'Very Unhealthy',
      dominantPollutant: 'pm25',
      pollutantConcentration: 120,
      pollutantUnit: 'µg/m³',
      cityName: 'Mumbai',
      dataSource: 'Copernicus CAMS via Open-Meteo',
      observationTime: '2026-11-22T08:00:00Z',
      weather: { temperatureC: 28, humidityPercent: 65, windSpeedKmh: 12 },
      userContext: {
        isSensitiveGroup: true,
        primaryActivity: 'outdoor_exercise',
        vulnerabilityTiers: ['pediatric'],
        locale: 'en',
      },
    };

    const commuterPayload = buildCopilotPayload(commuterReq, '@cf/google/gemma-4-26b-a4b-it');
    const pediatricPayload = buildCopilotPayload(pediatricReq, '@cf/google/gemma-4-26b-a4b-it');

    const commuterSystem = commuterPayload.messages.find((m) => m.role === 'system')?.content ?? '';
    const pediatricSystem = pediatricPayload.messages.find((m) => m.role === 'system')?.content ?? '';

    // Both must contain the authoritative city and provenance
    expect(commuterSystem).toContain('Location / City: Mumbai');
    expect(commuterSystem).toContain('Data Source: Copernicus CAMS via Open-Meteo');
    expect(commuterSystem).toContain('Observation Time: 2026-11-22T08:00:00Z');

    expect(pediatricSystem).toContain('Location / City: Mumbai');
    expect(pediatricSystem).toContain('Data Source: Copernicus CAMS via Open-Meteo');
    expect(pediatricSystem).toContain('Observation Time: 2026-11-22T08:00:00Z');

    // Personalization differences must be present
    expect(commuterSystem).toContain('Vulnerability Tiers: commuter');
    expect(commuterSystem).toContain('Primary Activity: daily_commute');

    expect(pediatricSystem).toContain('Vulnerability Tiers: pediatric');
    expect(pediatricSystem).toContain('Primary Activity: outdoor_exercise');

    // System instructions differ
    expect(commuterSystem).not.toEqual(pediatricSystem);
  });
});
