import { describe, it, expect } from 'vitest';
import {
  getDeterministicGuidance,
  getDeterministicCopilotAnswer,
} from '@/lib/ai/deterministic-fallback';
import { GuidanceRequest, CopilotRequest } from '@/lib/ai/types';

describe('Deterministic Offline Guidance Engine', () => {
  const baseWeather = {
    temperatureC: 22,
    humidityPercent: 45,
    windSpeedKmh: 12,
  };

  it('generates accurate, open-window guidance for Good AQI', () => {
    const req: GuidanceRequest = {
      aqi: 25,
      category: 'Good',
      dominantPollutant: 'pm25',
      pollutantConcentration: 6.0,
      pollutantUnit: 'µg/m³',
      weather: baseWeather,
      userContext: {
        isSensitiveGroup: false,
        primaryActivity: 'general',
        locale: 'en',
      },
    };

    const res = getDeterministicGuidance(req);
    expect(res.isDeterministicFallback).toBe(true);
    expect(res.ventilationRecommendation).toBe('open_windows');
    expect(res.headline).toContain('Satisfactory');
    expect(res.actionRecommendations.length).toBeGreaterThanOrEqual(2);
  });

  it('grounds Moderate AQI ventilation in pollutant thresholds rather than wind speed', () => {
    // Low moderate (AQI <= 75): open_windows
    const lowMod = getDeterministicGuidance({
      aqi: 60,
      category: 'Moderate',
      dominantPollutant: 'pm25',
      pollutantConcentration: 16.0,
      pollutantUnit: 'µg/m³',
      weather: { ...baseWeather, windSpeedKmh: 45 }, // High wind should NOT override clean low-moderate air
      userContext: { isSensitiveGroup: false, primaryActivity: 'general', locale: 'en' },
    });
    expect(lowMod.ventilationRecommendation).toBe('open_windows');

    // Upper moderate (AQI > 75): ventilate_briefly
    const highMod = getDeterministicGuidance({
      aqi: 85,
      category: 'Moderate',
      dominantPollutant: 'pm25',
      pollutantConcentration: 28.0,
      pollutantUnit: 'µg/m³',
      weather: { ...baseWeather, windSpeedKmh: 5 }, // Low wind
      userContext: { isSensitiveGroup: false, primaryActivity: 'general', locale: 'en' },
    });
    expect(highMod.ventilationRecommendation).toBe('ventilate_briefly');
  });

  it('generates air-purifier, sealed-window guidance for Unhealthy AQI', () => {
    const req: GuidanceRequest = {
      aqi: 175,
      category: 'Unhealthy',
      dominantPollutant: 'pm25',
      pollutantConcentration: 102.5,
      pollutantUnit: 'µg/m³',
      weather: baseWeather,
      userContext: {
        isSensitiveGroup: true,
        primaryActivity: 'daily_commute',
        locale: 'en',
      },
    };

    const res = getDeterministicGuidance(req);
    expect(res.isDeterministicFallback).toBe(true);
    expect(res.ventilationRecommendation).toBe('keep_closed_use_purifier');
    expect(res.headline).toContain('Unhealthy');
    expect(res.sensitiveGroupAdvisory).toContain('Sensitive groups must avoid');
    expect(res.actionRecommendations.some((r) => r.includes('transit') || r.includes('respirator'))).toBe(true);
  });

  it('generates 7-part Copilot response matching Master Spec §4.4', () => {
    const req: CopilotRequest = {
      question: 'Can I take my child to the park this evening?',
      aqi: 45,
      category: 'Good',
      dominantPollutant: 'pm25',
      pollutantConcentration: 10.8,
      pollutantUnit: 'µg/m³',
      weather: baseWeather,
      userContext: {
        isSensitiveGroup: false,
        primaryActivity: 'outdoor_exercise',
        locale: 'en',
      },
    };

    const res = getDeterministicCopilotAnswer(req);
    expect(res.isDeterministicFallback).toBe(true);
    expect(res.directAnswer).toContain('Yes');
    expect(res.environmentalConditions).toContain('AQI: 45');
    expect(res.recommendedAction).toBeDefined();
    expect(res.explanation).toBeDefined();
    expect(res.practicalAlternatives.length).toBeGreaterThanOrEqual(1);
    expect(res.dataSourceAndFreshness).toContain('EPA');
    expect(res.limitationsOrUncertainty).toContain('ambient conditions');
  });

  it('warns against outdoor playground for children when AQI is Unhealthy', () => {
    const req: CopilotRequest = {
      question: 'Can I take my child to the park this evening?',
      aqi: 165,
      category: 'Unhealthy',
      dominantPollutant: 'pm25',
      pollutantConcentration: 85.0,
      pollutantUnit: 'µg/m³',
      weather: baseWeather,
      userContext: {
        isSensitiveGroup: true,
        primaryActivity: 'outdoor_exercise',
        locale: 'en',
      },
    };

    const res = getDeterministicCopilotAnswer(req);
    expect(res.isDeterministicFallback).toBe(true);
    expect(res.directAnswer).toContain('not recommended');
    expect(res.explanation).toContain('developing lungs');
  });
});
