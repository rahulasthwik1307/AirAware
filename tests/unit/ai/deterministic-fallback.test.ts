import { describe, it, expect } from 'vitest';
import {
  getDeterministicGuidance,
  getDeterministicCopilotAnswer,
} from '@/lib/ai/deterministic-fallback';
import { GuidanceRequest, CopilotRequest, GuidanceResponseSchema } from '@/lib/ai/types';

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

  it('generates a personalized todayHouseholdPlan with morning/afternoon/evening covering 3 core areas and validates against GuidanceResponseSchema', () => {
    const req: GuidanceRequest = {
      aqi: 280,
      category: 'Very Unhealthy',
      dominantPollutant: 'pm25',
      pollutantConcentration: 195.0,
      pollutantUnit: 'µg/m³',
      weather: baseWeather,
      cityName: 'Delhi',
      userContext: {
        isSensitiveGroup: true,
        primaryActivity: 'daily_commute',
        locale: 'en',
      },
      householdMembers: [
        {
          id: 'mem-1',
          nickname: 'Aarav',
          archetype: 'pediatric',
          sensitivityTier: 'pediatric',
          schedules: [
            {
              activityName: 'outdoor_play',
              startTime: '16:00',
              durationMinutes: 120,
              commuteMode: 'walk',
            },
          ],
        },
        {
          id: 'mem-2',
          nickname: 'Priya',
          archetype: 'commuter',
          sensitivityTier: 'commuter',
          schedules: [
            {
              activityName: 'commute',
              startTime: '09:00',
              durationMinutes: 60,
              commuteMode: 'metro',
            },
          ],
        },
      ],
      scheduleSummary:
        'Aarav (pediatric): 16:00-18:00 outdoor_play (Park). Priya (commuter): 09:00-10:00 commute (Office).',
    };

    const res = getDeterministicGuidance(req);
    expect(res.todayHouseholdPlan).toBeDefined();
    const plan = res.todayHouseholdPlan!;
    expect(plan.morning.action).toBeTruthy();
    expect(plan.morning.why).toBeTruthy();
    expect(plan.morning.expectedImpact).toBeTruthy();
    expect(plan.afternoon.action).toBeTruthy();
    expect(plan.afternoon.why).toBeTruthy();
    expect(plan.afternoon.expectedImpact).toBeTruthy();
    expect(plan.evening.action).toBeTruthy();
    expect(plan.evening.why).toBeTruthy();
    expect(plan.evening.expectedImpact).toBeTruthy();

    // Verify it fully validates against Zod schema
    const parsed = GuidanceResponseSchema.safeParse(res);
    expect(parsed.success).toBe(true);
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
    expect(res.limitationsOrUncertainty).toContain('ambient');
  });

  it('differentiates ozone ventilation in warm weather vs particulate ventilation', () => {
    // Warm weather ozone: recommend brief airing / avoid afternoon windows
    const warmO3 = getDeterministicGuidance({
      aqi: 65,
      category: 'Moderate',
      dominantPollutant: 'o3',
      pollutantConcentration: 62.0,
      pollutantUnit: 'µg/m³',
      weather: { ...baseWeather, temperatureC: 28 },
      userContext: { isSensitiveGroup: false, primaryActivity: 'general', locale: 'en' },
    });
    expect(warmO3.ventilationRecommendation).toBe('ventilate_briefly');

    // Cool weather ozone: open windows
    const coolO3 = getDeterministicGuidance({
      aqi: 65,
      category: 'Moderate',
      dominantPollutant: 'o3',
      pollutantConcentration: 62.0,
      pollutantUnit: 'µg/m³',
      weather: { ...baseWeather, temperatureC: 18 },
      userContext: { isSensitiveGroup: false, primaryActivity: 'general', locale: 'en' },
    });
    expect(coolO3.ventilationRecommendation).toBe('open_windows');
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

  it('correctly handles all six official CPCB categories in fallback paths', () => {
    const cpcbTiers: Array<{
      category: 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';
      aqi: number;
      expectedVentilation: 'open_windows' | 'ventilate_briefly' | 'keep_closed_use_purifier';
      expectedHeadlineSubstring: string;
    }> = [
      { category: 'Good', aqi: 35, expectedVentilation: 'open_windows', expectedHeadlineSubstring: 'Satisfactory' },
      { category: 'Satisfactory', aqi: 75, expectedVentilation: 'open_windows', expectedHeadlineSubstring: 'Satisfactory' },
      { category: 'Moderate', aqi: 150, expectedVentilation: 'ventilate_briefly', expectedHeadlineSubstring: 'Acceptable' },
      { category: 'Poor', aqi: 250, expectedVentilation: 'ventilate_briefly', expectedHeadlineSubstring: 'Poor' },
      { category: 'Very Poor', aqi: 350, expectedVentilation: 'keep_closed_use_purifier', expectedHeadlineSubstring: 'Very Poor' },
      { category: 'Severe', aqi: 450, expectedVentilation: 'keep_closed_use_purifier', expectedHeadlineSubstring: 'Severe' },
    ];

    for (const tier of cpcbTiers) {
      const guidance = getDeterministicGuidance({
        aqi: tier.aqi,
        category: tier.category,
        dominantPollutant: 'pm25',
        pollutantConcentration: 50,
        pollutantUnit: 'µg/m³',
        weather: baseWeather,
        userContext: { isSensitiveGroup: false, primaryActivity: 'general', locale: 'en' },
      });

      expect(guidance.isDeterministicFallback).toBe(true);
      expect(guidance.ventilationRecommendation).toBe(tier.expectedVentilation);
      expect(guidance.headline).toContain(tier.expectedHeadlineSubstring);
      expect(guidance.actionRecommendations.length).toBeGreaterThan(0);

      const copilot = getDeterministicCopilotAnswer({
        question: 'Should I open the windows?',
        aqi: tier.aqi,
        category: tier.category,
        dominantPollutant: 'pm25',
        pollutantConcentration: 50,
        pollutantUnit: 'µg/m³',
        weather: baseWeather,
        userContext: { isSensitiveGroup: false, primaryActivity: 'general', locale: 'en' },
      });

      expect(copilot.isDeterministicFallback).toBe(true);
      expect(copilot.directAnswer).toBeDefined();
      expect(copilot.environmentalConditions).toContain(tier.category);
    }
  });
});
