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
    expect(payload.max_tokens).toBe(180);
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
});
