import { describe, it, expect } from 'vitest';
import { CopilotRequestSchema, WorkspaceEnum } from '@/lib/ai/types';

describe('Copilot Request & Workspace Context Schema', () => {
  it('validates a default workspace when none is supplied', () => {
    const raw = {
      question: 'Can I open my windows today?',
      aqi: 120,
      category: 'Unhealthy for Sensitive Groups',
      dominantPollutant: 'pm25',
      pollutantConcentration: 45.0,
      weather: { temperatureC: 22, humidityPercent: 55, windSpeedKmh: 8 },
    };

    const parsed = CopilotRequestSchema.parse(raw);
    expect(parsed.workspace).toBe('air-intelligence');
    expect(parsed.question).toBe('Can I open my windows today?');
    expect(parsed.roomContext).toBeUndefined();
  });

  it('validates indoor-air workspace with roomContext payload', () => {
    const raw = {
      question: 'How do I reduce frying fumes in the kitchen?',
      workspace: 'indoor-air',
      roomContext: {
        roomName: 'Kitchen',
        floorAreaM2: 12,
        cadrM3h: 250,
      },
      aqi: 160,
      category: 'Unhealthy',
      dominantPollutant: 'pm25',
      pollutantConcentration: 75.0,
      weather: { temperatureC: 25, humidityPercent: 60, windSpeedKmh: 5 },
    };

    const parsed = CopilotRequestSchema.parse(raw);
    expect(parsed.workspace).toBe('indoor-air');
    expect(parsed.roomContext?.roomName).toBe('Kitchen');
    expect(parsed.roomContext?.floorAreaM2).toBe(12);
    expect(parsed.roomContext?.cadrM3h).toBe(250);
  });

  it('strips control characters and rejects queries over 200 characters', () => {
    const rawValid = {
      question: 'Hello \x00\x08 world!',
      aqi: 50,
      category: 'Good',
      dominantPollutant: 'pm25',
      pollutantConcentration: 10.0,
      weather: { temperatureC: 20, humidityPercent: 40, windSpeedKmh: 10 },
    };

    const parsed = CopilotRequestSchema.parse(rawValid);
    expect(parsed.question).toBe('Hello  world!');
    expect(parsed.question).not.toContain('\x00');
    expect(parsed.question).not.toContain('\x08');

    const rawTooLong = {
      ...rawValid,
      question: 'A'.repeat(205),
    };
    expect(() => CopilotRequestSchema.parse(rawTooLong)).toThrow(/exceed 200 characters/);
  });

  it('rejects questions shorter than 2 characters', () => {
    const raw = {
      question: 'a',
      aqi: 50,
      category: 'Good',
      dominantPollutant: 'pm25',
      pollutantConcentration: 10.0,
      weather: { temperatureC: 20, humidityPercent: 40, windSpeedKmh: 10 },
    };

    expect(() => CopilotRequestSchema.parse(raw)).toThrow();
  });

  it('validates all 5 workspace enums', () => {
    expect(WorkspaceEnum.options).toEqual([
      'air-intelligence',
      'family-planner',
      'indoor-air',
      'cleaner-choices',
      'community-alerts',
    ]);
  });

  it('validates provenance and vulnerability context in CopilotRequestSchema', () => {
    const raw = {
      question: 'Is it safe for my toddler to play outside?',
      aqi: 185,
      category: 'Unhealthy',
      dominantPollutant: 'pm25',
      pollutantConcentration: 110.0,
      cityName: 'Delhi',
      dataSource: 'CPCB Ground Station (ITO)',
      observationTime: '2026-11-22T09:00:00Z',
      weather: { temperatureC: 19, humidityPercent: 70, windSpeedKmh: 4 },
      userContext: {
        isSensitiveGroup: true,
        primaryActivity: 'outdoor_exercise',
        vulnerabilityTiers: ['pediatric', 'respiratory'],
        locale: 'en',
      },
    };

    const parsed = CopilotRequestSchema.parse(raw);
    expect(parsed.cityName).toBe('Delhi');
    expect(parsed.dataSource).toBe('CPCB Ground Station (ITO)');
    expect(parsed.observationTime).toBe('2026-11-22T09:00:00Z');
    expect(parsed.userContext?.vulnerabilityTiers).toEqual(['pediatric', 'respiratory']);
    expect(parsed.userContext?.isSensitiveGroup).toBe(true);
  });
});
